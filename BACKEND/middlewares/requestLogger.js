const logger = require('./logger');

module.exports = function requestLogger(req, res, next) {
    const startTime = Date.now();
    req.requestTime = startTime;

    const originalSend = res.send;

    res.send = function(data) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        const msg = `${req.method} ${req.originalUrl} - Status: ${statusCode} - IP: ${req.ip} - Duration: ${duration}ms`;
        
        if (statusCode >= 400) {
            logger.error(msg);
        } else {
            logger.info(msg);
        }

        res.send = originalSend;
        return res.send(data);
    };

    next();
};
