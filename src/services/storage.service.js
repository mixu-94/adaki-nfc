import supabase from '../config/supabase.js';
import logger from '../utils/logger.js';

class StorageService {
    /**
     * Logs a verification attempt to Supabase
     * @param {object} result - The verification result
     * @param {string} [ipAddress] - Optional IP address of the client
     * @param {string} [userAgent] - Optional user agent of the client
     * @param {object} [geolocation] - Optional geolocation data
     */
    async logVerification(
        result,
        ipAddress,
        userAgent,
        geolocation = {}
    ) {
        try {
            // Log the verification attempt
            const { error: verificationError } = await supabase
                .from('verifications')
                .insert({
                    tag_id: result.tagId,
                    success: result.isValid,
                    metadata: result.metadata || {},
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    geolocation: geolocation
                });

            if (verificationError) {
                throw verificationError;
            }

            // If verification was successful, update the tags table
            if (result.isValid) {
                // Check if tag exists
                const { data: existingTag } = await supabase
                    .from('tags')
                    .select('*')
                    .eq('tag_id', result.tagId)
                    .single();

                if (existingTag) {
                    // Update existing tag
                    await supabase
                        .from('tags')
                        .update({
                            last_verified_at: new Date().toISOString(),
                            verification_count: existingTag.verification_count + 1
                        })
                        .eq('tag_id', result.tagId);
                } else {
                    // Insert new tag with redirect URL
                    await supabase
                        .from('tags')
                        .insert({
                            tag_id: result.tagId,
                            first_verified_at: new Date().toISOString(),
                            last_verified_at: new Date().toISOString(),
                            verification_count: 1,
                            redirect_url: result.redirectUrl
                        });
                }
            }

            logger.info('Verification logged successfully', {
                tagId: result.tagId,
                success: result.isValid
            });
        } catch (error) {
            logger.error('Error logging verification to Supabase', {
                error: error.message,
                tagId: result.tagId
            });
            // We don't want to fail the verification if logging fails
            // Just log the error and continue
        }
    }

    /**
     * Get the redirect URL for a tag
     * @param {string} tagId - The ID of the tag
     * @returns {string|null} The redirect URL or null if not found
     */
    async getRedirectUrl(tagId) {
        try {
            const { data, error } = await supabase
                .from('tags')
                .select('redirect_url')
                .eq('tag_id', tagId)
                .eq('is_active', true)
                .single();

            if (error || !data) {
                return null;
            }

            return data.redirect_url;
        } catch (error) {
            logger.error('Error getting redirect URL', { error, tagId });
            return null;
        }
    }
}

export default new StorageService();