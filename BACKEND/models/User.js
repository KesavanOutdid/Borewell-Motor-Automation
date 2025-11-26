const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    user_id: { type: Number, unique: true },

    user_name: { type: String, required: true },
    role_id: { type: Number, required: true },

    user_email: {
        type: String,
        required: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },

    user_phone: {
        type: Number,
        required: true,
        validate: {
            validator: v => /^[0-9]{10}$/.test(v.toString()),
            message: "Phone must be 10 digits"
        }
    },

    password: { type: Number, required: true },

    // Assignment fields
    assigned_serial_number: { type: String, default: null },
    assign_status: { type: Boolean, default: false },
    assignedBy: { type: String, default: null },
    assignedAt: { type: Date, default: null },

    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: null },

    status: { type: Boolean, default: true }

});

module.exports = mongoose.model('User', UserSchema);
