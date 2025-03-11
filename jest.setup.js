// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.SDM_BACKEND_URL = 'http://localhost:3001';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';

// Mock implementations can be added here