import { ApiKey, AuthenticationError } from '../types/auth.types';
import supabase from '../config/supabase';
import { generateApiKey } from '../utils/crypto';
import logger from '../utils/logger';

export class AuthService {
    /**
     * Validates an API key against the database
     * @param apiKey - The API key to validate
     * @returns The validated API key record
     * @throws AuthenticationError if validation fails
     */
    async validateApiKey(apiKey: string): Promise<ApiKey> {
        try {
            logger.debug('[services/auth.service.ts] Validating API key');

            // Fetch API key from database
            const { data, error } = await supabase
                .from('api_keys')
                .select('*')
                .eq('key', apiKey)
                .eq('is_active', true)
                .single();

            // Handle database errors
            if (error) {
                logger.warn('[services/auth.service.ts] API key validation failed', {
                    error: error.message,
                });
                throw new AuthenticationError('Invalid API key');
            }

            // Check if key exists
            if (!data) {
                logger.warn('[services/auth.service.ts] API key not found');
                throw new AuthenticationError('Invalid API key');
            }

            // Check if key has expired
            if (data.expires_at && new Date(data.expires_at) < new Date()) {
                logger.warn('[services/auth.service.ts] API key has expired', {
                    keyId: data.id,
                });
                throw new AuthenticationError('API key has expired');
            }

            logger.info('[services/auth.service.ts] API key validated successfully', {
                keyId: data.id,
                keyName: data.name,
            });

            return data;
        } catch (error) {
            if (error instanceof AuthenticationError) {
                throw error;
            }

            logger.error('[services/auth.service.ts] Error validating API key', { error });
            throw new AuthenticationError('Error validating API key');
        }
    }

    /**
     * Creates a new API key
     * @param name - Name for the API key
     * @param expiresAt - Optional expiration date
     * @returns The created API key object
     */
    async createApiKey(name: string, expiresAt?: Date): Promise<{ key: string; id: string }> {
        try {
            // Generate API key
            const key = generateApiKey();

            // Create API key record
            const { data, error } = await supabase
                .from('api_keys')
                .insert({
                    name,
                    key,
                    is_active: true,
                    expires_at: expiresAt?.toISOString(),
                })
                .select('id')
                .single();

            if (error) {
                throw error;
            }

            logger.info('[services/auth.service.ts] New API key created', {
                keyId: data.id,
                keyName: name,
            });

            return {
                key,
                id: data.id,
            };
        } catch (error) {
            logger.error('[services/auth.service.ts] Error creating API key', { error });
            throw new Error('Error creating API key');
        }
    }

    /**
     * Revokes an API key
     * @param id - ID of the API key to revoke
     */
    async revokeApiKey(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('api_keys')
                .update({ is_active: false })
                .eq('id', id);

            if (error) {
                throw error;
            }

            logger.info('[services/auth.service.ts] API key revoked', { keyId: id });
        } catch (error) {
            logger.error('[services/auth.service.ts] Error revoking API key', { error });
            throw new Error('Error revoking API key');
        }
    }
}

// Export singleton instance
export default new AuthService();