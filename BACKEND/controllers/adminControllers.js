// BACKEND/controllers/adminControllers.js
const { validationResult } = require('express-validator');
const Role = require('../models/Role');
const User = require('../models/User');
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
            createdBy: req.user?.user_email || 'Admin'
        });
        await role.save();
        res.status(201).json({ success: true, role });
    } catch (err) { next(err); }
};

// Create user
exports.createUser = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        const { user_name, role_id, user_email, user_phone, password } = req.body;

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
            createdBy: req.user?.user_email || 'Admin'
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

// Get all roles
exports.getRoles = async (req, res, next) => {
    try {
        const roles = await Role.find();
        res.json({ success: true, roles });
    } catch (err) { next(err); }
};

// Get all users
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, users });
    } catch (err) { next(err); }
};
