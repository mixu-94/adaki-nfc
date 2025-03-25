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
     * Parse relevant data from the SDM backend response
     * @param {string|object} responseData - The raw response data from the SDM backend
     * @returns {object} Cleaned and structured data
     */
    parseResponseData(responseData) {
        // Initialize a clean data object
        const cleanData = {
            encryption: null,
            uid: null,
            readCounter: null,
            fileDataHex: null,
            fileDataText: null,
            isTagTampered: false,
            status: 'verified'
        };

        // If the response is already a clean JSON object, use it directly
        if (typeof responseData === 'object' && !Array.isArray(responseData)) {
            return responseData;
        }

        // If response is a string (likely HTML), extract the data we want
        if (typeof responseData === 'string') {
            // Extract encryption mode
            const encryptionMatch = responseData.match(/Encryption mode:\s*([A-Z]+)/i);
            if (encryptionMatch && encryptionMatch[1]) {
                cleanData.encryption = encryptionMatch[1];
            }

            // Extract UID
            const uidMatch = responseData.match(/NFC TAG UID:\s*`([0-9a-f]+)`/i);
            if (uidMatch && uidMatch[1]) {
                cleanData.uid = uidMatch[1];
            }

            // Extract read counter
            const counterMatch = responseData.match(/Read counter:\s*`(\d+)`/i);
            if (counterMatch && counterMatch[1]) {
                cleanData.readCounter = parseInt(counterMatch[1], 10);
            }

            // Extract file data (hex)
            const hexMatch = responseData.match(/File data \(hex\):\s*`([0-9a-f-]+)`/i);
            if (hexMatch && hexMatch[1]) {
                cleanData.fileDataHex = hexMatch[1];
            }

            // Extract file data (text)
            const textMatch = responseData.match(/File data \(UTF-8\):\s*`([^`]+)`/i);
            if (textMatch && textMatch[1]) {
                cleanData.fileDataText = textMatch[1];
            }

            // Check for tamper indication
            if (responseData.includes('tamper') || responseData.includes('TAMPER')) {
                cleanData.isTagTampered = true;
            }
        }

        return cleanData;
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
            let url = `${this.baseUrl}/tag`;

            // Check if this is a TagTamper tag based on ID length
            if (sumMessage.id.length > 32) {
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

            // Use GET request for the SDM backend
            const response = await axios.get(url, {
                timeout: 8000
            });

            logger.info('SDM backend response received', {
                status: response.status,
                hasData: !!response.data
            });

            // Check if verification was successful
            if (!response.data) {
                logger.warn('SDM backend returned empty response');
                throw new NfcVerificationError('Tag verification returned empty response');
            }

            // Parse and clean the response data
            const parsedData = this.parseResponseData(response.data);

            // Extract redirect URL if present
            let redirectUrl = null;
            if (response.data.url) {
                redirectUrl = response.data.url;
            } else if (response.data.redirectUrl) {
                redirectUrl = response.data.redirectUrl;
            } else if (typeof response.data === 'string' && response.data.startsWith('http')) {
                redirectUrl = response.data;
            }

            logger.info('Tag verification successful', {
                tagId: sumMessage.id,
                hasRedirectUrl: !!redirectUrl,
                parsedData
            });

            return {
                isValid: true,
                tagId: sumMessage.id,
                timestamp: new Date(),
                redirectUrl: redirectUrl,
                // Use the cleaned data as metadata instead of the raw response
                metadata: parsedData
            };
        } catch (error) {
            // Enhanced error logging
            if (error.response) {
                logger.error('Error during NFC verification with SDM backend', {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers,
                    tagId: sumMessage.id
                });
            } else if (error.request) {
                logger.error('Error during NFC verification with SDM backend', {
                    error: 'No response received from SDM backend',
                    request: error.request,
                    tagId: sumMessage.id
                });
            } else {
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

// import axios from 'axios';
// import logger from '../utils/logger.js';
// import dotenv from 'dotenv';

// // Load environment variables
// dotenv.config();

// /**
//  * Error class for NFC verification errors
//  */
// export class NfcVerificationError extends Error {
//     constructor(message) {
//         super(message);
//         this.name = 'NfcVerificationError';
//     }
// }

// class SdmService {
//     constructor() {
//         this.baseUrl = process.env.SDM_BACKEND_URL || 'http://localhost:5000';
//         logger.info(`SDM Backend URL initialized to: ${this.baseUrl}`);
//     }

//     /**
//      * Verifies an NFC tag by sending the SUM message to sdm-backend
//      * @param {object} sumMessage - The SUM message from the NFC tag
//      * @returns {object} Verification result with tag details
//      * @throws {NfcVerificationError} if verification fails
//      */
//     async verifyNfcTag(sumMessage) {
//         try {
//             logger.info('Verifying NFC tag with SDM backend', {
//                 tagId: sumMessage.id,
//                 hasData: !!sumMessage.data,
//                 hasSignature: !!sumMessage.signature
//             });

//             // Build URL with query parameters instead of POST body
//             // This follows the format shown in the SDM backend documentation
//             let url = `${this.baseUrl}/tag`;

//             // Check if this is a TagTamper tag based on ID length or other criteria
//             // If it is, use the tagtt endpoint instead
//             if (sumMessage.id.length > 32) { // This is a heuristic, adjust as needed
//                 url = `${this.baseUrl}/tagtt`;
//                 logger.info('Detected possible TagTamper tag, using /tagtt endpoint');
//             }

//             // Add query parameters
//             url += `?picc_data=${encodeURIComponent(sumMessage.id)}`;

//             // Add cmac (signature) if available
//             if (sumMessage.signature) {
//                 url += `&cmac=${encodeURIComponent(sumMessage.signature)}`;
//             }

//             // Add enc (data) if available
//             if (sumMessage.data) {
//                 url += `&enc=${encodeURIComponent(sumMessage.data)}`;
//             }

//             logger.info(`Making request to SDM backend: ${url}`);

//             // Use GET instead of POST as shown in the SDM backend examples
//             const response = await axios.get(url, {
//                 timeout: 8000 // 8 second timeout
//             });

//             logger.info('SDM backend response received', {
//                 status: response.status,
//                 hasData: !!response.data
//             });

//             // Check if verification was successful
//             // Adapt this based on the actual response format from your SDM backend
//             if (!response.data) {
//                 logger.warn('SDM backend returned empty response');
//                 throw new NfcVerificationError('Tag verification returned empty response');
//             }

//             // Extract redirect URL if present in the response
//             let redirectUrl = null;
//             if (response.data.url) {
//                 redirectUrl = response.data.url;
//             } else if (response.data.redirectUrl) {
//                 redirectUrl = response.data.redirectUrl;
//             } else if (typeof response.data === 'string' && response.data.startsWith('http')) {
//                 // Some SDM backends might return just the URL as a string
//                 redirectUrl = response.data;
//             }

//             logger.info('Tag verification successful', {
//                 tagId: sumMessage.id,
//                 hasRedirectUrl: !!redirectUrl
//             });

//             return {
//                 isValid: true,
//                 tagId: sumMessage.id,
//                 timestamp: new Date(),
//                 redirectUrl: redirectUrl,
//                 metadata: response.data
//             };
//         } catch (error) {
//             // Enhanced error logging with detailed information
//             if (error.response) {
//                 // The request was made and the server responded with a status code
//                 // that falls out of the range of 2xx
//                 logger.error('Error during NFC verification with SDM backend', {
//                     status: error.response.status,
//                     data: error.response.data,
//                     headers: error.response.headers,
//                     tagId: sumMessage.id
//                 });
//             } else if (error.request) {
//                 // The request was made but no response was received
//                 logger.error('Error during NFC verification with SDM backend', {
//                     error: 'No response received from SDM backend',
//                     request: error.request,
//                     tagId: sumMessage.id
//                 });
//             } else {
//                 // Something happened in setting up the request that triggered an Error
//                 logger.error('Error during NFC verification with SDM backend', {
//                     error: error.message,
//                     stack: error.stack,
//                     tagId: sumMessage.id
//                 });
//             }

//             if (error instanceof NfcVerificationError) {
//                 throw error;
//             }

//             throw new NfcVerificationError('NFC tag could not be verified');
//         }
//     }
// }

// export default new SdmService();