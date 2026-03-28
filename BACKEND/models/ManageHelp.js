const mongoose = require('mongoose');

const ManageHelpSchema = new mongoose.Schema({
    user_id: {
        type: Number,
        required: true
    },

    user_name: {
        type: String,
        required: true,
        trim: true
    },

    user_mobile: {
        type: String,
        required: true,
        trim: true
    },

    subject: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true,
        trim: true
    },

    status: {
        type: String,
        enum: ['pending', 'rejected', 'solved', 're-solved'],
        default: 'pending'
    },

    admin_remarks: {
        type: String,
        default: null
    },

    createdBy: {
        type: String,
        default: null
    },

    updatedBy: {
        type: String,
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model('manage_help', ManageHelpSchema);
