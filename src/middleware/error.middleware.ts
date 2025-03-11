import { Request, Response, NextFunction } from 'express';
import { NfcVerificationError } from '../types/nfc.types';
import { AuthenticationError } from '../types/auth.types';
import logger from '../utils/logger';

/**
 * Global error handling middleware
 * @param err - Error object
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export function errorMiddleware(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    // Log the error
    logger.error('[middleware/error.middleware.ts] Uncaught error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    // Prepare error response
    const errorResponse = {
        success: false,
        error: {
            code: 'SERVER_ERROR',
            message: 'An unexpected error occurred',
        },
        timestamp: new Date().toISOString(),
    };

    // Handle known error types
    if (err instanceof NfcVerificationError) {
        return res.status(401).json({
            ...errorResponse,
            error: {
                code: 'VERIFICATION_FAILED',
                message: err.message,
            },
        });
    }

    if (err instanceof AuthenticationError) {
        return res.status(err.statusCode).json({
            ...errorResponse,
            error: {
                code: 'AUTHENTICATION_ERROR',
                message: err.message,
            },
        });
    }

    // For production, don't expose internal error details
    if (process.env.NODE_ENV === 'production') {
        return res.status(500).json(errorResponse);
    }

    // For development, include error details
    return res.status(500).json({
        ...errorResponse,
        error: {
            ...errorResponse.error,
            stack: err.stack,
            name: err.name,
        },
    });
}