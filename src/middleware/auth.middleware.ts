import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../types/auth.types';
import authService from '../services/auth.service';
import { validateApiKeyFormat } from '../utils/validation';
import logger from '../utils/logger';

/**
 * Middleware that validates API keys for protected routes
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export async function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        // Extract API key from headers
        const apiKey = req.headers['x-api-key'];

        // Check if API key exists
        if (!apiKey || typeof apiKey !== 'string') {
            logger.warn('[middleware/auth.middleware.ts] Missing API key');

            return res.status(401).json({
                success: false,
                error: {
                    code: 'MISSING_API_KEY',
                    message: 'API key is required'
                },
                timestamp: new Date().toISOString()
            });
        }

        // Basic format validation before database check
        if (!validateApiKeyFormat(apiKey)) {
            logger.warn('[middleware/auth.middleware.ts] Invalid API key format');

            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_API_KEY',
                    message: 'Invalid API key format'
                },
                timestamp: new Date().toISOString()
            });
        }

        // Validate API key with auth service
        const apiKeyData = await authService.validateApiKey(apiKey);

        // Store API key info in request for later use
        req.apiKey = apiKeyData;

        next();
    } catch (error) {
        if (error instanceof AuthenticationError) {
            // Handle authentication errors
            return res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.name.toUpperCase(),
                    message: error.message
                },
                timestamp: new Date().toISOString()
            });
        }

        // Handle unexpected errors
        logger.error('[middleware/auth.middleware.ts] Unexpected error during authentication', { error });

        return res.status(500).json({
            success: false,
            error: {
                code: 'AUTHENTICATION_ERROR',
                message: 'An unexpected error occurred during authentication'
            },
            timestamp: new Date().toISOString()
        });
    }
}