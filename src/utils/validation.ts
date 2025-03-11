import { SumMessage } from '../types/nfc.types';
import logger from './logger';

/**
 * Validates a SUM message
 * @param sumMessage - The SUM message to validate
 * @returns boolean indicating if the message is valid
 */
export function validateSumMessage(sumMessage: any): sumMessage is SumMessage {
    // Log validation attempt
    logger.debug('[utils/validation.ts] Validating SUM message');

    // Check if sumMessage is an object
    if (!sumMessage || typeof sumMessage !== 'object') {
        logger.warn('[utils/validation.ts] SUM message is not an object');
        return false;
    }

    // Check required fields
    if (!sumMessage.type || typeof sumMessage.type !== 'string') {
        logger.warn('[utils/validation.ts] SUM message type is missing or invalid');
        return false;
    }

    if (!sumMessage.data || typeof sumMessage.data !== 'string') {
        logger.warn('[utils/validation.ts] SUM message data is missing or invalid');
        return false;
    }

    // If signature is present, it must be a string
    if (sumMessage.signature && typeof sumMessage.signature !== 'string') {
        logger.warn('[utils/validation.ts] SUM message signature is invalid');
        return false;
    }

    // Additional validation logic can be added here based on specific SUM message format

    return true;
}

/**
 * Validates an API key format (simple format check, not auth check)
 * @param apiKey - API key to validate
 * @returns boolean indicating if the format is valid
 */
export function validateApiKeyFormat(apiKey: any): boolean {
    // Simple format validation
    return typeof apiKey === 'string' && apiKey.length >= 20;
}