const { validationResult } = require('express-validator');
const User = require('../models/User');
const Device = require('../models/Device');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

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
        };

        // Generate JWT
        const token = jwt.sign(payload, JWT_SECRET);

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

// Protected: Get Profile
exports.getProfileById = async (req, res, next) => {
    try {
        const userId = Number(req.params.user_id);

        // Only JWT verified users can access (authMiddleware already checked token)
        // Get user from DB
        const user = await User.findOne({ user_id: userId });

        if (!user)
            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        res.status(200).json({
            success: true,
            user
        });

    } catch (err) {
        next(err);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const userId = Number(req.params.user_id);

        const { user_name, user_phone, status, password} = req.body;

        const updateData = {};
        if (user_name) updateData.user_name = user_name;
        if (user_phone) updateData.user_phone = user_phone;
        if (password) updateData.password = password;
        if (typeof status === "boolean") updateData.status = status;

        updateData.updatedBy = req.user.user_email;

        const updatedUser = await User.findOneAndUpdate(
            { user_id: userId },
            updateData,
            { new: true, select: "-password" }
        );

        if (!updatedUser)
            return res.status(404).json({ success: false, message: "User not found" });

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
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

        const { serial_number, imei_number, user_email, timestamp, latitude, longitude, motor_hp } = req.body;

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

        // Update device including location
        const updatedDevice = await Device.findOneAndUpdate(
            { serial_number, assigned_user_id: user.user_id },
            {
                imei_number,
                latitude,
                longitude,
                motor_hp,
                config_status: true,
                updatedAt: new Date(timestamp),
                updatedBy: user_email
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "IMEI & location configured successfully",
            device: {
                serial_number: updatedDevice.serial_number,
                imei_number: updatedDevice.imei_number,
                latitude: updatedDevice.latitude,
                longitude: updatedDevice.longitude,
                motor_hp: updatedDevice.motor_hp,
                config_status: updatedDevice.config_status,
                updatedAt: updatedDevice.updatedAt,
                updatedBy: updatedDevice.updatedBy
            }
        });

    } catch (err) {
        next(err);
    }
};

exports.startStopDevice = async (req, res) => {
    try {
        const { serial_number, imei_number, user_email, start_status } = req.body;

        const device = await Device.findOne({ serial_number, imei_number });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device not found"
            });
        }

        let updateData = {
            start_status,
            updatedBy: user_email,
            updatedAt: new Date()
        };

        if (start_status === true) {
            updateData.startAt = new Date();
        } else {
            updateData.stopAt = new Date();
        }

        await Device.updateOne(
            { serial_number, imei_number },
            { $set: updateData }
        );

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
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        // Find all devices assigned to this user
        const devices = await Device.aggregate([
            { $match: { assigned_user_id: parseInt(user_id), assign_status: true, status: true } },
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
                $project: {
                    "user_details.password": 0,
                    "user_details.createdAt": 0,
                    "user_details.updatedAt": 0,
                    "user_details.__v": 0
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        const enrichedDevices = devices.map(device => ({
            ...device,
            user_details: device.user_details ? {
                user_name: device.user_details.user_name,
                user_email: device.user_details.user_email,
                user_phone: device.user_details.user_phone
            } : null
        }));

        return res.status(200).json({
            success: true,
            count: enrichedDevices.length,
            data: enrichedDevices
        });

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

        const device = await Device.findOne({ serial_number, imei_number });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: device
        });

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

        const { user_id } = req.body;

        // Validate user exists
        const user = await User.findOne({ user_id: parseInt(user_id) });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // DB collection
        const db = mongoose.connection.db;
        const historyCollection = db.collection("borewell_history");

        // Fetch all history sessions for this user
        const history = await historyCollection
            .find({ user_id: parseInt(user_id) })
            .sort({ startAt: -1 })    // latest first
            .toArray();

        if (!history.length) {
            return res.status(200).json({
                success: true,
                user_id,
                count: 0,
                data: []
            });
        }

        // Group by serial number
        const grouped = {};

        history.forEach(h => {
            if (!grouped[h.serial_number]) {
                grouped[h.serial_number] = [];
            }

            grouped[h.serial_number].push({
                serial_number: h.serial_number,
                imei_number: h.imei_number,
                date: h.date,
                startAt: h.startAt,
                stopAt: h.stopAt,
                duration_minutes: h.duration_minutes,
                energy_kwh: h.energy_kwh,
                maxCurrent: h.maxCurrent,
                minCurrent: h.minCurrent,
                maxVoltage: h.maxVoltage,
                minVoltage: h.minVoltage,
                createdAt: h.createdAt,
                updatedAt: h.updatedAt
            });
        });

        const response = Object.keys(grouped).map(serial_number => ({
            serial_number,
            count: grouped[serial_number].length,
            last_updated: grouped[serial_number][0]?.updatedAt,
            records: grouped[serial_number]
        }));

        return res.status(200).json({
            success: true,
            user_id,
            count: response.length,
            data: response
        });

    } catch (error) {
        console.error("userDeviceHistory Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
