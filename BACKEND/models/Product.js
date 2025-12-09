const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    product_id: { type: Number, unique: true },

    product_name: {
        type: String,
        required: true,
        trim: true
    },

    product_description: {
        type: String,
        required: true,
        trim: true
    },

    product_description_pdf: {
        type: String,
        default: null
    },

    product_main_image: {
        type: String,
        required: true
    },

    product_sub_images: [
        {
            type: String
        }
    ],

    product_quality: {
        box_size: { type: String, default: null },
        extra_details: { type: String, default: null }
    },

    product_price: {
        type: Number,
        default: 0,
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

    product_quantity: {
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

module.exports = mongoose.model('Product', ProductSchema);
