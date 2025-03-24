// NFC/SUM message related types
export interface SumMessage {
    id: string;
    data: string;
    signature?: string;
    [key: string]: any; // For any additional fields in the SUM message
}

export interface VerificationResult {
    isValid: boolean;
    tagId: string;
    timestamp: Date;
    redirectUrl?: string;
    metadata?: Record<string, any>;
}

// Error types
export class NfcVerificationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NfcVerificationError';
    }
}

// API key type (for extending Express Request)
export interface ApiKey {
    id: string;
    name: string;
    key: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    expires_at: string | null;
}

// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            apiKey?: ApiKey;
        }
    }
}