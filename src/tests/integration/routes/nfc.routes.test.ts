import request from 'supertest';
import app from '../../../app';
import authService from '../../../services/auth.service';
import nfcService from '../../../services/nfc.service';

// Mock dependencies
jest.mock('../../../services/auth.service');
jest.mock('../../../services/nfc.service');

describe('NFC Routes', () => {
    let mockApiKey: string;

    beforeEach(() => {
        // Setup mocks
        mockApiKey = 'test-api-key-12345678901234567890';

        // Mock auth service
        (authService.validateApiKey as jest.Mock).mockResolvedValue({
            id: 'test-id',
            name: 'Test API Key',
            key: mockApiKey,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        // Mock NFC service
        (nfcService.verifyNfcTag as jest.Mock).mockResolvedValue({
            isValid: true,
            tagId: 'test-tag-id',
            timestamp: new Date(),
            metadata: { test: 'data' },
        });

        (nfcService.getTagStatistics as jest.Mock).mockResolvedValue({
            tag_id: 'test-tag-id',
            first_verified_at: new Date().toISOString(),
            last_verified_at: new Date().toISOString(),
            verification_count: 5,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/nfc/verify', () => {
        it('should return 401 when no API key is provided', async () => {
            const response = await request(app)
                .post('/api/nfc/verify')
                .send({ sumMessage: { type: 'test', data: 'test-data' } });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_API_KEY');
        });

        it('should return 400 when sumMessage is invalid', async () => {
            const response = await request(app)
                .post('/api/nfc/verify')
                .set('X-API-Key', mockApiKey)
                .send({ sumMessage: { type: 123 } });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_FORMAT');
        });

        it('should return 200 and verification result for valid request', async () => {
            const response = await request(app)
                .post('/api/nfc/verify')
                .set('X-API-Key', mockApiKey)
                .send({ sumMessage: { type: 'test', data: 'test-data' } });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.tagId).toBe('test-tag-id');
            expect(response.body.data.isValid).toBe(true);
            expect(response.body.data.metadata).toEqual({ test: 'data' });
            expect(nfcService.verifyNfcTag).toHaveBeenCalledWith(
                { type: 'test', data: 'test-data' },
                expect.any(String),
                undefined
            );
        });
    });

    describe('GET /api/nfc/stats/:tagId', () => {
        it('should return 401 when no API key is provided', async () => {
            const response = await request(app)
                .get('/api/nfc/stats/test-tag-id');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_API_KEY');
        });

        it('should return 200 and tag statistics for valid request', async () => {
            const response = await request(app)
                .get('/api/nfc/stats/test-tag-id')
                .set('X-API-Key', mockApiKey);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.tag_id).toBe('test-tag-id');
            expect(response.body.data.verification_count).toBe(5);
            expect(nfcService.getTagStatistics).toHaveBeenCalledWith('test-tag-id');
        });

        it('should return 404 when tag is not found', async () => {
            (nfcService.getTagStatistics as jest.Mock).mockResolvedValueOnce(null);

            const response = await request(app)
                .get('/api/nfc/stats/nonexistent-tag')
                .set('X-API-Key', mockApiKey);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('TAG_NOT_FOUND');
        });
    });
});