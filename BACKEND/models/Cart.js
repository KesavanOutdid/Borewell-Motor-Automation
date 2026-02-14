const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
    cart_id: { type: Number, unique: true },

    user_id: {
        type: Number,
        required: true,
        index: true
    },

    items: [
        {
            product_id: {
                type: Number,
                required: true
            },
            product_name: {
                type: String,
                required: true
            },
            product_price: {
                type: Number,
                required: true,
                min: 0
            },
            product_gst: {
                type: Number,
                default: 0,
                min: 0,
                max: 100
            },
            product_shipping_cost: {
                type: Number,
                default: 0,
                min: 0
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            added_at: {
                type: Date,
                default: Date.now
            }
        }
    ],

    total_price: {
        type: Number,
        default: 0,
        min: 0
    },

    total_gst: {
        type: Number,
        default: 0,
        min: 0
    },

    total_shipping_cost: {
        type: Number,
        default: 0,
        min: 0
    },

    grand_total: {
        type: Number,
        default: 0,
        min: 0
    },

    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: null },

    status: { type: Boolean, default: true }
});

module.exports = mongoose.model('Cart', CartSchema);
