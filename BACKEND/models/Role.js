// BACKEND/models/Role.js
const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
    role_id: {
        type: Number,     
        required: true,
        unique: true
    },

    role_name: {
        type: String,
        required: true
    },

    createdBy: { type: String },
    updatedBy: { type: String },

    status: {
        type: Boolean,
        default: true
    },

}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

module.exports = mongoose.model('Role', RoleSchema);
