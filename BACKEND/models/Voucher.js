const mongoose = require('mongoose');

const VoucherSchema = new mongoose.Schema({
    voucher_code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    
    discount_percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    
    start_date: {
        type: Date,
        required: true
    },
    
    end_date: {
        type: Date,
        required: true
    },
    
    max_usage: {
        type: Number,
        default: null
    },
    
    used_count: {
        type: Number,
        default: 0
    },
    
    description: {
        type: String,
        default: null
    },
    
    status: {
        type: Boolean,
        default: true
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

module.exports = mongoose.model('Voucher', VoucherSchema);
