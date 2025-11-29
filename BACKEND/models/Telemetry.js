const mongoose = require("mongoose");

const telemetrySchema = new mongoose.Schema({
    version: { type: Number },
    type: { type: String },

    serial_number: { type: String, required: true },
    imei_number: { type: String },
    user_id: { type: Number },

    timestamp: { type: Date, required: true },        // event time
    receivedAt: { type: Date },                      // server received time

    voltage_rms: { type: Number },
    current_rms: { type: Number },
    motor_frequency_hz: { type: Number },
    motor_rpm: { type: Number },
    power_kw: { type: Number },
    energy_kwh: { type: Number },

    device_temp_c: { type: Number },
    flow_lpm: { type: Number },

    fault_code: { type: Number },
    fault_percentage: { type: Number },
    signal_strength: { type: Number },

    topic: { type: String }
}, {
    collection: "borewell_telemetry",  // IMPORTANT: match your collection name
    timestamps: false                  // disable Mongoose auto timestamps
});

// Performance Indexes
telemetrySchema.index({ timestamp: 1 });
telemetrySchema.index({ serial_number: 1 });
telemetrySchema.index({ user_id: 1 });

module.exports = mongoose.model("Telemetry", telemetrySchema);
