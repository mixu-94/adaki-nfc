import { SumMessage, VerificationResult, NfcVerificationError } from '../types/nfc.types';
import sdmService from './sdm.service';
import storageService from './storage.service';
import logger from '../utils/logger';

export class NfcService {
    /**
     * Process and verify an NFC tag using SUM message
     * @param sumMessage - SUM message from the NFC tag
     * @param ipAddress - Optional client IP address for logging
     * @param userAgent - Optional client user agent for logging
     * @returns Verification result with tag details
     */
    async verifyNfcTag(
        sumMessage: SumMessage,
        ipAddress?: string,
        userAgent?: string
    ): Promise<VerificationResult> {
        try {
            logger.info('[services/nfc.service.ts] Processing verification request');

            // Verify tag with SDM backend
            const result = await sdmService.verifyNfcTag(sumMessage);

            // Log verification to storage
            await storageService.logVerification(result, ipAddress, userAgent);

            return result;
        } catch (error) {
            // If the error is from verification, pass it through
            if (error instanceof NfcVerificationError) {
                // Attempt to log failed verification
                if (error.message.includes('Tag verification failed') && sumMessage) {
                    try {
                        const failedResult: VerificationResult = {
                            isValid: false,
                            tagId: 'unknown', // We don't have a valid tag ID for failed verifications
                            timestamp: new Date(),
                            metadata: { error: error.message },
                        };

                        await storageService.logVerification(failedResult, ipAddress, userAgent);
                    } catch (logError) {
                        // Just log the error and continue, don't fail the operation
                        logger.error('[services/nfc.service.ts] Error logging failed verification', {
                            error: logError
                        });
                    }
                }

                throw error;
            }

            // Otherwise, wrap it in a new error
            logger.error('[services/nfc.service.ts] Error in verification process', { error });
            throw new NfcVerificationError('Error processing verification request');
        }
    }

    /**
     * Get statistics for a tag
     * @param tagId - ID of the tag to get statistics for
     * @returns Tag statistics if available
     */
    async getTagStatistics(tagId: string) {
        try {
            return await storageService.getTagStatistics(tagId);
        } catch (error) {
            logger.error('[services/nfc.service.ts] Error getting tag statistics', { error });
            throw new Error('Error retrieving tag statistics');
        }
    }
}

// Export singleton instance
export default new NfcService();