// BACKEND/middlewares/errorHandler.js
const logger = require('./logger');
const multer = require('multer');

module.exports = function errorHandler(err, req, res, next) {
    logger.error(err.stack || err.message || err);
    
    // Handle Multer errors
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                success: false, 
                message: 'File size exceeds the maximum limit of 5MB' 
            });
        }
        return res.status(400).json({ 
            success: false, 
            message: err.message || 'File upload error' 
        });
    }
    
    // Handle custom file filter errors (from multerConfig.js)
    if (err.message && err.message.includes('Only PNG and JPG files are allowed')) {
        return res.status(400).json({ 
            success: false, 
            message: 'Only PNG and JPG files are allowed' 
        });
    }
    
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message || 'Internal Server Error' });
};
