import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Validate required environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    logger.error('[config/supabase.ts] Missing Supabase environment variables');
    throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY');
}

// Create and export Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// Test connection
(async () => {
    if (process.env.NODE_ENV !== 'test') {
        try {
            const { data, error } = await supabase.from('api_keys').select('count', { count: 'exact' });
            if (error) throw error;
            logger.info('[config/supabase.ts] Supabase connection successful');
        } catch (error) {
            logger.error('[config/supabase.ts] Supabase connection failed', { error });
        }
    }
})();

export default supabase;