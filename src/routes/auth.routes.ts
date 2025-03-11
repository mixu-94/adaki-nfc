import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { apiKeyMiddleware } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit';

const router = Router();

/**
 * @route POST /api/auth/keys
 * @desc Create a new API key
 * @access Protected by API key (only existing API keys can create new ones)
 */
router.post(
    '/keys',
    rateLimitMiddleware,
    apiKeyMiddleware,
    authController.createApiKey
);

/**
 * @route DELETE /api/auth/keys/:id
 * @desc Revoke an API key
 * @access Protected by API key
 */
router.delete(
    '/keys/:id',
    rateLimitMiddleware,
    apiKeyMiddleware,
    authController.revokeApiKey
);

export default router;