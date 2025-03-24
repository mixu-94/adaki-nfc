import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    logger.error('Supabase URL or key is missing from environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;