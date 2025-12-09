const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    address_id: { type: Number, unique: true },

    user_id: {
        type: Number,
        required: true,
        index: true
    },

    full_name: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true,
        match: /^[0-9]{10}$/
    },

    email: {
        type: String,
        required: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },

    street: {
        type: String,
        required: true
    },

    city: {
        type: String,
        required: true
    },

    state: {
        type: String,
        required: true
    },

    pincode: {
        type: String,
        required: true,
        match: /^[0-9]{6}$/
    },

    country: {
        type: String,
        default: 'India',
        required: true
    },

    is_default: {
        type: Boolean,
        default: false
    },

    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: null },

    status: { type: Boolean, default: true }
});

module.exports = mongoose.model('Address', AddressSchema);
