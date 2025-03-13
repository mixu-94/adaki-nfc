// src/tests/integration/routes/nfc.routes.test.ts
import request from 'supertest';
import app from '../../../app';
import authService from '../../../services/auth.service';
import nfcService from '../../../services/nfc.service';
import { AuthenticationError } from '../../../types/auth.types';
import { NfcVerificationError } from '../../../types/nfc.types';

// Mock dependencies
jest.mock('../../../services/auth.service');
jest.mock('../../../services/nfc.service');

describe('NFC Routes', () => {
    let mockApiKey: string;

    beforeEach(() => {
        // Setup mock API key
        mockApiKey = 'test-api-key-12345678901234567890';

        // Mock authentication service
        (authService.validateApiKey as jest.Mock).mockResolvedValue({
            id: 'test-id',
            name: 'Test API Key',
            key: mockApiKey,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Future expiration
        });

        // Mock NFC service
        (nfcService.verifyNfcTag as jest.Mock).mockImplementation((sumMessage) => {
            // NTAG 424 DNA standard tag scenario
            if (sumMessage.type === 'tag' && sumMessage.data.includes('EF963FF7')) {
                return Promise.resolve({
                    isValid: true,
                    tagId: 'ntag424-ef963ff7',
                    timestamp: new Date(),
                    metadata: {
                        tagType: 'NTAG 424 DNA',
                        scanMethod: 'SDMMAC',
                        readCounter: 42,
                        redirectUrl: 'https://example.com/campaign/special-offer'
                    }
                });
            }

            // TagTamper scenario
            if (sumMessage.type === 'tagtt' && sumMessage.data.includes('FDD387BF')) {
                return Promise.resolve({
                    isValid: true,
                    tagId: 'tamper-fdd387bf',
                    timestamp: new Date(),
                    metadata: {
                        tagType: 'NTAG 424 DNA TagTamper',
                        tamperStatus: 'intact',
                        encryptionMethod: 'SDMMAC + SDMFileData',
                        redirectUrl: 'https://example.com/tamper-proof'
                    }
                });
            }

            // Invalid tag
            return Promise.reject(new NfcVerificationError('Verification failed'));
        });

        // Mock tag statistics
        (nfcService.getTagStatistics as jest.Mock).mockImplementation((tagId) => {
            if (tagId === 'ntag424-ef963ff7') {
                return Promise.resolve({
                    tag_id: 'ntag424-ef963ff7',
                    first_verified_at: new Date().toISOString(),
                    last_verified_at: new Date().toISOString(),
                    verification_count: 42,
                    redirect_url: 'https://example.com/campaign/special-offer',
                    is_active: true
                });
            }

            return Promise.resolve(null);
        });

        // Mock tag configuration update
        (nfcService.updateTagConfiguration as jest.Mock).mockImplementation((tagId, config) => {
            if (tagId === 'ntag424-ef963ff7') {
                return Promise.resolve({
                    tag_id: 'ntag424-ef963ff7',
                    first_verified_at: new Date().toISOString(),
                    last_verified_at: new Date().toISOString(),
                    verification_count: 42,
                    redirect_url: config.redirectUrl || 'https://example.com/campaign/special-offer',
                    is_active: config.isActive !== undefined ? config.isActive : true,
                    updated_at: new Date().toISOString()
                });
            }

            return Promise.resolve(null);
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/nfc/verify', () => {
        it('should successfully verify a valid NTAG 424 DNA tag', async () => {
            const sumMessage = {
                type: 'tag',
                data: 'picc_data=EF963FF7828658A599F3041510671E88&cmac=94EED9EE65337086'
            };

            const response = await request(app)
                .post('/api/nfc/verify')
                .set('X-API-Key', mockApiKey)
                .send({ sumMessage });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.tagId).toBe('ntag424-ef963ff7');
            expect(response.body.data.metadata.tagType).toBe('NTAG 424 DNA');
            expect(response.body.data.redirectUrl).toBe('https://example.com/campaign/special-offer');
        });

        it('should successfully handle a TagTamper NFC tag', async () => {
            const sumMessage = {
                type: 'tagtt',
                data: 'picc_data=FDD387BF32A33A7C40CF259675B3A1E2&enc=EA050C282D8E9043E28F7A17146D697&cmac=7581101821345EC9'
            };

            const response = await request(app)
                .post('/api/nfc/verify')
                .set('X-API-Key', mockApiKey)
                .send({ sumMessage });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.tagId).toBe('tamper-fdd387bf');
            expect(response.body.data.metadata.tagType).toBe('NTAG 424 DNA TagTamper');
            expect(response.body.data.redirectUrl).toBe('https://example.com/tamper-proof');
        });

        it('should return 400 for invalid SUM message format', async () => {
            const invalidSumMessage = {
                type: 123,  // Invalid type
                data: null
            };

            const response = await request(app)
                .post('/api/nfc/verify')
                .set('X-API-Key', mockApiKey)
                .send({ sumMessage: invalidSumMessage });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_FORMAT');
        });

        it('should return 401 when no API key is provided', async () => {
            const sumMessage = {
                type: 'tag',
                data: 'test-data'
            };

            const response = await request(app)
                .post('/api/nfc/verify')
                .send({ sumMessage });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_API_KEY');
        });

        it('should accept and process geolocation data', async () => {
            const sumMessage = {
                type: 'tag',
                data: 'picc_data=EF963FF7828658A599F3041510671E88&cmac=94EED9EE65337086'
            };

            const geoLocation = {
                latitude: 48.8566,
                longitude: 2.3522
            };

            const response = await request(app)
                .post('/api/nfc/verify')
                .set('X-API-Key', mockApiKey)
                .send({ sumMessage, geoLocation });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(nfcService.verifyNfcTag).toHaveBeenCalledWith(
                sumMessage,
                expect.any(String),
                expect.any(String),
                geoLocation
            );
        });
    });

    describe('GET /api/nfc/stats/:tagId', () => {
        it('should return statistics for a valid tag', async () => {
            const response = await request(app)
                .get('/api/nfc/stats/ntag424-ef963ff7')
                .set('X-API-Key', mockApiKey);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.tag_id).toBe('ntag424-ef963ff7');
            expect(response.body.data.verification_count).toBe(42);
        });

        it('should return 404 for non-existent tag', async () => {
            const response = await request(app)
                .get('/api/nfc/stats/nonexistent-tag')
                .set('X-API-Key', mockApiKey);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('TAG_NOT_FOUND');
        });
    });

    describe('PUT /api/nfc/config/:tagId', () => {
        it('should update tag configuration', async () => {
            const newConfig = {
                redirectUrl: 'https://example.com/new-campaign',
                isActive: true
            };

            const response = await request(app)
                .put('/api/nfc/config/ntag424-ef963ff7')
                .set('X-API-Key', mockApiKey)
                .send(newConfig);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.redirect_url).toBe(newConfig.redirectUrl);
            expect(response.body.data.is_active).toBe(newConfig.isActive);
        });

        it('should return 404 for non-existent tag', async () => {
            const response = await request(app)
                .put('/api/nfc/config/nonexistent-tag')
                .set('X-API-Key', mockApiKey)
                .send({ redirectUrl: 'https://example.com' });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('TAG_NOT_FOUND');
        });

        it('should validate redirect URL format', async () => {
            const response = await request(app)
                .put('/api/nfc/config/ntag424-ef963ff7')
                .set('X-API-Key', mockApiKey)
                .send({ redirectUrl: 'invalid-url' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_REDIRECT_URL');
        });
    });
});