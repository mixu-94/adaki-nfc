import { Router } from 'express';
import nfcController from '../controllers/nfc.controller';
import { apiKeyMiddleware } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit';

const router = Router();

/**
 * @route POST /api/nfc/verify
 * @desc Verify an NFC tag using SUM message
 * @access Protected by API key
 */
router.post(
    '/verify',
    rateLimitMiddleware,
    apiKeyMiddleware,
    nfcController.verifyTag
);

/**
 * @route GET /api/nfc/stats/:tagId
 * @desc Get statistics for a specific tag
 * @access Protected by API key
 */
router.get(
    '/stats/:tagId',
    rateLimitMiddleware,
    apiKeyMiddleware,
    nfcController.getTagStatistics
);

/**
 * @route PUT /api/nfc/config/:tagId
 * @desc Update configuration for a specific tag
 * @access Protected by API key
 */
router.put(
    '/config/:tagId',
    rateLimitMiddleware,
    apiKeyMiddleware,
    nfcController.updateTagConfiguration
);

export default router;