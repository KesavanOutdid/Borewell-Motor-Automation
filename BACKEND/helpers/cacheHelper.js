const { redisClient, isRedisConnected } = require('../config/redis');

const DEFAULT_CACHE_TTL = 3600;

const cacheHelper = {
    async get(key) {
        if (!isRedisConnected()) return null;
        try {
            const value = await redisClient.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Cache get error for key ${key}:`, error.message);
            return null;
        }
    },

    async set(key, value, ttl = DEFAULT_CACHE_TTL) {
        if (!isRedisConnected()) return false;
        try {
            await redisClient.setEx(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Cache set error for key ${key}:`, error.message);
            return false;
        }
    },

    async delete(key) {
        if (!isRedisConnected()) return false;
        try {
            await redisClient.del(key);
            return true;
        } catch (error) {
            console.error(`Cache delete error for key ${key}:`, error.message);
            return false;
        }
    },

    async clear(pattern = '*') {
        if (!isRedisConnected()) return false;
        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
            return true;
        } catch (error) {
            console.error(`Cache clear error for pattern ${pattern}:`, error.message);
            return false;
        }
    },

    async getOrSet(key, fetchFn, ttl = DEFAULT_CACHE_TTL) {
        if (!isRedisConnected()) return fetchFn();
        try {
            const cached = await this.get(key);
            if (cached) return cached;

            const value = await fetchFn();
            await this.set(key, value, ttl);
            return value;
        } catch (error) {
            console.error(`Cache getOrSet error for key ${key}:`, error.message);
            return fetchFn();
        }
    }
};

module.exports = cacheHelper;
