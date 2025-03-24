import Redis from 'ioredis';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

redis.on('error', (error) => {
    logger.error('Redis connection error', { error: error.message });
});

redis.on('connect', () => {
    logger.info('Redis connected successfully');
});

export default redis;