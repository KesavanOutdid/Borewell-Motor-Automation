const mongoose = require("mongoose");

const deviceScheduleSchema = new mongoose.Schema({
    serial_number: { type: String, required: true },
    imei_number: { type: String, required: true },
    user_id: { type: Number, required: true },
    user_name: { type: String },
    started_by: { type: String },
    stopped_by: { type: String },
    cancelled_by: { type: String },
    
    start_time: { type: Date, required: true },
    stop_time: { type: Date, required: true },
    
    status: { 
        type: String, 
        enum: ['pending', 'started', 'completed', 'cancelled', 'failed', 'stopped'], 
        default: 'pending' 
    },
    
    start_executed: { type: Boolean, default: false },
    stop_executed: { type: Boolean, default: false },
    
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Index for efficient querying by background job
deviceScheduleSchema.index({ status: 1, start_time: 1 });
deviceScheduleSchema.index({ status: 1, stop_time: 1 });

module.exports = mongoose.model("DeviceSchedule", deviceScheduleSchema);
