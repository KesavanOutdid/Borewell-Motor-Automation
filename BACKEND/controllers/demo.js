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
        const limit = parseInt(req.query.limit);
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

        // Overall total users
        const totalUsers = await User.countDocuments();

        // Additional counts
        const totalCustomerUsers = await User.countDocuments({ role_id: 2 });
        const totalAdminUsers = await User.countDocuments({ role_id: 1 });
        const totalActiveUsers = await User.countDocuments({ status: true });
        const totalDeactiveUsers = await User.countDocuments({ status: false });

        // Aggregation for users paging
        const users = await User.aggregate([
            {
                $lookup: {
                    from: "roles",
                    localField: "role_id",
                    foreignField: "role_id",
                    as: "role"
                }
            },
            { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },
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

        res.json({
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

        // Total counts
        const totalDevices = await Device.countDocuments();
        const totalAssignedDevices = await Device.countDocuments({ assign_status: true });
        const totalUnassignedDevices = await Device.countDocuments({ assign_status: false });
        const totalActiveDevices = await Device.countDocuments({ status: true });
        const totalDeactiveDevices = await Device.countDocuments({ status: false });

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

        return res.status(200).json({
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

// exports.getAnalasitic = async (req, res) => {
//     try {
//         const analytics = await Device.aggregate([
//             {
//                 $facet: {
//                     // CREATED
//                     createdWeekly: [
//                         { $group: { _id: { week: { $isoWeek: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
//                         { $sort: { "_id.year": -1, "_id.week": -1 } },
//                         { $project: { _id: 0, week: { $concat: [{ $toString: "$_id.year" }, "-W", { $toString: "$_id.week" }] }, count: 1 } }
//                     ],
//                     createdMonthly: [
//                         { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
//                         { $sort: { "_id.year": -1, "_id.month": -1 } },
//                         { $project: { _id: 0, month: { $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }] }, count: 1 } }
//                     ],
//                     createdYearly: [
//                         { $group: { _id: { year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
//                         { $sort: { "_id.year": -1 } },
//                         { $project: { _id: 0, year: "$_id.year", count: 1 } }
//                     ],

//                     // ACTIVE STATUS DEVICES
//                     activeStatusWeekly: [
//                         { $match: { status: true, createdAt: { $ne: null } } },
//                         { $group: { _id: { week: { $isoWeek: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
//                         { $sort: { "_id.year": -1, "_id.week": -1 } },
//                         { $project: { _id: 0, week: { $concat: [{ $toString: "$_id.year" }, "-W", { $toString: "$_id.week" }] }, count: 1 } }
//                     ],
//                     activeStatusMonthly: [
//                         { $match: { status: true, createdAt: { $ne: null } } },
//                         { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
//                         { $sort: { "_id.year": -1, "_id.month": -1 } },
//                         { $project: { _id: 0, month: { $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }] }, count: 1 } }
//                     ],
//                     activeStatusYearly: [
//                         { $match: { status: true, createdAt: { $ne: null } } },
//                         { $group: { _id: { year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
//                         { $sort: { "_id.year": -1 } },
//                         { $project: { _id: 0, year: "$_id.year", count: 1 } }
//                     ],

//                     // DEACTIVATED
//                     statusDeactivatedWeekly: [
//                         { $match: { status: false, updatedAt: { $ne: null } } },
//                         { $group: { _id: { week: { $isoWeek: "$updatedAt" }, year: { $year: "$updatedAt" } }, count: { $sum: 1 } } },
//                         { $sort: { "_id.year": -1, "_id.week": -1 } },
//                         { $project: { _id: 0, week: { $concat: [{ $toString: "$_id.year" }, "-W", { $toString: "$_id.week" }] }, count: 1 } }
//                     ],
//                     statusDeactivatedMonthly: [
//                         { $match: { status: false, updatedAt: { $ne: null } } },
//                         { $group: { _id: { month: { $month: "$updatedAt" }, year: { $year: "$updatedAt" } }, count: { $sum: 1 } } },
//                         { $sort: { "_id.year": -1, "_id.month": -1 } },
//                         { $project: { _id: 0, month: { $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }] }, count: 1 } }
//                     ],
//                     statusDeactivatedYearly: [
//                         { $match: { status: false, updatedAt: { $ne: null } } },
//                         { $group: { _id: { year: { $year: "$updatedAt" } }, count: { $sum: 1 } } },
//                         { $sort: { "_id.year": -1 } },
//                         { $project: { _id: 0, year: "$_id.year", count: 1 } }
//                     ],

//                     // ASSIGNED
//                     assignedWeekly: [
//                         { $match: { assign_status: true, assignedAt: { $ne: null } } },
//                         { $group: { _id: { week: { $isoWeek: "$assignedAt" }, year: { $year: "$assignedAt" } }, count: { $sum: 1 } } },
//                         { $sort: { "_id.year": -1, "_id.week": -1 } },
//                         { $project: { _id: 0, week: { $concat: [{ $toString: "$_id.year" }, "-W", { $toString: "$_id.week" }] }, count: 1 } }
//                     ],
//                     assignedMonthly: [
//                         { $match: { assign_status: true, assignedAt: { $ne: null } } },
//                         { $group: { _id: { month: { $month: "$assignedAt" }, year: { $year: "$assignedAt" } }, count: { $sum: 1 } } },
//                         { $sort: { "_id.year": -1, "_id.month": -1 } },
//                         { $project: { _id: 0, month: { $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }] }, count: 1 } }
//                     ],
//                     assignedYearly: [
//                         { $match: { assign_status: true, assignedAt: { $ne: null } } },
//                         { $group: { _id: { year: { $year: "$assignedAt" } }, count: { $sum: 1 } } },
//                         { $sort: { "_id.year": -1 } },
//                         { $project: { _id: 0, year: "$_id.year", count: 1 } }
//                     ],

//                     // STATUS DISTRIBUTION
//                     statusType: [
//                         { $group: { _id: "$status", count: { $sum: 1 } } },
//                         { $project: { _id: 0, type: { $cond: [{ $eq: ["$_id", true] }, "active", "deactive"] }, count: 1 } }
//                     ],

//                     assignType: [
//                         { $group: { _id: "$assign_status", count: { $sum: 1 } } },
//                         { $project: { _id: 0, type: { $cond: [{ $eq: ["$_id", true] }, "assigned", "unassigned"] }, count: 1 } }
//                     ]
//                 }
//             }
//         ]);

//         res.json({
//             success: true,
//             created: {
//                 weekly: analytics[0].createdWeekly,
//                 monthly: analytics[0].createdMonthly,
//                 yearly: analytics[0].createdYearly
//             },
//             activeStatus: {
//                 weekly: analytics[0].activeStatusWeekly,
//                 monthly: analytics[0].activeStatusMonthly,
//                 yearly: analytics[0].activeStatusYearly
//             },
//             assigned: {
//                 weekly: analytics[0].assignedWeekly,
//                 monthly: analytics[0].assignedMonthly,
//                 yearly: analytics[0].assignedYearly
//             },
//             statusDeactivated: {
//                 weekly: analytics[0].statusDeactivatedWeekly,
//                 monthly: analytics[0].statusDeactivatedMonthly,
//                 yearly: analytics[0].statusDeactivatedYearly
//             },
//             statusType: analytics[0].statusType,
//             assignType: analytics[0].assignType
//         });

//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };


// ---------- helpers for filling missing periods ----------

// years: [2023, 2024, 2025]
// years: [{ year: 2024, count: 0 }, ...]
function generateYears(startYear, endYear) {
    const result = [];
    for (let y = startYear; y <= endYear; y++) {
        result.push({ year: y, count: 0 });
    }
    return result;
}

// months: [{ month: "2024-1", count: 0 }, ..., { month: "2025-12", count: 0 }]
function generateMonthsForYears(startYear, endYear) {
    const result = [];
    for (let y = startYear; y <= endYear; y++) {
        for (let m = 1; m <= 12; m++) {
            result.push({ month: `${y}-${m}`, count: 0 });
        }
    }
    return result;
}

// weeks: [{ week: "2024-W1", count: 0 }, ..., { week: "2025-W52", count: 0 }]
function generateWeeksForYears(startYear, endYear) {
    const result = [];
    for (let y = startYear; y <= endYear; y++) {
        for (let w = 1; w <= 52; w++) { // enough for charts
            result.push({ week: `${y}-W${w}`, count: 0 });
        }
    }
    return result;
}

// merge DB result into the full range
function mergeRange(fullRange, dbData = [], keyName) {
    return fullRange.map(item => {
        const found = dbData.find(d => d[keyName] === item[keyName]);
        return found ? { ...item, count: found.count } : item;
    });
}

exports.getAnalasitic = async (req, res) => {
    try {
        const analytics = await Device.aggregate([
            {
                $facet: {
                    // CREATED
                    createdWeekly: [
                        { $group: { _id: { week: { $isoWeek: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
                        { $sort: { "_id.year": -1, "_id.week": -1 } },
                        {
                            $project: {
                                _id: 0,
                                week: {
                                    $concat: [
                                        { $toString: "$_id.year" },
                                        "-W",
                                        { $toString: "$_id.week" }
                                    ]
                                },
                                count: 1
                            }
                        }
                    ],
                    createdMonthly: [
                        { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
                        { $sort: { "_id.year": -1, "_id.month": -1 } },
                        {
                            $project: {
                                _id: 0,
                                month: {
                                    $concat: [
                                        { $toString: "$_id.year" },
                                        "-",
                                        { $toString: "$_id.month" }
                                    ]
                                },
                                count: 1
                            }
                        }
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
                        {
                            $project: {
                                _id: 0,
                                week: {
                                    $concat: [
                                        { $toString: "$_id.year" },
                                        "-W",
                                        { $toString: "$_id.week" }
                                    ]
                                },
                                count: 1
                            }
                        }
                    ],
                    activeStatusMonthly: [
                        { $match: { status: true, createdAt: { $ne: null } } },
                        { $group: { _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } }, count: { $sum: 1 } } },
                        { $sort: { "_id.year": -1, "_id.month": -1 } },
                        {
                            $project: {
                                _id: 0,
                                month: {
                                    $concat: [
                                        { $toString: "$_id.year" },
                                        "-",
                                        { $toString: "$_id.month" }
                                    ]
                                },
                                count: 1
                            }
                        }
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
                        {
                            $project: {
                                _id: 0,
                                week: {
                                    $concat: [
                                        { $toString: "$_id.year" },
                                        "-W",
                                        { $toString: "$_id.week" }
                                    ]
                                },
                                count: 1
                            }
                        }
                    ],
                    statusDeactivatedMonthly: [
                        { $match: { status: false, updatedAt: { $ne: null } } },
                        { $group: { _id: { month: { $month: "$updatedAt" }, year: { $year: "$updatedAt" } }, count: { $sum: 1 } } },
                        { $sort: { "_id.year": -1, "_id.month": -1 } },
                        {
                            $project: {
                                _id: 0,
                                month: {
                                    $concat: [
                                        { $toString: "$_id.year" },
                                        "-",
                                        { $toString: "$_id.month" }
                                    ]
                                },
                                count: 1
                            }
                        }
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
                        {
                            $project: {
                                _id: 0,
                                week: {
                                    $concat: [
                                        { $toString: "$_id.year" },
                                        "-W",
                                        { $toString: "$_id.week" }
                                    ]
                                },
                                count: 1
                            }
                        }
                    ],
                    assignedMonthly: [
                        { $match: { assign_status: true, assignedAt: { $ne: null } } },
                        { $group: { _id: { month: { $month: "$assignedAt" }, year: { $year: "$assignedAt" } }, count: { $sum: 1 } } },
                        { $sort: { "_id.year": -1, "_id.month": -1 } },
                        {
                            $project: {
                                _id: 0,
                                month: {
                                    $concat: [
                                        { $toString: "$_id.year" },
                                        "-",
                                        { $toString: "$_id.month" }
                                    ]
                                },
                                count: 1
                            }
                        }
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
                        {
                            $project: {
                                _id: 0,
                                type: { $cond: [{ $eq: ["$_id", true] }, "active", "deactive"] },
                                count: 1
                            }
                        }
                    ],

                    assignType: [
                        { $group: { _id: "$assign_status", count: { $sum: 1 } } },
                        {
                            $project: {
                                _id: 0,
                                type: { $cond: [{ $eq: ["$_id", true] }, "assigned", "unassigned"] },
                                count: 1
                            }
                        }
                    ]
                }
            }
        ]);

        const row = analytics[0] || {};

        // ---------- FIXED: last 7 years (including current) ----------
        const currentYear = new Date().getFullYear();  // e.g. 2025
        const minYear = currentYear - 6;               // 2019
        const maxYear = currentYear;                   // 2025

        // ---------- build full ranges ----------
        const fullYears = generateYears(minYear, maxYear);             // 2019..2025
        const fullMonths = generateMonthsForYears(minYear, maxYear);   // all 12 months each year
        const fullWeeks = generateWeeksForYears(minYear, maxYear);     // 52 weeks per year

        // ---------- merge DB data into full ranges ----------
        const created = {
            weekly: mergeRange(fullWeeks, row.createdWeekly, "week"),
            monthly: mergeRange(fullMonths, row.createdMonthly, "month"),
            yearly: mergeRange(fullYears, row.createdYearly, "year")
        };

        const activeStatus = {
            weekly: mergeRange(fullWeeks, row.activeStatusWeekly, "week"),
            monthly: mergeRange(fullMonths, row.activeStatusMonthly, "month"),
            yearly: mergeRange(fullYears, row.activeStatusYearly, "year")
        };

        const assigned = {
            weekly: mergeRange(fullWeeks, row.assignedWeekly, "week"),
            monthly: mergeRange(fullMonths, row.assignedMonthly, "month"),
            yearly: mergeRange(fullYears, row.assignedYearly, "year")
        };

        const statusDeactivated = {
            weekly: mergeRange(fullWeeks, row.statusDeactivatedWeekly, "week"),
            monthly: mergeRange(fullMonths, row.statusDeactivatedMonthly, "month"),
            yearly: mergeRange(fullYears, row.statusDeactivatedYearly, "year")
        };

        // ---------- final response ----------
        res.json({
            success: true,
            created,
            activeStatus,
            assigned,
            statusDeactivated,
            statusType: row.statusType || [],
            assignType: row.assignType || []
        });

    } catch (err) {
        console.error("getAnalasitic error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

