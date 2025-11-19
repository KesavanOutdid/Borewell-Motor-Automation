const { validationResult } = require('express-validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES = '2h';

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
            user_phone: Number(user.user_phone)
        };

        // Generate JWT
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

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
        const user = await User.findOne({ user_id: userId }).select('-password');

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

        const { user_name, user_phone, status } = req.body;

        const updateData = {};
        if (user_name) updateData.user_name = user_name;
        if (user_phone) updateData.user_phone = user_phone;
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
