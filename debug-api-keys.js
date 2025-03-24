// debug-api-keys.js
import supabase from './src/config/supabase.js';
import logger from './src/utils/logger.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test API key
const TEST_API_KEY = '6a93b0c5f7d84e47b4c32a8e9f128b6c';

async function debugApiKeys() {
    try {
        logger.info('Starting API key debugging');

        // 1. First try: query with explicit schema name
        logger.info('Attempting to query with explicit schema name (nfc_verify.api_keys)');
        const { data: explicitSchemaData, error: explicitSchemaError } = await supabase
            .schema("nfc_verify")
            .from('api_keys')
            .select('*')
            .eq('key', TEST_API_KEY);

        if (explicitSchemaError) {
            logger.error('Error with explicit schema query:', explicitSchemaError);
        } else {
            logger.info(`Explicit schema query results: ${JSON.stringify(explicitSchemaData)}`);
        }

        // 2. Second try: query without schema name
        logger.info('Attempting to query without schema name (api_keys)');
        const { data: plainData, error: plainError } = await supabase
            .schema("nfc_verify")
            .from('api_keys')
            .select('*')
            .eq('key', TEST_API_KEY);

        if (plainError) {
            logger.error('Error with plain table query:', plainError);
        } else {
            logger.info(`Plain table query results: ${JSON.stringify(plainData)}`);
        }

        // 3. List all tables to see what's actually available
        logger.info('Listing all available tables in the database');
        const { data: tables, error: tablesError } = await supabase
            .rpc('list_tables');

        if (tablesError) {
            logger.error('Error listing tables:', tablesError);
        } else {
            logger.info(`Available tables: ${JSON.stringify(tables)}`);
        }

        // 4. Insert the test API key (if not exists)
        logger.info('Attempting to insert test API key (if not exists)');
        const { data: insertData, error: insertError } = await supabase
            .schema("nfc_verify")
            .from('api_keys')
            .upsert([
                {
                    name: 'TestKey',
                    key: TEST_API_KEY,
                    is_active: true
                }
            ], { onConflict: 'key' });

        if (insertError) {
            logger.error('Error inserting test API key:', insertError);
        } else {
            logger.info('Test API key inserted or updated successfully');
        }

        logger.info('API key debugging completed');
    } catch (error) {
        logger.error('Unexpected error during debugging:', error);
    }
}

// Run the debugging function
debugApiKeys();