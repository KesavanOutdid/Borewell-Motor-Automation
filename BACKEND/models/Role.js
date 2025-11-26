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

    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: null },

    status: {
        type: Boolean,
        default: true
    },

});

module.exports = mongoose.model('Role', RoleSchema);
