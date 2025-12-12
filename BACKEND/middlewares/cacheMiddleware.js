const { redisClient, isRedisConnected } = require('../config/redis');

const CACHE_TTL = {
    ROLES: 3600,
    USERS: 3600,
    DEVICES: 1800,
    PROFILE: 1800,
    ORDERS: 1800,
    ADDRESSES: 1800,
    DEVICE_DETAILS: 900,
    DEVICE_HISTORY: 3600,
    DEFAULT: 3600
};

const getCacheKey = (prefix, params = {}) => {
    const keys = Object.keys(params)
        .sort()
        .map(key => `${key}:${params[key]}`)
        .join('|');
    return keys ? `${prefix}:${keys}` : prefix;
};

const cacheGet = async (key) => {
    try {
        if (!isRedisConnected() || !redisClient.isOpen) {
            return null;
        }
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        return null;
    }
};

const cacheSet = async (key, value, ttl = CACHE_TTL.DEFAULT) => {
    try {
        if (!isRedisConnected() || !redisClient.isOpen) {
            return false;
        }
        await redisClient.setEx(key, ttl, JSON.stringify(value));
        return true;
    } catch (err) {
        return false;
    }
};

const cacheDelete = async (key) => {
    try {
        if (!isRedisConnected() || !redisClient.isOpen) {
            return false;
        }
        await redisClient.del(key);
        return true;
    } catch (err) {
        return false;
    }
};

const cacheDeletePattern = async (pattern) => {
    try {
        if (!isRedisConnected() || !redisClient.isOpen) {
            return false;
        }
        const keys = await redisClient.keys(pattern);
        if (keys.length === 0) {
            return true;
        }
        await redisClient.del(keys);
        return true;
    } catch (err) {
        return false;
    }
};

const cacheMiddleware = (prefix, ttl = CACHE_TTL.DEFAULT) => {
    return async (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }

        try {
            const cacheKey = getCacheKey(prefix, { ...req.params, ...req.query });
            const cachedData = await cacheGet(cacheKey);

            if (cachedData) {
                console.log(`Cache HIT: ${cacheKey}`);
                return res.json(cachedData);
            }

            console.log(`Cache MISS: ${cacheKey}`);
            const originalJson = res.json.bind(res);

            res.json = function(data) {
                req.cacheKey = cacheKey;
                req.cacheTTL = ttl;
                req.cachedData = data;
                return originalJson(data);
            };

            next();
        } catch (err) {
            console.error('Cache middleware error:', err);
            next();
        }
    };
};

const cacheResponse = async (req, res, next) => {
    try {
        if (req.cacheKey && req.cachedData) {
            await cacheSet(req.cacheKey, req.cachedData, req.cacheTTL || CACHE_TTL.DEFAULT);
            console.log(`Cache SET: ${req.cacheKey}`);
        }
    } catch (err) {
        console.error('Response cache error:', err);
    }
    next();
};

module.exports = {
    cacheGet,
    cacheSet,
    cacheDelete,
    cacheDeletePattern,
    cacheMiddleware,
    cacheResponse,
    getCacheKey,
    CACHE_TTL
};
