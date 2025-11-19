// BACKEND/controllers/appControllers.js
const { validationResult } = require('express-validator');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES = '2h';

exports.login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { user_email, password } = req.body;
        const user = await User.findOne({ user_email });
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        if (!user.status) return res.status(403).json({ success: false, message: 'User disabled' });

        const payload = {
            user_id: user.user_id,
            user_email: user.user_email,
            user_name: user.user_name,
            role_id: user.role_id,
            user_phone: user.user_phone
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
        res.json({ success: true, token, user: payload });
    } catch (err) { next(err); }
};

// Example protected endpoint to get profile
exports.getProfile = async (req, res, next) => {
    try {
        // req.user set by auth middleware
        res.json({ success: true, user: req.user });
    } catch (err) { next(err); }
};
