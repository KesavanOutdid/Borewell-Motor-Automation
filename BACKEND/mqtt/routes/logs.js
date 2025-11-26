const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// IMPORTANT — Correct path to actual log directory
const logDir = path.join(__dirname, '../utils/logs');

router.get('/logs', (req, res) => {
    const { date, limit = 100, direction } = req.query;

    try {
        let files = fs.readdirSync(logDir)
            .filter(f => f.startsWith('mqtt_log_') && f.endsWith('.log'))
            .sort()
            .reverse();

        let allLogs = [];

        if (date) {
            files = files.filter(f => f.startsWith(`mqtt_log_${date}_`));
        }

        for (const file of files) {
            const filePath = path.join(logDir, file);
            let logs = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (direction && direction !== 'ALL')
                logs = logs.filter(l => l.direction === direction);

            allLogs.push(...logs);
        }

        // Sort logs by loggedAt descending
        allLogs.sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));

        // Apply limit
        allLogs = allLogs.slice(0, limit);

        const available_dates = files
            .map(f => f.replace('mqtt_log_', '').replace('.log', '').split('_')[0])
            .filter((v, i, a) => a.indexOf(v) === i)
            .sort()
            .reverse();

        res.json({
            total: allLogs.length,
            date: date || 'all',
            available_dates,
            logs: allLogs
        });

    } catch (err) {
        res.status(500).json({ error: 'Error reading logs', details: err.message });
    }
});

router.get('/logs/dates', (req, res) => {
    try {
        const dates = fs.readdirSync(logDir)
            .filter(f => f.startsWith('mqtt_log_') && f.endsWith('.log'))
            .map(f => f.replace('mqtt_log_', '').replace('.log', '').split('_')[0])
            .filter((v, i, a) => a.indexOf(v) === i)
            .sort()
            .reverse();

        res.json({ available_dates: dates });
    } catch (err) {
        res.status(500).json({ error: 'Error reading log directory' });
    }
});

module.exports = router;
