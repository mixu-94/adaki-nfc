import { VerificationResult, VerificationRecord, TagRecord } from '../types/nfc.types';
import supabase from '../config/supabase';
import logger from '../utils/logger';

export class StorageService {
    /**
     * 📊 Logs a verification attempt to Supabase
     * @param result - The verification result
     * @param ipAddress - Optional IP address of the client
     * @param userAgent - Optional user agent of the client
     * @returns Promise that resolves when logging is complete
     */
    async logVerification(
        result: VerificationResult,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        try {
            logger.info('[services/storage.service.ts] Logging verification attempt', {
                tagId: result.tagId,
                success: result.isValid,
            });

            // Create verification record
            const verificationRecord: VerificationRecord = {
                tag_id: result.tagId,
                success: result.isValid,
                metadata: result.metadata || {},
                ip_address: ipAddress,
                user_agent: userAgent,
            };

            // Log the verification attempt
            const { error: verificationError } = await supabase.schema("nfc_verify")
                .from('verifications')
                .insert(verificationRecord);

            if (verificationError) {
                throw verificationError;
            }

            // If verification was successful, update the tags table
            if (result.isValid) {
                await this.updateTagRecord(result.tagId);
            }

            logger.info('[services/storage.service.ts] Verification logged successfully', {
                tagId: result.tagId,
                success: result.isValid,
            });
        } catch (error) {
            logger.error('[services/storage.service.ts] Error logging verification', { error });
            // We don't want to fail the verification if logging fails
            // Just log the error and continue
        }
    }

    /**
     * Updates a tag record in the database or creates a new one if it doesn't exist
     * @param tagId - ID of the tag to update
     * @private
     */
    private async updateTagRecord(tagId: string): Promise<void> {
        try {
            // Check if tag exists
            const { data: existingTag, error: queryError } = await supabase
                .from('nfc_verify.tags')
                .select('*')
                .eq('tag_id', tagId)
                .single();

            if (queryError && queryError.code !== 'PGRST116') { // PGRST116 = No rows found
                throw queryError;
            }

            if (existingTag) {
                // Update existing tag
                const { error: updateError } = await supabase
                    .from('nfc_verify.tags')
                    .update({
                        last_verified_at: new Date().toISOString(),
                        verification_count: existingTag.verification_count + 1,
                    })
                    .eq('tag_id', tagId);

                if (updateError) {
                    throw updateError;
                }
            } else {
                // Insert new tag
                const newTag: TagRecord = {
                    tag_id: tagId,
                    first_verified_at: new Date().toISOString(),
                    last_verified_at: new Date().toISOString(),
                    verification_count: 1,
                };

                const { error: insertError } = await supabase
                    .from('nfc_verify.tags')
                    .insert(newTag);

                if (insertError) {
                    throw insertError;
                }
            }
        } catch (error) {
            logger.error('[services/storage.service.ts] Error updating tag record', {
                error,
                tagId,
            });
            throw error;
        }
    }

    /**
     * Retrieves verification statistics for a tag
     * @param tagId - ID of the tag
     * @returns Statistics for the tag
     */
    async getTagStatistics(tagId: string): Promise<TagRecord | null> {
        try {
            const { data, error } = await supabase
                .from('nfc_verify.tags')
                .select('*')
                .eq('tag_id', tagId)
                .single();

            if (error) {
                throw error;
            }

            return data;
        } catch (error) {
            logger.error('[services/storage.service.ts] Error retrieving tag statistics', {
                error,
                tagId,
            });
            return null;
        }
    }
}

// Export singleton instance
export default new StorageService();