import nfcService from '../services/nfc.service.js';
import logger from '../utils/logger.js';
import { validateSumMessage } from '../utils/validation.js';
import { NfcVerificationError } from '../services/sdm.service.js';

class NfcController {
    /**
     * Verify an NFC tag with SUM message
     */
    async verifyTag(req, res, next) {
        try {
            const { sumMessage } = req.body;

            // Validate input
            if (!validateSumMessage(sumMessage)) {
                logger.warn('Invalid SUM message format received');
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

            // Verify tag - ensure the service has this method
            const result = await nfcService.verifyTag(
                sumMessage,
                req.ip,
                req.headers['user-agent']
            );

            logger.info('Tag verification successful', {
                tagId: result.tagId
            });

            // Return successful response
            res.status(200).json({
                success: true,
                data: {
                    tagId: result.tagId,
                    isValid: result.isValid,
                    redirectUrl: result.redirectUrl,
                    metadata: result.metadata
                },
                message: 'NFC tag successfully verified',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            if (error instanceof NfcVerificationError) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VERIFICATION_FAILED',
                        message: error.message
                    },
                    timestamp: new Date().toISOString()
                });
                return;
            }

            next(error);
        }
    }

    /**
     * Simple endpoint to handle redirects
     */
    async handleRedirect(req, res, next) {
        try {
            const { sumMessage } = req.body;

            // Validate input
            if (!validateSumMessage(sumMessage)) {
                return res.redirect('/error?reason=invalid_format');
            }

            // Verify tag
            const result = await nfcService.verifyTag(
                sumMessage,
                req.ip,
                req.headers['user-agent']
            );

            // If verification succeeded and we have a redirect URL, redirect the user
            if (result.isValid && result.redirectUrl) {
                return res.redirect(result.redirectUrl);
            }

            // If verification succeeded but no redirect URL, show success page
            if (result.isValid) {
                return res.redirect(`/success?tagId=${result.tagId}`);
            }

            // If verification failed, show error page
            return res.redirect('/error?reason=verification_failed');
        } catch (error) {
            logger.error('Error in redirect handler', { error });
            return res.redirect('/error?reason=server_error');
        }
    }
}

// Export as instance (this is likely the issue)
export default new NfcController();