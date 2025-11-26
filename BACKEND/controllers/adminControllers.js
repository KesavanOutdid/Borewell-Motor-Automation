// BACKEND/controllers/adminControllers.js
const { validationResult } = require('express-validator');
const Role = require('../models/Role');
const User = require('../models/User');
const Device = require("../models/Device"); 
const bcrypt = require('bcrypt');

// Create role
exports.createRole = async (req, res, next) => {
    try {
        // validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { role_id, role_name } = req.body;
        // check duplicate by role_id or role_name
        const exists = await Role.findOne({ $or: [{ role_id }, { role_name }] });
        if (exists) return res.status(409).json({ success: false, message: 'Role already exists' });

        const role = new Role({
            role_id,
            role_name,
            createdBy,
        });
        await role.save();
        res.status(201).json({ success: true, role });
    } catch (err) { next(err); }
};

// Edit Role
exports.editRole = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { role_id, status, updatedBy } = req.body;

        // Find role
        const role = await Role.findOne({ role_id });
        if (!role)
            return res.status(404).json({ success: false, message: "Role not found" });

        // Update only status + updatedBy + updatedAt
        role.status = status;
        role.updatedBy = updatedBy;
        role.updatedAt = new Date();

        await role.save();

        res.json({
            success: true,
            message: "Role updated successfully",
            role
        });

    } catch (err) {
        next(err);
    }
};


// Create user
exports.createUser = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_name, role_id, user_email, user_phone, password, createdBy } = req.body;

        // Check if role exists
        const role = await Role.findOne({ role_id });
        if (!role)
            return res.status(400).json({ success: false, message: 'Invalid role_id' });

        // Email unique inside same role
        const exists = await User.findOne({ user_email, role_id });
        if (exists)
            return res.status(409).json({
                success: false,
                message: "Email already exists for this role"
            });

        // AUTO-INCREMENT user_id
        const lastUser = await User.findOne().sort({ user_id: -1 }).lean();
        const newUserId = lastUser ? lastUser.user_id + 1 : 1;

        // Create user
        const user = new User({
            user_id: newUserId,
            user_name,
            role_id,
            user_email,
            user_phone,
            password,
            createdBy,
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                user_id: user.user_id,
                user_name: user.user_name,
                user_email: user.user_email,
                role_id: user.role_id
            }
        });

    } catch (err) {
        next(err);
    }
};

