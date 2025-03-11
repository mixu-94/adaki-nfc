import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import logger from '../utils/logger';

export class AuthController {
    /**
     * Create a new API key
     * @param req - Express request
     * @param res - Express response
     * @param next - Express next function
     */
    async createApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { name, expiresAt } = req.body;

            // Validate input
            if (!name || typeof name !== 'string') {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_NAME',
                        message: 'A valid name is required for the API key'
                    },
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Parse expiration date if provided
            let expiration: Date | undefined = undefined;
            if (expiresAt) {
                expiration = new Date(expiresAt);

                // Validate date
                if (isNaN(expiration.getTime())) {
                    res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_DATE',
                            message: 'Invalid expiration date format'
                        },
                        timestamp: new Date().toISOString()
                    });
                    return;
                }
            }

            // Create API key
            const apiKey = await authService.createApiKey(name, expiration);

            // Return the key (this is the only time it will be visible)
            res.status(201).json({
                success: true,
                data: {
                    id: apiKey.id,
                    key: apiKey.key,
                    name,
                    expiresAt: expiration?.toISOString(),
                },
                message: 'API key created successfully. Store this key securely as it won\'t be shown again.',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('[controllers/auth.controller.ts] Error creating API key', { error });
            next(error);
        }
    }

    /**
     * Revoke an API key
     * @param req - Express request
     * @param res - Express response
     * @param next - Express next function
     */
    async revokeApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_ID',
                        message: 'API key ID is required'
                    },
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Revoke the key
            await authService.revokeApiKey(id);

            res.status(200).json({
                success: true,
                message: 'API key revoked successfully',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('[controllers/auth.controller.ts] Error revoking API key', { error });
            next(error);
        }
    }
}

// Export singleton instance
export default new AuthController();