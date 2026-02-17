const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

function getLogFilePath(entry) {
    const date = new Date(entry.timestamp).toISOString().split('T')[0];
    const type = entry.type ? entry.type.toLowerCase() : 'unknown';
    return path.join(logDir, `mqtt_log_${date}_${type}.log`);
}

function logToFile(entry) {
    const loggedAt = new Date().toISOString();

    const logEntry = {
        loggedAt,
        direction: entry.direction || 'RECEIVED',
        ...entry
    };

    const logPath = getLogFilePath(entry);

    // console.log("Logging to file:", logPath);

    try {
        // Append as a single line (NDJSON format) for performance
        fs.appendFileSync(logPath, JSON.stringify(logEntry) + "\n", 'utf8');
        // console.log(`Logged → ${path.basename(logPath)}`);
    } catch (err) {
        console.error("Error writing log file:", err);
    }
}

module.exports = { logToFile };
