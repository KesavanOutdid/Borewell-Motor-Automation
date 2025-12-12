const redis = require('redis');
require('dotenv').config();

let redisConnected = false;

const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 5) {
                console.warn('Redis unavailable - caching disabled. Install Redis for better performance.');
                return false;
            }
            return Math.min(retries * 100, 2000);
        }
    }
});

redisClient.on('error', (err) => {
    if (redisConnected) {
        console.error('Redis Connection Error:', err.message);
    }
});

redisClient.on('connect', () => {
    redisConnected = true;
    console.log('✓ Redis Connected - Caching Enabled');
});

redisClient.on('ready', () => {
    console.log('✓ Redis Ready');
});

redisClient.on('reconnecting', () => {
    if (redisConnected) {
        console.warn('Redis Reconnecting...');
    }
});

module.exports = { redisClient, isRedisConnected: () => redisConnected };
