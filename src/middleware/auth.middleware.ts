import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../types/auth.types';
import authService from '../services/auth.service';
import { validateApiKeyFormat } from '../utils/validation';
import logger from '../utils/logger';

/**
 * Middleware for authenticating API key requests
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        // Extract API key from headers
        const apiKey = req.headers['x-api-key'];

        // Log debug information about request
        logger.debug('[middleware/auth.middleware.ts] API Key Authentication', {
            path: req.path,
            method: req.method,
            apiKeyPresent: !!apiKey
        });

        // Check if API key exists and is a string
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
            logger.warn('[middleware/auth.middleware.ts] Invalid API key format', {
                apiKeyLength: apiKey.length
            });

            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_API_KEY',
                    message: 'Invalid API key format'
                },
                timestamp: new Date().toISOString()
            });
        }

        // Validate API key with authentication service
        const apiKeyData = await authService.validateApiKey(apiKey);

        // Store API key info in request for potential later use
        req.apiKey = apiKeyData;

        // Proceed to next middleware or route handler
        next();
    } catch (error) {
        // Handle specific authentication errors
        if (error instanceof AuthenticationError) {
            logger.warn('[middleware/auth.middleware.ts] Authentication error', {
                errorMessage: error.message,
                errorCode: error.name
            });

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
        logger.error('[middleware/auth.middleware.ts] Unexpected authentication error', { error });

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