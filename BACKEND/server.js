// BACKEND/server.js
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const connectDB = require('./config/db');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');

require('dotenv').config();

const adminRoutes = require('./routes/adminRoutes');
const appRoutes = require('./routes/appRoutes');

const app = express();
app.use(express.json());
app.use(requestLogger);

// connect DB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Borewell-Motor-Automation';
connectDB(MONGO_URI);

// Swagger options
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Borewell Motor Automation API',
            version: '1.0.0',
            description: 'API for Borewell Motor Automation'
        },
        servers: [{ url: 'http://localhost:3000' }],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: ['./routes/*.js', './controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => res.json(swaggerSpec));

// routes
app.use('/admin', adminRoutes);
app.use('/app', appRoutes);

// health
app.get('/', (req, res) => res.json({ ok: true, message: 'Borewell API running' }));

// error handler (last)
app.use(errorHandler);

// start
const port = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running: http://localhost:${port}`);
        console.log(`Swagger docs: http://localhost:${port}/api-docs`);
    });
}

module.exports = app;
