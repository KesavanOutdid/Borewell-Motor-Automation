const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
    serial_number: { type: String, required: true, unique: true },
    imei_number: { type: String, default: null },
    config_status: { type: Boolean, default: false },
    status: { type: Boolean, default: true },

    // Assignment fields
    assigned_user_id: { type: Number, default: null },
    sim_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Sim', default: null },
    assign_status: { type: Boolean, default: false },
    start_status: { type: Boolean, default: false },
    assignedBy: { type: String, default: null },
    assignedAt: { type: Date, default: null },

    latitude: { type: String, default: null },
    longitude: { type: String, default: null },
    motor_hp: { type: String, default: null },
    device_nickname: { type: String, default: null },

    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },

    updatedBy: { type: String, default: null },
    updatedAt: { type: Date, default: null },
    last_heartbeat: { type: Date, default: null },
    startAt: { type: Date, default: null },
    stopAt: { type: Date, default: null },
    last_started_by: { type: String, default: null },
    last_started_by_email: { type: String, default: null },
    last_stopped_by: { type: String, default: null },
    last_stopped_by_email: { type: String, default: null },
});

module.exports = mongoose.model("Device", deviceSchema);
