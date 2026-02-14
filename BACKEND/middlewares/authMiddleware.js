// BACKEND/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

function authMiddleware(requiredRole) {
    return async (req, res, next) => {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!token) return res.status(401).json({ success: false, message: 'Missing token' });

        try {
            const payload = jwt.verify(token, JWT_SECRET);
            // attach user info to req
            req.user = payload;

            // optional: fetch fresh user from DB
            const user = await User.findOne({ user_id: payload.user_id });
            if (!user) return res.status(401).json({ success: false, message: 'User not found' });
            if (!user.status) return res.status(403).json({ success: false, message: 'User disabled' });

            // if role required, check
            if (requiredRole) {
                if (payload.role_id !== requiredRole && payload.role_id !== 'ADMIN') {
                    return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
                }
            }

            next();
        } catch (err) {
            console.error(err);
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
    };
}

module.exports = authMiddleware;
