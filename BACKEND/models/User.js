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

    password: {
        type: Number,
        required: true,
        validate: {
            validator: v => /^[0-9]{6}$/.test(v.toString()),
            message: "Password must be 6 digits"
        }
    },

    createdBy: String,
    updatedBy: String,
    status: { type: Boolean, default: true }

}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
