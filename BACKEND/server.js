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
const http = require("http");
const { Server } = require("socket.io");

const adminRoutes = require('./routes/adminRoutes');
const appRoutes = require('./routes/appRoutes');
const orderRoutes = require('./routes/orderRoutes');
const addressRoutes = require('./routes/addressRoutes');
const logsRoutes = require('./mqtt/routes/logs');
const { sendBootNotificationsOnStartup, client: publisherClient } = require('./mqtt/publisher');
const { initScheduler } = require('./utils/scheduler');
// Import MQTT client to start the subscriber
const mqttClient = require('./mqtt/mqttClient');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Static file serving
app.use(express.static(path.join(__dirname, 'mqtt', 'public')));
app.use('/upload', express.static(path.join(__dirname, 'upload')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'mqtt', 'public', 'index.html'));
});

// Connect DB
connectDB().then(() => {
    console.log('Database connected successfully.');
    initScheduler(); // Start the auto start/stop scheduler
}).catch(err => {
    console.error('Database connection failed:', err);
});

// Wait for DB to be ready, then send boot notifications
setTimeout(async () => {
    try {
        console.log('Attempting to send boot notifications...');
        await sendBootNotificationsOnStartup();
        console.log('Boot notifications sent successfully');
    } catch (error) {
        console.error('Failed to send boot notifications:', error.message);
    }
}, 5000);

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
const port = process.env.PORT || 3030;

// Swagger options
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Smart Motor Automation API',
            version: '1.0.0',
            description: 'API for Smart Motor Automation'
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
            { url: `http://localhost:${port}`, description: 'Local URL' },
            { url: `http://${localIP}:${port}`, description: 'Network URL' }
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
app.use('/app/order', orderRoutes);
app.use('/app/address', addressRoutes);
app.use('/mqtt', logsRoutes);

// Error handler
app.use(errorHandler);



// ----------------------------
// HTTP + SOCKET.IO SERVER
// ----------------------------
const server = http.createServer(app);  // attach express to HTTP

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log("Socket.IO client connected:", socket.id);

    // Example: subscription per serial number (optional)
    // socket.on("subscribe", (serialNumber) => {
    //     socket.join(serialNumber);
    //     console.log(`Client ${socket.id} joined room ${serialNumber}`);
    // });

    socket.on("disconnect", () => {
        console.log("Socket.IO client disconnected:", socket.id);
    });
});

// Make Socket.IO globally available (for MQTT broadcaster)
global.io = io;

// ----------------------------
// Start Server
// ----------------------------
if (require.main === module) {
    server.listen(port, "0.0.0.0", () => {
        console.log("\n=====================================");
        console.log(" Server Started");
        console.log("-------------------------------------");
        console.log(` Local URL:     http://localhost:${port}`);
        console.log(` Network URL:   http://${localIP}:${port}`);
        console.log(` Swagger UI:    http://${localIP}:${port}/api-docs`);
        console.log(` Socket.IO URL: http://${localIP}:${port}/socket.io`);
        console.log("=====================================\n");
    });
}

module.exports = app;
