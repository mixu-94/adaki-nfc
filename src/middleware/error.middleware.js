import logger from '../utils/logger.js';

/**
 * Error handling middleware
 */
export function errorMiddleware(error, req, res, next) {
    // Log the error
    logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        path: req.path
    });

    // Handle specific known errors
    if (error.name === 'NfcVerificationError') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VERIFICATION_FAILED',
                message: error.message
            },
            timestamp: new Date().toISOString()
        });
    }

    // Default error response for unhandled errors
    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : error.message
        },
        timestamp: new Date().toISOString()
    });
}