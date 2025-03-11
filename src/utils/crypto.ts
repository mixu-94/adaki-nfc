import crypto from 'crypto';
import logger from './logger';

/**
 * Generates a secure random API key
 * @returns A random API key string
 */
export function generateApiKey(): string {
    try {
        // Generate a random buffer and convert to base64
        const buffer = crypto.randomBytes(32);
        // Convert to base64 and remove non-alphanumeric characters
        const key = buffer.toString('base64').replace(/[^a-zA-Z0-9]/g, '');

        return key;
    } catch (error) {
        logger.error('[utils/crypto.ts] Error generating API key', { error });
        throw new Error('Failed to generate secure API key');
    }
}

/**
 * Hash sensitive data for storage or comparison
 * @param data - Data to hash
 * @returns SHA-256 hash of the data
 */
export function hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Compares two strings in constant time to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns Boolean indicating if strings match
 */
export function secureCompare(a: string, b: string): boolean {
    // Use crypto.timingSafeEqual to prevent timing attacks
    try {
        const bufA = Buffer.from(a);
        const bufB = Buffer.from(b);

        // If lengths are different, pad the shorter one
        // (still return false, but prevents timing attacks)
        if (bufA.length !== bufB.length) {
            const maxLength = Math.max(bufA.length, bufB.length);
            const paddedA = Buffer.alloc(maxLength, 0);
            const paddedB = Buffer.alloc(maxLength, 0);

            bufA.copy(paddedA);
            bufB.copy(paddedB);

            return crypto.timingSafeEqual(paddedA, paddedB);
        }

        return crypto.timingSafeEqual(bufA, bufB);
    } catch (error) {
        logger.error('[utils/crypto.ts] Error comparing strings', { error });
        return false;
    }
}