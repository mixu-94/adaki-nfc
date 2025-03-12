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
        // Setup comprehensive API key mock
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

        // Advanced NFC service mock with detailed scenario handling
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
                        readCounter: 42
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
                        encryptionMethod: 'SDMMAC + SDMFileData'
                    }
                });
            }

            // Fallback error handling
            return Promise.reject(new NfcVerificationError('Verification failed'));
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

            console.log('NTAG 424 DNA Verification Response:', response.body);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.tagId).toBe('ntag424-ef963ff7');
            expect(response.body.data.metadata.tagType).toBe('NTAG 424 DNA');
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

            console.log('TagTamper Verification Response:', response.body);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.tagId).toBe('tamper-fdd387bf');
            expect(response.body.data.metadata.tagType).toBe('NTAG 424 DNA TagTamper');
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
    });
});