import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import nfcRoutes from './routes/nfc.routes.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Apply middlewares
app.use(helmet()); // Security headers
app.use(express.json()); // Parse JSON bodies
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com'] // Restrict in production
        : '*' // Allow all in development
}));

// Simple welcome route
app.get('/', (req, res) => {
    res.status(200).json({
        name: 'adaki-nfc',
        description: 'NFC tag verification service',
        status: 'running'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Apply routes
app.use('/api/nfc', nfcRoutes);

// Error handling middleware (must be last)
app.use(errorMiddleware);

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        logger.info(`Server running on port ${port}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

export default app;