// BACKEND/middlewares/errorHandler.js
const logger = require('./logger');

module.exports = function errorHandler(err, req, res, next) {
    logger.error(err.stack || err.message || err);
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message || 'Internal Server Error' });
};
