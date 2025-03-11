/**
 * Represents an API key record in the database
 */
export interface ApiKey {
    id: string;
    name: string;
    key: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    expires_at?: string;
}

/**
 * Express Request interface extended with API key
 */
declare global {
    namespace Express {
        interface Request {
            apiKey?: ApiKey;
        }
    }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends Error {
    public statusCode: number;

    constructor(message: string, statusCode = 401) {
        super(message);
        this.name = 'AuthenticationError';
        this.statusCode = statusCode;
    }
}