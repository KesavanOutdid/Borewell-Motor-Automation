require('dotenv').config();
const mqtt = require('mqtt');
const { logToFile } = require('./utils/fileLogger');
const connectToDatabase = require('../config/db');
const { notifyUser } = require('../utils/notificationHelper');
const { redisClient, isRedisConnected } = require('../config/redis');

const clientId = `receiver_${Math.random().toString(16).substr(2, 8)}`;

const client = mqtt.connect(process.env.MQTT_BROKER, {
    port: parseInt(process.env.MQTT_PORT || '1883', 10),
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId,
    clean: true,
});

let db = null;

/* ------------------------------------------------------ */
/* CONNECT MONGO DB                                       */
/* ------------------------------------------------------ */
connectToDatabase()
    .then(database => {
        db = database;
        console.log('DB connected for MQTT receiver');
    })
    .catch(err => console.error('DB connect error:', err.message || err));

/* ------------------------------------------------------ */
/* SUBSCRIBE TO ALL MOTOR TOPICS                          */
/* ------------------------------------------------------ */
client.on('connect', () => {
    console.log(`MQTT Connected as ${clientId}`);

    const topics = [
        'agri/+/telemetry',
        'agri/+/alert',
        'agri/+/phase',
        'agri/+/boot',
        'agri/+/heartbeat',
    ];

    client.subscribe(topics, { qos: 0 }, (err, granted) => {
        if (err) return console.error("Subscription failed:", err.message);
        console.log("Subscribed →", granted.map(g => g.topic).join(", "));
    });
});

/* ------------------------------------------------------ */
/* SAFE JSON PARSE                                        */
/* ------------------------------------------------------ */
function safeParseMessage(buf) {
    const raw = buf.toString();
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
        return [{ raw }];
    }
}

