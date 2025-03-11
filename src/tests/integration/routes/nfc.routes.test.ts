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

        // Mock NFC service with default response
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

        it('should verify standard NTAG 424 DNA tag', async () => {
            // Simulate actual NFC tag scan data
            const sumMessage = {
                type: 'tag',
                data: 'picc_data=EF963FF7828658A599F3041510671E88&cmac=94EED9EE65337086'
            };

            // Set specific mock response for this tag
            (nfcService.verifyNfcTag as jest.Mock).mockResolvedValueOnce({
                isValid: true,
                tagId: 'ntag424-ef963ff7',
                timestamp: new Date(),
                metadata: {
                    tagType: 'NTAG 424 DNA',
                    scanMethod: 'SDMMAC',
                    readCounter: 42
                }
            });

            const response = await request(app)
                .post('/api/nfc/verify')
                .set('X-API-Key', mockApiKey)
                .send({ sumMessage });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.tagId).toBe('ntag424-ef963ff7');
            expect(response.body.data.isValid).toBe(true);
            expect(response.body.data.metadata.tagType).toBe('NTAG 424 DNA');
            expect(nfcService.verifyNfcTag).toHaveBeenCalledWith(
                sumMessage,
                expect.any(String),
                undefined
            );
        });

        it('should verify NTAG 424 DNA TagTamper tag', async () => {
            // Simulate TagTamper NFC scan with specific format
            const sumMessage = {
                type: 'tagtt',
                data: 'picc_data=FDD387BF32A33A7C40CF259675B3A1E2&enc=EA050C282D8E9043E28F7A17146D697&cmac=7581101821345EC9'
            };

            // Set specific mock response for TagTamper
            (nfcService.verifyNfcTag as jest.Mock).mockResolvedValueOnce({
                isValid: true,
                tagId: 'tamper-fdd387bf',
                timestamp: new Date(),
                metadata: {
                    tagType: 'NTAG 424 DNA TagTamper',
                    tamperStatus: 'intact',
                    encryptionMethod: 'SDMMAC + SDMFileData'
                }
            });

            const response = await request(app)
                .post('/api/nfc/verify')
                .set('X-API-Key', mockApiKey)
                .send({ sumMessage });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.tagId).toBe('tamper-fdd387bf');
            expect(response.body.data.metadata.tagType).toBe('NTAG 424 DNA TagTamper');
            expect(response.body.data.metadata.tamperStatus).toBe('intact');
        });

        it('should handle tampered NFC tag detection', async () => {
            // Simulate a tampered tag scan
            const sumMessage = {
                type: 'tagtt',
                data: 'picc_data=8EE8E27DE3974FFE245F96C71087129B&enc=48987A0D55638C017D1F4DC3D8ADD91&cmac=862E781E52244A75'
            };

            // Mock detection of tampered tag
            (nfcService.verifyNfcTag as jest.Mock).mockResolvedValueOnce({
                isValid: true,
                tagId: 'tamper-8ee8e27d',
                timestamp: new Date(),
                metadata: {
                    tagType: 'NTAG 424 DNA TagTamper',
                    tamperStatus: 'tampered',
                    tamperDate: '2025-03-10T15:23:42Z'
                }
            });

            const response = await request(app)
                .post('/api/nfc/verify')
                .set('X-API-Key', mockApiKey)
                .send({ sumMessage });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.tagId).toBe('tamper-8ee8e27d');
            expect(response.body.data.metadata.tamperStatus).toBe('tampered');
        });

        it('should handle invalid NFC tag verification', async () => {
            // Simulate invalid NFC scan
            const sumMessage = {
                type: 'tag',
                data: 'picc_data=INVALID1234567890ABCDEF&cmac=INVALIDCMAC1234'
            };

            // Mock invalid tag response
            (nfcService.verifyNfcTag as jest.Mock).mockRejectedValueOnce(
                new Error('NFC tag verification failed')
            );

            const response = await request(app)
                .post('/api/nfc/verify')
                .set('X-API-Key', mockApiKey)
                .send({ sumMessage });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VERIFICATION_FAILED');
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

// import request from 'supertest';
// import app from '../../../app';
// import authService from '../../../services/auth.service';
// import nfcService from '../../../services/nfc.service';

// // Mock dependencies
// jest.mock('../../../services/auth.service');
// jest.mock('../../../services/nfc.service');

// describe('NFC Routes', () => {
//     let mockApiKey: string;

//     beforeEach(() => {
//         // Setup mocks
//         mockApiKey = 'test-api-key-12345678901234567890';

//         // Mock auth service
//         (authService.validateApiKey as jest.Mock).mockResolvedValue({
//             id: 'test-id',
//             name: 'Test API Key',
//             key: mockApiKey,
//             is_active: true,
//             created_at: new Date().toISOString(),
//             updated_at: new Date().toISOString(),
//         });

//         // Mock NFC service
//         (nfcService.verifyNfcTag as jest.Mock).mockResolvedValue({
//             isValid: true,
//             tagId: 'test-tag-id',
//             timestamp: new Date(),
//             metadata: { test: 'data' },
//         });

//         (nfcService.getTagStatistics as jest.Mock).mockResolvedValue({
//             tag_id: 'test-tag-id',
//             first_verified_at: new Date().toISOString(),
//             last_verified_at: new Date().toISOString(),
//             verification_count: 5,
//         });
//     });

//     afterEach(() => {
//         jest.clearAllMocks();
//     });

//     describe('POST /api/nfc/verify', () => {
//         it('should return 401 when no API key is provided', async () => {
//             const response = await request(app)
//                 .post('/api/nfc/verify')
//                 .send({ sumMessage: { type: 'test', data: 'test-data' } });

//             expect(response.status).toBe(401);
//             expect(response.body.success).toBe(false);
//             expect(response.body.error.code).toBe('MISSING_API_KEY');
//         });

//         it('should return 400 when sumMessage is invalid', async () => {
//             const response = await request(app)
//                 .post('/api/nfc/verify')
//                 .set('X-API-Key', mockApiKey)
//                 .send({ sumMessage: { type: 123 } });

//             expect(response.status).toBe(400);
//             expect(response.body.success).toBe(false);
//             expect(response.body.error.code).toBe('INVALID_FORMAT');
//         });

//         it('should return 200 and verification result for valid request', async () => {
//             const response = await request(app)
//                 .post('/api/nfc/verify')
//                 .set('X-API-Key', mockApiKey)
//                 .send({ sumMessage: { type: 'test', data: 'test-data' } });

//             expect(response.status).toBe(200);
//             expect(response.body.success).toBe(true);
//             expect(response.body.data.tagId).toBe('test-tag-id');
//             expect(response.body.data.isValid).toBe(true);
//             expect(response.body.data.metadata).toEqual({ test: 'data' });
//             expect(nfcService.verifyNfcTag).toHaveBeenCalledWith(
//                 { type: 'test', data: 'test-data' },
//                 expect.any(String),
//                 undefined
//             );
//         });
//     });

//     describe('GET /api/nfc/stats/:tagId', () => {
//         it('should return 401 when no API key is provided', async () => {
//             const response = await request(app)
//                 .get('/api/nfc/stats/test-tag-id');

//             expect(response.status).toBe(401);
//             expect(response.body.success).toBe(false);
//             expect(response.body.error.code).toBe('MISSING_API_KEY');
//         });

//         it('should return 200 and tag statistics for valid request', async () => {
//             const response = await request(app)
//                 .get('/api/nfc/stats/test-tag-id')
//                 .set('X-API-Key', mockApiKey);

//             expect(response.status).toBe(200);
//             expect(response.body.success).toBe(true);
//             expect(response.body.data.tag_id).toBe('test-tag-id');
//             expect(response.body.data.verification_count).toBe(5);
//             expect(nfcService.getTagStatistics).toHaveBeenCalledWith('test-tag-id');
//         });

//         it('should return 404 when tag is not found', async () => {
//             (nfcService.getTagStatistics as jest.Mock).mockResolvedValueOnce(null);

//             const response = await request(app)
//                 .get('/api/nfc/stats/nonexistent-tag')
//                 .set('X-API-Key', mockApiKey);

//             expect(response.status).toBe(404);
//             expect(response.body.success).toBe(false);
//             expect(response.body.error.code).toBe('TAG_NOT_FOUND');
//         });
//     });
// });