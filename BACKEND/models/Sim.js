const mongoose = require("mongoose");

const simSchema = new mongoose.Schema({
    sim_number: { type: String, required: true, unique: true }, // ICCID
    phone_number: { type: String, required: true },
    imei_number: { type: String, default: null }, // Optional or required based on user input
    provider: { type: String, default: null }, // e.g. Airtel, Jio
    status: { type: Boolean, default: true }, // Active/De-active generally
    
    // Assignment fields
    assign_status: { type: Boolean, default: false },
    assigned_device_serial: { type: String, default: null }, // Reference to device

    // Timing fields
    sim_activation_date: { type: Date, default: null },
    sim_expiry_date: { type: Date, default: null },
    sim_recharge_status: { type: String, enum: ['Active', 'Expiring Soon', 'Expired'], default: 'Active' },

    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedBy: { type: String, default: null },
    updatedAt: { type: Date, default: null }
});

module.exports = mongoose.model("Sim", simSchema);
