const { validationResult } = require('express-validator');
const User = require('../models/User');
const Role = require('../models/Role');
const Device = require('../models/Device');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Voucher = require('../models/Voucher');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Telemetry = require("../models/Telemetry");
const DeviceShare = require("../models/DeviceShare");
const DeviceSchedule = require("../models/DeviceSchedule");
const { sendPushNotification } = require('../utils/notificationHelper');
const { sendEmail } = require('../utils/emailHelper');
const { cacheDeletePattern } = require('../middlewares/cacheMiddleware');
const { redisClient, isRedisConnected } = require('../config/redis');
const { client: mqttPublisher } = require('../mqtt/publisher');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
// const JWT_EXPIRES = '2h';

exports.login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_email, password, role_id } = req.body;

        // Find the user by email
        const user = await User.findOne({ user_email, role_id });
        if (!user)
            return res.status(401).json({ success: false, message: "Invalid email" });

        // Check role
        if (Number(role_id) !== Number(user.role_id))
            return res.status(401).json({ success: false, message: "Invalid role_id" });

        // Check password
        if (Number(password) !== Number(user.password))
            return res.status(401).json({ success: false, message: "Invalid password" });

        // Check if user active
        if (!user.status)
            return res.status(403).json({ success: false, message: "User is deactivated" });

        // Prepare payload
        const payload = {
            user_id: user.user_id,
            user_email: user.user_email,
            user_name: user.user_name,
            role_id: user.role_id,
            user_phone: Number(user.user_phone),
            password: Number(user.password),
        };

        // Generate JWT
        const token = jwt.sign(payload, JWT_SECRET);

        // Send Login Email
        sendEmail(
            user.user_email,
            'Login Alert - Smart Motor Automation',
            `Hello ${user.user_name},\n\nYou have successfully logged into your account on ${new Date().toLocaleString()}.\n\nIf this wasn't you, please reset your password immediately.`
        ).catch(err => console.error("Login email failed:", err));

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: payload
        });

    } catch (err) {
        next(err);
    }
};

exports.signup = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_name, user_email, user_phone, password, role_id } = req.body;

        if (user_name && user_name.trim().length > 40) {
            return res.status(400).json({ success: false, message: "Name should not exceed 40 characters." });
        }

        // Check if role exists
        const role = await Role.findOne({ role_id: Number(role_id) });
        if (!role)
            return res.status(400).json({ success: false, message: 'Invalid role_id' });

        // Check if email already exists
        const emailExists = await User.findOne({ user_email });
        if (emailExists)
            return res.status(409).json({ success: false, message: "Email already exists" });

        // Check if phone already exists
        const phoneExists = await User.findOne({ user_phone });
        if (phoneExists)
            return res.status(409).json({ success: false, message: "Phone number already exists" });

        // AUTO-INCREMENT user_id
        const lastUser = await User.findOne().sort({ user_id: -1 }).lean();
        const newUserId = lastUser ? lastUser.user_id + 1 : 1;

        // Create user
        const user = new User({
            user_id: newUserId,
            user_name,
            role_id: Number(role_id),
            user_email,
            user_phone: Number(user_phone),
            password: Number(password),
            createdBy: user_email,
        });

        await user.save();

        // Direct Login: Prepare payload
        const payload = {
            user_id: user.user_id,
            user_email: user.user_email,
            user_name: user.user_name,
            role_id: user.role_id,
            user_phone: Number(user.user_phone),
        };

        // Generate JWT
        const token = jwt.sign(payload, JWT_SECRET);

        // Send Signup Email
        sendEmail(
            user.user_email,
            'Welcome to Smart Motor Automation!',
            `Hello ${user.user_name},\n\nYour account has been successfully created. You can now log in and manage your motor automation devices.\n\nThank you for choosing us!`
        ).catch(err => console.error("Signup email failed:", err));

        res.status(201).json({
            success: true,
            message: "Signup successful",
            token,
            user: payload
        });

    } catch (err) {
        next(err);
    }
};

// Protected: Get Profile
exports.getProfileById = async (req, res, next) => {
    try {
        const userId = Number(req.params.user_id);

        // Only JWT verified users can access (authMiddleware already checked token)
        // Get user from DB excluding password
        const user = await User.findOne({ user_id: userId });

        if (!user)
            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        const response = {
            success: true,
            user
        };

        res.status(200).json(response);

    } catch (err) {
        next(err);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const userId = Number(req.params.user_id);

        let { user_name, user_phone, status, password } = req.body;

        if (user_name) {
            user_name = user_name.trim();
            if (!/^[a-zA-Z\s]+$/.test(user_name)) {
                return res.status(400).json({ success: false, message: 'Name should contain letters only.' });
            }
            if (user_name.length > 40) {
                return res.status(400).json({ success: false, message: 'Name should not exceed 40 characters.' });
            }
        }

        // Check if phone is being updated and if it already exists for another user
        if (user_phone) {
            const phoneExists = await User.findOne({ user_phone, user_id: { $ne: userId } });
            if (phoneExists) {
                return res.status(409).json({ success: false, message: 'Phone number already exists' });
            }
        }

        const updateData = {};
        if (user_name) updateData.user_name = user_name;
        if (user_phone) updateData.user_phone = user_phone;
        if (password) {
            const user = await User.findOne({ user_id: userId });
            if (user && Number(user.password) === Number(password)) {
                return res.status(400).json({ success: false, message: "New password cannot be the same as the old password." });
            }
            updateData.password = Number(password);

            // Send Password Update Email
            sendEmail(
                user.user_email,
                'Password Updated - Smart Motor Automation',
                `Hello ${user.user_name},\n\nYour account password has been successfully updated on ${new Date().toLocaleString()}.\n\nIf you did not perform this action, please contact support immediately.`
            ).catch(err => console.error("Password update email failed:", err));
        }
        if (typeof status === "boolean") updateData.status = status;

        updateData.updatedBy = req.user.user_email;

        const updatedUser = await User.findOneAndUpdate(
            { user_id: userId },
            updateData,
            { new: true }
        );

        if (!updatedUser)
            return res.status(404).json({ success: false, message: "User not found" });

        await cacheDeletePattern('*profile*');
        await cacheDeletePattern('*users*');

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (err) {
        next(err);
    }
};

exports.updateFcmToken = async (req, res, next) => {
    try {
        const { user_email, fcm_token } = req.body;

        if (!user_email || !fcm_token) {
            return res.status(400).json({ success: false, message: "user_email and fcm_token are required" });
        }

        const user = await User.findOneAndUpdate(
            { user_email },
            {
                $addToSet: { fcm_tokens: fcm_token },
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, message: "FCM token registered successfully" });
    } catch (err) {
        next(err);
    }
};

exports.removeFcmToken = async (req, res, next) => {
    try {
        const { user_email, fcm_token } = req.body;

        if (!user_email || !fcm_token) {
            return res.status(400).json({ success: false, message: "user_email and fcm_token are required" });
        }

        const user = await User.findOneAndUpdate(
            { user_email },
            {
                $pull: { fcm_tokens: fcm_token },
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, message: "FCM token removed successfully" });
    } catch (err) {
        next(err);
    }
};

exports.uploadProfileImage = async (req, res, next) => {
    try {
        const userId = Number(req.params.user_id);

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file uploaded' });
        }

        const imageUrl = `/upload/img/${req.file.filename}`;

        const updatedUser = await User.findOneAndUpdate(
            { user_id: userId },
            {
                profile_image: imageUrl,
                updatedBy: req.user.user_email,
                updatedAt: new Date()
            },
            { new: true, select: "-password" }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        await cacheDeletePattern('*profile*');
        await cacheDeletePattern('*users*');

        res.status(200).json({
            success: true,
            message: "Profile image uploaded successfully",
            profile_image: imageUrl,
            user: updatedUser
        });

    } catch (err) {
        next(err);
    }
};

exports.deleteProfileImage = async (req, res, next) => {
    try {
        const userId = Number(req.params.user_id);

        const user = await User.findOne({ user_id: userId });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.profile_image) {
            const filePath = path.join(__dirname, '..', user.profile_image);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        user.profile_image = "";
        user.updatedBy = req.user.user_email;
        user.updatedAt = new Date();
        await user.save();

        await cacheDeletePattern('*profile*');
        await cacheDeletePattern('*users*');

        res.status(200).json({
            success: true,
            message: "Profile image deleted successfully",
            user: {
                user_id: user.user_id,
                user_name: user.user_name,
                user_email: user.user_email,
                profile_image: ""
            }
        });

    } catch (err) {
        next(err);
    }
};

exports.configIMEInumber = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { serial_number, imei_number, user_email, timestamp, latitude, longitude, motor_hp, device_nickname } = req.body;

        // Find user by email
        const user = await User.findOne({ user_email });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Find assigned device
        const device = await Device.findOne({
            serial_number,
            assigned_user_id: user.user_id
        });

        if (!device)
            return res.status(404).json({
                success: false,
                message: "Device not found or not assigned to this user"
            });

        // Prepare update object
        const updateData = {
            imei_number,
            latitude,
            longitude,
            motor_hp,
            config_status: true,
            updatedAt: new Date(timestamp),
            updatedBy: user_email
        };

        // Add device_nickname if provided
        if (device_nickname !== undefined) {
            updateData.device_nickname = device_nickname;
        }

        // Update device including location
        const updatedDevice = await Device.findOneAndUpdate(
            { serial_number, assigned_user_id: user.user_id },
            updateData,
            { new: true }
        );

        await cacheDeletePattern('*devices*');
        await cacheDeletePattern('*analytics*');

        res.status(200).json({
            success: true,
            message: "IMEI & location configured successfully",
            device: {
                serial_number: updatedDevice.serial_number,
                imei_number: updatedDevice.imei_number,
                latitude: updatedDevice.latitude,
                longitude: updatedDevice.longitude,
                motor_hp: updatedDevice.motor_hp,
                device_nickname: updatedDevice.device_nickname,
                config_status: updatedDevice.config_status,
                updatedAt: updatedDevice.updatedAt,
                updatedBy: updatedDevice.updatedBy
            }
        });

    } catch (err) {
        next(err);
    }
};

