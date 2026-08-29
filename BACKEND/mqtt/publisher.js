require('dotenv').config();
const mqtt = require('mqtt');
const Device = require('../models/Device');

const clientId = `publisher_${Math.random().toString(16).substr(2, 8)}`;
const client = mqtt.connect(process.env.MQTT_BROKER, {
    port: parseInt(process.env.MQTT_PORT),
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId,
    clean: true,
    keepalive: 30,
    reconnectPeriod: 5000,
    connectTimeout: 4000,
});

// Fetch configured & active devices that are assigned to users
async function getConfiguredDevices() {
    try {
        return await Device.find({
            config_status: true,
            status: true,
            assign_status: true,
            assigned_user_id: { $exists: true, $ne: null }
        }).maxTimeMS(30000);
    } catch (error) {
        console.error('Error fetching configured devices:', error.message);
        return [];
    }
}

let intervals = [];

client.on('connect', () => {
    console.log(`Publisher Connected as ${clientId}`);

    intervals.forEach(id => clearInterval(id));
    intervals = [];

    sendBoot();

    intervals.push(setInterval(sendHeartbeat, 3000)); 
    intervals.push(setInterval(sendStatusAck, 3000)); 
    intervals.push(setInterval(sendTelemetry, 3000));
    intervals.push(setInterval(sendAlert, 300000)); 

});

client.on('error', (err) => {
    console.error('MQTT Connection Error:', err);
});

client.on('offline', () => {
    console.warn('MQTT Client went offline');
});

client.on('reconnect', () => {
    console.log('MQTT Client attempting to reconnect...');
});

// MQTT Publish Wrapper
function publish(topic, payload) {
    if (!client.connected) {
        console.warn(`Cannot publish to ${topic} - MQTT client not connected`);
        return;
    }

    client.publish(topic, JSON.stringify(payload), { qos: 1 }, err => {
        // if (err) console.error(`Publish error on ${topic}:`, err);
        // else console.log(`Published: ${topic}`);
    });
}

/* --------------------------------------------------------------------- */
/* BOOT – only when motor is OFF                                       */
/* --------------------------------------------------------------------- */

async function sendBoot() {
    try {
        const devices = await getConfiguredDevices();

        devices.forEach(d => {
            if (d.start_status) return;  // motor ON → do NOT send BOOT

            const payload = {
                MESSAGE_TYPE: "BOOTNOTIFICATION",
                SERIAL_NUMBER: d.serial_number,
                FIRMWARE_VERSION: "1.0.3",
                HARDWARE_VERSION: "HW1.0",
                TIMESTAMP: new Date().toISOString(),
                POWER_STATUS: "ON",
                NETWORK_STATUS: "4G",
            };
            if (d.imei_number) payload.IMEI_NUMBER = d.imei_number;

            publish(`agri/${d.serial_number}/boot`, payload);
        });
    } catch (error) {
        console.error('Error sending boot notifications:', error.message);
    }
}

/* --------------------------------------------------------------------- */
/* HEARTBEAT – only when motor is OFF                                   */
/* --------------------------------------------------------------------- */

async function sendHeartbeat() {
    try {
        const devices = await getConfiguredDevices();

        devices.forEach(d => {
            const payload = {
                MESSAGE_TYPE: "HEARTBEAT",
                SERIAL_NUMBER: d.serial_number,
                SIGNAL_STRENGTH: 30 + Math.floor(Math.random() * 50),
                TIMESTAMP: new Date().toISOString(),
                MOTOR_RUNNING: !!d.start_status
            };
            if (d.imei_number) payload.IMEI_NUMBER = d.imei_number;

            publish(`agri/${d.serial_number}/heartbeat`, payload);
        });
    } catch (error) {
        console.error('Error sending heartbeat:', error.message);
    }
}

/* --------------------------------------------------------------------- */
/* STATUS – always send                                                 */
/* --------------------------------------------------------------------- */
async function sendStatusAck() {
    try {
        const devices = await getConfiguredDevices();

        devices.forEach(d => {
            const payload = {
                MESSAGE_TYPE: "STATUS",
                SERIAL_NUMBER: d.serial_number,
                MOTOR_RUNNING: !!d.start_status,
                MOTOR_POWER: "Single Phase",
                TIMESTAMP: new Date().toISOString()
            };
            if (d.imei_number) payload.IMEI_NUMBER = d.imei_number;

            publish(`agri/${d.serial_number}/phase`, payload);
        });
    } catch (error) {
        console.error('Error sending status ack:', error.message);
    }
}

/* --------------------------------------------------------------------- */
/* TELEMETRY – only motor is running                                    */
/* --------------------------------------------------------------------- */
async function sendTelemetry() {
    try {
        const devices = await getConfiguredDevices();

        devices.forEach(d => {
            if (!d.start_status) return; // motor OFF → do not send

            const payload = {
                TYPE: "TELEMETRY",
                SERIAL_NUMBER: d.serial_number,
                TIMESTAMP: new Date().toISOString(),
                VOLTAGE_RMS: Number((230 + Math.random() * 10).toFixed(1)),
                CURRENT_RMS: Number((5 + Math.random() * 2).toFixed(1)),
                MOTOR_RPM: Math.floor(2100 + Math.random() * 50),
                POWER_KW: 1.1,
                ENERGY_KWH: Number((Math.random() * 0.3).toFixed(3)),
                DEVICE_TEMP_C: Number((38 + Math.random() * 5).toFixed(1)),
                FLOW_LPM: Math.floor(250 + Math.random() * 10),
                FREQUENCY_HZ: 50,
                POWER_FACTOR: 0.92,
                SIGNAL_STRENGTH: 75,
                FAULT_CODE: 0
            };
            if (d.imei_number) payload.IMEI_NUMBER = d.imei_number;

            publish(`agri/${d.serial_number}/telemetry`, payload);
        });
    } catch (error) {
        console.error('Error sending telemetry:', error.message);
    }
}

/* --------------------------------------------------------------------- */
/* ALERT – only when motor is running                                   */
/* --------------------------------------------------------------------- */
async function sendAlert() {
    try {
        const devices = await getConfiguredDevices();

        const alertTypes = ["DRY_RUN", "OVERLOAD", "LOW_VOLTAGE"];

    devices.forEach(d => {
        if (!d.start_status) return;  // motor OFF → don't send alerts

        const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];

        const payload = {
            MESSAGE_TYPE: "ALERT",
            ALERT_TYPE: alert,
            SERIAL_NUMBER: d.serial_number,
            DEVICE_STATUS: alert === "DRY_RUN" ? "CRITICAL" : "WARNING",
            FAULT_CODE: 101,
            TIMESTAMP: new Date().toISOString()
        };
        if (d.imei_number) payload.IMEI_NUMBER = d.imei_number;

        publish(`agri/${d.serial_number}/alert`, payload);
    });
    } catch (error) {
        console.error('Error sending alert:', error.message);
    }
}

module.exports = {
    client,
    sendBootNotificationsOnStartup: sendBoot
}; 
