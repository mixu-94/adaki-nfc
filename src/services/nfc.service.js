import sdmService, { NfcVerificationError } from './sdm.service.js';
import storageService from './storage.service.js';
import redis from '../config/redis.js';
import logger from '../utils/logger.js';

class NfcService {
    /**
     * Process NFC tag verification
     * @param {object} sumMessage - The SUM message from the NFC tag
     * @param {string} [ipAddress] - Optional IP address of the client
     * @param {string} [userAgent] - Optional user agent of the client
     * @returns {object} Verification result with tag details and redirect URL
     */
    async verifyTag(sumMessage, ipAddress, userAgent) {
        try {
            // Log for debugging
            logger.info('verifyTag method called with sumMessage:', {
                id: sumMessage.id,
                hasData: !!sumMessage.data,
                hasSignature: !!sumMessage.signature
            });

            // Try to get from cache first (only for successful verifications)
            const cacheKey = `tag:${sumMessage.id}`;
            const cachedResult = await redis.get(cacheKey);

            if (cachedResult) {
                const parsedResult = JSON.parse(cachedResult);
                logger.info('Using cached verification result', { tagId: sumMessage.id });

                // Even though we're using cached result, still log this verification
                await storageService.logVerification(
                    parsedResult,
                    ipAddress,
                    userAgent
                );

                return parsedResult;
            }

            // Verify tag with sdm-backend
            const verificationResult = await sdmService.verifyNfcTag(sumMessage);

            // If there's no redirect URL from the SDM backend, try to get it from our database
            if (!verificationResult.redirectUrl) {
                const redirectUrl = await storageService.getRedirectUrl(verificationResult.tagId);
                if (redirectUrl) {
                    verificationResult.redirectUrl = redirectUrl;
                }
            }

            // Log verification to Supabase
            await storageService.logVerification(
                verificationResult,
                ipAddress,
                userAgent
            );

            // Cache successful verifications
            if (verificationResult.isValid) {
                await redis.set(
                    cacheKey,
                    JSON.stringify(verificationResult),
                    'EX',
                    60 * 5 // Cache for 5 minutes
                );
            }

            return verificationResult;
        } catch (error) {
            logger.error('Error in NFC verification process', {
                error: error.message,
                stack: error.stack
            });

            if (error instanceof NfcVerificationError) {
                throw error;
            }

            throw new NfcVerificationError('NFC tag verification failed');
        }
    }
}

// Create a singleton instance and export it
const nfcService = new NfcService();
export default nfcService;