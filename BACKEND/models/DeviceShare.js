const mongoose = require("mongoose");

const deviceShareSchema = new mongoose.Schema({
    serial_number: { type: String, required: true },
    master_user_id: { type: Number, required: true },
    shared_to_user_id: { type: Number, required: true },
    shared_to_user_name: { type: String, default: null },
    shared_to_user_phone: { type: Number, default: null },
    status: { type: Boolean, default: true }, // true = active, false = deactivated
    acceptance_status: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected'], 
        default: 'pending' 
    },
    assignedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: null },
    history: [
        {
            action: { type: String, enum: ['assigned', 'deactivated', 'activated', 'deleted', 'accepted', 'rejected'] },
            performedBy: { type: Number }, // user_id who performed the action
            timestamp: { type: Date, default: Date.now }
        }
    ]
});

// Create index for faster lookups
deviceShareSchema.index({ serial_number: 1, shared_to_user_id: 1 }, { unique: true });

module.exports = mongoose.model("DeviceShare", deviceShareSchema);
