import axios from 'axios';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Error class for NFC verification errors
 */
export class NfcVerificationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NfcVerificationError';
    }
}

class SdmService {
    constructor() {
        this.baseUrl = process.env.SDM_BACKEND_URL || 'http://localhost:5000';
    }

    /**
     * Verifies an NFC tag by sending the SUM message to sdm-backend
     * @param {object} sumMessage - The SUM message from the NFC tag
     * @returns {object} Verification result with tag details
     * @throws {NfcVerificationError} if verification fails
     */
    async verifyNfcTag(sumMessage) {
        try {
            logger.info('Verifying NFC tag with SDM backend');

            // Adapt this request format to match your sdm-backend's API
            const response = await axios.post(`${this.baseUrl}/tag`, {
                picc_data: sumMessage.id,
                cmac: sumMessage.signature || '',
                enc: sumMessage.data || ''
            }, {
                timeout: 5000 // 5 second timeout
            });

            // Check if verification was successful
            if (!response.data || response.data.success === false) {
                throw new NfcVerificationError('Tag verification failed');
            }

            return {
                isValid: true,
                tagId: sumMessage.id, // or extract from response if available
                timestamp: new Date(),
                redirectUrl: response.data.redirectUrl || null,
                metadata: response.data || {}
            };
        } catch (error) {
            if (error instanceof NfcVerificationError) {
                throw error;
            }

            logger.error('Error during NFC verification with SDM backend', {
                error: error.message,
                status: error.response?.status
            });

            throw new NfcVerificationError('NFC tag could not be verified');
        }
    }
}

export default new SdmService();