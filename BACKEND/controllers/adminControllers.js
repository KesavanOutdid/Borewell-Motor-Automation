// BACKEND/controllers/adminControllers.js
const { validationResult } = require('express-validator');
const Role = require('../models/Role');
const User = require('../models/User');
const Device = require("../models/Device");
const Product = require("../models/Product");
const Voucher = require('../models/Voucher');
const DeviceShare = require('../models/DeviceShare');
const ManageHelp = require('../models/ManageHelp');
const bcrypt = require('bcrypt');
const path = require('path');
const { sendEmail } = require('../utils/emailHelper');
const { cacheDeletePattern } = require('../middlewares/cacheMiddleware');
const mongoose = require('mongoose');

// Create role
exports.createRole = async (req, res, next) => {
    try {
        // validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { role_id, role_name, createdBy } = req.body;
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

        if (user_name && user_name.trim().length > 40) {
            return res.status(400).json({ success: false, message: "Name should not exceed 40 characters." });
        }

        // Check if role exists
        const role = await Role.findOne({ role_id });
        if (!role)
            return res.status(400).json({ success: false, message: 'Invalid role_id' });

        // Check if email already exists
        const emailExists = await User.findOne({ user_email });
        if (emailExists)
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });

        // Check if phone already exists
        const phoneExists = await User.findOne({ user_phone });
        if (phoneExists)
            return res.status(409).json({
                success: false,
                message: "Phone number already exists"
            });

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
            createdBy,
        });

        await user.save();

        // Send Signup Email
        sendEmail(
            user.user_email,
            'Welcome to Smart Motor Automation!',
            `Hello ${user.user_name},\n\nYour account has been successfully created by our administrator. You can now log in and manage your motor automation devices.\n\nThank you for choosing us!`
        ).catch(err => console.error("Admin createUser email failed:", err));

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
        const limit = parseInt(req.query.limit);
        const search = req.query.search || '';

        const skip = (page - 1) * limit;

        const searchFilter = search ? {
            $or: [
                { role_name: { $regex: search, $options: 'i' } }
            ]
        } : {};

        // Get total count for pagination
        const totalRoles = await Role.countDocuments(searchFilter);

        const roles = await Role.find(searchFilter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalRoles / limit);

        const response = {
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
        };

        res.json(response);
    } catch (err) { next(err); }
};

