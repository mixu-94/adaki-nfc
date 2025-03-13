// src/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';
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
    skipFailedRequests: false,

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

// Create rate limiter with Redis store (since Redis is always on)
export const rateLimitMiddleware = rateLimit({
    ...limiterConfig,
    store: new RedisStore({
        // Pass redis client to store
        sendCommand: async (...args: string[]) => {
            return redisClient.sendCommand(args);
        },
        // Key prefix for Redis
        prefix: 'ratelimit:',
    }),
});

// Log rate limiter configuration
logger.info('[middleware/rate-limit.ts] Rate limiter configured', {
    windowMs: config.security.rateLimit.windowMs / 1000 / 60 + ' minutes',
    maxRequests: config.security.rateLimit.max,
    usingRedis: true,
});



// import rateLimit from 'express-rate-limit';
// import { Request, Response, NextFunction } from 'express';
// import RedisStore from 'rate-limit-redis';
// import { redisClient } from '../config/redis';
// import config from '../config/app';
// import logger from '../utils/logger';

// // Define express-rate-limit Options interface for proper typing
// interface RateLimitOptions {
//     windowMs: number;
//     max: number;
//     standardHeaders: boolean;
//     legacyHeaders: boolean;
//     skipFailedRequests: boolean;
//     handler: (req: Request, res: Response, next: NextFunction) => void;
// }

// // Configure rate limiter based on environment
// const limiterConfig: RateLimitOptions = {
//     // Time window for rate limiting
//     windowMs: config.security.rateLimit.windowMs,

//     // Maximum number of requests per window
//     max: config.security.rateLimit.max,

//     // Return rate limit info in headers
//     standardHeaders: true,

//     // Don't use legacy headers
//     legacyHeaders: false,

//     // Skip on error to prevent API being unavailable
//     skipFailedRequests: false,

//     // Custom error handler with Express types
//     handler: (req: Request, res: Response, next: NextFunction): void => {
//         logger.warn('[middleware/rate-limit.ts] Rate limit exceeded', {
//             ip: req.ip,
//             path: req.path,
//         });

//         res.status(429).json({
//             success: false,
//             error: {
//                 code: 'RATE_LIMIT_EXCEEDED',
//                 message: 'Too many requests, please try again later',
//             },
//             timestamp: new Date().toISOString(),
//         });
//     },
// };

// // Create rate limiter with Redis store if available
// export const rateLimitMiddleware =
//     // Check if Redis client is connected
//     redisClient.isOpen
//         ? rateLimit({
//             ...limiterConfig,
//             store: new RedisStore({
//                 // Pass redis client to store
//                 sendCommand: async (...args: string[]) => {
//                     return redisClient.sendCommand(args);
//                 },
//                 // Key prefix for Redis
//                 prefix: 'ratelimit:',
//             }),
//         })
//         : rateLimit(limiterConfig);

// // Log rate limiter configuration
// logger.info('[middleware/rate-limit.ts] Rate limiter configured', {
//     windowMs: config.security.rateLimit.windowMs / 1000 / 60 + ' minutes',
//     maxRequests: config.security.rateLimit.max,
//     usingRedis: redisClient.isOpen,
// });