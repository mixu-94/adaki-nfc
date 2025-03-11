import { createClient } from 'redis';
import logger from '../utils/logger';

// Create Redis client
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Initialize Redis client with connection options
export const redisClient = createClient({
    url: redisUrl,
    socket: {
        reconnectStrategy: (retries) => {
            // Limit reconnection attempts to prevent excessive logging
            if (retries > 3) {
                logger.warn('[config/redis.ts] Redis connection failed after multiple attempts, disabling reconnects');
                return new Error('Redis connection attempts exhausted');
            }
            // Exponential backoff: 1s, 2s, 4s
            return Math.min(retries * 1000, 4000);
        }
    }
});

// Track connection status
let isRedisConnected = false;

// Connect to Redis if not in test mode
if (process.env.NODE_ENV !== 'test') {
    // Connect to Redis
    (async () => {
        try {
            await redisClient.connect();
            isRedisConnected = true;
            logger.info('[config/redis.ts] Redis connection successful');
        } catch (error) {
            logger.warn('[config/redis.ts] Redis connection failed, falling back to memory store', { error });
            // Redis connection is optional, so we'll continue without it
        }
    })();

    // Handle Redis errors with limited logging
    let errorCount = 0;
    redisClient.on('error', (error) => {
        // Limit error logging to prevent log flooding
        if (errorCount < 3) {
            logger.error('[config/redis.ts] Redis error', { error });
            errorCount++;
        } else if (errorCount === 3) {
            logger.error('[config/redis.ts] Suppressing further Redis connection errors');
            errorCount++;
        }
    });
}

// Export connection status checker
export const isRedisAvailable = () => isRedisConnected;

export default redisClient;