exports.updateDeviceNickname = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { serial_number, device_nickname, user_email } = req.body;

        // Find user by email
        const user = await User.findOne({ user_email });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Find device by serial number
        const device = await Device.findOne({ serial_number });
        if (!device)
            return res.status(404).json({ success: false, message: "Device not found" });

        // Check if user has permission (must be master user)
        if (Number(device.assigned_user_id) !== Number(user.user_id))
            return res.status(403).json({
                success: false,
                message: "Only the device owner can update device nickname"
            });

        // Update device nickname
        const updatedDevice = await Device.findOneAndUpdate(
            { serial_number },
            {
                device_nickname: device_nickname || null,
                updatedBy: user_email,
                updatedAt: new Date()
            },
            { new: true }
        );

        await cacheDeletePattern('*devices*');
        await cacheDeletePattern('*analytics*');

        res.status(200).json({
            success: true,
            message: "Device nickname updated successfully",
            device: {
                serial_number: updatedDevice.serial_number,
                device_nickname: updatedDevice.device_nickname,
                updatedBy: updatedDevice.updatedBy,
                updatedAt: updatedDevice.updatedAt
            }
        });

    } catch (err) {
        next(err);
    }
};

exports.startStopDevice = async (req, res) => {
    try {
        const { serial_number, imei_number, user_email, start_status } = req.body;

        // 1. Redis Debounce / Lock to prevent rapid multiple clicks
        if (isRedisConnected() && redisClient.isOpen) {
            const lockKey = `lock:device:${serial_number}`;
            const setRes = await redisClient.set(lockKey, "LOCKED", { NX: true, EX: 3 });
            if (!setRes) {
                return res.status(429).json({
                    success: false,
                    message: "Please wait, another command is in progress for this device."
                });
            }
        }

        const user = await User.findOne({ user_email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const device = await Device.findOne({ serial_number, imei_number });
        if (!device) {
            return res.status(404).json({ success: false, message: "Device not found" });
        }

        // 2. Prevent redundant state changes
        if (device.start_status === start_status) {
            return res.status(200).json({
                success: true,
                message: `Device is already ${start_status ? 'started' : 'stopped'}`,
                data: { start_status: device.start_status }
            });
        }

        // Permission Check: Must be master OR active shared user
        let hasPermission = false;
        if (Number(device.assigned_user_id) === Number(user.user_id)) {
            hasPermission = true;
        } else {
            const share = await DeviceShare.findOne({
                serial_number,
                shared_to_user_id: user.user_id,
                status: true,
                acceptance_status: 'accepted'
            });
            if (share) hasPermission = true;
        }

        if (!hasPermission) {
            return res.status(403).json({ success: false, message: "You don't have permission to operate this device" });
        }

        let updateData = {
            start_status,
            updatedBy: user_email,
            updatedAt: new Date()
        };

        if (start_status === true) {
            updateData.startAt = new Date();
            updateData.last_started_by = user.user_name;
            updateData.last_started_by_email = user.user_email;
        } else {
            updateData.stopAt = new Date();
            updateData.last_stopped_by = user.user_name;
            updateData.last_stopped_by_email = user.user_email;
        }

        await Device.updateOne(
            { serial_number, imei_number },
            { $set: updateData }
        );

        // If user manually stops, find any active schedule for this device and mark it as stopped
        if (start_status === false) {
            await DeviceSchedule.updateMany(
                { 
                    serial_number, 
                    status: 'started',
                    stop_executed: false 
                },
                { 
                    $set: { 
                        status: 'stopped',
                        stopped_by: user.user_name,
                        stop_executed: true,
                        updated_at: new Date()
                    } 
                }
            );
        }

        // Save to agri_history
        try {
            const db = mongoose.connection.db;
            const historyCollection = db.collection("agri_history");

            if (start_status === true) {
                // Check if a session is already open for this device to avoid duplicates
                const openSession = await historyCollection.findOne({
                    serial_number,
                    stopAt: null
                });

                if (!openSession) {
                    await historyCollection.insertOne({
                        serial_number,
                        imei_number,
                        user_id: user.user_id,
                        date: new Date().toISOString().split("T")[0],
                        startAt: updateData.startAt,
                        stopAt: null,
                        started_by: user.user_name,
                        started_by_email: user.user_email,
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
                }
            } else {
                // Find the latest open session for this device
                const session = await historyCollection.findOne({
                    serial_number,
                    stopAt: null
                });

                if (session) {
                    const stopTime = updateData.stopAt;
                    const duration = (stopTime - new Date(session.startAt)) / 60000;

                    await historyCollection.updateOne(
                        { _id: session._id, stopAt: null }, // Atomic check
                        {
                            $set: {
                                stopAt: stopTime,
                                stopped_by: user.user_name,
                                stopped_by_email: user.user_email,
                                duration_minutes: Number(duration.toFixed(3)),
                                updatedAt: new Date()
                            }
                        }
                    );
                }
            }
        } catch (historyError) {
            console.error("[History Error] Failed to log to agri_history:", historyError);
        }

        // Notify all users associated with this device via FCM
        try {
            // Check for duplicate notifications within a 30-second window
            if (isRedisConnected() && redisClient.isOpen) {
                const notifKey = `notif_sent:${serial_number.trim()}:${start_status ? 'START' : 'STOP'}`;
                const alreadySent = await redisClient.set(notifKey, "SENT", { NX: true, EX: 30 });
                if (!alreadySent) {
                    console.log(`[Notification] Duplicate ${start_status ? 'START' : 'STOP'} notification blocked for ${serial_number}`);
                    return res.status(200).json({
                        success: true,
                        message: "Device command sent. Notification already handled."
                    });
                }
            }

            // 1. Get Master User
            const masterUser = await User.findOne({ user_id: device.assigned_user_id });

            // 2. Get Shared Users
            const shares = await DeviceShare.find({
                serial_number,
                status: true,
                acceptance_status: 'accepted'
            });
            const sharedUserIds = shares.map(s => s.shared_to_user_id);
            const sharedUsers = await User.find({ user_id: { $in: sharedUserIds } });

            // 3. Collect all unique tokens
            const allUsers = [masterUser, ...sharedUsers].filter(u => u != null);
            const uniqueTokens = new Set();
            allUsers.forEach(u => {
                if (u.fcm_tokens && Array.isArray(u.fcm_tokens)) {
                    u.fcm_tokens.forEach(t => uniqueTokens.add(t));
                } else if (u.fcm_token) {
                    uniqueTokens.add(u.fcm_token);
                }
            });

            const tokensArray = Array.from(uniqueTokens);
            if (tokensArray.length > 0) {
                const title = start_status ? "🟢 Motor Started" : "🔴 Motor Stopped";
                const body = `Device ${serial_number} was ${start_status ? 'started' : 'stopped'} by ${user.user_name}`;

                sendPushNotification(tokensArray, { title, body }, {
                    type: "STATUS",
                    serial_number,
                    action: start_status ? "START" : "STOP",
                    timestamp: String(Date.now())
                });
            }
        } catch (notifyError) {
            console.error("[Notification Error] Failed to send start/stop FCM:", notifyError);
            // Don't fail the request if notification fails
        }

        // 4. Send MQTT Command to the Motor
        const topic = `agri/${serial_number}/command`;
        const payload = {
            MESSAGE_TYPE: "COMMAND",
            SERIAL_NUMBER: serial_number,
            IMEI_NUMBER: imei_number,
            COMMAND: start_status ? "START" : "STOP",
            TIMESTAMP: new Date().toISOString()
        };

        if (mqttPublisher && mqttPublisher.connected) {
            mqttPublisher.publish(topic, JSON.stringify(payload), { qos: 1 });
            console.log(`[MQTT] Published command to ${topic}:`, payload.COMMAND);
        } else {
            console.warn("[MQTT] Failed to publish - Publisher not connected");
        }

        // 5. Immediate Socket.IO reflection for real-time UI updates across all users
        if (global.io) {
            global.io.emit("LIVE_STATUS", {
                serial_number: serial_number,
                payload: {
                    motor_running: start_status,
                    updatedAt: new Date().toISOString()
                }
            });
        }

        await cacheDeletePattern('devices');
        await cacheDeletePattern('analytics');

        return res.status(200).json({
            success: true,
            message: start_status ? "Device started" : "Device stopped",
            data: updateData
        });

    } catch (error) {
        console.error("Start/Stop Device Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error, please try again later"
        });
    }
};

exports.userAssignDevices = async (req, res) => {
    try {
        const { user_id, page = 1, limit = 10, filter = 'All' } = req.body;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const userIdNum = parseInt(user_id);
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Threshold for online status (3 minutes to allow for clock drift and signal issues)
        const onlineThreshold = new Date(Date.now() - 3 * 60 * 1000);

        // Define base query for devices where user is master or shared
        // First get shared serials - exclude rejected shares but include pending
        const shares = await DeviceShare.find({ shared_to_user_id: userIdNum, status: true, acceptance_status: { $ne: 'rejected' } });
        const sharedSerials = shares.map(s => s.serial_number);

        // Base match criteria
        const baseMatch = {
            status: true,
            $or: [
                { assigned_user_id: userIdNum, assign_status: true },
                { serial_number: { $in: sharedSerials } }
            ]
        };

        // Add filter specific criteria
        if (filter === 'Running') {
            baseMatch.start_status = true;
        } else if (filter === 'Stopped') {
            baseMatch.start_status = false;
            baseMatch.imei_number = { $ne: null, $not: /^\s*$/ }; // Configured
        } else if (filter === 'Online') {
            baseMatch.last_heartbeat = { $gte: onlineThreshold };
        } else if (filter === 'Offline') {
            baseMatch.$and = [
                {
                    $or: [
                        { last_heartbeat: { $lt: onlineThreshold } },
                        { last_heartbeat: { $exists: false } }
                    ]
                }
            ];
        } else if (filter === 'Not Configured') {
            baseMatch.assigned_user_id = userIdNum; // Only show MY devices
            delete baseMatch.$or;
            baseMatch.$and = [
                {
                    $or: [
                        { imei_number: null },
                        { imei_number: "" }
                    ]
                }
            ];
        } else if (filter === 'Shared') {
            baseMatch.assigned_user_id = { $ne: userIdNum };
        }

        const sortCriteria = { updatedAt: -1 };

        // Aggregate with pagination
        const devices = await Device.aggregate([
            { $match: baseMatch },
            {
                $lookup: {
                    from: "users",
                    localField: "assigned_user_id",
                    foreignField: "user_id",
                    as: "user_details"
                }
            },
            {
                $unwind: {
                    path: "$user_details",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    role: {
                        $cond: { if: { $eq: ["$assigned_user_id", userIdNum] }, then: 'master', else: 'shared' }
                    }
                }
            },
            { $sort: sortCriteria },
            { $skip: skip },
            { $limit: filter === 'Recently' ? 5 : limitNum }
        ]);

        const totalDevices = await Device.countDocuments(baseMatch);

        const enrichedDevices = devices.map(device => {
            const share = shares.find(s => s.serial_number === device.serial_number);
            return {
                ...device,
                acceptance_status: device.role === 'master' ? 'accepted' : (share ? share.acceptance_status : 'pending'),
                share_info: device.role === 'shared' && share ? {
                    master_user_id: share.master_user_id,
                    master_user_name: share.master_user_name,
                    master_user_email: share.master_user_email,
                    shared_to_user_id: share.shared_to_user_id,
                    shared_to_user_name: share.shared_to_user_name,
                    shared_to_user_phone: share.shared_to_user_phone,
                    shared_to_user_email: share.shared_to_user_email,
                    assignedAt: share.assignedAt
                } : null,
                user_details: device.user_details ? {
                    user_name: device.user_details.user_name,
                    user_email: device.user_details.user_email,
                    user_phone: device.user_details.user_phone
                } : null
            };
        });

        // 3. Find all device share relationships where this user is involved (as master or shared_to) - exclude rejected shares
        const sharedDeviceRelationships = await DeviceShare.find({
            $or: [
                { master_user_id: userIdNum },
                { shared_to_user_id: userIdNum }
            ],
            status: true,
            acceptance_status: { $ne: 'rejected' }
        }).sort({ assignedAt: -1 });

        const response = {
            success: true,
            count: enrichedDevices.length,
            total: totalDevices,
            currentPage: pageNum,
            totalPages: Math.ceil(totalDevices / limitNum),
            data: enrichedDevices,
            shared_devices: sharedDeviceRelationships
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error("userAssignDevices Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

exports.userDeviceDetails = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { serial_number, imei_number } = req.body;

        const query = { serial_number };
        if (imei_number) {
            query.imei_number = imei_number;
        }

        const device = await Device.findOne(query);

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device not found"
            });
        }

        // Determine role
        let role = 'shared';
        let acceptance_status = 'accepted'; // Default for master
        if (device.assigned_user_id && req.user && req.user.user_id) {
            if (Number(device.assigned_user_id) === Number(req.user.user_id)) {
                role = 'master';
            } else {
                // If shared, check acceptance status
                const share = await DeviceShare.findOne({
                    serial_number,
                    shared_to_user_id: req.user.user_id
                });
                if (share) {
                    acceptance_status = share.acceptance_status;
                }
            }
        }

        // Fetch latest telemetry
        const telemetryCollection = mongoose.connection.db.collection("agri_telemetry");
        const latestTelemetry = await telemetryCollection
            .find({ serial_number })
            .sort({ timestamp: -1 })
            .limit(1)
            .toArray();

        const response = {
            success: true,
            data: {
                ...device.toObject(),
                role,
                acceptance_status,
                telemetry: latestTelemetry.length > 0 ? latestTelemetry[0] : null
            }
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error("userDeviceDetails Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

exports.userDeviceHistory = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { user_id, page = 1, limit = 10, serial_number } = req.body;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Validate user exists
        const user = await User.findOne({ user_id: parseInt(user_id) });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User found"
            });
        }

        let serialNumbers = [];
        if (serial_number) {
            // Verify if user has access to this serial
            const hasAccess = await Device.findOne({ serial_number, assigned_user_id: user.user_id, status: true }) ||
                              await DeviceShare.findOne({ serial_number, shared_to_user_id: user.user_id, status: true, acceptance_status: 'accepted' });
            
            if (!hasAccess) {
                return res.status(403).json({ success: false, message: "No access to this device" });
            }
            serialNumbers = [serial_number];
        } else {
            // 1. Get all serial numbers the user has access to
            const masterDevices = await Device.find({ assigned_user_id: user.user_id, status: true });
            const sharedShares = await DeviceShare.find({
                shared_to_user_id: user.user_id,
                status: true,
                acceptance_status: 'accepted'
            });

            serialNumbers = [
                ...masterDevices.map(d => d.serial_number),
                ...sharedShares.map(s => s.serial_number)
            ];
        }

        if (serialNumbers.length === 0) {
            return res.status(200).json({
                success: true,
                user_id,
                count: 0,
                total: 0,
                data: []
            });
        }

        // DB collection
        const db = mongoose.connection.db;
        const historyCollection = db.collection("agri_history");

        const query = { serial_number: { $in: serialNumbers } };

        // 2. Fetch history sessions with pagination
        const history = await historyCollection
            .find(query)
            .sort({ startAt: -1 })    // latest first
            .skip(skip)
            .limit(limitNum)
            .toArray();

        const totalRecords = await historyCollection.countDocuments(query);

        if (!history.length) {
            const response = {
                success: true,
                user_id,
                count: 0,
                total: totalRecords,
                currentPage: pageNum,
                totalPages: Math.ceil(totalRecords / limitNum),
                data: []
            };
            return res.status(200).json(response);
        }

        const response = {
            success: true,
            user_id,
            count: history.length,
            total: totalRecords,
            currentPage: pageNum,
            totalPages: Math.ceil(totalRecords / limitNum),
            data: history
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error("userDeviceHistory Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

exports.getTelemetryAnalytics = async (req, res) => {
    try {
        const { serial_number, imei_number, type } = req.query;

        if (!type) {
            return res.status(400).json({
                success: false,
                message: "Please provide type parameter"
            });
        }

        const allowedTypes = [
            "motor_rpm",
            "motor_frequency_hz",
            "power_kw",
            "current_rms",
            "voltage_rms",
            "energy_kwh",
            "device_temp_c",
            "signal_strength"
        ];

        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid type, allowed: ${allowedTypes.join(", ")}`
            });
        }

        // build query filter - support both lowercase/UPPERCASE for device and timestamp fields
        const filter = {
            $and: [
                { 
                    $or: [
                        { timestamp: { $exists: true } }, 
                        { TIMESTAMP: { $exists: true } },
                        { receivedAt: { $exists: true } }
                    ] 
                }
            ]
        };
        
        if (serial_number) {
            filter.$and.push({ 
                $or: [
                    { serial_number: serial_number.trim() }, 
                    { SERIAL_NUMBER: serial_number.trim() }
                ] 
            });
        }
        if (imei_number) {
            filter.$and.push({ 
                $or: [
                    { imei_number: imei_number.trim() }, 
                    { IMEI_NUMBER: imei_number.trim() }
                ] 
            });
        }

        const now = new Date();

        // ------------------------------------------
        // 📍 Updated aggregation with time-based filtering and case normalization
        // ------------------------------------------
        const analytics = await Telemetry.aggregate([
            { $match: filter },
            {
                $addFields: {
                    // Support both timestamp/TIMESTAMP/receivedAt and normalize to 'ts'
                    ts: { $toDate: { $ifNull: ["$timestamp", "$TIMESTAMP", "$receivedAt"] } },
                    // Support both lowercase and uppercase field names, plus common variations
                    val: { 
                        $ifNull: [
                            `$${type}`, 
                            `$${type.toUpperCase()}`,
                            // Handle special hardware-specific mappings
                            type === "motor_frequency_hz" ? "$FREQUENCY_HZ" : null,
                            type === "motor_rpm" ? "$RPM" : null,
                            type === "voltage_rms" ? "$VOLTAGE" : null,
                            type === "current_rms" ? "$CURRENT" : null,
                            type === "power_kw" ? "$POWER" : null,
                            type === "energy_kwh" ? "$ENERGY" : null,
                            0 // Default to 0 if not found
                        ] 
                    }
                }
            },
            {
                $facet: {
                    // Hourly: Last 60 hours with time labels
                    hourly: [
                        {
                            $match: {
                                ts: { $gte: new Date(now.getTime() - 60 * 60 * 60 * 1000) }
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    year: { $year: "$ts" },
                                    month: { $month: "$ts" },
                                    day: { $dayOfMonth: "$ts" },
                                    hour: { $hour: "$ts" }
                                },
                                value: { $avg: "$val" },
                                timestamp: { $first: "$ts" },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { timestamp: 1 } },
                        { $limit: 60 },
                        {
                            $project: {
                                _id: 0,
                                label: { 
                                    $concat: [
                                        { $dateToString: { format: "%d %b ", date: "$timestamp" } },
                                        { $dateToString: { format: "%H:%M", date: "$timestamp" } }
                                    ]
                                },
                                value: "$value",
                                timestamp: "$timestamp",
                                count: "$count"
                            }
                        }
                    ],

                    // Today: Last 24 hours with hour labels
                    today: [
                        {
                            $match: {
                                ts: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    year: { $year: "$ts" },
                                    month: { $month: "$ts" },
                                    day: { $dayOfMonth: "$ts" },
                                    hour: { $hour: "$ts" }
                                },
                                value: { $avg: "$val" },
                                timestamp: { $first: "$ts" },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { timestamp: 1 } },
                        {
                            $project: {
                                _id: 0,
                                label: { $dateToString: { format: "%H:00", date: "$timestamp" } },
                                value: "$value",
                                timestamp: "$timestamp",
                                count: "$count"
                            }
                        }
                    ],

                    // Weekly: Last 7 days with day labels (Mon, Tue, etc.)
                    weekly: [
                        {
                            $match: {
                                ts: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    year: { $year: "$ts" },
                                    month: { $month: "$ts" },
                                    day: { $dayOfMonth: "$ts" }
                                },
                                value: { $avg: "$val" },
                                timestamp: { $first: "$ts" },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { timestamp: 1 } },
                        {
                            $project: {
                                _id: 0,
                                label: {
                                    $arrayElemAt: [
                                        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                                        { $subtract: [{ $dayOfWeek: "$timestamp" }, 1] }
                                    ]
                                },
                                value: "$value",
                                timestamp: "$timestamp",
                                count: "$count"
                            }
                        }
                    ],

                    // Monthly: Last 30 days with day numbers (01, 02, etc.)
                    monthly: [
                        {
                            $match: {
                                ts: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    year: { $year: "$ts" },
                                    month: { $month: "$ts" },
                                    day: { $dayOfMonth: "$ts" }
                                },
                                value: { $avg: "$val" },
                                timestamp: { $first: "$ts" },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { timestamp: 1 } },
                        {
                            $project: {
                                _id: 0,
                                label: { $dateToString: { format: "%d", date: "$timestamp" } },
                                value: "$value",
                                timestamp: "$timestamp",
                                count: "$count"
                            }
                        }
                    ],

                    // Yearly: By year and month with month names (Jan, Feb, etc.)
                    yearly: [
                        {
                            $group: {
                                _id: {
                                    year: { $year: "$ts" },
                                    month: { $month: "$ts" }
                                },
                                value: { $avg: "$val" },
                                timestamp: { $first: "$ts" },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { timestamp: 1 } },
                        {
                            $project: {
                                _id: 0,
                                label: {
                                    $arrayElemAt: [
                                        ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                                        { $month: "$timestamp" }
                                    ]
                                },
                                value: "$value",
                                timestamp: "$timestamp",
                                count: "$count"
                            }
                        }
                    ]
                }
            }
        ]);

        const result = analytics[0] || {
            hourly: [],
            today: [],
            weekly: [],
            monthly: [],
            yearly: []
        };

        // Helper function to calculate statistics and trends
        const calculateStats = (data, periodType) => {
            if (!data || data.length === 0) {
                return {
                    dataPoints: 0,
                    totalRecords: 0,
                    totalSum: 0,
                    average: 0,
                    min: 0,
                    max: 0,
                    trend: 'no_data',
                    variance: 0,
                    isConstant: false,
                    percentChange: 0,
                    standardDeviation: 0,
                    peakHour: null,
                    lowestHour: null,
                    performanceScore: 0,
                    anomalyCount: 0,
                    anomalies: [],
                    consistency: 'no_data',
                    reliability: 0
                };
            }

            const values = data.map(item => item.value);
            const total = values.reduce((sum, val) => sum + val, 0);
            const avg = total / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);

            // Find peak and lowest points
            const maxIndex = values.indexOf(max);
            const minIndex = values.indexOf(min);
            const peakHour = data[maxIndex] ? {
                label: data[maxIndex].label,
                value: max,
                timestamp: data[maxIndex].timestamp
            } : null;
            const lowestHour = data[minIndex] ? {
                label: data[minIndex].label,
                value: min,
                timestamp: data[minIndex].timestamp
            } : null;

            // Determine if values are constant (within 0.1% tolerance)
            const isConstant = (max - min) / avg < 0.001 || stdDev < 0.001;

            // Calculate trend
            let trend = 'stable';
            if (!isConstant && values.length > 1) {
                const firstHalf = values.slice(0, Math.floor(values.length / 2));
                const secondHalf = values.slice(Math.floor(values.length / 2));
                const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
                const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
                const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;

                if (percentChange > 5) trend = 'increasing';
                else if (percentChange < -5) trend = 'decreasing';
                else trend = 'stable';
            } else if (isConstant) {
                trend = 'constant';
            }

            // Detect anomalies (values beyond 2 standard deviations)
            const anomalies = [];
            values.forEach((val, idx) => {
                if (Math.abs(val - avg) > 2 * stdDev) {
                    anomalies.push({
                        index: idx,
                        label: data[idx].label,
                        value: val,
                        deviation: ((val - avg) / stdDev).toFixed(2),
                        timestamp: data[idx].timestamp
                    });
                }
            });

            // Calculate performance score (0-100)
            // Based on consistency, uptime reliability
            const coefficientOfVariation = avg !== 0 ? (stdDev / avg) * 100 : 0;
            let performanceScore = 100;
            if (coefficientOfVariation > 50) performanceScore -= 40;
            else if (coefficientOfVariation > 30) performanceScore -= 25;
            else if (coefficientOfVariation > 15) performanceScore -= 10;

            if (anomalies.length > data.length * 0.2) performanceScore -= 30;
            else if (anomalies.length > data.length * 0.1) performanceScore -= 15;

            // Consistency rating
            let consistency = 'excellent';
            if (coefficientOfVariation > 40) consistency = 'poor';
            else if (coefficientOfVariation > 25) consistency = 'fair';
            else if (coefficientOfVariation > 15) consistency = 'good';

            // Reliability percentage
            const reliablePoints = values.filter(v => Math.abs(v - avg) <= stdDev).length;
            const reliability = ((reliablePoints / values.length) * 100).toFixed(1);

            return {
                dataPoints: data.length,
                totalRecords: data.reduce((sum, item) => sum + (item.count || 0), 0),
                totalSum: total,
                average: parseFloat(avg.toFixed(2)),
                min: parseFloat(min.toFixed(2)),
                max: parseFloat(max.toFixed(2)),
                trend,
                variance: parseFloat(variance.toFixed(2)),
                standardDeviation: parseFloat(stdDev.toFixed(2)),
                isConstant,
                percentChange: values.length > 1 ? parseFloat(((values[values.length - 1] - values[0]) / values[0] * 100).toFixed(2)) : 0,
                peakHour,
                lowestHour,
                performanceScore: Math.max(0, Math.round(performanceScore)),
                anomalyCount: anomalies.length,
                anomalies: anomalies.slice(0, 5),
                consistency,
                reliability: parseFloat(reliability),
                coefficientOfVariation: parseFloat(coefficientOfVariation.toFixed(2))
            };
        };

        const summary = {
            hourly: calculateStats(result.hourly, 'hourly'),
            today: calculateStats(result.today, 'today'),
            weekly: calculateStats(result.weekly, 'weekly'),
            monthly: calculateStats(result.monthly, 'monthly'),
            yearly: calculateStats(result.yearly, 'yearly')
        };

        // Calculate overall metrics
        const allValues = [
            ...result.hourly,
            ...result.today,
            ...result.weekly,
            ...result.monthly,
            ...result.yearly
        ];

        const overallStats = allValues.length > 0 ? {
            totalDataPoints: allValues.length,
            averagePerformance: Math.round(
                (summary.hourly.performanceScore +
                    summary.today.performanceScore +
                    summary.weekly.performanceScore +
                    summary.monthly.performanceScore +
                    summary.yearly.performanceScore) / 5
            ),
            overallTrend: summary.today.trend,
            totalAnomalies: summary.hourly.anomalyCount +
                summary.today.anomalyCount +
                summary.weekly.anomalyCount +
                summary.monthly.anomalyCount +
                summary.yearly.anomalyCount,
            criticalAnomalies: [
                ...summary.hourly.anomalies,
                ...summary.today.anomalies,
                ...summary.weekly.anomalies,
                ...summary.monthly.anomalies,
                ...summary.yearly.anomalies
            ].slice(0, 10)
        } : null;

        // Calculate comparisons (current vs previous period)
        const calculateComparison = (currentData, label) => {
            if (!currentData || currentData.length < 2) {
                return { comparison: 'insufficient_data' };
            }

            const mid = Math.floor(currentData.length / 2);
            const previousPeriod = currentData.slice(0, mid);
            const currentPeriod = currentData.slice(mid);

            const prevAvg = previousPeriod.reduce((sum, item) => sum + item.value, 0) / previousPeriod.length;
            const currAvg = currentPeriod.reduce((sum, item) => sum + item.value, 0) / currentPeriod.length;

            const change = currAvg - prevAvg;
            const percentChange = prevAvg !== 0 ? ((change / prevAvg) * 100) : 0;

            return {
                label,
                previousAverage: parseFloat(prevAvg.toFixed(2)),
                currentAverage: parseFloat(currAvg.toFixed(2)),
                absoluteChange: parseFloat(change.toFixed(2)),
                percentChange: parseFloat(percentChange.toFixed(2)),
                trend: percentChange > 5 ? 'improving' : percentChange < -5 ? 'declining' : 'stable'
            };
        };

        const comparisons = {
            hourly: calculateComparison(result.hourly, 'Last 30h vs Previous 30h'),
            today: calculateComparison(result.today, 'Last 12h vs Previous 12h'),
            weekly: calculateComparison(result.weekly, 'Last 3-4 days vs Previous 3 days'),
            monthly: calculateComparison(result.monthly, 'Last 15 days vs Previous 15 days')
        };

        const response = {
            success: true,
            type,
            serial_number,
            imei_number,
            data: {
                ...result,
                summary,
                comparisons,
                overallStats
            },
            metadata: {
                generatedAt: new Date().toISOString(),
                metricType: type,
                availablePeriods: ['hourly', 'today', 'weekly', 'monthly', 'yearly']
            }
        };

        res.json(response);

    } catch (err) {
        console.error("Telemetry analytics error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};


// Helper to get cart with product images
const getPopulatedCart = async (user_id) => {
    const cartData = await Cart.aggregate([
        { $match: { user_id: Number(user_id) } },
        {
            $lookup: {
                from: "products",
                localField: "items.product_id",
                foreignField: "product_id",
                as: "productDetails"
            }
        },
        {
            $project: {
                cart_id: 1,
                user_id: 1,
                items: {
                    $map: {
                        input: "$items",
                        as: "item",
                        in: {
                            product_id: "$$item.product_id",
                            product_name: "$$item.product_name",
                            product_price: "$$item.product_price",
                            product_gst: "$$item.product_gst",
                            product_shipping_cost: "$$item.product_shipping_cost",
                            quantity: "$$item.quantity",
                            added_at: "$$item.added_at",
                            product_main_image: {
                                $arrayElemAt: [
                                    {
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: "$productDetails",
                                                    as: "prod",
                                                    cond: { $eq: ["$$prod.product_id", "$$item.product_id"] }
                                                }
                                            },
                                            as: "prod",
                                            in: "$$prod.product_main_image"
                                        }
                                    },
                                    0
                                ]
                            }
                        }
                    }
                },
                total_price: 1,
                total_gst: 1,
                total_shipping_cost: 1,
                grand_total: 1,
                createdAt: 1,
                updatedAt: 1,
                status: 1
            }
        }
    ]);
    return cartData && cartData.length > 0 ? cartData[0] : null;
};

exports.addCart = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id, product_id, quantity } = req.body;

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Verify product exists and is active
        const product = await Product.findOne({ product_id, status: true });
        if (!product)
            return res.status(404).json({ success: false, message: "Product not found" });

        // Check available quantity
        if (product.product_quantity < quantity)
            return res.status(400).json({ success: false, message: "Insufficient product quantity" });

        // Find or create cart for user
        let cart = await Cart.findOne({ user_id });

        if (!cart) {
            // Create new cart with a reliable unique cart_id
            const lastCart = await Cart.findOne().sort({ cart_id: -1 });
            const nextId = lastCart && lastCart.cart_id ? lastCart.cart_id + 1 : 1;

            cart = new Cart({
                cart_id: nextId,
                user_id,
                items: [],
                createdBy: user.user_email
            });
        }

        // Check if product already in cart
        const existingItem = cart.items.find(item => item.product_id === product_id);

        if (existingItem) {
            // Update quantity
            existingItem.quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                product_id: product.product_id,
                product_name: product.product_name,
                product_price: product.product_price,
                product_gst: product.product_gst,
                product_shipping_cost: product.product_shipping_cost,
                quantity
            });
        }

        // Calculate totals
        cart.total_price = 0;
        cart.total_gst = 0;
        cart.total_shipping_cost = 0;

        cart.items.forEach(item => {
            const itemPrice = item.product_price * item.quantity;
            const itemGST = (itemPrice * item.product_gst) / 100;
            const itemShipping = item.product_shipping_cost * item.quantity;

            cart.total_price += itemPrice;
            cart.total_gst += itemGST;
            cart.total_shipping_cost += itemShipping;
        });

        cart.grand_total = cart.total_price + cart.total_gst + cart.total_shipping_cost;
        cart.updatedAt = new Date();
        cart.updatedBy = user.user_email;

        await cart.save();

        await cacheDeletePattern('*cart*');

        const populatedCart = await getPopulatedCart(user_id);

        res.status(201).json({
            success: true,
            message: "Product added to cart successfully",
            cart: populatedCart || cart
        });

    } catch (err) {
        next(err);
    }
};

exports.fetchCart = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id } = req.body;

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Find cart with product details lookup
        const cartData = await Cart.aggregate([
            { $match: { user_id } },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product_id",
                    foreignField: "product_id",
                    as: "productDetails"
                }
            },
            {
                $project: {
                    cart_id: 1,
                    user_id: 1,
                    items: {
                        $filter: {
                            input: {
                                $map: {
                                    input: "$items",
                                    as: "item",
                                    in: {
                                        product_id: "$$item.product_id",
                                        product_name: "$$item.product_name",
                                        product_price: "$$item.product_price",
                                        product_gst: "$$item.product_gst",
                                        product_shipping_cost: "$$item.product_shipping_cost",
                                        quantity: "$$item.quantity",
                                        added_at: "$$item.added_at",
                                        // Get product status from productDetails
                                        status: {
                                            $arrayElemAt: [
                                                {
                                                    $map: {
                                                        input: {
                                                            $filter: {
                                                                input: "$productDetails",
                                                                as: "p",
                                                                cond: { $eq: ["$$p.product_id", "$$item.product_id"] }
                                                            }
                                                        },
                                                        as: "p",
                                                        in: "$$p.status"
                                                    }
                                                },
                                                0
                                            ]
                                        },
                                        product_main_image: {
                                            $arrayElemAt: [
                                                {
                                                    $map: {
                                                        input: {
                                                            $filter: {
                                                                input: "$productDetails",
                                                                as: "prod",
                                                                cond: { $eq: ["$$prod.product_id", "$$item.product_id"] }
                                                            }
                                                        },
                                                        as: "prod",
                                                        in: "$$prod.product_main_image"
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    }
                                }
                            },
                            as: "item",
                            cond: { $eq: ["$$item.status", true] }
                        }
                    },
                    total_price: 1,
                    total_gst: 1,
                    total_shipping_cost: 1,
                    grand_total: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    status: 1
                }
            }
        ]);

        if (!cartData || cartData.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Cart is empty",
                cart: {
                    user_id,
                    items: [],
                    total_price: 0,
                    total_gst: 0,
                    total_shipping_cost: 0,
                    grand_total: 0
                }
            });
        }

        const cart = cartData[0];

        const response = {
            success: true,
            message: "Cart fetched successfully",
            cart
        };

        res.status(200).json(response);

    } catch (err) {
        next(err);
    }
};

exports.updatedCart = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id, product_id, quantity } = req.body;

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Verify product exists
        const product = await Product.findOne({ product_id, status: true });
        if (!product)
            return res.status(404).json({ success: false, message: "Product not found" });

        // Check available quantity
        if (product.product_quantity < quantity)
            return res.status(400).json({ success: false, message: "Insufficient product quantity" });

        // Find cart
        const cart = await Cart.findOne({ user_id });
        if (!cart)
            return res.status(404).json({ success: false, message: "Cart not found" });

        // Find item in cart
        const cartItem = cart.items.find(item => item.product_id === product_id);
        if (!cartItem)
            return res.status(404).json({ success: false, message: "Product not found in cart" });

        // Update quantity
        cartItem.quantity = quantity;

        // Recalculate totals
        cart.total_price = 0;
        cart.total_gst = 0;
        cart.total_shipping_cost = 0;

        cart.items.forEach(item => {
            const itemPrice = item.product_price * item.quantity;
            const itemGST = (itemPrice * item.product_gst) / 100;
            const itemShipping = item.product_shipping_cost * item.quantity;

            cart.total_price += itemPrice;
            cart.total_gst += itemGST;
            cart.total_shipping_cost += itemShipping;
        });

        cart.grand_total = cart.total_price + cart.total_gst + cart.total_shipping_cost;
        cart.updatedAt = new Date();
        cart.updatedBy = user.user_email;

        await cart.save();

        await cacheDeletePattern('*cart*');

        const populatedCart = await getPopulatedCart(user_id);

        res.status(200).json({
            success: true,
            message: "Cart updated successfully",
            cart: populatedCart || cart
        });

    } catch (err) {
        next(err);
    }
};

exports.productDelete = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id, product_id } = req.body;

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Find cart
        const cart = await Cart.findOne({ user_id });
        if (!cart)
            return res.status(404).json({ success: false, message: "Cart not found" });

        // Remove product from cart
        const initialLength = cart.items.length;
        cart.items = cart.items.filter(item => item.product_id !== product_id);

        if (cart.items.length === initialLength)
            return res.status(404).json({ success: false, message: "Product not found in cart" });

        // Recalculate totals
        cart.total_price = 0;
        cart.total_gst = 0;
        cart.total_shipping_cost = 0;

        cart.items.forEach(item => {
            const itemPrice = item.product_price * item.quantity;
            const itemGST = (itemPrice * item.product_gst) / 100;
            const itemShipping = item.product_shipping_cost * item.quantity;

            cart.total_price += itemPrice;
            cart.total_gst += itemGST;
            cart.total_shipping_cost += itemShipping;
        });

        cart.grand_total = cart.total_price + cart.total_gst + cart.total_shipping_cost;
        cart.updatedAt = new Date();
        cart.updatedBy = user.user_email;

        await cart.save();

        await cacheDeletePattern('*cart*');

        const populatedCart = await getPopulatedCart(user_id);

        res.status(200).json({
            success: true,
            message: "Product removed from cart successfully",
            cart: populatedCart || cart
        });

    } catch (err) {
        next(err);
    }
};

exports.allProductDelete = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id } = req.body;

        // Verify user exists
        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        // Find cart
        const cart = await Cart.findOne({ user_id });
        if (!cart)
            return res.status(404).json({ success: false, message: "Cart not found" });

        // Clear all items
        cart.items = [];
        cart.total_price = 0;
        cart.total_gst = 0;
        cart.total_shipping_cost = 0;
        cart.grand_total = 0;
        cart.updatedAt = new Date();
        cart.updatedBy = user.user_email;

        await cart.save();

        await cacheDeletePattern('*cart*');

        res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
            cart
        });

    } catch (err) {
        next(err);
    }
};

exports.validateVoucher = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id, voucher_code } = req.body;

        const user = await User.findOne({ user_id });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        const voucher = await Voucher.findOne({ voucher_code: voucher_code.toUpperCase() });
        if (!voucher)
            return res.status(404).json({ success: false, message: "Voucher not found" });

        const now = new Date();

        if (!voucher.status)
            return res.status(400).json({ success: false, message: "Voucher is inactive" });

        if (now < new Date(voucher.start_date))
            return res.status(400).json({ success: false, message: "Voucher is not yet valid" });

        if (now > new Date(voucher.end_date))
            return res.status(400).json({ success: false, message: "Voucher has expired" });

        if (voucher.max_usage && voucher.used_count >= voucher.max_usage)
            return res.status(400).json({ success: false, message: "Voucher usage limit exceeded" });

        // Check if user has already used this voucher
        const Order = require('../models/Order');
        const userOrderWithVoucher = await Order.findOne({
            user_id,
            'order_summary.voucher_code': voucher_code.toUpperCase(),
            payment_status: 'completed'
        });

        // if (userOrderWithVoucher) {
        //     return res.status(400).json({ success: false, message: "You have already used this voucher" });
        // }

        res.status(200).json({
            success: true,
            message: "Voucher is valid",
            data: {
                voucher_code: voucher.voucher_code,
                discount_percentage: voucher.discount_percentage,
                valid_until: voucher.end_date,
                description: voucher.description
            }
        });

    } catch (err) {
        next(err);
    }
};

exports.createVoucher = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { voucher_code, discount_percentage, start_date, end_date, max_usage, description, createdBy } = req.body;

        // Validation
        if (discount_percentage !== undefined && (isNaN(discount_percentage) || discount_percentage < 0 || discount_percentage > 100)) {
            return res.status(400).json({ success: false, message: "Discount percentage must be between 0 and 100" });
        }
        if (max_usage !== undefined && max_usage !== null && max_usage !== '' && (isNaN(max_usage) || max_usage < 1)) {
            return res.status(400).json({ success: false, message: "Max usage must be at least 1" });
        }

        const existingVoucher = await Voucher.findOne({ voucher_code: voucher_code.toUpperCase() });
        if (existingVoucher)
            return res.status(400).json({ success: false, message: "Voucher code already exists" });

        const newVoucher = new Voucher({
            voucher_code: voucher_code.toUpperCase(),
            discount_percentage,
            start_date: new Date(start_date),
            end_date: new Date(end_date),
            max_usage: max_usage || null,
            description: description || null,
            status: true,
            createdBy,
            createdAt: new Date()
        });

        await newVoucher.save();

        res.status(201).json({
            success: true,
            message: "Voucher created successfully",
            data: newVoucher
        });

    } catch (err) {
        next(err);
    }
};

exports.getAllVouchers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;

        const skip = (page - 1) * limit;

        const searchFilter = search ? {
            $or: [
                { voucher_code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const vouchers = await Voucher.find(searchFilter)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Voucher.countDocuments(searchFilter);
        const totalActive = await Voucher.countDocuments({ ...searchFilter, status: true });
        const totalInactive = await Voucher.countDocuments({ ...searchFilter, status: false });

        const response = {
            success: true,
            data: vouchers,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalVouchers: total,
                totalActiveVouchers: totalActive,
                totalInactiveVouchers: totalInactive,
                limit: parseInt(limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        };

        res.status(200).json(response);

    } catch (err) {
        next(err);
    }
};

exports.getVoucherById = async (req, res, next) => {
    try {
        const { id } = req.query;

        if (!id)
            return res.status(400).json({ success: false, message: "Voucher ID is required" });

        const voucher = await Voucher.findById(id);
        if (!voucher)
            return res.status(404).json({ success: false, message: "Voucher not found" });

        const response = {
            success: true,
            data: voucher
        };

        res.status(200).json(response);

    } catch (err) {
        next(err);
    }
};

exports.updateVoucher = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { id, voucher_code, discount_percentage, start_date, end_date, max_usage, used_count, description, status, updatedBy } = req.body;

        if (!id)
            return res.status(400).json({ success: false, message: "Voucher ID is required" });

        // Validation
        if (discount_percentage !== undefined && (isNaN(discount_percentage) || discount_percentage < 0 || discount_percentage > 100)) {
            return res.status(400).json({ success: false, message: "Discount percentage must be between 0 and 100" });
        }
        if (max_usage !== undefined && max_usage !== null && max_usage !== '' && (isNaN(max_usage) || max_usage < 1)) {
            return res.status(400).json({ success: false, message: "Max usage must be at least 1" });
        }
        if (used_count !== undefined && isNaN(used_count)) {
            return res.status(400).json({ success: false, message: "Used count must be a number" });
        }

        const voucher = await Voucher.findById(id);
        if (!voucher)
            return res.status(404).json({ success: false, message: "Voucher not found" });

        if (voucher_code && voucher_code.toUpperCase() !== voucher.voucher_code) {
            const existingVoucher = await Voucher.findOne({ voucher_code: voucher_code.toUpperCase() });
            if (existingVoucher)
                return res.status(400).json({ success: false, message: "Voucher code already exists" });
        }

        const updateData = {};
        if (voucher_code) updateData.voucher_code = voucher_code.toUpperCase();
        if (discount_percentage !== undefined) updateData.discount_percentage = discount_percentage;
        if (start_date) updateData.start_date = new Date(start_date);
        if (end_date) updateData.end_date = new Date(end_date);
        if (max_usage !== undefined) updateData.max_usage = max_usage || null;
        if (used_count !== undefined) updateData.used_count = used_count;
        if (description !== undefined) updateData.description = description || null;
        if (typeof status === 'boolean') updateData.status = status;

        updateData.updatedBy = updatedBy;
        updateData.updatedAt = new Date();

        const updatedVoucher = await Voucher.findByIdAndUpdate(id, updateData, { new: true });

        res.status(200).json({
            success: true,
            message: "Voucher updated successfully",
            data: updatedVoucher
        });

    } catch (err) {
        next(err);
    }
};

exports.deleteVoucher = async (req, res, next) => {
    try {
        const { id } = req.body;

        if (!id)
            return res.status(400).json({ success: false, message: "Voucher ID is required" });

        const voucher = await Voucher.findByIdAndDelete(id);
        if (!voucher)
            return res.status(404).json({ success: false, message: "Voucher not found" });

        res.status(200).json({
            success: true,
            message: "Voucher deleted successfully"
        });

    } catch (err) {
        next(err);
    }
};

exports.assignDeviceToOther = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { serial_number, master_user_id, shared_to_user_phone } = req.body;

        // 1. Verify master ownership and get master details
        const device = await Device.findOne({ serial_number, assigned_user_id: master_user_id });
        if (!device) {
            return res.status(404).json({ success: false, message: "Device not found or you are not the owner" });
        }

        const masterUser = await User.findOne({ user_id: master_user_id });
        if (!masterUser) {
            return res.status(404).json({ success: false, message: "Master user not found" });
        }

        // 2. Find shared user
        const sharedUser = await User.findOne({ user_phone: shared_to_user_phone });
        if (!sharedUser) {
            return res.status(404).json({ success: false, message: "This number is not registered, please register" });
        }

        if (Number(sharedUser.user_id) === Number(master_user_id)) {
            return res.status(400).json({ success: false, message: "Cannot share with yourself" });
        }

        // 3. Check current share count
        const shareCount = await DeviceShare.countDocuments({ serial_number, master_user_id });
        if (shareCount >= 3) {
            return res.status(400).json({ success: false, message: "Maximum 3 persons sharing limit reached" });
        }

        // 4. Create or Update share
        let share = await DeviceShare.findOne({ serial_number, shared_to_user_id: sharedUser.user_id });
        if (share) {
            return res.status(400).json({ success: false, message: "Device already shared with this user" });
        }

        share = new DeviceShare({
            serial_number,
            master_user_id,
            master_user_name: masterUser.user_name,
            master_user_email: masterUser.user_email,
            shared_to_user_id: sharedUser.user_id,
            shared_to_user_name: sharedUser.user_name,
            shared_to_user_phone: sharedUser.user_phone,
            shared_to_user_email: sharedUser.user_email,
            history: [{
                action: 'assigned',
                performedBy: master_user_id,
                performedBy_name: masterUser.user_name,
                performedBy_email: masterUser.user_email
            }]
        });

        await share.save();

        // Notify both Owner and Shared User
        const subject = `Device Sharing - ${serial_number}`;
        const ownerBody = `Hello ${masterUser.user_name},\n\nYou have successfully shared access to device ${serial_number} with ${sharedUser.user_name}.`;
        const sharedBody = `Hello ${sharedUser.user_name},\n\n${masterUser.user_name} has shared access to device ${serial_number} with you. You can now manage this device from your account.`;

        sendEmail(masterUser.user_email, subject, ownerBody).catch(e => console.error("Owner share email failed:", e));
        sendEmail(sharedUser.user_email, subject, sharedBody).catch(e => console.error("Shared user email failed:", e));

        res.status(200).json({ success: true, message: "Device shared successfully", data: share });

    } catch (err) {
        next(err);
    }
};

exports.getSharedUsers = async (req, res, next) => {
    try {
        const { serial_number, master_user_id } = req.body;
        const shares = await DeviceShare.find({ serial_number, master_user_id });
        res.status(200).json({ success: true, data: shares });
    } catch (err) {
        next(err);
    }
};

exports.updateShareStatus = async (req, res, next) => {
    try {
        const { serial_number, master_user_id, shared_to_user_id, status } = req.body;

        const share = await DeviceShare.findOne({ serial_number, master_user_id, shared_to_user_id });
        if (!share) {
            return res.status(404).json({ success: false, message: "Share record not found" });
        }

        const masterUser = await User.findOne({ user_id: master_user_id });
        if (!masterUser) {
            return res.status(404).json({ success: false, message: "Master user not found" });
        }

        share.status = status;
        share.updatedAt = new Date();
        share.history.push({
            action: status ? 'activated' : 'deactivated',
            performedBy: master_user_id,
            performedBy_name: masterUser.user_name,
            performedBy_email: masterUser.user_email
        });

        await share.save();
        res.status(200).json({ success: true, message: `Share ${status ? 'activated' : 'deactivated'} successfully`, data: share });
    } catch (err) {
        next(err);
    }
};

exports.respondToDeviceShare = async (req, res, next) => {
    try {
        const { serial_number, user_id, action } = req.body; // action: 'accepted' or 'rejected'

        if (!['accepted', 'rejected'].includes(action)) {
            return res.status(400).json({ success: false, message: "Invalid action. Must be 'accepted' or 'rejected'" });
        }

        const share = await DeviceShare.findOne({ serial_number, shared_to_user_id: user_id });
        if (!share) {
            return res.status(404).json({ success: false, message: "Sharing request not found" });
        }

        const sharedUser = await User.findOne({ user_id });
        if (!sharedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        share.acceptance_status = action;
        share.updatedAt = new Date();
        share.history.push({
            action: action,
            performedBy: user_id,
            performedBy_name: sharedUser.user_name,
            performedBy_email: sharedUser.user_email
        });

        // If rejected, we might want to delete the record or just keep it as rejected
        // The requirement says "accept or reject", usually it stays as record

        await share.save();

        res.status(200).json({
            success: true,
            message: `Sharing request ${action} successfully`,
            data: share
        });

    } catch (err) {
        next(err);
    }
};

exports.deleteShare = async (req, res, next) => {
    try {
        const { serial_number, master_user_id, shared_to_user_id } = req.body;

        const share = await DeviceShare.findOneAndDelete({ serial_number, master_user_id, shared_to_user_id });
        if (!share) {
            return res.status(404).json({ success: false, message: "Share record not found" });
        }

        res.status(200).json({ success: true, message: "Share deleted successfully" });
    } catch (err) {
        next(err);
    }
};



exports.getDeviceSmartHistory = async (req, res) => {
    try {
        const { serial_number, page = 1, limit = 10 } = req.query;

        if (!serial_number) {
            return res.status(400).json({
                success: false,
                message: "Serial number is required"
            });
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const db = mongoose.connection.db;
        const historyCollection = db.collection("agri_history");

        const query = { serial_number: serial_number };

        const history = await historyCollection
            .find(query)
            .sort({ startAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .toArray();

        const totalRecords = await historyCollection.countDocuments(query);

        return res.status(200).json({
            success: true,
            serial_number,
            count: history.length,
            total: totalRecords,
            currentPage: pageNum,
            totalPages: Math.ceil(totalRecords / limitNum),
            data: history
        });

    } catch (error) {
        console.error("getDeviceSmartHistory Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

exports.createSchedule = async (req, res) => {
    try {
        const { serial_number, imei_number, user_id, user_name, start_time, stop_time } = req.body;

        if (!serial_number || !imei_number || !user_id || !start_time || !stop_time) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const start = new Date(start_time);
        const stop = new Date(stop_time);
        const now = new Date();

        // 0. Ensure start date is not in the past (before today's start)
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (start < todayStart) {
            return res.status(400).json({ 
                success: false, 
                message: "Start date cannot be in the past" 
            });
        }

        // 1. Start time must be at least 5 minutes after current time
        const minStartTime = new Date(now.getTime() + 5 * 60 * 1000);
        if (start < minStartTime) {
            return res.status(400).json({ 
                success: false, 
                message: "Start time must be at least 5 minutes from now" 
            });
        }

        // 2. Start date must be up to 7 days from now
        const maxStartTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (start > maxStartTime) {
            return res.status(400).json({ 
                success: false, 
                message: "Start date can only be up to 7 days in the future" 
            });
        }

        // 3. Stop time must be after start time
        if (stop <= start) {
            return res.status(400).json({ 
                success: false, 
                message: "Stop time must be after start time" 
            });
        }

        // Check for overlapping schedules (pending or started)
        const overlappingSchedule = await DeviceSchedule.findOne({ 
            serial_number, 
            status: { $in: ['pending', 'started'] },
            start_time: { $lt: stop },
            stop_time: { $gt: start }
        });

        if (overlappingSchedule) {
            const type = overlappingSchedule.status === 'started' ? 'active' : 'pending';
            return res.status(400).json({ 
                success: false, 
                message: `This time overlaps with an ${type} schedule (${new Date(overlappingSchedule.start_time).toLocaleTimeString()} - ${new Date(overlappingSchedule.stop_time).toLocaleTimeString()}).` 
            });
        }

        const newSchedule = new DeviceSchedule({
            serial_number,
            imei_number,
            user_id,
            user_name,
            start_time: start,
            stop_time: stop,
            status: 'pending'
        });

        await newSchedule.save();

        // Notify Owner and Shared Users via Email
        const notifyUsers = async () => {
            try {
                // 1. Get Owner
                const owner = await User.findOne({ user_id });
                
                // 2. Get Shared Users
                const sharedEntries = await DeviceShare.find({ serial_number, status: true });
                const sharedEmails = sharedEntries.map(s => s.shared_to_user_email).filter(e => e);
                
                const allEmails = [owner.user_email, ...sharedEmails];
                const uniqueEmails = [...new Set(allEmails)];

                const subject = `New Schedule Created - ${serial_number}`;
                const body = `Hello,\n\nA new motor schedule has been created for device ${serial_number}.\n\n` +
                             `Start Time: ${start.toLocaleString()}\n` +
                             `Stop Time: ${stop.toLocaleString()}\n` +
                             `Created by: ${user_name}\n\n` +
                             `The motor will run continuously during this period.`;

                for (const email of uniqueEmails) {
                    sendEmail(email, subject, body).catch(e => console.error(`Schedule email failed for ${email}:`, e));
                }

                // 3. Send FCM Notification to all related users
                const sharedUserIds = sharedEntries.map(s => s.shared_to_user_id);
                const allUserIds = [...new Set([user_id, ...sharedUserIds])];
                const usersToNotify = await User.find({ user_id: { $in: allUserIds } });

                const fcmTitle = "📅 New Schedule Set";
                const fcmBody = `Device ${serial_number} scheduled to run from ${start.toLocaleTimeString()} to ${stop.toLocaleTimeString()} (Set by: ${user_name})`;

                for (const user of usersToNotify) {
                    if (user.fcm_tokens && user.fcm_tokens.length > 0) {
                        sendPushNotification(user.fcm_tokens, { title: fcmTitle, body: fcmBody }, {
                            type: "SCHEDULE",
                            serial_number,
                            schedule_id: newSchedule._id.toString()
                        });
                    }
                }
            } catch (err) {
                console.error("Schedule notification error:", err);
            }
        };
        notifyUsers();

        res.status(201).json({
            success: true,
            message: "Schedule created successfully",
            data: newSchedule
        });

    } catch (error) {
        console.error("createSchedule Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getSchedules = async (req, res) => {
    try {
        const { serial_number, user_id, status, dashboard } = req.query;
        const query = {};
        if (serial_number) query.serial_number = serial_number;
        if (user_id) query.user_id = user_id;
        
        // Add status filtering
        if (status && status !== 'All') {
            query.status = status.toLowerCase();
        }

        if (dashboard === 'true' && serial_number) {
            // Get all pending and started schedules (active ones)
            const activeSchedules = await DeviceSchedule.find({
                ...query,
                status: { $in: ['pending', 'started'] }
            }).sort({ created_at: -1 });

            // Get non-active schedules (completed, cancelled)
            const completedSchedules = await DeviceSchedule.find({
                ...query,
                status: { $in: ['completed', 'cancelled'] }
            }).sort({ created_at: -1 }).limit(Math.max(0, 5 - activeSchedules.length));

            // Combine them
            const combinedSchedules = [...activeSchedules, ...completedSchedules];

            return res.status(200).json({
                success: true,
                data: combinedSchedules
            });
        }

        const schedules = await DeviceSchedule.find(query).sort({ created_at: -1 });

        res.status(200).json({
            success: true,
            data: schedules
        });
    } catch (error) {
        console.error("getSchedules Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.cancelSchedule = async (req, res) => {
    try {
        const { schedule_id } = req.params;
        const { user_name } = req.body; // Pass who cancelled it
        const schedule = await DeviceSchedule.findById(schedule_id);

        if (!schedule) {
            return res.status(404).json({ success: false, message: "Schedule not found" });
        }

        if (schedule.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: "Only pending schedules can be cancelled" 
            });
        }

        schedule.status = 'cancelled';
        if (user_name) schedule.cancelled_by = user_name;
        schedule.updated_at = new Date();
        await schedule.save();

        // Notify Owner and Shared Users via Email
        const notifyCancel = async () => {
            try {
                const owner = await User.findOne({ user_id: schedule.user_id });
                const sharedEntries = await DeviceShare.find({ serial_number: schedule.serial_number, status: true });
                const sharedEmails = sharedEntries.map(s => s.shared_to_user_email).filter(e => e);
                
                const allEmails = [owner.user_email, ...sharedEmails];
                const uniqueEmails = [...new Set(allEmails)];

                const subject = `Schedule Cancelled - ${schedule.serial_number}`;
                const body = `Hello,\n\nA motor schedule has been cancelled for device ${schedule.serial_number}.\n\n` +
                             `Original Start Time: ${new Date(schedule.start_time).toLocaleString()}\n` +
                             `Cancelled by: ${user_name || 'System'}\n` +
                             `Cancellation Time: ${new Date().toLocaleString()}`;

                for (const email of uniqueEmails) {
                    sendEmail(email, subject, body).catch(e => console.error(`Cancel email failed for ${email}:`, e));
                }

                // 3. Send FCM Notification to all related users
                const sharedUserIds = sharedEntries.map(s => s.shared_to_user_id);
                const allUserIds = [...new Set([schedule.user_id, ...sharedUserIds])];
                const usersToNotify = await User.find({ user_id: { $in: allUserIds } });

                const fcmTitle = "📅 Schedule Cancelled";
                const fcmBody = `Motor schedule for ${schedule.serial_number} has been cancelled by ${user_name || 'System'}`;

                for (const user of usersToNotify) {
                    if (user.fcm_tokens && user.fcm_tokens.length > 0) {
                        sendPushNotification(user.fcm_tokens, { title: fcmTitle, body: fcmBody }, {
                            type: "SCHEDULE_CANCEL",
                            serial_number: schedule.serial_number,
                            schedule_id: schedule._id.toString()
                        });
                    }
                }
            } catch (err) {
                console.error("Cancel schedule notification error:", err);
            }
        };
        notifyCancel();

        res.status(200).json({ success: true, message: "Schedule cancelled successfully", data: schedule });
    } catch (error) {
        console.error("cancelSchedule Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        const searchFilter = {
            status: true,
            ...(search ? {
                $or: [
                    { product_name: { $regex: search, $options: 'i' } },
                    { product_description: { $regex: search, $options: 'i' } }
                ]
            } : {})
        };

        const totalProducts = await Product.countDocuments(searchFilter);

        const products = await Product.find(searchFilter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalPages = Math.ceil(totalProducts / limit);

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                currentPage: page,
                totalPages,
                totalProducts,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error("Get App Products Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching products"
        });
    }
};

exports.forgotPasswordRequest = async (req, res, next) => {
    try {
        const { user_email } = req.body;
        const user = await User.findOne({ user_email });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Generate 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.resetPasswordOtp = otp;
        user.resetPasswordExpires = otpExpiry;
        await user.save();

        // Send Email via helper
        await sendEmail(
            user_email,
            'Password Reset OTP',
            `Your OTP for password reset is ${otp}. It is valid for 10 minutes.`
        ).then(result => {
            if (result.success) {
                res.status(200).json({ success: true, message: "OTP sent to email" });
            } else {
                res.status(500).json({ success: false, message: "Error sending email" });
            }
        }).catch(err => {
            console.error("Forgot password email failed:", err);
            res.status(500).json({ success: false, message: "Error sending email" });
        });

    } catch (error) {
        next(error);
    }
};

exports.verifyOtp = async (req, res, next) => {
    try {
        const { user_email, otp } = req.body;

        const user = await User.findOne({
            user_email,
            resetPasswordOtp: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        res.status(200).json({ success: true, message: "OTP verified successfully" });

    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { user_email, otp, new_password } = req.body;

        const user = await User.findOne({
            user_email,
            resetPasswordOtp: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        if (Number(user.password) === Number(new_password)) {
            return res.status(400).json({ success: false, message: "New password cannot be the same as the old password." });
        }

        user.password = Number(new_password);
        user.resetPasswordOtp = null;
        user.resetPasswordExpires = null;
        user.updatedBy = user_email;
        user.updatedAt = new Date();
        await user.save();

        // Send Reset Email
        sendEmail(
            user.user_email,
            'Password Reset Successful',
            `Hello ${user.user_name},\n\nYour password has been successfully reset on ${new Date().toLocaleString()}.\n\nIf you did not perform this action, please contact support immediately.`
        ).catch(err => console.error("Reset password email failed:", err));

        res.status(200).json({ success: true, message: "Password reset successful" });

    } catch (error) {
        next(error);
    }
};
