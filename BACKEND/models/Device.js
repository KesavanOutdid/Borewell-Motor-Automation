const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
    serial_number: { type: String, required: true, unique: true },
    imei_number: { type: String, default: null },
    config_status: { type: Boolean, default: false },
    status: { type: Boolean, default: true },

    // Assignment fields
    assigned_user_id: { type: Number, default: null },
    assign_status: { type: Boolean, default: false },
    start_status: { type: Boolean, default: false },
    assignedBy: { type: String, default: null },
    assignedAt: { type: Date, default: null },

    latitude: { type: String, default: null },
    longitude: { type: String, default: null },
    motor_hp: { type: String, default: null },

    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },

    updatedBy: { type: String, default: null },
    updatedAt: { type: Date, default: null },
    startAt: { type: Date, default: null },
    stopAt: { type: Date, default: null },
});

module.exports = mongoose.model("Device", deviceSchema);
