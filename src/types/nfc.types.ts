/**
 * Represents a SUM message from an NFC tag
 */
export interface SumMessage {
    type: string;
    data: string;
    signature?: string;
    [key: string]: any;
}

/**
 * Represents the result of verifying an NFC tag
 */
export interface VerificationResult {
    isValid: boolean;
    tagId: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}

/**
 * Error thrown when NFC verification fails
 */
export class NfcVerificationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NfcVerificationError';
    }
}

/**
 * Represents a record in the verifications table
 */
export interface VerificationRecord {
    id?: string;
    tag_id: string;
    success: boolean;
    metadata?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    created_at?: string;
}

/**
 * Represents a record in the tags table
 */
export interface TagRecord {
    id?: string;
    tag_id: string;
    first_verified_at: string;
    last_verified_at: string;
    verification_count: number;
}