// Get all users with pagination
exports.getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        const skip = (page - 1) * limit;

        let searchFilter = {};
        let aggregatedSearchFilter = {};

        if (search) {
            const searchConditions = [
                { user_name: { $regex: search, $options: 'i' } },
                { user_email: { $regex: search, $options: 'i' } }
            ];

            const aggregatedSearchConditions = [
                { user_name: { $regex: search, $options: 'i' } },
                { user_email: { $regex: search, $options: 'i' } },
                { 'role.role_name': { $regex: search, $options: 'i' } }
            ];

            const numericSearch = search.replace(/\D/g, '');
            if (numericSearch) {
                searchConditions.push({
                    $expr: {
                        $regexMatch: {
                            input: { $toString: "$user_phone" },
                            regex: numericSearch,
                            options: 'i'
                        }
                    }
                });
                aggregatedSearchConditions.push({
                    $expr: {
                        $regexMatch: {
                            input: { $toString: "$user_phone" },
                            regex: numericSearch,
                            options: 'i'
                        }
                    }
                });
            }

            searchFilter = { $or: searchConditions };
            aggregatedSearchFilter = { $or: aggregatedSearchConditions };
        }

        // Summary counts aggregation to correctly reflect filtered counts
        const countPipelineForSummary = [
            {
                $lookup: {
                    from: "roles",
                    localField: "role_id",
                    foreignField: "role_id",
                    as: "role"
                }
            },
            { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } }
        ];

        if (search) {
            countPipelineForSummary.push({ $match: aggregatedSearchFilter });
        } else {
            countPipelineForSummary.push({ $match: searchFilter });
        }

        countPipelineForSummary.push({
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                totalActiveUsers: { $sum: { $cond: [{ $eq: ["$status", true] }, 1, 0] } },
                totalDeactiveUsers: { $sum: { $cond: [{ $eq: ["$status", false] }, 1, 0] } },
                totalAdminUsers: { $sum: { $cond: [{ $eq: ["$role.role_name", "Admin"] }, 1, 0] } },
                totalCustomerUsers: { $sum: { $cond: [{ $eq: ["$role.role_name", "Customer"] }, 1, 0] } }
            }
        });

        const summaryResult = await User.aggregate(countPipelineForSummary);
        const summary = summaryResult[0] || {
            totalUsers: 0,
            totalActiveUsers: 0,
            totalDeactiveUsers: 0,
            totalAdminUsers: 0,
            totalCustomerUsers: 0
        };

        const totalUsersFiltered = summary.totalUsers;
        const totalActiveUsers = summary.totalActiveUsers;
        const totalDeactiveUsers = summary.totalDeactiveUsers;
        const totalAdminUsers = summary.totalAdminUsers;
        const totalCustomerUsers = summary.totalCustomerUsers;

        // Aggregation for users paging
        const pipeline = [];

        // If searching, we need to lookup role first to search by role_name
        if (search) {
            pipeline.push(
                {
                    $lookup: {
                        from: "roles",
                        localField: "role_id",
                        foreignField: "role_id",
                        as: "role"
                    }
                },
                { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },
                { $match: aggregatedSearchFilter }
            );
        } else {
            pipeline.push(
                { $match: searchFilter },
                {
                    $lookup: {
                        from: "roles",
                        localField: "role_id",
                        foreignField: "role_id",
                        as: "role"
                    }
                },
                { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } }
            );
        }

        pipeline.push(
            { $project: { "role._id": 0, "role.createdAt": 0, "role.updatedAt": 0, "role.__v": 0 } },
            { $sort: { createdAt: -1 } }
        );

        pipeline.push(
            { $skip: skip },
            { $limit: limit }
        );

        const users = await User.aggregate(pipeline);

        const formatted = users.map(u => ({
            ...u,
            role_name: u.role?.role_name || "N/A"
        }));

        const totalPages = Math.ceil(totalUsersFiltered / limit);

        const response = {
            success: true,
            users: formatted,
            pagination: {
                currentPage: page,
                totalPages,
                limit,
                totalUsers: totalUsersFiltered,
                totalCustomerUsers,
                totalAdminUsers,
                totalActiveUsers,
                totalDeactiveUsers,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };

        res.json(response);

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

        if (user_name && user_name.trim().length > 40) {
            return res.status(400).json({ success: false, message: "Name should not exceed 40 characters." });
        }

        // Validate required fields
        if (!user_id) return res.status(400).json({ success: false, message: 'User ID is required' });

        // Find user by user_id
        const user = await User.findOne({ user_id });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Check if phone is being updated and if it already exists for another user
        if (user_phone !== undefined && user_phone !== '' && user_phone !== user.user_phone) {
            const phoneExists = await User.findOne({ user_phone, user_id: { $ne: user_id } });
            if (phoneExists) {
                return res.status(409).json({ success: false, message: 'Phone number already exists' });
            }
        }

        // Update fields (only update fields that are provided and not empty)
        let passwordChanged = false;
        let detailsChanged = false;

        if (user_name !== undefined && user_name !== '' && user_name !== user.user_name) {
            user.user_name = user_name;
            detailsChanged = true;
        }
        if (user_phone !== undefined && user_phone !== '' && Number(user_phone) !== Number(user.user_phone)) {
            user.user_phone = Number(user_phone);
            detailsChanged = true;
        }

        if (status !== undefined) {
            const newStatus = status === 'true' || status === true;
            if (newStatus !== user.status) {
                user.status = newStatus;
                detailsChanged = true;
            }
        }

        if (password !== undefined && password !== '' && String(password) !== String(user.password)) {
            user.password = Number(password);
            passwordChanged = true;
        }

        // Update metadata
        user.updatedBy = updatedBy;
        user.updatedAt = new Date();

        await user.save();

        // Send Email if password changed
        if (passwordChanged) {
            sendEmail(
                user.user_email,
                'Password Updated - Smart Motor Automation',
                `Hello ${user.user_name},\n\nYour account password has been successfully updated by our administrator on ${new Date().toLocaleString()}.\n\nIf you did not expect this change, please contact us immediately.`
            ).catch(err => console.error("Admin update password email failed:", err));
        } else if (detailsChanged) {
            // Send Profile Update Email
            sendEmail(
                user.user_email,
                'Profile Updated - Smart Motor Automation',
                `Hello ${user.user_name},\n\nYour account details have been successfully updated by our administrator on ${new Date().toLocaleString()}.\n\nIf you did not expect this change, please contact us immediately.`
            ).catch(err => console.error("Admin update details email failed:", err));
        }

        await cacheDeletePattern('*users*');
        await cacheDeletePattern('*profile*');

        res.json({ success: true, message: 'User updated successfully' });
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
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

        const now = new Date();
        now.setUTCHours(0, 0, 0, 0); // Normalize to UTC start of day for consistent date-only comparison
        const tomorrow = new Date(now);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

        const summaryResult = await Voucher.aggregate([
            { $match: searchFilter },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    valid: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$status", true] },
                                        { $lt: ["$start_date", tomorrow] },
                                        { $gte: ["$end_date", now] }
                                    ]
                                },
                                1, 0
                            ]
                        }
                    },
                    pending: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$status", true] },
                                        { $gte: ["$start_date", tomorrow] }
                                    ]
                                },
                                1, 0
                            ]
                        }
                    },
                    expired: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$status", true] },
                                        { $lt: ["$end_date", now] }
                                    ]
                                },
                                1, 0
                            ]
                        }
                    },
                    inactive: {
                        $sum: {
                            $cond: [{ $eq: ["$status", false] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const summary = summaryResult[0] || { total: 0, valid: 0, pending: 0, expired: 0, inactive: 0 };

        const response = {
            success: true,
            data: vouchers,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(summary.total / limit),
                totalVouchers: summary.total,
                totalValidVouchers: summary.valid,
                totalPendingVouchers: summary.pending,
                totalExpiredVouchers: summary.expired,
                totalInactiveVouchers: summary.inactive,
                limit: parseInt(limit),
                hasNextPage: page * limit < summary.total,
                hasPrevPage: page > 1
            }
        };

        res.status(200).json(response);

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
                updatedBy: req.body.updatedBy || 'admin',
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

exports.createDevice = async (req, res) => {
    try {
        const { serial_number, imei_number, createdBy } = req.body;

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
            imei_number: imei_number || null,
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
        const search = req.query.search || '';
        const assign_status = req.query.assign_status;

        const skip = (page - 1) * limit;

        const searchFilter = search ? {
            $or: [
                { serial_number: { $regex: search, $options: 'i' } },
                { imei_number: { $regex: search, $options: 'i' } }
            ]
        } : {};

        if (assign_status === 'true') {
            searchFilter.assign_status = true;
        } else if (assign_status === 'false') {
            searchFilter.assign_status = false;
        }

        const aggregatedSearchFilter = search ? {
            $or: [
                { serial_number: { $regex: search, $options: 'i' } },
                { imei_number: { $regex: search, $options: 'i' } },
                { 'user_details.user_name': { $regex: search, $options: 'i' } }
            ]
        } : {};

        if (assign_status === 'true') {
            aggregatedSearchFilter.assign_status = true;
        } else if (assign_status === 'false') {
            aggregatedSearchFilter.assign_status = false;
        }

        // Summary counts aggregation to correctly reflect search results across all categories
        const countPipelineForSummary = [
            {
                $lookup: {
                    from: "users",
                    localField: "assigned_user_id",
                    foreignField: "user_id",
                    as: "user_details"
                }
            },
            { $unwind: { path: "$user_details", preserveNullAndEmptyArrays: true } },
            {
                $match: search ? {
                    $or: [
                        { serial_number: { $regex: search, $options: 'i' } },
                        { imei_number: { $regex: search, $options: 'i' } },
                        { 'user_details.user_name': { $regex: search, $options: 'i' } }
                    ]
                } : {}
            },
            {
                $group: {
                    _id: null,
                    totalDevices: { $sum: 1 },
                    totalAssignedDevices: { $sum: { $cond: [{ $eq: ["$assign_status", true] }, 1, 0] } },
                    totalUnassignedDevices: { $sum: { $cond: [{ $eq: ["$assign_status", false] }, 1, 0] } },
                    totalActiveDevices: { $sum: { $cond: [{ $eq: ["$status", true] }, 1, 0] } },
                    totalDeactiveDevices: { $sum: { $cond: [{ $eq: ["$status", false] }, 1, 0] } }
                }
            }
        ];

        const summaryResult = await Device.aggregate(countPipelineForSummary);
        const summary = summaryResult[0] || {
            totalDevices: 0,
            totalAssignedDevices: 0,
            totalUnassignedDevices: 0,
            totalActiveDevices: 0,
            totalDeactiveDevices: 0
        };

        const totalDevicesFiltered = summary.totalDevices;
        const totalAssignedDevices = summary.totalAssignedDevices;
        const totalUnassignedDevices = summary.totalUnassignedDevices;
        const totalActiveDevices = summary.totalActiveDevices;
        const totalDeactiveDevices = summary.totalDeactiveDevices;

        // Paginated device data with user details
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
                $unwind: { path: "$user_details", preserveNullAndEmptyArrays: true }
            },
            { $match: aggregatedSearchFilter },
            {
                $project: {
                    "user_details.password": 0,
                    "user_details.createdAt": 0,
                    "user_details.updatedAt": 0,
                    "user_details.__v": 0
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        // Fetch DeviceShare data for each device
        const enrichedDevices = await Promise.all(devices.map(async (device) => {
            const sharedUsers = await DeviceShare.find({
                serial_number: device.serial_number,
                status: true
            }).select('-__v').lean();

            return {
                ...device,
                user_details: device.user_details
                    ? {
                        user_name: device.user_details.user_name,
                        user_email: device.user_details.user_email,
                        user_phone: device.user_details.user_phone,
                        status: device.user_details.status
                    }
                    : null,
                shared_users: sharedUsers || []
            };
        }));

        const totalPages = Math.ceil(totalDevicesFiltered / limit);

        const response = {
            success: true,
            data: enrichedDevices,
            pagination: {
                currentPage: page,
                totalPages,
                totalDevices: totalDevicesFiltered,
                totalAssignedDevices,
                totalUnassignedDevices,
                totalActiveDevices,
                totalDeactiveDevices,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };

        return res.status(200).json(response);

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
        const { id, serial_number, imei_number, status, updatedBy } = req.body;

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
        if (imei_number !== undefined) device.imei_number = imei_number || null;
        if (status !== undefined) device.status = status;

        device.updatedBy = updatedBy;
        device.updatedAt = new Date();

        await device.save();

        await cacheDeletePattern('*devices*');
        await cacheDeletePattern('*analytics*');

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

        // Check if device is already assigned to the same user
        if (device.assign_status && device.assigned_user_id === user_id) {
            return res.status(409).json({ message: "This device is already assigned to this user" });
        }

        // Check if device is already assigned to a different user
        if (device.assign_status && device.assigned_user_id !== user_id) {
            return res.status(409).json({ message: "This device is already assigned to another user. Unassign it first." });
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

        await cacheDeletePattern('*devices*');
        await cacheDeletePattern('*users*');
        await cacheDeletePattern('*analytics*');

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

exports.getAnalasitic = async (req, res) => {
    try {
        const analytics = await Device.aggregate([
            {
                $facet: {
                    // CREATED
                    createdWeekly: [
                        { $group: { _id: { week: { $isoWeek: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
                        { $sort: { "_id.year": -1, "_id.week": -1 } },
                        { $project: { _id: 0, week: { $concat: [{ $toString: "$_id.year" }, "-W", { $toString: "$_id.week" }] }, count: 1 } }
                    ],
                    createdMonthly: [
                        { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
                        { $sort: { "_id.year": -1, "_id.month": -1 } },
                        { $project: { _id: 0, month: { $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }] }, count: 1 } }
                    ],
                    createdYearly: [
                        { $group: { _id: { year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
                        { $sort: { "_id.year": -1 } },
                        { $project: { _id: 0, year: "$_id.year", count: 1 } }
                    ],

                    // ACTIVE STATUS DEVICES
                    activeStatusWeekly: [
                        { $match: { status: true, createdAt: { $ne: null } } },
                        { $group: { _id: { week: { $isoWeek: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
                        { $sort: { "_id.year": -1, "_id.week": -1 } },
                        { $project: { _id: 0, week: { $concat: [{ $toString: "$_id.year" }, "-W", { $toString: "$_id.week" }] }, count: 1 } }
                    ],
                    activeStatusMonthly: [
                        { $match: { status: true, createdAt: { $ne: null } } },
                        { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
                        { $sort: { "_id.year": -1, "_id.month": -1 } },
                        { $project: { _id: 0, month: { $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }] }, count: 1 } }
                    ],
                    activeStatusYearly: [
                        { $match: { status: true, createdAt: { $ne: null } } },
                        { $group: { _id: { year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
                        { $sort: { "_id.year": -1 } },
                        { $project: { _id: 0, year: "$_id.year", count: 1 } }
                    ],

                    // DEACTIVATED
                    statusDeactivatedWeekly: [
                        { $match: { status: false, updatedAt: { $ne: null } } },
                        { $group: { _id: { week: { $isoWeek: "$updatedAt" }, year: { $year: "$updatedAt" } }, count: { $sum: 1 } } },
                        { $sort: { "_id.year": -1, "_id.week": -1 } },
                        { $project: { _id: 0, week: { $concat: [{ $toString: "$_id.year" }, "-W", { $toString: "$_id.week" }] }, count: 1 } }
                    ],
                    statusDeactivatedMonthly: [
                        { $match: { status: false, updatedAt: { $ne: null } } },
                        { $group: { _id: { month: { $month: "$updatedAt" }, year: { $year: "$updatedAt" } }, count: { $sum: 1 } } },
                        { $sort: { "_id.year": -1, "_id.month": -1 } },
                        { $project: { _id: 0, month: { $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }] }, count: 1 } }
                    ],
                    statusDeactivatedYearly: [
                        { $match: { status: false, updatedAt: { $ne: null } } },
                        { $group: { _id: { year: { $year: "$updatedAt" } }, count: { $sum: 1 } } },
                        { $sort: { "_id.year": -1 } },
                        { $project: { _id: 0, year: "$_id.year", count: 1 } }
                    ],

                    // ASSIGNED
                    assignedWeekly: [
                        { $match: { assign_status: true, assignedAt: { $ne: null } } },
                        { $group: { _id: { week: { $isoWeek: "$assignedAt" }, year: { $year: "$assignedAt" } }, count: { $sum: 1 } } },
                        { $sort: { "_id.year": -1, "_id.week": -1 } },
                        { $project: { _id: 0, week: { $concat: [{ $toString: "$_id.year" }, "-W", { $toString: "$_id.week" }] }, count: 1 } }
                    ],
                    assignedMonthly: [
                        { $match: { assign_status: true, assignedAt: { $ne: null } } },
                        { $group: { _id: { month: { $month: "$assignedAt" }, year: { $year: "$assignedAt" } }, count: { $sum: 1 } } },
                        { $sort: { "_id.year": -1, "_id.month": -1 } },
                        { $project: { _id: 0, month: { $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }] }, count: 1 } }
                    ],
                    assignedYearly: [
                        { $match: { assign_status: true, assignedAt: { $ne: null } } },
                        { $group: { _id: { year: { $year: "$assignedAt" } }, count: { $sum: 1 } } },
                        { $sort: { "_id.year": -1 } },
                        { $project: { _id: 0, year: "$_id.year", count: 1 } }
                    ],

                    // STATUS DISTRIBUTION
                    statusType: [
                        { $group: { _id: "$status", count: { $sum: 1 } } },
                        { $project: { _id: 0, type: { $cond: [{ $eq: ["$_id", true] }, "active", "deactive"] }, count: 1 } }
                    ],

                    assignType: [
                        { $group: { _id: "$assign_status", count: { $sum: 1 } } },
                        { $project: { _id: 0, type: { $cond: [{ $eq: ["$_id", true] }, "assigned", "unassigned"] }, count: 1 } }
                    ]
                }
            }
        ]);

        res.json({
            success: true,
            created: {
                weekly: analytics[0].createdWeekly,
                monthly: analytics[0].createdMonthly,
                yearly: analytics[0].createdYearly
            },
            activeStatus: {
                weekly: analytics[0].activeStatusWeekly,
                monthly: analytics[0].activeStatusMonthly,
                yearly: analytics[0].activeStatusYearly
            },
            assigned: {
                weekly: analytics[0].assignedWeekly,
                monthly: analytics[0].assignedMonthly,
                yearly: analytics[0].assignedYearly
            },
            statusDeactivated: {
                weekly: analytics[0].statusDeactivatedWeekly,
                monthly: analytics[0].statusDeactivatedMonthly,
                yearly: analytics[0].statusDeactivatedYearly
            },
            statusType: analytics[0].statusType,
            assignType: analytics[0].assignType
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


// ---------- helpers for filling missing periods ----------

// ---------------------
// Product Management
// ---------------------
exports.createProduct = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const {
            product_name,
            product_description,
            product_description_pdf,
            product_main_image,
            product_sub_images,
            product_quality,
            product_price,
            product_gst,
            product_shipping_cost,
            product_quantity,
            createdBy
        } = req.body;

        if (!product_name || !product_description || !product_main_image)
            return res.status(400).json({
                success: false,
                message: "product_name, product_description, and product_main_image are required"
            });

        // Product Name Validation (only letters and numbers)
        const productNameRegex = /^[a-zA-Z0-9\s]+$/;
        if (!productNameRegex.test(product_name)) {
            return res.status(400).json({
                success: false,
                message: "Product name should contain only letters and numbers"
            });
        }

        // Box Size Validation
        const boxSizeRegex = /^(\d+(\.\d+)?\s*[xX*]\s*)*\d+(\.\d+)?$/;
        if (product_quality?.box_size && !boxSizeRegex.test(product_quality.box_size)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Box Size format. Use numbers (e.g., 10 or 10x10x10)"
            });
        }

        // Numeric fields validation
        if (product_price !== undefined && isNaN(product_price)) {
            return res.status(400).json({ success: false, message: "Price must be a number" });
        }
        if (product_gst !== undefined && isNaN(product_gst)) {
            return res.status(400).json({ success: false, message: "GST must be a number" });
        }
        if (product_shipping_cost !== undefined && isNaN(product_shipping_cost)) {
            return res.status(400).json({ success: false, message: "Shipping Cost must be a number" });
        }
        if (product_quantity !== undefined && !/^\d+$/.test(product_quantity)) {
            return res.status(400).json({ success: false, message: "Quantity must be an integer" });
        }

        const lastProduct = await Product.findOne().sort({ product_id: -1 }).lean();
        const newProductId = lastProduct ? lastProduct.product_id + 1 : 1;

        const product = new Product({
            product_id: newProductId,
            product_name,
            product_description,
            product_description_pdf: product_description_pdf || null,
            product_main_image,
            product_sub_images: product_sub_images || [],
            product_quality: product_quality || { box_size: null, extra_details: null },
            product_price: product_price || 0,
            product_gst: product_gst || 0,
            product_shipping_cost: product_shipping_cost || 0,
            product_quantity: product_quantity || 0,
            createdBy,
            createdAt: new Date()
        });

        await product.save();

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product
        });

    } catch (err) {
        console.error("Create Product Error:", err);
        res.status(500).json({ success: false, message: "Server error creating product" });
        next(err);
    }
};

exports.getProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        const searchFilter = search ? {
            $or: [
                { product_name: { $regex: search, $options: 'i' } },
                { product_description: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const totalProducts = await Product.countDocuments(searchFilter);
        const totalActiveProducts = await Product.countDocuments({ ...searchFilter, status: true });
        const totalInactiveProducts = await Product.countDocuments({ ...searchFilter, status: false });

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
                totalActiveProducts,
                totalInactiveProducts,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error("Get Products Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching products"
        });
    }
};

exports.getProductById = async (req, res, next) => {
    try {
        const { id } = req.query;

        if (!id)
            return res.status(400).json({ success: false, message: "Product ID is required" });

        const product = await Product.findById(id).lean();

        if (!product)
            return res.status(404).json({ success: false, message: "Product not found" });

        res.status(200).json({
            success: true,
            data: product
        });

    } catch (error) {
        console.error("Get Product By ID Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching product"
        });
    }
};

exports.updateProduct = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const {
            id,
            product_name,
            product_description,
            product_description_pdf,
            product_main_image,
            product_sub_images,
            product_quality,
            product_price,
            product_gst,
            product_shipping_cost,
            product_quantity,
            status,
            updatedBy
        } = req.body;

        if (!id)
            return res.status(400).json({ success: false, message: "Product ID is required" });

        const product = await Product.findById(id);

        if (!product)
            return res.status(404).json({ success: false, message: "Product not found" });

        // Product Name Validation (only letters and numbers)
        if (product_name) {
            const productNameRegex = /^[a-zA-Z0-9\s]+$/;
            if (!productNameRegex.test(product_name)) {
                return res.status(400).json({
                    success: false,
                    message: "Product name should contain only letters and numbers"
                });
            }
        }

        // Box Size Validation
        const boxSizeRegex = /^(\d+(\.\d+)?\s*[xX*]\s*)*\d+(\.\d+)?$/;
        if (product_quality?.box_size && !boxSizeRegex.test(product_quality.box_size)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Box Size format. Use numbers (e.g., 10 or 10x10x10)"
            });
        }

        // Numeric fields validation
        if (product_price !== undefined && isNaN(product_price)) {
            return res.status(400).json({ success: false, message: "Price must be a number" });
        }
        if (product_gst !== undefined && isNaN(product_gst)) {
            return res.status(400).json({ success: false, message: "GST must be a number" });
        }
        if (product_shipping_cost !== undefined && isNaN(product_shipping_cost)) {
            return res.status(400).json({ success: false, message: "Shipping Cost must be a number" });
        }
        if (product_quantity !== undefined && !/^\d+$/.test(product_quantity)) {
            return res.status(400).json({ success: false, message: "Quantity must be an integer" });
        }

        if (product_name) product.product_name = product_name;
        if (product_description) product.product_description = product_description;
        if (product_description_pdf !== undefined) product.product_description_pdf = product_description_pdf;
        if (product_main_image) product.product_main_image = product_main_image;
        if (product_sub_images) product.product_sub_images = product_sub_images;
        if (product_quality) product.product_quality = product_quality;
        if (product_price !== undefined) product.product_price = product_price;
        if (product_gst !== undefined) product.product_gst = product_gst;
        if (product_shipping_cost !== undefined) product.product_shipping_cost = product_shipping_cost;
        if (product_quantity !== undefined) product.product_quantity = product_quantity;
        if (status !== undefined) product.status = status;

        product.updatedBy = updatedBy;
        product.updatedAt = new Date();

        await product.save();

        await cacheDeletePattern('*products*');

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product
        });

    } catch (error) {
        console.error("Update Product Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error updating product"
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
        // First get shared serials
        const shares = await DeviceShare.find({ shared_to_user_id: userIdNum });
        const sharedSerials = shares.map(s => s.serial_number);

        // Base match criteria
        const baseMatch = {
            // status: true,
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

        // 3. Find all device share relationships where this user is involved (as master or shared_to)
        const sharedDeviceRelationships = await DeviceShare.find({
            $or: [
                { master_user_id: userIdNum },
                { shared_to_user_id: userIdNum }
            ],
            status: true
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
                message: "User not found"
            });
        }

        let serialNumbers = [];
        if (serial_number) {
            // If user is admin (role_id === 1), bypass access check
            if (user.role_id === 1) {
                serialNumbers = [serial_number];
            } else {
                // Verify if user has access to this serial
                const hasAccess = await Device.findOne({ serial_number, assigned_user_id: user.user_id }) ||
                    await DeviceShare.findOne({ serial_number, shared_to_user_id: user.user_id, status: true, acceptance_status: 'accepted' });

                if (!hasAccess) {
                    return res.status(403).json({ success: false, message: "No access to this device" });
                }
                serialNumbers = [serial_number];
            }
        } else {
            // 1. Get all serial numbers the user has access to
            const masterDevices = await Device.find({ assigned_user_id: user.user_id });
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

exports.deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.body;

        if (!id)
            return res.status(400).json({ success: false, message: "Product ID is required" });

        const product = await Product.findByIdAndDelete(id);

        if (!product)
            return res.status(404).json({ success: false, message: "Product not found" });

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error("Delete Product Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error deleting product"
        });
    }
};

// ---------------------
// File Upload Handlers
// ---------------------
exports.uploadPDF = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const fileUrl = `/upload/pdf/${req.file.filename}`;

        res.status(200).json({
            success: true,
            message: 'PDF uploaded successfully',
            filePath: fileUrl,
            fileName: req.file.filename
        });

    } catch (error) {
        console.error('Upload PDF Error:', error);
        res.status(500).json({ success: false, message: 'Server error uploading PDF' });
    }
};

exports.uploadImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const fileUrl = `/upload/img/${req.file.filename}`;

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            filePath: fileUrl,
            fileName: req.file.filename
        });

    } catch (error) {
        console.error('Upload Image Error:', error);
        res.status(500).json({ success: false, message: 'Server error uploading image' });
    }
};

exports.uploadMultipleImages = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const filePaths = req.files.map(file => `/upload/img/${file.filename}`);

        res.status(200).json({
            success: true,
            message: 'Images uploaded successfully',
            filePaths: filePaths,
            fileNames: req.files.map(f => f.filename)
        });

    } catch (error) {
        console.error('Upload Multiple Images Error:', error);
        res.status(500).json({ success: false, message: 'Server error uploading images' });
    }
};

