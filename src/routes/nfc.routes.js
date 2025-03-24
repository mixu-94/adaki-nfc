import { Router } from 'express';

import { apiKeyMiddleware, apiKeyMiddlewareOptional } from '../middleware/auth.middleware.js';
import nfcController from '../controller/nfc.controller.js';



const router = Router();

/**
 * @route POST /api/nfc/verify
 * @desc Verify an NFC tag using SUM message
 * @access Protected by API key
 */
router.post(
    '/verify',
    apiKeyMiddleware,
    nfcController.verifyTag
);

/**
 * @route POST /api/nfc/redirect
 * @desc Verify an NFC tag and redirect to the appropriate URL
 * @access Public (no API key required)
 */
router.post(
    '/redirect',
    apiKeyMiddlewareOptional,
    nfcController.handleRedirect
);

export default router;