// // File: src/controllers/nfc.controller.ts
// import { Request, Response, NextFunction } from 'express';
// import { SumMessage, VerificationResult } from '../types/nfc.types';
// import sdmService from '../services/sdm.service';
// import storageService from '../services/storage.service';
// import { validateSumMessage } from '../utils/validation';
// import logger from '../utils/logger';

// export class NfcController {
//     /**
//      * Verify NFC tag and handle comprehensive verification workflow
//      */
//     async verifyTag(req: Request, res: Response, next: NextFunction): Promise<void> {
//         try {
//             const { sumMessage } = req.body;

//             // Validate SUM message structure
//             if (!validateSumMessage(sumMessage)) {
//                 res.status(200).json({
//                     success: false,
//                     data: {
//                         tagId: 'invalid',
//                         isValid: false,
//                         metadata: {
//                             error: 'Invalid SUM message format'
//                         }
//                     },
//                     message: 'NFC tag verification failed',
//                     timestamp: new Date().toISOString()
//                 });
//                 return;
//             }

//             // Comprehensive verification attempt
//             let verificationResult: VerificationResult;
//             try {
//                 // Attempt verification through SDM backend
//                 verificationResult = await sdmService.verifyNfcTag(sumMessage);
//             } catch (verificationError) {
//                 // Create a failed verification result if SDM verification fails
//                 logger.warn('NFC tag verification encountered an issue', {
//                     error: verificationError instanceof Error ? verificationError.message : String(verificationError),
//                     sumMessage
//                 });

//                 verificationResult = {
//                     isValid: false,
//                     tagId: 'unknown',
//                     timestamp: new Date(),
//                     metadata: {
//                         error: verificationError instanceof Error
//                             ? verificationError.message
//                             : 'Verification process failed'
//                     }
//                 };
//             }

//             // Log verification attempt
//             await storageService.logVerification(
//                 verificationResult,
//                 req.ip,
//                 req.headers['user-agent']
//             );

//             // Always return 200 with comprehensive verification details
//             res.status(200).json({
//                 success: verificationResult.isValid,
//                 data: {
//                     tagId: verificationResult.tagId,
//                     isValid: verificationResult.isValid,
//                     metadata: verificationResult.metadata
//                 },
//                 message: verificationResult.isValid
//                     ? 'NFC tag successfully verified'
//                     : 'NFC tag verification failed',
//                 timestamp: new Date().toISOString()
//             });

//         } catch (systemError) {
//             // Unexpected system-level errors
//             const errorMessage = systemError instanceof Error
//                 ? systemError.message
//                 : 'An unexpected system error occurred';

//             logger.error('Catastrophic error in NFC tag verification', {
//                 error: errorMessage
//             });

//             // Return 200 with system error details
//             res.status(200).json({
//                 success: false,
//                 data: {
//                     tagId: 'system-error',
//                     isValid: false,
//                     metadata: { error: errorMessage }
//                 },
//                 message: 'System error during verification',
//                 timestamp: new Date().toISOString()
//             });
//         }
//     }

//     /**
//      * Retrieve statistics for a specific NFC tag
//      */
//     async getTagStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
//         try {
//             const { tagId } = req.params;

//             // Validate tag ID input
//             if (!tagId) {
//                 res.status(200).json({
//                     success: false,
//                     error: {
//                         code: 'MISSING_TAG_ID',
//                         message: 'Tag ID is required'
//                     },
//                     timestamp: new Date().toISOString()
//                 });
//                 return;
//             }

//             // Retrieve tag statistics
//             const statistics = await storageService.getTagStatistics(tagId);

//             // Handle non-existent tag
//             if (!statistics) {
//                 res.status(200).json({
//                     success: false,
//                     error: {
//                         code: 'TAG_NOT_FOUND',
//                         message: 'Tag statistics not found'
//                     },
//                     timestamp: new Date().toISOString()
//                 });
//                 return;
//             }

//             // Send successful response
//             res.status(200).json({
//                 success: true,
//                 data: statistics,
//                 timestamp: new Date().toISOString()
//             });

//         } catch (error) {
//             // Log error details
//             logger.error('Error retrieving tag statistics', {
//                 error: error instanceof Error ? error.message : String(error),
//                 tagId: req.params.tagId
//             });

//             // Return 200 with error details
//             res.status(200).json({
//                 success: false,
//                 error: {
//                     code: 'INTERNAL_SERVER_ERROR',
//                     message: 'Unable to retrieve tag statistics'
//                 },
//                 timestamp: new Date().toISOString()
//             });
//         }
//     }
// }

// // Create singleton instance and export as default
// export default new NfcController();

import { Request, Response, NextFunction } from 'express';
import { SumMessage, NfcVerificationError } from '../types/nfc.types';
import nfcService from '../services/nfc.service';
import { validateSumMessage } from '../utils/validation';
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
            const { sumMessage } = req.body;

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

            // Process verification
            const result = await nfcService.verifyNfcTag(
                sumMessage,
                req.ip,
                req.headers['user-agent']
            );

            // Return successful response
            res.status(200).json({
                success: true,
                data: {
                    tagId: result.tagId,
                    isValid: result.isValid,
                    metadata: result.metadata,
                    verifiedAt: result.timestamp.toISOString()
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
}

// Export singleton instance
export default new NfcController();