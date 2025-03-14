// src/services/nfc.service.ts
import { SumMessage, VerificationResult, NfcVerificationError, TagConfigurationOptions } from '../types/nfc.types';
import sdmService from './sdm.service';
import storageService from './storage.service';
import logger from '../utils/logger';
import { NfcUrlParser } from '../utils/url-parser';

export class NfcService {
    /**
     * Process and verify an NFC tag using SUM message
     * @param sumMessage - SUM message from the NFC tag
     * @param ipAddress - Optional client IP address for logging
     * @param userAgent - Optional client user agent for logging
     * @param geoLocation - Optional geolocation data
     * @returns Verification result with tag details
     */
    async verifyNfcTag(
        sumMessage: SumMessage,
        ipAddress?: string,
        userAgent?: string,
        geoLocation?: { latitude: number, longitude: number }
    ): Promise<VerificationResult> {
        try {
            logger.info('[services/nfc.service.ts] Processing verification request');

            // Pre-process SUM message if needed for URL handling
            const processedSumMessage = this.preprocessSumMessage(sumMessage);

            // Verify tag with SDM backend
            const result = await sdmService.verifyNfcTag(processedSumMessage);

            // Add geolocation to metadata if provided
            if (geoLocation) {
                result.metadata = {
                    ...result.metadata,
                    geoLocation
                };
            }

            // Log verification to storage
            await storageService.logVerification(result, ipAddress, userAgent, geoLocation);

            // Add redirect URL to result from storage if available
            try {
                const tagInfo = await storageService.getTagStatistics(result.tagId);
                if (tagInfo && tagInfo.redirect_url) {
                    result.metadata = {
                        ...result.metadata,
                        redirectUrl: tagInfo.redirect_url
                    };
                }
            } catch (error) {
                // Non-critical error, log but continue
                logger.warn('[services/nfc.service.ts] Could not fetch redirect URL', { error });
            }

            return result;
        } catch (error) {
            // If the error is from verification, pass it through
            if (error instanceof NfcVerificationError) {
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

    /**
     * Update configuration for a tag
     * @param tagId - ID of the tag to update
     * @param config - Configuration options to update
     * @returns Updated tag record
     */
    async updateTagConfiguration(tagId: string, config: TagConfigurationOptions) {
        try {
            logger.info('[services/nfc.service.ts] Updating tag configuration', {
                tagId,
                hasRedirectUrl: !!config.redirectUrl,
                hasActiveStatus: config.isActive !== undefined
            });

            return await storageService.updateTagConfiguration(tagId, config);
        } catch (error) {
            logger.error('[services/nfc.service.ts] Error updating tag configuration', { error });
            throw new Error('Error updating tag configuration');
        }
    }

    /**
     * Preprocesses SUM message for verification
     * Handles URL formatting and parameter extraction
     * @param sumMessage - Original SUM message
     * @returns Processed SUM message ready for verification
     */
    private preprocessSumMessage(sumMessage: SumMessage): SumMessage {
        // If it's already a properly formatted SUM message, return as is
        if (sumMessage.type && typeof sumMessage.data === 'string') {
            // For complete URLs, extract query parameters
            if (sumMessage.data.startsWith('http')) {
                const processedData = sumMessage.data.includes('?') ?
                    sumMessage.data.split('?')[1] :
                    sumMessage.data;

                return {
                    ...sumMessage,
                    data: processedData
                };
            }
            return sumMessage;
        }

        // Fallback parsing (should not normally be needed)
        logger.warn('[services/nfc.service.ts] Using fallback SUM message parsing');
        return {
            type: 'tag',
            data: typeof sumMessage === 'string' ? sumMessage : JSON.stringify(sumMessage)
        };
    }
}

// Export singleton instance
export default new NfcService();

// // src/services/nfc.service.ts
// import { SumMessage, VerificationResult, NfcVerificationError, TagConfigurationOptions } from '../types/nfc.types';
// import sdmService from './sdm.service';
// import storageService from './storage.service';
// import logger from '../utils/logger';

// export class NfcService {
//     /**
//      * Process and verify an NFC tag using SUM message
//      * @param sumMessage - SUM message from the NFC tag
//      * @param ipAddress - Optional client IP address for logging
//      * @param userAgent - Optional client user agent for logging
//      * @param geoLocation - Optional geolocation data
//      * @returns Verification result with tag details
//      */
//     async verifyNfcTag(
//         sumMessage: SumMessage,
//         ipAddress?: string,
//         userAgent?: string,
//         geoLocation?: { latitude: number, longitude: number }
//     ): Promise<VerificationResult> {
//         try {
//             logger.info('[services/nfc.service.ts] Processing verification request');

//             // Verify tag with SDM backend
//             const result = await sdmService.verifyNfcTag(sumMessage);

//             // Add geolocation to metadata if provided
//             if (geoLocation) {
//                 result.metadata = {
//                     ...result.metadata,
//                     geoLocation
//                 };
//             }

//             // Log verification to storage
//             await storageService.logVerification(result, ipAddress, userAgent, geoLocation);

//             return result;
//         } catch (error) {
//             // If the error is from verification, pass it through
//             if (error instanceof NfcVerificationError) {
//                 throw error;
//             }

//             // Otherwise, wrap it in a new error
//             logger.error('[services/nfc.service.ts] Error in verification process', { error });
//             throw new NfcVerificationError('Error processing verification request');
//         }
//     }

//     /**
//      * Get statistics for a tag
//      * @param tagId - ID of the tag to get statistics for
//      * @returns Tag statistics if available
//      */
//     async getTagStatistics(tagId: string) {
//         try {
//             return await storageService.getTagStatistics(tagId);
//         } catch (error) {
//             logger.error('[services/nfc.service.ts] Error getting tag statistics', { error });
//             throw new Error('Error retrieving tag statistics');
//         }
//     }

//     /**
//      * Update configuration for a tag
//      * @param tagId - ID of the tag to update
//      * @param config - Configuration options to update
//      * @returns Updated tag record
//      */
//     async updateTagConfiguration(tagId: string, config: TagConfigurationOptions) {
//         try {
//             logger.info('[services/nfc.service.ts] Updating tag configuration', {
//                 tagId,
//                 hasRedirectUrl: !!config.redirectUrl,
//                 hasActiveStatus: config.isActive !== undefined
//             });

//             return await storageService.updateTagConfiguration(tagId, config);
//         } catch (error) {
//             logger.error('[services/nfc.service.ts] Error updating tag configuration', { error });
//             throw new Error('Error updating tag configuration');
//         }
//     }
// }

// // Export singleton instance
// export default new NfcService();