// years: [2023, 2024, 2025]
// years: [{ year: 2024, count: 0 }, ...]
// RANDOM GENERATOR
// function randomInt(min, max) {
//     return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// // Weekly data: 10 entries
// function generateWeekly() {
//     const result = [];
//     const today = new Date();

//     for (let i = 0; i < 10; i++) {
//         const date = new Date(today);
//         date.setDate(today.getDate() - i * 7);

//         const year = date.getFullYear();
//         const oneJan = new Date(year, 0, 1);
//         const week = Math.ceil((((date - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);

//         result.push({
//             week: `${year}-W${week}`,
//             count: randomInt(10, 80)
//         });
//     }

//     return result.reverse();
// }

// // Monthly data: 12 entries
// function generateMonthly() {
//     const result = [];
//     const currentYear = new Date().getFullYear();

//     for (let m = 1; m <= 12; m++) {
//         result.push({
//             month: `${currentYear}-${m}`,
//             count: randomInt(50, 200)
//         });
//     }

//     return result;
// }

// // Yearly data: 10 entries
// function generateYearly() {
//     const result = [];
//     const currentYear = new Date().getFullYear();

//     for (let y = 0; y < 10; y++) {
//         result.push({
//             year: currentYear - y,
//             count: randomInt(200, 1500)
//         });
//     }

