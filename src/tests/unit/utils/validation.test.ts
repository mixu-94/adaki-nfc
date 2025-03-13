// src/tests/unit/utils/validation.test.ts
import { validateSumMessage, validateApiKeyFormat, validateUrl, validateGeoLocation } from '../../../utils/validation';

describe('Validation Utilities', () => {
    describe('validateSumMessage', () => {
        it('should return false for null input', () => {
            expect(validateSumMessage(null)).toBe(false);
        });

        it('should return false for non-object input', () => {
            expect(validateSumMessage('string')).toBe(false);
            expect(validateSumMessage(123)).toBe(false);
            expect(validateSumMessage([])).toBe(false);
        });

        it('should return false when required fields are missing', () => {
            expect(validateSumMessage({ data: 'test' })).toBe(false);
            expect(validateSumMessage({ type: 'tag' })).toBe(false);
        });

        it('should return false when fields have incorrect types', () => {
            expect(validateSumMessage({ type: 123, data: 'test' })).toBe(false);
            expect(validateSumMessage({ type: 'tag', data: 123 })).toBe(false);
            expect(validateSumMessage({ type: 'tag', data: 'test', signature: 123 })).toBe(false);
        });

        it('should return true for valid SUM message', () => {
            expect(validateSumMessage({ type: 'tag', data: 'test' })).toBe(true);
            expect(validateSumMessage({ type: 'tagtt', data: 'test', signature: 'test' })).toBe(true);
            expect(validateSumMessage({ type: 'tag', data: 'test', extraField: 'extra' })).toBe(true);
        });
    });

    describe('validateApiKeyFormat', () => {
        it('should return false for non-string input', () => {
            expect(validateApiKeyFormat(null)).toBe(false);
            expect(validateApiKeyFormat(123)).toBe(false);
            expect(validateApiKeyFormat({})).toBe(false);
            expect(validateApiKeyFormat([])).toBe(false);
        });

        it('should return false for strings shorter than 20 characters', () => {
            expect(validateApiKeyFormat('short')).toBe(false);
            expect(validateApiKeyFormat('123456789012345678')).toBe(false);
        });

        it('should return true for strings 20 characters or longer', () => {
            expect(validateApiKeyFormat('12345678901234567890')).toBe(true);
            expect(validateApiKeyFormat('very-long-api-key-that-is-valid')).toBe(true);
        });
    });

    describe('validateUrl', () => {
        it('should return false for invalid URLs', () => {
            expect(validateUrl('not-a-url')).toBe(false);
            expect(validateUrl('http://')).toBe(false);
            expect(validateUrl('ftp:/example.com')).toBe(false);
        });

        it('should return true for valid URLs', () => {
            expect(validateUrl('https://example.com')).toBe(true);
            expect(validateUrl('http://localhost:3000')).toBe(true);
            expect(validateUrl('https://example.com/path?query=value')).toBe(true);
        });
    });

    describe('validateGeoLocation', () => {
        it('should return false for non-object input', () => {
            expect(validateGeoLocation(null)).toBe(false);
            expect(validateGeoLocation('string')).toBe(false);
            expect(validateGeoLocation(123)).toBe(false);
        });

        it('should return false for missing or invalid latitude/longitude', () => {
            expect(validateGeoLocation({})).toBe(false);
            expect(validateGeoLocation({ latitude: 'invalid' })).toBe(false);
            expect(validateGeoLocation({ longitude: 100 })).toBe(false);
            expect(validateGeoLocation({ latitude: -100, longitude: 100 })).toBe(false);
            expect(validateGeoLocation({ latitude: 50, longitude: 200 })).toBe(false);
        });

        it('should return true for valid geolocation', () => {
            expect(validateGeoLocation({ latitude: 0, longitude: 0 })).toBe(true);
            expect(validateGeoLocation({ latitude: 90, longitude: 180 })).toBe(true);
            expect(validateGeoLocation({ latitude: -90, longitude: -180 })).toBe(true);
            expect(validateGeoLocation({ latitude: 45.5, longitude: -122.6 })).toBe(true);
        });
    });
});

// import { validateSumMessage, validateApiKeyFormat } from '../../../utils/validation';

// describe('Validation Utilities', () => {
//     describe('validateSumMessage', () => {
//         it('should return false for null input', () => {
//             expect(validateSumMessage(null)).toBe(false);
//         });

//         it('should return false for non-object input', () => {
//             expect(validateSumMessage('string')).toBe(false);
//             expect(validateSumMessage(123)).toBe(false);
//             expect(validateSumMessage([])).toBe(false);
//         });

//         it('should return false when required fields are missing', () => {
//             expect(validateSumMessage({ data: 'test' })).toBe(false);
//             expect(validateSumMessage({ type: 'tag' })).toBe(false);
//         });

//         it('should return false when fields have incorrect types', () => {
//             expect(validateSumMessage({ type: 123, data: 'test' })).toBe(false);
//             expect(validateSumMessage({ type: 'tag', data: 123 })).toBe(false);
//             expect(validateSumMessage({ type: 'tag', data: 'test', signature: 123 })).toBe(false);
//         });

//         it('should return true for valid SUM message', () => {
//             // Updated to use valid tag types
//             expect(validateSumMessage({ type: 'tag', data: 'test' })).toBe(true);
//             expect(validateSumMessage({ type: 'tagtt', data: 'test', signature: 'test' })).toBe(true);
//             expect(validateSumMessage({ type: 'tag', data: 'test', extraField: 'extra' })).toBe(true);
//         });
//     });

//     describe('validateApiKeyFormat', () => {
//         it('should return false for non-string input', () => {
//             expect(validateApiKeyFormat(null)).toBe(false);
//             expect(validateApiKeyFormat(123)).toBe(false);
//             expect(validateApiKeyFormat({})).toBe(false);
//             expect(validateApiKeyFormat([])).toBe(false);
//         });

//         it('should return false for strings shorter than 20 characters', () => {
//             expect(validateApiKeyFormat('short')).toBe(false);
//             expect(validateApiKeyFormat('123456789012345678')).toBe(false);
//         });

//         it('should return true for strings 20 characters or longer', () => {
//             expect(validateApiKeyFormat('12345678901234567890')).toBe(true);
//             expect(validateApiKeyFormat('very-long-api-key-that-is-valid')).toBe(true);
//         });
//     });
// });