// Get all roles with pagination
exports.getRoles = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1;
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalRoles = await Role.countDocuments();

        const roles = await Role.find()
            .sort({ createdAt: -1 }) // Sort by creation date, newest first
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalRoles / limit);

        res.json({
            success: true,
            roles,
            pagination: {
                currentPage: page,
                totalPages,
                totalRoles,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (err) { next(err); }
};

// Get all users with pagination
exports.getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalUsers = await User.countDocuments();

        const users = await User.aggregate([
            {
                $lookup: {
                    from: "roles",            // MongoDB collection name
                    localField: "role_id",    // field in User
                    foreignField: "role_id",  // field in Role
                    as: "role"
                }
            },
            {
                $unwind: {
                    path: "$role",
                    preserveNullAndEmptyArrays: true  // if no role found
                }
            },
            {
                $project: {
                    "role._id": 0,
                    "role.createdAt": 0,
                    "role.updatedAt": 0,
                    "role.__v": 0
                }
            },
            {
                $sort: { createdAt: -1 } // Sort by creation date, newest first
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);

        // Format final output
        const formatted = users.map(u => ({
            ...u,
            role_name: u.role?.role_name || "N/A"
        }));

        const totalPages = Math.ceil(totalUsers / limit);

        res.json({
            success: true,
            users: formatted,
            pagination: {
                currentPage: page,
                totalPages,
                totalUsers,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (err) {
        next(err);
    }
};

// Update User
exports.manageUserUpdated = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { user_id, user_name, user_phone, password, status, updatedBy } = req.body;

        // Validate required fields
        if (!user_id) return res.status(400).json({ success: false, message: 'User ID is required' });

        // Find user by user_id
        const user = await User.findOne({ user_id });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Update fields (only update fields that are provided and not empty)
        if (user_name !== undefined && user_name !== '') user.user_name = user_name;
        if (user_phone !== undefined && user_phone !== '') user.user_phone = user_phone;
        if (password !== undefined && password !== '') user.password = password;
        if (status !== undefined) user.status = status === 'true' || status === true;

        // Update metadata
        user.updatedBy = updatedBy;
        user.updatedAt = new Date();

        await user.save();

        res.json({ success: true, message: 'User updated successfully' });
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.createDevice = async (req, res) => {
    try {
        const { serial_number, createdBy } = req.body;

        // Validate serial number
        if (!serial_number || serial_number.trim().length < 17 || serial_number.length > 20) {
            return res.status(400).json({ message: "Serial Number must be 17–20 characters." });
        }

        // Check duplicate
        const exists = await Device.findOne({ serial_number });
        if (exists) {
            return res.status(400).json({ message: "Serial Number already exists." });
        }

        // Create device
        const device = new Device({
            serial_number,
            device_status: true,
            createdBy: createdBy,
            createdAt: new Date(),
            updatedBy: null,
            updatedAt: null
        });

        await device.save();

        return res.status(201).json({
            message: "Device created successfully!",
            device
        });

    } catch (error) {
        console.error("Create Device Error:", error);
        return res.status(500).json({ message: "Server error. Try again later." });
    }
};

exports.getDevices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalDevices = await Device.countDocuments();

        // Get paginated devices with user lookup
        const devices = await Device.aggregate([
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
            {
                $sort: { createdAt: -1 } // Sort by creation date, newest first
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);

        // Format user details
        const enrichedDevices = devices.map(device => ({
            ...device,
            user_details: device.user_details ? {
                user_name: device.user_details.user_name,
                user_email: device.user_details.user_email
            } : null
        }));

        const totalPages = Math.ceil(totalDevices / limit);

        return res.status(200).json({
            success: true,
            data: enrichedDevices,
            pagination: {
                currentPage: page,
                totalPages,
                totalDevices,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error("Get Devices Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error. Please try again later."
        });
    }
};

exports.updateDevice = async (req, res) => {
    try {
        const { id, serial_number, status, updatedBy } = req.body;

        const device = await Device.findById(id);
        if (!device) {
            return res.status(404).json({ message: "Device not found" });
        }

        // Check serial number uniqueness
        if (serial_number) {
            const existingDevice = await Device.findOne({
                serial_number: serial_number,
                _id: { $ne: id }   // exclude current device
            });

            if (existingDevice) {
                return res.status(400).json({ message: "Serial Number already exists" });
            }
        }

        // Update fields
        if (serial_number) device.serial_number = serial_number;
        if (status !== undefined) device.status = status;

        device.updatedBy = updatedBy;
        device.updatedAt = new Date();

        await device.save();

        return res.status(200).json({
            message: "Device updated successfully!",
            device
        });

    } catch (error) {
        console.error("Update Device Error:", error);
        return res.status(500).json({ message: "Server error. Try again later." });
    }
};

exports.deviceAssignToUser = async (req, res) => {
    try {
        const { user_id, serial_number, assignedBy } = req.body;

        if (!user_id || !serial_number || !assignedBy) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Find User
        const user = await User.findOne({ user_id });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find Device
        const device = await Device.findOne({ serial_number });
        if (!device) {
            return res.status(404).json({ message: "Device not found" });
        }

        const now = new Date();

        // --------------------------------------
        // Update USER assignment
        // --------------------------------------
        user.assigned_serial_number = serial_number;
        user.assign_status = true;
        user.assignedBy = assignedBy;
        user.assignedAt = now;

        user.updatedBy = assignedBy;
        user.updatedAt = now;

        await user.save();

        // --------------------------------------
        // Update DEVICE assignment
        // --------------------------------------
        device.assigned_user_id = user_id;
        device.assign_status = true;
        device.assignedBy = assignedBy;
        device.assignedAt = now;

        device.updatedBy = assignedBy;
        device.updatedAt = now;

        await device.save();

        return res.status(200).json({
            success: true,
            message: "Device assigned to user successfully",
            data: {
                user,
                device
            }
        });

    } catch (error) {
        console.error("Assign Device Error:", error);
        return res.status(500).json({ message: "Server error. Try again later." });
    }
};

exports.getAssignDevices = async (req, res) => {
    try {
        const pageParam = req.query.page ? parseInt(req.query.page) : null;
        const limitParam = req.query.limit ? parseInt(req.query.limit) : null;

        const filter = {
            status: true,
            assign_status: true,
            config_status: true
        };

        const pipeline = [
            { $match: filter },
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
        ];

        // pagination
        if (pageParam && limitParam) {
            const page = pageParam;
            const limit = limitParam;
            const skip = (page - 1) * limit;

            const totalDevices = await Device.countDocuments(filter);

            const paginatedPipeline = [
                ...pipeline,
                { $skip: skip },
                { $limit: limit }
            ];

            const devices = await Device.aggregate(paginatedPipeline);

            const enrichedDevices = devices.map(device => ({
                ...device,
                user_details: device.user_details ? {
                    user_name: device.user_details.user_name,
                    user_email: device.user_details.user_email,
                    user_phone: device.user_details.user_phone   // ✔ Added
                } : null
            }));

            return res.status(200).json({
                success: true,
                data: enrichedDevices,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalDevices / limit),
                    totalDevices,
                    limit,
                    hasNextPage: page < Math.ceil(totalDevices / limit),
                    hasPrevPage: page > 1
                }
            });
        }

        // no pagination
        const devices = await Device.aggregate(pipeline);

        const enrichedDevices = devices.map(device => ({
            ...device,
            user_details: device.user_details ? {
                user_name: device.user_details.user_name,
                user_email: device.user_details.user_email,
                user_phone: device.user_details.user_phone  // ✔ Added
            } : null
        }));

        return res.status(200).json({
            success: true,
            data: enrichedDevices,
            pagination: null
        });

    } catch (error) {
        console.error("Get Devices Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error. Please try again later."
        });
    }
};


