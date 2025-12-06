// BACKEND/server.js
const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const connectDB = require('./config/db');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');
const cors = require("cors");
const os = require("os");
require('dotenv').config();
const WebSocket = require("ws");

const adminRoutes = require('./routes/adminRoutes');
const appRoutes = require('./routes/appRoutes');
const logsRoutes = require('./mqtt/routes/logs');
const { sendBoot } = require('./mqtt/publisher');
// Import MQTT client to start the subscriber
const mqttClient = require('./mqtt/mqttClient');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Static file serving
app.use(express.static(path.join(__dirname, 'mqtt', 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'mqtt', 'public', 'index.html'));
});

// ----------------------------
// Auto Detect Local IP
// ----------------------------
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return "localhost";
}

const localIP = getLocalIP();

// Connect DB
connectDB().then(() => {
    // Send boot notifications for configured devices on startup
    sendBoot();
}).catch(err => {
    console.error('Database connection failed:', err);
});

// Swagger options
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Borewell Motor Automation API',
            version: '1.0.0',
            description: 'API for Borewell Motor Automation'
        },
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{ BearerAuth: [] }],
        servers: [
            { url: `http://${localIP}:3000` },
            { url: `http://localhost:3000` }
        ]
    },
    apis: ['./routes/*.js', './routes/**/*.js', './controllers/*.js', './controllers/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => res.json(swaggerSpec));

// API Routes
app.use('/admin', adminRoutes);
app.use('/app', appRoutes);
app.use('/mqtt', logsRoutes);

// Error handler
app.use(errorHandler);

const port = process.env.PORT || 3000;


// ----------------------------
// WEBSOCKET SERVER
// ----------------------------
const wss = new WebSocket.Server({ port: 8081, host: "0.0.0.0" });
console.log(`WebSocket Server running on ws://${localIP}:8081`);

function broadcast(data) {
    const payload = JSON.stringify(data);

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

// Make broadcast available globally
global.broadcast = broadcast;

// ----------------------------
// Start Server
// ----------------------------
if (require.main === module) {
    app.listen(port, "0.0.0.0", () => {
        console.log("\n=====================================");
        console.log(" Server Started");
        console.log("-------------------------------------");
        console.log(` Local URL:   http://localhost:${port}`);
        console.log(` Network URL: http://${localIP}:${port}`);
        console.log(` Swagger UI:  http://${localIP}:${port}/api-docs`);
        console.log(` WebSocket:   ws://${localIP}:8081`);
        console.log("=====================================\n");
    });
}

module.exports = app;
