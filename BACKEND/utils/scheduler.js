const cron = require('node-cron');
const DeviceSchedule = require('../models/DeviceSchedule');
const Device = require('../models/Device');
const User = require('../models/User');
const DeviceShare = require('../models/DeviceShare');
const { client: mqttPublisher } = require('../mqtt/publisher');
const { sendPushNotification } = require('./notificationHelper');
const mongoose = require('mongoose');

// Power availability time windows (24-hour format)
const NO_POWER_WINDOWS = [
    { start: 18, startMin: 0, end: 19, endMin: 30 }  // 6:00 PM - 7:30 PM (18:00 - 19:30)
];

const isPowerAvailable = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    for (const window of NO_POWER_WINDOWS) {
        const windowStart = window.start * 60 + window.startMin;
        const windowEnd = window.end * 60 + window.endMin;
        const currentTime = hour * 60 + minute;
        
        if (currentTime >= windowStart && currentTime < windowEnd) {
            return false; // No power available
        }
    }
    return true; // Power is available
};

const getNextPowerAvailableTime = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    for (const window of NO_POWER_WINDOWS) {
        const windowStart = window.start * 60 + window.startMin;
        const windowEnd = window.end * 60 + window.endMin;
        const currentTime = hour * 60 + minute;
        
        if (currentTime >= windowStart && currentTime < windowEnd) {
            // Currently in no-power window, return when power comes back
            const nextDate = new Date(now);
            nextDate.setHours(window.end, window.endMin, 0, 0);
            return nextDate;
        }
    }
    return now; // Power is available now
};

const initScheduler = () => {
    console.log('--- Scheduler Initialized ---');
    console.log('Power unavailable: 6:00 PM - 7:30 PM (18:00 - 19:30)');
    
    // Run every minute
    cron.schedule('* * * * *', async () => {
        const now = new Date();
        
        try {
            // 1. Process Pending Schedules to START
            const pendingStarts = await DeviceSchedule.find({
                status: 'pending',
                start_time: { $lte: now },
                start_executed: false
            });

            for (const schedule of pendingStarts) {
                // Check if power is available
                if (!isPowerAvailable()) {
                    const nextPowerTime = getNextPowerAvailableTime();
                    console.log(`[Scheduler] ⚠️ NO POWER for ${schedule.serial_number}. Next power available: ${nextPowerTime}`);
                    
                    // Update schedule with next available time
                    schedule.start_time = nextPowerTime;
                    await schedule.save();
                    continue; // Skip execution, wait for next power window
                }
                
                await executeCommand(schedule, true);
            }

            // 2. Process Started Schedules to STOP
            const pendingStops = await DeviceSchedule.find({
                status: { $in: ['pending', 'started'] },
                stop_time: { $lte: now },
                stop_executed: false
            });

            for (const schedule of pendingStops) {
                await executeCommand(schedule, false);
            }

        } catch (error) {
            console.error('Scheduler Error:', error);
        }
    });
};

const executeCommand = async (schedule, isStart) => {
    const { serial_number, imei_number, user_id } = schedule;
    
    try {
        console.log(`[Scheduler] ${isStart ? 'STARTING' : 'STOPPING'} Device: ${serial_number}`);

        // Update Device State in DB
        const updateData = {
            start_status: isStart,
            updatedBy: 'SYSTEM_SCHEDULER',
            updatedAt: new Date()
        };

        if (isStart) {
            updateData.startAt = new Date();
            updateData.last_started_by = 'Auto Scheduler';
        } else {
            updateData.stopAt = new Date();
            updateData.last_stopped_by = 'Auto Scheduler';
        }

        await Device.updateOne({ serial_number }, { $set: updateData });

        // Publish MQTT Command
        const topic = `agri/${serial_number}/command`;
        const payload = {
            MESSAGE_TYPE: "COMMAND",
            SERIAL_NUMBER: serial_number,
            IMEI_NUMBER: imei_number,
            COMMAND: isStart ? "START" : "STOP",
            TIMESTAMP: new Date().toISOString()
        };

        if (mqttPublisher && mqttPublisher.connected) {
            mqttPublisher.publish(topic, JSON.stringify(payload), { qos: 1 });
        }

        // Emit Socket Event
        if (global.io) {
            global.io.emit("LIVE_STATUS", {
                serial_number,
                payload: {
                    motor_running: isStart,
                    updatedAt: new Date().toISOString()
                }
            });
        }

        // Update Schedule Status
        if (isStart) {
            schedule.start_executed = true;
            schedule.status = 'started';
        } else {
            schedule.stop_executed = true;
            schedule.status = 'completed';
        }
        schedule.updated_at = new Date();
        await schedule.save();

        // Notify Owner and Shared Users
        const notifyAllUsers = async () => {
            try {
                // 1. Get Device and Owner
                const device = await Device.findOne({ serial_number });
                const ownerId = device ? device.assigned_user_id : user_id;
                
                // 2. Get Shared Users
                const sharedEntries = await DeviceShare.find({ serial_number, status: true, acceptance_status: 'accepted' });
                const sharedUserIds = sharedEntries.map(s => s.shared_to_user_id);
                
                const allUserIds = [...new Set([ownerId, ...sharedUserIds])];
                const users = await User.find({ user_id: { $in: allUserIds } });
                
                const title = isStart ? "🟢 Auto Start Triggered" : "🔴 Auto Stop Triggered";
                const setByInfo = schedule.user_name ? ` (Set by: ${schedule.user_name})` : '';
                const body = `Scheduled task: Device ${serial_number} has been ${isStart ? 'started' : 'stopped'} automatically${setByInfo}.`;

                for (const user of users) {
                    if (user.fcm_tokens && user.fcm_tokens.length > 0) {
                        sendPushNotification(user.fcm_tokens, { title, body }, {
                            type: "STATUS",
                            serial_number,
                            action: isStart ? "START" : "STOP"
                        });
                    }
                }
            } catch (err) {
                console.error("Schedule FCM notification failed:", err);
            }
        };
        notifyAllUsers();

    } catch (error) {
        console.error(`Execution failed for ${serial_number}:`, error);
        schedule.status = 'failed';
        await schedule.save();
    }
};

module.exports = { initScheduler };
