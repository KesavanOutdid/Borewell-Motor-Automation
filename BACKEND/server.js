// BACKEND/server.js
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const connectDB = require('./config/db');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');
const cors = require("cors");
const os = require("os");
require('dotenv').config();

const adminRoutes = require('./routes/adminRoutes');
const appRoutes = require('./routes/appRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Connect DB
connectDB();

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
            { url: `http://${require('os').networkInterfaces().en0[1].address}:3000` },  // Local IP
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

// Test API
app.get('/', (req, res) => res.json({ ok: true, message: 'Borewell API running' }));

// Error handler
app.use(errorHandler);

// ----------------------------
// ⭐ Auto Detect Local IP
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

const port = process.env.PORT || 3000;
const localIP = getLocalIP();

// ----------------------------
// Start Server
// ----------------------------
if (require.main === module) {
    app.listen(port, "0.0.0.0", () => {
        console.log("\n=====================================");
        console.log(" 🚀 Server Started");
        console.log("-------------------------------------");
        console.log(` Local URL:   http://localhost:${port}`);
        console.log(` Network URL: http://${localIP}:${port}`);
        console.log(` Swagger UI:  http://${localIP}:${port}/api-docs`);
        console.log("=====================================\n");
    });
}

module.exports = app;
