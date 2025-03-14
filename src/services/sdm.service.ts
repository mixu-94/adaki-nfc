// src/services/sdm.service.ts
import axios from 'axios';
import { SumMessage, VerificationResult, NfcVerificationError } from '../types/nfc.types';
import config from '../config/app';
import logger from '../utils/logger';
import { NfcUrlParser } from '../utils/url-parser';

export class SdmService {
    private readonly baseUrl: string;

    constructor() {
        // Get the sdm-backend URL from configuration
        this.baseUrl = config.services.sdmBackendUrl;
    }

    /**
     * 🔒 Verifies an NFC tag by sending the SUM message to sdm-backend
     * @param sumMessage - The SUM message from the NFC tag
     * @returns Verification result with tag details
     * @throws NfcVerificationError if verification fails
     */
    async verifyNfcTag(sumMessage: SumMessage): Promise<VerificationResult> {
        try {
            logger.info('[services/sdm.service.ts] Verifying NFC tag');

            // Preprocess SUM message data to ensure correct format
            const processedData = this.preprocessSumMessageData(sumMessage.data);
            const processedSumMessage = {
                ...sumMessage,
                data: processedData
            };

            // Configure request with timeout
            const requestConfig = {
                timeout: 5000, // 5-second timeout
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            // Send the SUM message to the sdm-backend for verification
            const response = await axios.post(
                `${this.baseUrl}/verify`,
                { sumMessage: processedSumMessage },
                requestConfig
            );

            // Check if verification was successful
            if (!response.data || !response.data.success) {
                logger.warn('[services/sdm.service.ts] Verification failed', {
                    response: response.data
                });
                throw new NfcVerificationError('Tag verification failed');
            }

            // Extract parameters to determine tag ID if not provided by backend
            let tagId = response.data.tagId;
            if (!tagId) {
                const params = NfcUrlParser.parseParameters(processedData);
                const tagType = NfcUrlParser.determineTagType(params);
                tagId = NfcUrlParser.extractTagId(params, tagType) || 'unknown-tag';
            }

            // Build verification result from response
            const result: VerificationResult = {
                isValid: true,
                tagId: tagId,
                timestamp: new Date(),
                metadata: response.data.metadata || {},
            };

            logger.info('[services/sdm.service.ts] Tag verification successful', {
                tagId: result.tagId,
            });

            return result;
        } catch (error) {
            // Handle different types of errors
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNREFUSED') {
                    logger.error('[services/sdm.service.ts] SDM backend is unavailable', { error });
                    throw new NfcVerificationError('Verification service is unavailable');
                }

                if (error.response) {
                    logger.error('[services/sdm.service.ts] SDM backend returned error', {
                        status: error.response.status,
                        data: error.response.data,
                    });
                }
            }

            logger.error('[services/sdm.service.ts] Error during NFC verification', { error });
            throw new NfcVerificationError('NFC tag could not be verified');
        }
    }

    /**
     * Preprocesses SUM message data to ensure it's in the correct format
     * @param data - Original SUM message data
     * @returns Processed data ready for verification
     */
    private preprocessSumMessageData(data: string): string {
        // If data is a complete URL, extract just the query parameters
        if (data.startsWith('http')) {
            try {
                const url = new URL(data);
                return url.search.startsWith('?') ? url.search.substring(1) : url.search;
            } catch (error) {
                logger.warn('[services/sdm.service.ts] Invalid URL in SUM message data', { error });
                // Return original data if URL parsing fails
                return data;
            }
        }

        return data;
    }
}

// Export singleton instance
export default new SdmService();

// import axios from 'axios';
// import { SumMessage, VerificationResult, NfcVerificationError } from '../types/nfc.types';
// import config from '../config/app';
// import logger from '../utils/logger';

// export class SdmService {
//     private readonly baseUrl: string;

//     constructor() {
//         // Get the sdm-backend URL from configuration
//         this.baseUrl = config.services.sdmBackendUrl;
//     }

//     /**
//      * 🔒 Verifies an NFC tag by sending the SUM message to sdm-backend
//      * @param sumMessage - The SUM message from the NFC tag
//      * @returns Verification result with tag details
//      * @throws NfcVerificationError if verification fails
//      */
//     async verifyNfcTag(sumMessage: SumMessage): Promise<VerificationResult> {
//         try {
//             logger.info('[services/sdm.service.ts] Verifying NFC tag');

//             // Configure request with timeout
//             const requestConfig = {
//                 timeout: 5000, // 5-second timeout
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//             };

//             // Send the SUM message to the sdm-backend for verification
//             const response = await axios.post(
//                 `${this.baseUrl}/verify`,
//                 { sumMessage },
//                 requestConfig
//             );

//             // Check if verification was successful
//             if (!response.data || !response.data.success) {
//                 logger.warn('[services/sdm.service.ts] Verification failed', {
//                     response: response.data
//                 });
//                 throw new NfcVerificationError('Tag verification failed');
//             }

//             // Build verification result from response
//             const result: VerificationResult = {
//                 isValid: true,
//                 tagId: response.data.tagId,
//                 timestamp: new Date(),
//                 metadata: response.data.metadata || {},
//             };

//             logger.info('[services/sdm.service.ts] Tag verification successful', {
//                 tagId: result.tagId,
//             });

//             return result;
//         } catch (error) {
//             // Handle different types of errors
//             if (axios.isAxiosError(error)) {
//                 if (error.code === 'ECONNREFUSED') {
//                     logger.error('[services/sdm.service.ts] SDM backend is unavailable', { error });
//                     throw new NfcVerificationError('Verification service is unavailable');
//                 }

//                 if (error.response) {
//                     logger.error('[services/sdm.service.ts] SDM backend returned error', {
//                         status: error.response.status,
//                         data: error.response.data,
//                     });
//                 }
//             }

//             logger.error('[services/sdm.service.ts] Error during NFC verification', { error });
//             throw new NfcVerificationError('NFC tag could not be verified');
//         }
//     }
// }

// // Export singleton instance
// export default new SdmService();