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
    return await Device.find({
        config_status: true,
        status: true,
        assign_status: true,
        assigned_user_id: { $exists: true, $ne: null }
    });
}

let intervals = [];

client.on('connect', () => {
    console.log(`Publisher Connected as ${clientId}`);

    intervals.forEach(id => clearInterval(id));
    intervals = [];

    sendBoot();

    intervals.push(setInterval(sendHeartbeat, 10000));
    intervals.push(setInterval(sendStatusAck, 10000));
    intervals.push(setInterval(sendTelemetry, 5000));
    intervals.push(setInterval(sendAlert, 10000));
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
        if (err) console.error(`Publish error on ${topic}:`, err);
        else console.log(`Published: ${topic}`);
    });
}

/* --------------------------------------------------------------------- */
/* BOOT – only when motor is OFF                                       */
/* --------------------------------------------------------------------- */
async function sendBoot() {
    const devices = await getConfiguredDevices();

    devices.forEach(d => {
        if (d.start_status) return;  // motor ON → do NOT send BOOT

        publish(`borewell/${d.serial_number}/boot`, {
            v: 1,
            message_type: "BOOT",
            serial_number: d.serial_number,
            imei_number: d.imei_number,
            user_id: d.assigned_user_id,
            timestamp: new Date().toISOString(),
            device_status: "Ready",
            power_status: "ON",
            network_status: "4G Connected",
            signal_strength: Math.floor(Math.random() * 100),
            voltage: 230 + Math.random() * 10
        });
    });
}

/* --------------------------------------------------------------------- */
/* HEARTBEAT – only when motor is OFF                                   */
/* --------------------------------------------------------------------- */
// async function sendHeartbeat() {
//     const devices = await getConfiguredDevices();

//     devices.forEach(d => {
//         if (d.start_status) return;  // motor ON → do not send HEARTBEAT

//         publish(`borewell/${d.serial_number}/heartbeat`, {
//             v: 1,
//             message_type: "HEARTBEAT",
//             serial_number: d.serial_number,
//             imei_number: d.imei_number,
//             user_id: d.assigned_user_id,
//             timestamp: new Date().toISOString(),
//             device_status: "Online",
//             signal_strength: 30 + Math.floor(Math.random() * 20)
//         });
//     });
// }

async function sendHeartbeat() {
    const devices = await getConfiguredDevices();

    devices.forEach(d => {
        // When motor running → force Online heartbeat ONLY for this device
        if (d.start_status === true) {
            publish(`borewell/${d.serial_number}/heartbeat`, {
                v: 1,
                message_type: "HEARTBEAT",
                serial_number: d.serial_number,
                imei_number: d.imei_number,
                user_id: d.assigned_user_id,
                timestamp: new Date().toISOString(),
                device_status: "Online",
                signal_strength: 30 + Math.floor(Math.random() * 20)
            });
            return;
        }

        // Random Online/Offline when motor is off
        const randomStatus = Math.random() > 0.5 ? "Online" : "Offline";

        publish(`borewell/${d.serial_number}/heartbeat`, {
            v: 1,
            message_type: "HEARTBEAT",
            serial_number: d.serial_number,
            imei_number: d.imei_number,
            user_id: d.assigned_user_id,
            timestamp: new Date().toISOString(),
            device_status: randomStatus,
            signal_strength: 10 + Math.floor(Math.random() * 10)
        });
    });
}

/* --------------------------------------------------------------------- */
/* STATUS – always send                                                 */
/* --------------------------------------------------------------------- */
async function sendStatusAck() {
    const devices = await getConfiguredDevices();

    devices.forEach(d => {
        publish(`borewell/${d.serial_number}/status`, {
            v: 1,
            message_type: "STATUS",
            serial_number: d.serial_number,
            imei_number: d.imei_number,
            user_id: d.assigned_user_id,
            timestamp: new Date().toISOString(),
            acknowledged_command: d.start_status ? "START_MOTOR" : "STOP_MOTOR",
            motor_running: d.start_status
        });
    });
}

/* --------------------------------------------------------------------- */
/* TELEMETRY – only motor is running                                    */
/* --------------------------------------------------------------------- */
async function sendTelemetry() {
    const devices = await getConfiguredDevices();

    devices.forEach(d => {
        if (!d.start_status) return; // motor OFF → do not send

        publish(`borewell/${d.serial_number}/telemetry`, {
            version: 1,
            type: "TELEMETRY",
            serial_number: d.serial_number,
            imei_number: d.imei_number,
            user_id: d.assigned_user_id,
            timestamp: new Date().toISOString(),
            voltage_rms: 230 + Math.random() * 10,
            current_rms: 5 + Math.random() * 2,
            motor_frequency_hz: 48 + Math.random() * 2,
            motor_rpm: 2100 + Math.random() * 50,
            power_kw: 1.2,
            energy_kwh: Number((Math.random() * 0.3).toFixed(3)),
            device_temp_c: 38 + Math.random() * 5,
            flow_lpm: 250 + Math.random() * 10,
            fault_code: 0,
            fault_percentage: -2,
            signal_strength: 20 + Math.random() * 20,
        });
    });
}

/* --------------------------------------------------------------------- */
/* ALERT – only when motor is running                                   */
/* --------------------------------------------------------------------- */
async function sendAlert() {
    const devices = await getConfiguredDevices();

    const alertTypes = ["Dry run", "Overload", "Low Voltage"];

    devices.forEach(d => {
        if (!d.start_status) return;  // motor OFF → don't send alerts

        const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];

        publish(`borewell/${d.serial_number}/alert`, {
            v: 1,
            message_type: "ALERT",
            serial_number: d.serial_number,
            imei_number: d.imei_number,
            user_id: d.assigned_user_id,
            timestamp: new Date().toISOString(),
            alert_type: alert,
            device_status: alert === "Dry run" ? "Critical" : "Warning",
            description: "Simulated alert"
        });
    });
}

module.exports = client;