/* ------------------------------------------------------ */
/* ON MESSAGE RECEIVED                                    */
/* ------------------------------------------------------ */
client.on("message", async (topic, message) => {

    const loggedAt = new Date().toISOString();
    const type = topic.split("/").pop().toUpperCase();
    const data = safeParseMessage(message);

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("MQTT Message Received");
    console.log("Topic:", topic);
    console.log("Type:", type);
    console.log("Count:", data.length);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    logToFile({ timestamp: loggedAt, topic, type, data, direction: "RECEIVED" });

    if (!db) {
        console.warn("DB not ready — skipping save.");
        return;
    }

    const map = {
        TELEMETRY: "agri_telemetry",
        ALERT: "agri_alerts",
        PHASE: "agri_status",
        BOOT: "agri_boot",
        HEARTBEAT: "agri_heartbeat"
    };

    for (const item of data) {
        // Normalize keys to support both old and new formats during transition
        const serialNumber = item.SERIAL_NUMBER || item.serial_number;
        const imeiNumber = item.IMEI_NUMBER || item.imei_number;
        const timestamp = item.TIMESTAMP || item.timestamp;
        const motorRunning = item.MOTOR_RUNNING !== undefined ? item.MOTOR_RUNNING : item.motor_running;

        if (!serialNumber) continue;

        // Fetch device to get assigned user if not in payload
        const device = await db.collection("devices").findOne({ serial_number: serialNumber });
        const userId = device ? device.assigned_user_id : (item.USER_ID || item.user_id);

        const entry = {
            ...item,
            receivedAt: loggedAt,
            topic,
            type,
            serial_number: serialNumber, 
            imei_number: imeiNumber,
            user_id: userId
        };

        const collection = map[type] || "agri_unknown";

        try {
            await db.collection(collection).insertOne(entry);
            
            // Update the device collection with latest timestamp and status
            const deviceUpdate = {
                updatedAt: new Date(timestamp || loggedAt),
                device_status: (item.DEVICE_STATUS || item.device_status || type).toLowerCase()
            };

            if ((type === "PHASE" || type === "STATUS" || type === "HEARTBEAT") && motorRunning !== undefined) {
                deviceUpdate.start_status = motorRunning;
            }

            await db.collection("devices").updateOne(
                { serial_number: serialNumber },
                { $set: deviceUpdate }
            );
        } catch (err) {
            console.error(`DB insert/update error (${collection}):`, err.message);
        }

        /* ------------------------------------------------------ */
        /* Daily Energy Log + Live Telemetry (TELEMETRY ONLY)     */
        /* ------------------------------------------------------ */

        const energyValue = item.ENERGY_KWH ?? item.energy_kwh ?? 0;

        if (type === "TELEMETRY") {

            const usageDate = new Date().toISOString().split("T")[0];

            try {
                // 1) Save Daily Power Usage (per day)
                await db.collection("agri_daily_energy").updateOne(
                    {
                        serial_number: serialNumber,
                        imei_number: imeiNumber,
                        user_id: userId,
                        date: usageDate
                    },
                    {
                        $inc: { energy_kwh: energyValue },

                        $max: {
                            maxCurrent: item.CURRENT_RMS ?? item.current_rms,
                            maxVoltage: item.VOLTAGE_RMS ?? item.voltage_rms
                        },

                        $min: {
                            minCurrent: item.CURRENT_RMS ?? item.current_rms,
                            minVoltage: item.VOLTAGE_RMS ?? item.voltage_rms
                        },

                        $set: { updatedAt: new Date() }
                    },
                    { upsert: true }
                );

            } catch (err) {
                console.error("DB Telemetry Update Error:", err.message);
            }
        }

        /* ------------------------------------------------------ */
        /* HISTORY LOGIC (START / STOP SESSION)                   */
        /* ------------------------------------------------------ */
        if ((type === "PHASE" || type === "STATUS" || type === "HEARTBEAT") && serialNumber) {
            
            if (motorRunning === true) {
                // CHECK if session already open
                const openSession = await db.collection("agri_history").findOne({
                    serial_number: serialNumber,
                    user_id: userId,
                    stopAt: null
                });

                if (!openSession) {
                    // Create new session
                    await db.collection("agri_history").insertOne({
                        serial_number: serialNumber,
                        imei_number: imeiNumber,
                        user_id: userId,
                        date: new Date().toISOString().split("T")[0],
                        startAt: new Date(timestamp || Date.now()),
                        stopAt: null,
                        started_by: device ? device.last_started_by : null,
                        started_by_email: device ? device.last_started_by_email : null,
                        stopped_by: null,
                        stopped_by_email: null,
                        duration_minutes: 0,
                        energy_kwh: 0,
                        maxCurrent: 0,
                        minCurrent: 9999,
                        maxVoltage: 0,
                        minVoltage: 9999,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                    console.log(`HISTORY: Start session created for ${serialNumber}`);
                    
                    // Check if notification was already sent by app controller recently
                    let alreadyNotified = false;
                    if (isRedisConnected() && redisClient.isOpen) {
                        const notifKey = `notif_sent:${serialNumber}:START`;
                        const exists = await redisClient.get(notifKey);
                        if (exists) alreadyNotified = true;
                    }

                    if (!alreadyNotified) {
                        notifyUser(db, userId, "STATUS", entry);
                    }
                }

            } else if (motorRunning === false) {

                // CLOSE existing session
                const session = await db.collection("agri_history").findOne({
                    serial_number: serialNumber,
                    user_id: userId,
                    stopAt: null
                });

                if (session) {
                    const stopTime = new Date(timestamp || Date.now());
                    const duration = (stopTime - new Date(session.startAt)) / 60000;

                    await db.collection("agri_history").updateOne(
                        { _id: session._id },
                        {
                            $set: {
                                stopAt: stopTime,
                                stopped_by: device ? device.last_stopped_by : null,
                                stopped_by_email: device ? device.last_stopped_by_email : null,
                                duration_minutes: Math.round(duration),
                                updatedAt: new Date()
                            }
                        }
                    );
                    console.log(`HISTORY: Session closed for ${serialNumber}`);

                    // Check if notification was already sent by app controller recently
                    let alreadyNotified = false;
                    if (isRedisConnected() && redisClient.isOpen) {
                        const notifKey = `notif_sent:${serialNumber}:STOP`;
                        const exists = await redisClient.get(notifKey);
                        if (exists) alreadyNotified = true;
                    }

                    if (!alreadyNotified) {
                        notifyUser(db, userId, "STATUS", entry);
                    }
                }
            }
        }

        /* ------------------------------------------------------ */
        /* HISTORY LIVE ENERGY UPDATE (TELEMETRY)                 */
        /* ------------------------------------------------------ */
        if (type === "TELEMETRY") {
            await db.collection("agri_history").updateOne(
                {
                    serial_number: serialNumber,
                    imei_number: imeiNumber,
                    user_id: userId,
                    stopAt: null   // only update open sessions
                },
                {
                    $inc: { energy_kwh: energyValue },
                    $max: { 
                        maxCurrent: item.CURRENT_RMS ?? item.current_rms, 
                        maxVoltage: item.VOLTAGE_RMS ?? item.voltage_rms 
                    },
                    $min: { 
                        minCurrent: item.CURRENT_RMS ?? item.current_rms, 
                        minVoltage: item.VOLTAGE_RMS ?? item.voltage_rms 
                    },
                    $set: { updatedAt: new Date() }
                }
            );
        }

        /* ------------------------------------------------------ */
        /* SEND LIVE UPDATES TO SOCKET.IO CLIENTS                 */
        /* ------------------------------------------------------ */
        if (type === "ALERT") {
            notifyUser(db, userId, type, entry);
        }

        if (global.io) {
            if (type === "BOOT") {
                global.io.emit("LIVE_BOOT", {
                    serial_number: serialNumber,
                    payload: entry
                });
            } else if (type === "PHASE" || type === "STATUS") {
                global.io.emit("LIVE_STATUS", {
                    serial_number: serialNumber,
                    payload: entry
                });
            } else if (type === "ALERT") {
                global.io.emit("LIVE_ALERT", {
                    serial_number: serialNumber,
                    payload: entry
                });
            } else if (type === "HEARTBEAT") {
                global.io.emit("LIVE_HEARTBEAT", {
                    serial_number: serialNumber,
                    motor_running: motorRunning,
                    payload: entry
                });
            } else if (type === "TELEMETRY") {
                global.io.emit("LIVE_TELEMETRY", {
                    serial_number: serialNumber,
                    imei_number: imeiNumber,
                    user_id: userId,
                    telemetry: {
                        voltage_rms: item.VOLTAGE_RMS ?? item.voltage_rms,
                        current_rms: item.CURRENT_RMS ?? item.current_rms,
                        motor_frequency_hz: item.FREQUENCY_HZ ?? item.motor_frequency_hz,
                        motor_rpm: item.MOTOR_RPM ?? item.motor_rpm,
                        power_kw: item.POWER_KW ?? item.power_kw,
                        energy_kwh: item.ENERGY_KWH ?? item.energy_kwh,
                        device_temp_c: item.DEVICE_TEMP_C ?? item.device_temp_c,
                        flow_lpm: item.FLOW_LPM ?? item.flow_lpm,
                        fault_code: item.FAULT_CODE ?? item.fault_code,
                        fault_percentage: item.fault_percentage,
                        signal_strength: item.SIGNAL_STRENGTH ?? item.signal_strength,
                        timestamp: timestamp
                    }
                });
            }
        }
    }
});

/* ------------------------------------------------------ */
client.on("error", err => console.error("MQTT Error:", err.message));
module.exports = client;
