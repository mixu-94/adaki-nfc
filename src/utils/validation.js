/**
 * Validates a SUM message
 * @param {object} data - The data to validate
 * @returns {boolean} True if the data is a valid SUM message
 */
export function validateSumMessage(data) {
    if (!data || typeof data !== 'object') return false;

    // Check required fields
    if (!data.id || typeof data.id !== 'string' || data.id.length < 1) return false;
    if (!data.data || typeof data.data !== 'string' || data.data.length < 1) return false;

    // Signature is optional
    if (data.signature !== undefined && typeof data.signature !== 'string') return false;

    return true;
}