// src/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request, Response, NextFunction } from 'express';
import { redisClient, isRedisAvailable } from '../config/redis';
import config from '../config/app';
import logger from '../utils/logger';

// Define express-rate-limit Options type for proper typing
type RateLimitOptions = {
    windowMs: number;
    max: number;
    standardHeaders: boolean;
    legacyHeaders: boolean;
    skipFailedRequests: boolean;
    handler: (req: Request, res: Response, next: NextFunction) => void;
}

// Configure rate limiter based on environment
const limiterConfig: RateLimitOptions = {
    // Time window for rate limiting
    windowMs: config.security.rateLimit.windowMs,

    // Maximum number of requests per window
    max: config.security.rateLimit.max,

    // Return rate limit info in headers
    standardHeaders: true,

    // Don't use legacy headers
    legacyHeaders: false,

    // Skip on error to prevent API being unavailable
    skipFailedRequests: true, // Change to true to prevent failures

    // Custom error handler with Express types
    handler: (req: Request, res: Response, next: NextFunction): void => {
        logger.warn('[middleware/rate-limit.ts] Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
        });

        res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests, please try again later',
            },
            timestamp: new Date().toISOString(),
        });
    },
};

// Check if we're in a test environment
const isTest = process.env.NODE_ENV === 'test';

// Create rate limiter - use in-memory store for tests
export const rateLimitMiddleware = rateLimit({
    ...limiterConfig,
    // Only use Redis store if Redis is available and we're not in a test environment
    ...(isRedisAvailable() && !isTest ? {
        store: new RedisStore({
            // Pass redis client to store
            sendCommand: async (...args: string[]) => {
                return redisClient.sendCommand(args);
            },
            // Key prefix for Redis
            prefix: 'ratelimit:',
        })
    } : {}) // Empty object falls back to memory store
});

// Log rate limiter configuration
logger.info('[middleware/rate-limit.ts] Rate limiter configured', {
    windowMs: config.security.rateLimit.windowMs / 1000 / 60 + ' minutes',
    maxRequests: config.security.rateLimit.max,
    usingRedis: isRedisAvailable() && !isTest,
    environment: process.env.NODE_ENV
});