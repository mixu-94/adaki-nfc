// src/utils/validation.ts
import { SumMessage } from '../types/nfc.types';
import logger from './logger';

/**
 * Validates a SUM message with enhanced type checking and logging
 * @param sumMessage - The SUM message to validate
 * @returns boolean indicating if the message is valid
 */
export function validateSumMessage(sumMessage: any): sumMessage is SumMessage {
    // Log validation attempt with safety checks
    logger.debug('[utils/validation.ts] Validating SUM message', {
        inputType: typeof sumMessage,
        inputExists: !!sumMessage
    });

    // Comprehensive object type validation
    if (!sumMessage || typeof sumMessage !== 'object' || Array.isArray(sumMessage)) {
        logger.warn('[utils/validation.ts] Invalid SUM message: Not an object', {
            receivedType: typeof sumMessage
        });
        return false;
    }

    // Type validation for tag type
    if (!sumMessage.type || typeof sumMessage.type !== 'string') {
        logger.warn('[utils/validation.ts] Invalid tag type', {
            type: sumMessage.type
        });
        return false;
    }

    // Data validation with enhanced checks
    if (!sumMessage.data || typeof sumMessage.data !== 'string') {
        logger.warn('[utils/validation.ts] Invalid tag data', {
            dataType: typeof sumMessage.data
        });
        return false;
    }

    // Optional signature validation
    if (sumMessage.signature !== undefined && typeof sumMessage.signature !== 'string') {
        logger.warn('[utils/validation.ts] Invalid signature type', {
            signatureType: typeof sumMessage.signature
        });
        return false;
    }

    return true;
}

/**
 * Validates an API key format
 * @param apiKey - API key to validate
 * @returns boolean indicating if the format is valid
 */
export function validateApiKeyFormat(apiKey: any): boolean {
    return typeof apiKey === 'string' && apiKey.length >= 20;
}

/**
 * Validates a URL string
 * @param url - URL to validate
 * @returns boolean indicating if the URL is valid
 */
export function validateUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        // Check that the URL has a valid protocol
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (error) {
        logger.warn('[utils/validation.ts] Invalid URL format', {
            url: url.substring(0, 30) + (url.length > 30 ? '...' : '')
        });
        return false;
    }
}

/**
 * Validates geolocation data
 * @param geoLocation - Geolocation data to validate
 * @returns boolean indicating if the geolocation data is valid
 */
export function validateGeoLocation(geoLocation: any): boolean {
    if (!geoLocation || typeof geoLocation !== 'object' || Array.isArray(geoLocation)) {
        logger.warn('[utils/validation.ts] Invalid geolocation data: Not an object');
        return false;
    }

    const { latitude, longitude } = geoLocation;

    // Check if latitude is valid (-90 to 90)
    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
        logger.warn('[utils/validation.ts] Invalid latitude value', { latitude });
        return false;
    }

    // Check if longitude is valid (-180 to 180)
    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
        logger.warn('[utils/validation.ts] Invalid longitude value', { longitude });
        return false;
    }

    return true;
}