require('dotenv').config();
const mqtt = require('mqtt');
const { logToFile } = require('./utils/fileLogger');
const connectToDatabase = require('../config/db');
const { notifyUser } = require('../utils/notificationHelper');

const clientId = `receiver_${Math.random().toString(16).substr(2, 8)}`;

const client = mqtt.connect(process.env.MQTT_BROKER, {
    port: parseInt(process.env.MQTT_PORT || '1883', 10),
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId,
    clean: true,
});

let db = null;

/* ------------------------------------------------------ */
/* CONNECT MONGO DB                                       */
/* ------------------------------------------------------ */
connectToDatabase()
    .then(database => {
        db = database;
        console.log('DB connected for MQTT receiver');
    })
    .catch(err => console.error('DB connect error:', err.message || err));

/* ------------------------------------------------------ */
/* SUBSCRIBE TO ALL MOTOR TOPICS                          */
/* ------------------------------------------------------ */
client.on('connect', () => {
    console.log(`MQTT Connected as ${clientId}`);

    const topics = [
        'borewell/+/telemetry',
        'borewell/+/alert',
        'borewell/+/status',
        'borewell/+/boot',
        'borewell/+/heartbeat',
    ];

    client.subscribe(topics, { qos: 0 }, (err, granted) => {
        if (err) return console.error("Subscription failed:", err.message);
        console.log("Subscribed →", granted.map(g => g.topic).join(", "));
    });
});

/* ------------------------------------------------------ */
/* SAFE JSON PARSE                                        */
/* ------------------------------------------------------ */
function safeParseMessage(buf) {
    const raw = buf.toString();
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
        return [{ raw }];
    }
}

