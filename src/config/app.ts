import dotenv from 'dotenv';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

// Define app configuration
const config = {
    // Server configuration
    server: {
        port: parseInt(process.env.PORT || '3000', 10),
        nodeEnv: process.env.NODE_ENV || 'development',
        allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
    },

    // External services
    services: {
        sdmBackendUrl: process.env.SDM_BACKEND_URL || 'http://localhost:3001',
    },

    // Security configuration
    security: {
        // Rate limiting
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Lower in production to prevent abuse
        },
    },
};

logger.info('[config/app.ts] Application configuration loaded', {
    environment: config.server.nodeEnv,
    port: config.server.port,
});

export default config;