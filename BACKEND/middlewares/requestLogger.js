// BACKEND/middlewares/requestLogger.js
const logger = require('./logger');

module.exports = function requestLogger(req, res, next) {
    const msg = `${req.method} ${req.originalUrl} - IP:${req.ip}`;
    logger.info(msg);
    // also attach a simple request-start time if needed
    req.requestTime = Date.now();
    next();
};
