// BACKEND/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true }, // maybe uuid or auto string
    user_name: { type: String, required: true },
    role_id: { type: String, required: true }, // references Role.role_id
    user_email: { type: String, required: true, unique: true },
    user_phone: { type: String },
    user_address: { type: String },
    password: { type: String, required: true },
    createdBy: { type: String },
    updatedBy: { type: String },
    status: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

module.exports = mongoose.model('User', UserSchema);
