const admin = require("firebase-admin");
const path = require("path");
const { redisClient, isRedisConnected } = require("../config/redis");

// Initialize Firebase Admin    
try { 
    if (admin.apps.length === 0) {
        let credential;
        
        // Try to load from file first
        try {
            const serviceAccount = require("../config/firebase-service-account.json");
            credential = admin.credential.cert(serviceAccount);
            console.log("Firebase Admin: Initializing with service account file");
        } catch (fileError) {
            // Fallback to environment variables if file is missing
            if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
                credential = admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                });
                console.log("Firebase Admin: Initializing with environment variables");
            } else {
                throw new Error("Missing both firebase-service-account.json and Firebase environment variables.");
            }
        }

        admin.initializeApp({
            credential
        });
        console.log("Firebase Admin initialized successfully");
    }
} catch (error) {
    console.error("Firebase Admin initialization failed:", error.message);
}

/**
 * Send FCM notification to a specific user
 * @param {string|string[]} tokens - User's FCM device token(s)
 * @param {object} notification - { title, body }
 * @param {object} data - Optional data payload
 */
exports.sendPushNotification = async (tokens, notification, data = {}) => {
    if (!tokens || (Array.isArray(tokens) && tokens.length === 0)) return;

    if (admin.apps.length === 0) {
        console.error("[Notification] Skip sending: Firebase Admin not initialized (missing service account).");
        return;
    }

    // Convert single string token to array if necessary
    const targetTokens = Array.isArray(tokens) ? tokens : [tokens];

    const message = {
        notification,
        data: {
            ...data,
            click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        android: {
            priority: "high",
            notification: {
                channelId: "high_importance_channel",
                priority: "high",
                clickAction: "FLUTTER_NOTIFICATION_CLICK"
            }
        },
        tokens: targetTokens
    };

    try {
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`[Notification] Successfully sent ${response.successCount} messages. ${response.failureCount} failed.`);
        
        // If some tokens failed, they might be invalid (uninstalled app etc.)
        if (response.failureCount > 0) {
            const tokensToRemove = new Set();
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error.code;
                    const errorMessage = resp.error.message;
                    console.log(`[Notification] Token at index ${idx} failed: ${errorMessage} (${errorCode})`);
                    
                    // Identify tokens to remove: NotRegistered or Invalid
                    if (errorCode === 'messaging/registration-token-not-registered' || 
                        errorCode === 'messaging/invalid-registration-token' ||
                        errorMessage.includes('NotRegistered') ||
                        errorMessage.includes('Requested entity was not found')) {
                        tokensToRemove.add(targetTokens[idx]);
                    }
                }
            });

            if (tokensToRemove.size > 0) {
                const tokensArray = Array.from(tokensToRemove);
                console.log(`[Notification] Cleaning up ${tokensArray.length} invalid tokens...`);
                // Use the User model to remove these tokens from all users
                const User = require("../models/User");
                try {
                    await User.updateMany(
                        { fcm_tokens: { $in: tokensArray } },
                        { $pull: { fcm_tokens: { $in: tokensArray } } }
                    );
                    console.log("[Notification] Token cleanup successful");
                } catch (dbError) {
                    console.error("[Notification] Error during token cleanup:", dbError.message);
                }
            }
        }
        return response;
    } catch (error) {
        console.error("[Notification] Error sending multicast push notification:", error);
    }
};

/**
 * Send notification based on MQTT message type to ALL associated users
 * @param {object} db - MongoDB instance
 * @param {string} userId - Original user ID from MQTT (usually master)
 * @param {string} type - ALERT, STATUS, etc.
 * @param {object} payload - MQTT payload
 */
exports.notifyUser = async (db, userId, type, payload) => {
    console.log(`[Notification] Processing notifyUser for device: ${payload.serial_number}, type: ${type}`);
    try {
        const serial_number = payload.serial_number;
        if (!serial_number) return;

        // Internal de-duplication to prevent multiple MQTT messages (PHASE, STATUS, HEARTBEAT) 
        // from triggering the same notification within a short window.
        if (isRedisConnected() && redisClient.isOpen) {
            let actionSuffix = "";
            if (type === "STATUS") {
                actionSuffix = payload.motor_running === true ? ":START" : ":STOP";
            } else if (type === "ALERT") {
                actionSuffix = ":" + (payload.alert_type || payload.ALERT_TYPE || "UNKNOWN");
            }
            
            const internalKey = `internal_notif_block:${serial_number.trim()}:${type}${actionSuffix}`;
            const alreadyBlocked = await redisClient.set(internalKey, "BLOCKED", { NX: true, EX: 10 });
            if (!alreadyBlocked) {
                console.log(`[Notification] Internal duplicate block for ${serial_number} (${type}${actionSuffix})`);
                return;
            }
        }

        // 1. Find the device to get the master user
        const device = await db.collection("devices").findOne({ serial_number: String(serial_number) });
        if (!device) {
            console.log(`[Notification] Device ${serial_number} not found in DB`);
            return;
        }

        // 2. Collect all associated user IDs (Master + Shared)
        const userIds = new Set();
        userIds.add(Number(device.assigned_user_id));

        const shares = await db.collection("deviceshares").find({
            serial_number: String(serial_number),
            status: true,
            acceptance_status: 'accepted'
        }).toArray();
        
        shares.forEach(share => userIds.add(Number(share.shared_to_user_id)));

        // 3. Fetch all unique tokens for these users
        const users = await db.collection("users").find({ 
            user_id: { $in: Array.from(userIds) } 
        }).toArray();

        const allTokens = new Set();
        users.forEach(user => {
            const tokens = user.fcm_tokens || (user.fcm_token ? [user.fcm_token] : []);
            tokens.forEach(t => allTokens.add(t));
        });

        const tokensArray = Array.from(allTokens);
        if (tokensArray.length === 0) {
            console.log(`[Notification] No FCM tokens found for any user associated with device ${serial_number}`);
            return;
        }

        console.log(`[Notification] Found ${tokensArray.length} tokens across ${users.length} users.`);

        let title = "";
        let body = "";

        if (type === "ALERT") {
            const alertType = payload.alert_type || payload.ALERT_TYPE || 'Alert';
            const description = payload.description || payload.DESCRIPTION || 'Device alert reported';
            title = `⚠️ Device Alert: ${serial_number}`;
            body = `${alertType}: ${description}`;
        } else if (type === "STATUS") {
            const running = payload.motor_running === true;
            
            // Re-fetch the device to get the latest last_started_by/last_stopped_by
            // which might have been updated by mqttClient.js right before this call.
            const latestDevice = await db.collection("devices").findOne({ serial_number: String(serial_number) });
            
            const actionBy = running ? (latestDevice.last_started_by || "Manual") : (latestDevice.last_stopped_by || "Manual");
            
            title = running ? "🟢 Motor Started" : "🔴 Motor Stopped";
            body = `Device ${serial_number} was ${running ? 'started' : 'stopped'} by ${actionBy}`;
        } else {
            console.log(`[Notification] Skipping notification for type: ${type}`);
            return;
        }

        console.log(`[Notification] Sending: "${title}" to ${tokensArray.length} targets`);

        const dataPayload = {
            type,
            serial_number,
            timestamp: String(payload.timestamp || Date.now())
        };

        if (type === "STATUS") {
            dataPayload.action = payload.motor_running === true ? 'START' : 'STOP';
        }

        await this.sendPushNotification(tokensArray, { title, body }, dataPayload);

    } catch (error) {
        console.error("[Notification] Error in notifyUser:", error);
    }
};
