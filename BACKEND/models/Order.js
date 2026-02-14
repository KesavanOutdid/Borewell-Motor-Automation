const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    order_id: { type: String, unique: true, required: true },

    user_id: {
        type: Number,
        required: true,
        index: true
    },

    user_email: {
        type: String,
        required: true
    },

    cart_items: [
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
                required: true
            },
            product_gst: {
                type: Number,
                default: 0
            },
            product_shipping_cost: {
                type: Number,
                default: 0
            },
            quantity: {
                type: Number,
                required: true
            },
            product_main_image: {
                type: String,
                default: null
            }
        }
    ],

    shipping_address: {
        full_name: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        country: { type: String, default: 'India' }
    },

    order_summary: {
        total_price: { type: Number, required: true },
        total_gst: { type: Number, required: true },
        total_shipping_cost: { type: Number, required: true },
        grand_total: { type: Number, required: true }
    },

    payment_method: {
        type: String,
        enum: ['razorpay', 'cod'],
        default: 'cod'
    },

    payment_status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },

    order_status: {
        type: String,
        enum: ['created', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'created'
    },

    razorpay_order_id: { type: String, default: null },
    razorpay_payment_id: { type: String, default: null },
    razorpay_signature: { type: String, default: null },

    cancellation_reason: { type: String, default: null },

    order_timeline: [
        {
            status: {
                type: String,
                enum: ['created', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']
            },
            message: { type: String },
            timestamp: { type: Date, default: Date.now },
            updated_by: { type: String, default: null }
        }
    ],

    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: null }
});

module.exports = mongoose.model('Order', OrderSchema);
