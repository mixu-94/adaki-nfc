import { validateSumMessage, validateApiKeyFormat } from '../../../utils/validation';

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
            expect(validateSumMessage({ type: 'test' })).toBe(false);
        });

        it('should return false when fields have incorrect types', () => {
            expect(validateSumMessage({ type: 123, data: 'test' })).toBe(false);
            expect(validateSumMessage({ type: 'test', data: 123 })).toBe(false);
            expect(validateSumMessage({ type: 'test', data: 'test', signature: 123 })).toBe(false);
        });

        it('should return true for valid SUM message', () => {
            expect(validateSumMessage({ type: 'test', data: 'test' })).toBe(true);
            expect(validateSumMessage({ type: 'test', data: 'test', signature: 'test' })).toBe(true);
            expect(validateSumMessage({ type: 'test', data: 'test', extraField: 'extra' })).toBe(true);
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
});