

import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import nfcRoutes from './routes/nfc.routes';
import authRoutes from './routes/auth.routes';

// Import middleware
import { errorMiddleware } from './middleware/error.middleware';

// Import configuration
import config from './config/app';
import logger from './utils/logger';

// Create Express application
const app = express();

// Apply middlewares
app.use(helmet()); // Security headers
app.use(compression()); // Response compression
app.use(express.json()); // Parse JSON bodies
app.use(cors({
    origin: config.server.allowedOrigins,
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-API-Key'],
})); // CORS support

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.server.nodeEnv
    });
});

// Apply routes
app.use('/api/nfc', nfcRoutes);
app.use('/api/auth', authRoutes);

// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'The requested resource was not found'
        },
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use(errorMiddleware);

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
    app.listen(config.server.port, () => {
        logger.info(`[app.ts] Server running in ${config.server.nodeEnv} mode on port ${config.server.port}`);
    });
}

export default app;