//     return result.reverse();
// }

// exports.getAnalasitic = async (req, res) => {
//     try {
//         res.json({
//             success: true,
//             created: {
//                 weekly: generateWeekly(),
//                 monthly: generateMonthly(),
//                 yearly: generateYearly()
//             },
//             activeStatus: {
//                 weekly: generateWeekly(),
//                 monthly: generateMonthly(),
//                 yearly: generateYearly()
//             },
//             assigned: {
//                 weekly: generateWeekly(),
//                 monthly: generateMonthly(),
//                 yearly: generateYearly()
//             },
//             statusDeactivated: {
//                 weekly: generateWeekly(),
//                 monthly: generateMonthly(),
//                 yearly: generateYearly()
//             },
//             statusType: [
//                 { type: "active", count: randomInt(50, 100) },
//                 { type: "deactive", count: randomInt(10, 40) }
//             ],
//             assignType: [
//                 { type: "assigned", count: randomInt(40, 90) },
//                 { type: "unassigned", count: randomInt(10, 40) }
//             ]
//         });

//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

exports.getDeviceSmartHistory = async (req, res) => {
    try {
        const { serial_number } = req.query;

        if (!serial_number) {
            return res.status(400).json({
                success: false,
                message: "Serial number is required"
            });
        }

        const db = mongoose.connection.db;
        const historyCollection = db.collection("agri_history");

        const history = await historyCollection
            .find({ serial_number: serial_number })
            .sort({ startAt: -1 })
            .toArray();

        return res.status(200).json({
            success: true,
            serial_number,
            count: history.length,
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

// =====================
// Manage Help (Admin)
// =====================

exports.getAllHelp = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '', status_filter = '' } = req.query;

        const skip = (page - 1) * limit;

        let searchFilter = {};
        const conditions = [];

        if (search) {
            conditions.push({
                $or: [
                    { user_name: { $regex: search, $options: 'i' } },
                    { user_mobile: { $regex: search, $options: 'i' } },
                    { subject: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            });
        }

        if (status_filter && status_filter !== 'all') {
            conditions.push({ status: status_filter });
        }

        if (conditions.length > 0) {
            searchFilter = conditions.length === 1 ? conditions[0] : { $and: conditions };
        }

        const helpRequests = await ManageHelp.find(searchFilter)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await ManageHelp.countDocuments(searchFilter);
        const totalPending = await ManageHelp.countDocuments({ ...(search ? conditions[0] : {}), status: 'pending' });
        const totalSolved = await ManageHelp.countDocuments({ ...(search ? conditions[0] : {}), status: 'solved' });
        const totalRejected = await ManageHelp.countDocuments({ ...(search ? conditions[0] : {}), status: 'rejected' });
        const totalReSolved = await ManageHelp.countDocuments({ ...(search ? conditions[0] : {}), status: 're-solved' });
        const totalAll = await ManageHelp.countDocuments(search ? conditions[0] : {});

        res.status(200).json({
            success: true,
            data: helpRequests,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalHelp: totalAll,
                totalPending,
                totalSolved,
                totalRejected,
                totalReSolved,
                limit: parseInt(limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        });

    } catch (err) {
        next(err);
    }
};

exports.getHelpById = async (req, res, next) => {
    try {
        const { id } = req.query;

        if (!id) return res.status(400).json({ success: false, message: "Help ID is required" });

        const help = await ManageHelp.findById(id);
        if (!help) return res.status(404).json({ success: false, message: "Help request not found" });

        res.status(200).json({
            success: true,
            data: help
        });

    } catch (err) {
        next(err);
    }
};

exports.updateHelpStatus = async (req, res, next) => {
    try {
        const { id, status, admin_remarks, updatedBy } = req.body;

        if (!id) return res.status(400).json({ success: false, message: "Help ID is required" });
        if (!status) return res.status(400).json({ success: false, message: "Status is required" });

        const validStatuses = ['pending', 'rejected', 'solved', 're-solved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
        }

        const help = await ManageHelp.findById(id);
        if (!help) return res.status(404).json({ success: false, message: "Help request not found" });

        const updateData = {
            status,
            updatedBy: updatedBy || null,
            updatedAt: new Date()
        };

        if (admin_remarks !== undefined) {
            updateData.admin_remarks = admin_remarks;
        }

        const updatedHelp = await ManageHelp.findByIdAndUpdate(id, updateData, { new: true });

        res.status(200).json({
            success: true,
            message: "Help status updated successfully",
            data: updatedHelp
        });

    } catch (err) {
        next(err);
    }
};
