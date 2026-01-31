const redis = require('redis');
require('dotenv').config();

let redisConnected = false;

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT) || 6379;
const redisPassword = process.env.REDIS_PASSWORD || undefined;
const redisDb = parseInt(process.env.REDIS_DB) || 0;

const redisClient = redis.createClient({
    url: redisPassword 
        ? `redis://:${redisPassword}@${redisHost}:${redisPort}/${redisDb}`
        : `redis://${redisHost}:${redisPort}/${redisDb}`,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 5) {
                console.warn('Redis unavailable - caching disabled. Make sure Redis is running on port 6379.');
                return false;
            }
            return Math.min(retries * 100, 2000);
        }
    }
});

redisClient.on('error', (err) => {
    console.error('Redis Connection Error:', err.message);
});

redisClient.on('connect', () => {
    redisConnected = true;
    console.log('✓ Redis Connected - Caching Enabled');
});

redisClient.on('ready', () => {
    redisConnected = true;
    console.log('✓ Redis Ready - Cache is operational');
});

redisClient.on('reconnecting', () => {
    if (redisConnected) {
        console.warn('Redis Reconnecting...');
    }
});

module.exports = { redisClient, isRedisConnected: () => redisConnected };
