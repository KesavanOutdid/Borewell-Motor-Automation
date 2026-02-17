// BACKEND/middlewares/logger.js
const winston = require('winston');
const fs = require('fs');
const path = require('path');

const logsDirectory = path.join(__dirname, '..', 'Log');
if (!fs.existsSync(logsDirectory)) fs.mkdirSync(logsDirectory, { recursive: true });

const logFilename = path.join(logsDirectory, 'DataLog.log');

const transports = [
    new winston.transports.File({ filename: logFilename }),
];

if (process.env.NODE_ENV !== 'production') {
    transports.push(new winston.transports.Console());
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: transports,
});

module.exports = logger;
