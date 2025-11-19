// BACKEND/models/Role.js
const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
    role_id: { type: String, required: true, unique: true }, // e.g. "ADMIN", "USER"
    role_name: { type: String, required: true },
    createdBy: { type: String }, // user_id or admin email
    updatedBy: { type: String },
    status: { type: Boolean, default: true },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

module.exports = mongoose.model('Role', RoleSchema);
