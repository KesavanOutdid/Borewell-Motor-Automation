// BACKEND/controllers/adminControllers.js
const { validationResult } = require('express-validator');
const Role = require('../models/Role');
const User = require('../models/User');
const Device = require("../models/Device");
const Product = require("../models/Product");
const bcrypt = require('bcrypt');
const path = require('path');
const { cacheDeletePattern } = require('../middlewares/cacheMiddleware');

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

        const searchFilter = search ? {
            $or: [
                { user_name: { $regex: search, $options: 'i' } },
                { user_email: { $regex: search, $options: 'i' } },
                { user_phone: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const aggregatedSearchFilter = search ? {
            $or: [
                { user_name: { $regex: search, $options: 'i' } },
                { user_email: { $regex: search, $options: 'i' } },
                { user_phone: { $regex: search, $options: 'i' } },
                { 'role.role_name': { $regex: search, $options: 'i' } }
            ]
        } : {};

        // Overall total users
        const totalUsers = await User.countDocuments(searchFilter);

        // Additional counts
        const totalCustomerUsers = await User.countDocuments({ ...searchFilter, role_id: 2 });
        const totalAdminUsers = await User.countDocuments({ ...searchFilter, role_id: 1 });
        const totalActiveUsers = await User.countDocuments({ ...searchFilter, status: true });
        const totalDeactiveUsers = await User.countDocuments({ ...searchFilter, status: false });

        // Aggregation for users paging
        const users = await User.aggregate([
            { $match: searchFilter },
            {
                $lookup: {
                    from: "roles",
                    localField: "role_id",
                    foreignField: "role_id",
                    as: "role"
                }
            },
            { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },
            { $match: aggregatedSearchFilter },
            { $project: { "role._id": 0, "role.createdAt": 0, "role.updatedAt": 0, "role.__v": 0 } },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        const formatted = users.map(u => ({
            ...u,
            role_name: u.role?.role_name || "N/A"
        }));

        const totalPages = Math.ceil(totalUsers / limit);

        const response = {
            success: true,
            users: formatted,
            pagination: {
                currentPage: page,
                totalPages,
                limit,
                totalUsers,
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

        await cacheDeletePattern('*users*');
        await cacheDeletePattern('*profile*');

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
        const search = req.query.search || '';

        const skip = (page - 1) * limit;

        const searchFilter = search ? {
            $or: [
                { serial_number: { $regex: search, $options: 'i' } },
                { imei_number: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const aggregatedSearchFilter = search ? {
            $or: [
                { serial_number: { $regex: search, $options: 'i' } },
                { imei_number: { $regex: search, $options: 'i' } },
                { 'user_details.user_name': { $regex: search, $options: 'i' } }
            ]
        } : {};

        // Total counts
        const totalDevices = await Device.countDocuments(searchFilter);
        const totalAssignedDevices = await Device.countDocuments({ ...searchFilter, assign_status: true });
        const totalUnassignedDevices = await Device.countDocuments({ ...searchFilter, assign_status: false });
        const totalActiveDevices = await Device.countDocuments({ ...searchFilter, status: true });
        const totalDeactiveDevices = await Device.countDocuments({ ...searchFilter, status: false });

        // Paginated device data with user details
        const devices = await Device.aggregate([
            { $match: searchFilter },
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

        // Format response
        const enrichedDevices = devices.map(device => ({
            ...device,
            user_details: device.user_details
                ? {
                    user_name: device.user_details.user_name,
                    user_email: device.user_details.user_email,
                    user_phone: device.user_details.user_phone,
                    status: device.user_details.status
                }
                : null
        }));

        const totalPages = Math.ceil(totalDevices / limit);

        const response = {
            success: true,
            data: enrichedDevices,
            pagination: {
                currentPage: page,
                totalPages,
                totalDevices,
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
