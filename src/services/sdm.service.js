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
        logger.info(`SDM Backend URL initialized to: ${this.baseUrl}`);
    }

    /**
     * Verifies an NFC tag by sending the SUM message to sdm-backend
     * @param {object} sumMessage - The SUM message from the NFC tag
     * @returns {object} Verification result with tag details
     * @throws {NfcVerificationError} if verification fails
     */
    async verifyNfcTag(sumMessage) {
        try {
            logger.info('Verifying NFC tag with SDM backend', {
                tagId: sumMessage.id,
                hasData: !!sumMessage.data,
                hasSignature: !!sumMessage.signature
            });

            // Build URL with query parameters instead of POST body
            // This follows the format shown in the SDM backend documentation
            let url = `${this.baseUrl}/tag`;

            // Check if this is a TagTamper tag based on ID length or other criteria
            // If it is, use the tagtt endpoint instead
            if (sumMessage.id.length > 32) { // This is a heuristic, adjust as needed
                url = `${this.baseUrl}/tagtt`;
                logger.info('Detected possible TagTamper tag, using /tagtt endpoint');
            }

            // Add query parameters
            url += `?picc_data=${encodeURIComponent(sumMessage.id)}`;

            // Add cmac (signature) if available
            if (sumMessage.signature) {
                url += `&cmac=${encodeURIComponent(sumMessage.signature)}`;
            }

            // Add enc (data) if available
            if (sumMessage.data) {
                url += `&enc=${encodeURIComponent(sumMessage.data)}`;
            }

            logger.info(`Making request to SDM backend: ${url}`);

            // Use GET instead of POST as shown in the SDM backend examples
            const response = await axios.get(url, {
                timeout: 8000 // 8 second timeout
            });

            logger.info('SDM backend response received', {
                status: response.status,
                hasData: !!response.data
            });

            // Check if verification was successful
            // Adapt this based on the actual response format from your SDM backend
            if (!response.data) {
                logger.warn('SDM backend returned empty response');
                throw new NfcVerificationError('Tag verification returned empty response');
            }

            // Extract redirect URL if present in the response
            let redirectUrl = null;
            if (response.data.url) {
                redirectUrl = response.data.url;
            } else if (response.data.redirectUrl) {
                redirectUrl = response.data.redirectUrl;
            } else if (typeof response.data === 'string' && response.data.startsWith('http')) {
                // Some SDM backends might return just the URL as a string
                redirectUrl = response.data;
            }

            logger.info('Tag verification successful', {
                tagId: sumMessage.id,
                hasRedirectUrl: !!redirectUrl
            });

            return {
                isValid: true,
                tagId: sumMessage.id,
                timestamp: new Date(),
                redirectUrl: redirectUrl,
                metadata: response.data
            };
        } catch (error) {
            // Enhanced error logging with detailed information
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                logger.error('Error during NFC verification with SDM backend', {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers,
                    tagId: sumMessage.id
                });
            } else if (error.request) {
                // The request was made but no response was received
                logger.error('Error during NFC verification with SDM backend', {
                    error: 'No response received from SDM backend',
                    request: error.request,
                    tagId: sumMessage.id
                });
            } else {
                // Something happened in setting up the request that triggered an Error
                logger.error('Error during NFC verification with SDM backend', {
                    error: error.message,
                    stack: error.stack,
                    tagId: sumMessage.id
                });
            }

            if (error instanceof NfcVerificationError) {
                throw error;
            }

            throw new NfcVerificationError('NFC tag could not be verified');
        }
    }
}

export default new SdmService();