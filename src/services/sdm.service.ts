import axios from 'axios';
import { SumMessage, VerificationResult, NfcVerificationError } from '../types/nfc.types';
import config from '../config/app';
import logger from '../utils/logger';

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
                { sumMessage },
                requestConfig
            );

            // Check if verification was successful
            if (!response.data || !response.data.success) {
                logger.warn('[services/sdm.service.ts] Verification failed', {
                    response: response.data
                });
                throw new NfcVerificationError('Tag verification failed');
            }

            // Build verification result from response
            const result: VerificationResult = {
                isValid: true,
                tagId: response.data.tagId,
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
}

// Export singleton instance
export default new SdmService();