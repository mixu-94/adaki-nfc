// src/utils/validation.ts
import { SumMessage } from '../types/nfc.types';
import logger from './logger';

/**
 * Validates a SUM message
 * @param sumMessage - The SUM message to validate
 * @returns boolean indicating if the message is valid
 */
export function validateSumMessage(sumMessage: any): sumMessage is SumMessage {
    // Log validation attempt
    logger.debug('[utils/validation.ts] Validating SUM message', {
        inputType: typeof sumMessage,
        inputExists: !!sumMessage
    });

    // Basic object type validation
    if (!sumMessage || typeof sumMessage !== 'object' || Array.isArray(sumMessage)) {
        logger.warn('[utils/validation.ts] Invalid SUM message: Not an object', {
            receivedType: typeof sumMessage
        });
        return false;
    }

    // Type validation
    if (!sumMessage.type || typeof sumMessage.type !== 'string') {
        logger.warn('[utils/validation.ts] Invalid tag type', {
            type: sumMessage.type
        });
        return false;
    }

    // Data validation
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
        // Use URL constructor to validate URL format
        new URL(url);
        return true;
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
// // src/utils/validation.ts
// import { SumMessage } from '../types/nfc.types';
// import logger from './logger';

// /**
//  * Validates a SUM message
//  * @param sumMessage - The SUM message to validate
//  * @returns boolean indicating if the message is valid
//  */
// export function validateSumMessage(sumMessage: any): sumMessage is SumMessage {
//     // Log validation attempt
//     logger.debug('[utils/validation.ts] Validating SUM message', {
//         inputType: typeof sumMessage,
//         inputExists: !!sumMessage
//     });

//     // Basic object type validation
//     if (!sumMessage || typeof sumMessage !== 'object' || Array.isArray(sumMessage)) {
//         logger.warn('[utils/validation.ts] Invalid SUM message: Not an object', {
//             receivedType: typeof sumMessage
//         });
//         return false;
//     }

//     // Type validation
//     if (!sumMessage.type || typeof sumMessage.type !== 'string') {
//         logger.warn('[utils/validation.ts] Invalid tag type', {
//             type: sumMessage.type
//         });
//         return false;
//     }

//     // Data validation
//     if (!sumMessage.data || typeof sumMessage.data !== 'string') {
//         logger.warn('[utils/validation.ts] Invalid tag data', {
//             dataType: typeof sumMessage.data
//         });
//         return false;
//     }

//     // Optional signature validation
//     if (sumMessage.signature !== undefined && typeof sumMessage.signature !== 'string') {
//         logger.warn('[utils/validation.ts] Invalid signature type', {
//             signatureType: typeof sumMessage.signature
//         });
//         return false;
//     }

//     return true;
// }

// /**
//  * Validates an API key format
//  * @param apiKey - API key to validate
//  * @returns boolean indicating if the format is valid
//  */
// export function validateApiKeyFormat(apiKey: any): boolean {
//     return typeof apiKey === 'string' && apiKey.length >= 20;
// }

// /**
//  * Validates a URL string
//  * @param url - URL to validate
//  * @returns boolean indicating if the URL is valid
//  */
// export function validateUrl(url: string): boolean {
//     try {
//         // Use URL constructor to validate URL format
//         new URL(url);
//         return true;
//     } catch (error) {
//         return false;
//     }
// }

// /**
//  * Validates geolocation data
//  * @param geoLocation - Geolocation data to validate
//  * @returns boolean indicating if the geolocation data is valid
//  */
// export function validateGeoLocation(geoLocation: any): boolean {
//     if (!geoLocation || typeof geoLocation !== 'object') {
//         return false;
//     }

//     const { latitude, longitude } = geoLocation;

//     // Check if latitude is valid (-90 to 90)
//     if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
//         return false;
//     }

//     // Check if longitude is valid (-180 to 180)
//     if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
//         return false;
//     }

//     return true;
// }


// import { SumMessage } from '../types/nfc.types';
// import logger from './logger';

// /**
//  * Validates a SUM message with enhanced type checking and logging
//  * @param sumMessage - The SUM message to validate
//  * @returns boolean indicating if the message is valid
//  */
// export function validateSumMessage(sumMessage: any): sumMessage is SumMessage {
//     // Log validation attempt with safety checks
//     logger.debug('[utils/validation.ts] Validating SUM message', {
//         inputType: typeof sumMessage,
//         inputExists: !!sumMessage
//     });

//     // Comprehensive object type validation
//     if (!sumMessage || typeof sumMessage !== 'object' || Array.isArray(sumMessage)) {
//         logger.warn('[utils/validation.ts] Invalid SUM message: Not an object', {
//             receivedType: typeof sumMessage
//         });
//         return false;
//     }

//     // Type validation for tag type
//     if (!sumMessage.type || typeof sumMessage.type !== 'string') {
//         logger.warn('[utils/validation.ts] Invalid tag type', {
//             type: sumMessage.type
//         });
//         return false;
//     }

//     // Data validation with enhanced checks
//     if (!sumMessage.data || typeof sumMessage.data !== 'string') {
//         logger.warn('[utils/validation.ts] Invalid tag data', {
//             dataType: typeof sumMessage.data
//         });
//         return false;
//     }

//     // Optional signature validation
//     if (sumMessage.signature !== undefined && typeof sumMessage.signature !== 'string') {
//         logger.warn('[utils/validation.ts] Invalid signature type', {
//             signatureType: typeof sumMessage.signature
//         });
//         return false;
//     }

//     // Additional specific validation for common tag types
//     const validTagTypes = ['tag', 'tagtt'];
//     if (!validTagTypes.includes(sumMessage.type)) {
//         logger.warn('[utils/validation.ts] Unrecognized tag type', {
//             providedType: sumMessage.type
//         });
//         return false;
//     }

//     return true;
// }

// /**
//  * Validates an API key format with more robust checks
//  * @param apiKey - API key to validate
//  * @returns boolean indicating if the format is valid
//  */
// export function validateApiKeyFormat(apiKey: any): boolean {
//     // Enhanced format validation
//     const isValidApiKey = typeof apiKey === 'string'
//         && apiKey.length >= 20
//         && apiKey.trim().length === apiKey.length;

//     if (!isValidApiKey) {
//         logger.warn('[utils/validation.ts] Invalid API key format', {
//             keyType: typeof apiKey,
//             keyLength: apiKey ? apiKey.length : 'N/A'
//         });
//     }

//     return isValidApiKey;
// }