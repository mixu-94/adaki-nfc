// src/controllers/nfc.controller.ts
import { Request, Response, NextFunction } from 'express';
import { SumMessage, NfcVerificationError } from '../types/nfc.types';
import nfcService from '../services/nfc.service';
import { validateSumMessage, validateUrl, validateGeoLocation } from '../utils/validation';
import logger from '../utils/logger';

export class NfcController {
    /**
     * Handles NFC tag verification requests
     * @param req - Express request
     * @param res - Express response
     * @param next - Express next function
     */
    async verifyTag(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { sumMessage, geoLocation } = req.body;

            // Validate input
            if (!validateSumMessage(sumMessage)) {
                logger.warn('[controllers/nfc.controller.ts] Invalid SUM message format');

                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_FORMAT',
                        message: 'Invalid SUM message format'
                    },
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Validate geolocation if provided
            if (geoLocation && !validateGeoLocation(geoLocation)) {
                logger.warn('[controllers/nfc.controller.ts] Invalid geolocation format');

                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_GEOLOCATION',
                        message: 'Invalid geolocation format'
                    },
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Process verification
            const result = await nfcService.verifyNfcTag(
                sumMessage,
                req.ip,
                req.headers['user-agent'] as string,
                geoLocation
            );

            // Return successful response
            res.status(200).json({
                success: true,
                data: {
                    tagId: result.tagId,
                    isValid: result.isValid,
                    metadata: result.metadata,
                    verifiedAt: result.timestamp.toISOString(),
                    redirectUrl: result.metadata?.redirectUrl
                },
                message: 'NFC tag successfully verified',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            // Handle verification errors specifically
            if (error instanceof NfcVerificationError) {
                logger.warn('[controllers/nfc.controller.ts] Verification failed', {
                    error: error.message
                });

                res.status(401).json({
                    success: false,
                    error: {
                        code: 'VERIFICATION_FAILED',
                        message: error.message
                    },
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Pass other errors to global error handler
            next(error);
        }
    }

    /**
     * Retrieves tag statistics
     * @param req - Express request
     * @param res - Express response
     * @param next - Express next function
     */
    async getTagStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { tagId } = req.params;

            if (!tagId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_TAG_ID',
                        message: 'Tag ID is required'
                    },
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const statistics = await nfcService.getTagStatistics(tagId);

            if (!statistics) {
                res.status(404).json({
                    success: false,
                    error: {
                        code: 'TAG_NOT_FOUND',
                        message: 'Tag not found'
                    },
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: statistics,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Updates tag configuration
     * @param req - Express request
     * @param res - Express response
     * @param next - Express next function
     */
    async updateTagConfiguration(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { tagId } = req.params;
            const { redirectUrl, isActive } = req.body;

            if (!tagId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_TAG_ID',
                        message: 'Tag ID is required'
                    },
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Validate input
            if (redirectUrl !== undefined && typeof redirectUrl === 'string') {
                if (!validateUrl(redirectUrl)) {
                    res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_REDIRECT_URL',
                            message: 'Invalid URL format'
                        },
                        timestamp: new Date().toISOString()
                    });
                    return;
                }
            } else if (redirectUrl !== undefined) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_REDIRECT_URL',
                        message: 'Redirect URL must be a string'
                    },
                    timestamp: new Date().toISOString()
                });
                return;
            }

            if (isActive !== undefined && typeof isActive !== 'boolean') {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_IS_ACTIVE',
                        message: 'isActive must be a boolean'
                    },
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Update tag configuration
            const result = await nfcService.updateTagConfiguration(tagId, {
                redirectUrl,
                isActive
            });

            if (!result) {
                res.status(404).json({
                    success: false,
                    error: {
                        code: 'TAG_NOT_FOUND',
                        message: 'Tag not found'
                    },
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: result,
                message: 'Tag configuration updated successfully',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            next(error);
        }
    }
}

export default new NfcController();


