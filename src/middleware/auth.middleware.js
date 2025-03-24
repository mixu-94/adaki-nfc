import supabase from '../config/supabase.js';
import logger from '../utils/logger.js';
import redis from '../config/redis.js';

// Cache TTL for API keys (10 minutes)
const API_KEY_CACHE_TTL = 60 * 10;

// Schema name - adjust if needed
const SCHEMA_NAME = 'nfc_verify';

/**
 * API key authentication middleware
 */
export async function apiKeyMiddleware(req, res, next) {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey || typeof apiKey !== 'string') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'MISSING_API_KEY',
                    message: 'API key is required'
                },
                timestamp: new Date().toISOString()
            });
        }

        // Log for debugging
        logger.info(`Checking API key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);

        // Check cache first
        const cacheKey = `apikey:${apiKey}`;
        const cachedApiKey = await redis.get(cacheKey);

        if (cachedApiKey) {
            req.apiKey = JSON.parse(cachedApiKey);
            return next();
        }

        // If not in cache, check database
        const { data, error } = await supabase
            .from(`${SCHEMA_NAME}.api_keys`)  // Explicitly use schema name
            .select('*')
            .eq('key', apiKey)
            .eq('is_active', true)
            .single();

        if (error) {
            logger.error('Error querying API key', {
                error: error.message,
                details: error.details,
                code: error.code
            });

            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_API_KEY',
                    message: 'Invalid or inactive API key'
                },
                timestamp: new Date().toISOString()
            });
        }

        if (!data) {
            logger.warn('No API key found for', {
                key: apiKey.substring(0, 4) + '...' // Log only first 4 chars for security
            });

            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_API_KEY',
                    message: 'Invalid or inactive API key'
                },
                timestamp: new Date().toISOString()
            });
        }

        // Check if API key has expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            logger.warn('Expired API key used', {
                key: apiKey.substring(0, 4) + '...'
            });

            return res.status(401).json({
                success: false,
                error: {
                    code: 'EXPIRED_API_KEY',
                    message: 'API key has expired'
                },
                timestamp: new Date().toISOString()
            });
        }

        // Store API key info in request for later use
        req.apiKey = data;

        // Cache valid API key
        await redis.set(cacheKey, JSON.stringify(data), 'EX', API_KEY_CACHE_TTL);

        logger.info('API key validated successfully');
        next();
    } catch (error) {
        logger.error('Error verifying API key', { error: error.message });
        next(error);
    }
}

/**
 * Optional API key middleware
 */
export function apiKeyMiddlewareOptional(req, res, next) {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return next(); // Continue without API key
    }

    // If API key is provided, validate it
    return apiKeyMiddleware(req, res, next);
}