/* ------------------------------------------------------ */
/* ON MESSAGE RECEIVED                                    */
/* ------------------------------------------------------ */
client.on("message", async (topic, message) => {

    const loggedAt = new Date().toISOString();
    const type = topic.split("/").pop().toUpperCase();
    const data = safeParseMessage(message);

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("MQTT Message Received");
    console.log("Topic:", topic);
    console.log("Type:", type);
    console.log("Count:", data.length);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    logToFile({ timestamp: loggedAt, topic, type, data, direction: "RECEIVED" });

    if (!db) {
        console.warn("DB not ready — skipping save.");
        return;
    }

    for (const item of data) {

        const entry = {
            ...item,
            receivedAt: loggedAt,
            topic,
            type
        };

        /* ------------------------------------------------------ */
        /* Save RAW message                                       */
        /* ------------------------------------------------------ */
        const map = {
            TELEMETRY: "borewell_telemetry",
            ALERT: "borewell_alerts",
            STATUS: "borewell_status",
            BOOT: "borewell_boot",
            HEARTBEAT: "borewell_heartbeat"
        };
        const collection = map[type] || "borewell_unknown";

        try {
            await db.collection(collection).insertOne(entry);
        } catch (err) {
            console.error(`DB insert error (${collection}):`, err.message);
        }

        /* ------------------------------------------------------ */
        /* Daily Energy Log + Live Telemetry (TELEMETRY ONLY)     */
        /* ------------------------------------------------------ */

        const energyValue = item.energy_kwh ?? 0;

        if (type === "TELEMETRY") {

            const usageDate = new Date().toISOString().split("T")[0];

            try {
                // 1) Save Daily Power Usage (per day)
                await db.collection("borewell_daily_energy").updateOne(
                    {
                        serial_number: item.serial_number,
                        imei_number: item.imei_number,
                        user_id: item.user_id,
                        date: usageDate
                    },
                    {
                        $inc: { energy_kwh: energyValue },

                        $max: {
                            maxCurrent: item.current_rms,
                            maxVoltage: item.voltage_rms
                        },

                        $min: {
                            minCurrent: item.current_rms,
                            minVoltage: item.voltage_rms
                        },

                        $set: { updatedAt: new Date() }
                    },
                    { upsert: true }
                );

            } catch (err) {
                console.error("DB Telemetry Update Error:", err.message);
            }
        }

        /* ------------------------------------------------------ */
        /* HISTORY LOGIC (START / STOP SESSION)                   */
        /* ------------------------------------------------------ */
        if (type === "STATUS" && item.serial_number) {
            const userId = Number(item.user_id);
            // Fetch device details to know who started/stopped
            const device = await db.collection("devices").findOne({ serial_number: item.serial_number });

            if (item.motor_running === true) {
                // CHECK if session already open
                const openSession = await db.collection("borewell_history").findOne({
                    serial_number: item.serial_number,
                    user_id: userId,
                    stopAt: null
                });

                if (!openSession) {
                    // Create new session
                    await db.collection("borewell_history").insertOne({
                        serial_number: item.serial_number,
                        imei_number: item.imei_number,
                        user_id: userId,
                        date: new Date().toISOString().split("T")[0],
                        startAt: new Date(item.timestamp || Date.now()),
                        stopAt: null,
                        started_by: device ? device.last_started_by : null,
                        started_by_email: device ? device.last_started_by_email : null,
                        stopped_by: null,
                        stopped_by_email: null,
                        duration_minutes: 0,
                        energy_kwh: 0,
                        maxCurrent: 0,
                        minCurrent: 9999,
                        maxVoltage: 0,
                        minVoltage: 9999,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                    console.log(`HISTORY: Start session created for ${item.serial_number}`);
                    notifyUser(db, userId, "STATUS", item);
                }

            } else if (item.motor_running === false) {

                // CLOSE existing session
                const session = await db.collection("borewell_history").findOne({
                    serial_number: item.serial_number,
                    user_id: userId,
                    stopAt: null
                });

                if (session) {
                    const stopTime = new Date(item.timestamp || Date.now());
                    const duration = (stopTime - new Date(session.startAt)) / 60000;

                    await db.collection("borewell_history").updateOne(
                        { _id: session._id },
                        {
                            $set: {
                                stopAt: stopTime,
                                stopped_by: device ? device.last_stopped_by : null,
                                stopped_by_email: device ? device.last_stopped_by_email : null,
                                duration_minutes: Math.round(duration),
                                updatedAt: new Date()
                            }
                        }
                    );
                    console.log(`HISTORY: Session closed for ${item.serial_number}`);
                    notifyUser(db, userId, "STATUS", item);
                }
            }
        }

        /* ------------------------------------------------------ */
        /* HISTORY LIVE ENERGY UPDATE (TELEMETRY)                 */
        /* ------------------------------------------------------ */
        if (type === "TELEMETRY") {
            await db.collection("borewell_history").updateOne(
                {
                    serial_number: item.serial_number,
                    imei_number: item.imei_number,
                    user_id: item.user_id,
                    stopAt: null   // only update open sessions
                },
                {
                    $inc: { energy_kwh: item.energy_kwh ?? 0 },
                    $max: { maxCurrent: item.current_rms, maxVoltage: item.voltage_rms },
                    $min: { minCurrent: item.current_rms, minVoltage: item.voltage_rms },
                    $set: { updatedAt: new Date() }
                }
            );
        }

        /* ------------------------------------------------------ */
        /* SEND LIVE UPDATES TO SOCKET.IO CLIENTS                 */
        /* ------------------------------------------------------ */
        if (type === "ALERT") {
            notifyUser(db, item.user_id, type, item);
        }

        if (global.io) {
            if (type === "BOOT") {
                global.io.emit("LIVE_BOOT", {
                    serial_number: item.serial_number,
                    payload: item
                });
            } else if (type === "STATUS") {
                global.io.emit("LIVE_STATUS", {
                    serial_number: item.serial_number,
                    payload: item
                });
            } else if (type === "ALERT") {
                global.io.emit("LIVE_ALERT", {
                    serial_number: item.serial_number,
                    payload: item
                });
            } else if (type === "HEARTBEAT") {
                global.io.emit("LIVE_HEARTBEAT", {
                    serial_number: item.serial_number,
                    payload: item
                });
            } else if (type === "TELEMETRY") {
                global.io.emit("LIVE_TELEMETRY", {
                    serial_number: item.serial_number,
                    imei_number: item.imei_number,
                    user_id: item.user_id,
                    telemetry: {
                        voltage_rms: item.voltage_rms,
                        current_rms: item.current_rms,
                        motor_frequency_hz: item.motor_frequency_hz,
                        motor_rpm: item.motor_rpm,
                        power_kw: item.power_kw,
                        energy_kwh: item.energy_kwh,
                        device_temp_c: item.device_temp_c,
                        flow_lpm: item.flow_lpm,
                        fault_code: item.fault_code,
                        fault_percentage: item.fault_percentage,
                        signal_strength: item.signal_strength,
                        timestamp: item.timestamp
                    }
                });
            }
        }
    }
});

/* ------------------------------------------------------ */
client.on("error", err => console.error("MQTT Error:", err.message));
module.exports = client;
