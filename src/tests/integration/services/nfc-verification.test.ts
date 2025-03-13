// src/tests/integration/services/nfc-verification.test.ts
import request from 'supertest';
import app from '../../../app';
import { setupTestMocks, teardownTestMocks } from '../../test-helpers/mock-setup';
import { mockTagResponses } from '../../test-helpers/mock-data';

// Mock external dependencies for controlled testing
jest.mock('../../../services/sdm.service');
jest.mock('../../../config/supabase');

describe('NFC Tag Verification Integration Tests', () => {
    const apiKey = 'test-api-key-123456789012345678901234567890';

    beforeAll(() => {
        setupTestMocks();
    });

    afterAll(() => {
        teardownTestMocks();
    });

    describe('NTAG 424 DNA Standard Tag Verification', () => {
        /**
         * This test simulates a real NFC scan URL that would be produced by 
         * an NTAG 424 DNA tag configured with SDM (Secure Dynamic Messaging).
         * 
         * The URL parameters are what would be produced when an NFC-enabled
         * device scans a properly configured tag.
         */
        it('should verify standard NTAG 424 DNA tag with SDMMAC', async () => {
            // This represents a URL like:
            // https://adaki.me/v?picc=E2347894F792312B&cmac=D3A2910582F48A15&uid=041E3C8A556480
            const requestBody = {
                sumMessage: {
                    type: 'tag',
                    data: 'picc=E2347894F792312B&cmac=D3A2910582F48A15&uid=041E3C8A556480'
                },
                geoLocation: {
                    latitude: 48.8566,
                    longitude: 2.3522
                }
            };

            const response = await request(app)
                .post('/api/nfc/verify')
                .set('X-API-Key', apiKey)
                .send(requestBody);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
                data: {
                    tagId: expect.stringMatching(/^ntag424-[a-f0-9]+$/),
                    isValid: true,
                    metadata: {
                        tagType: 'NTAG 424 DNA',
                        scanMethod: 'SDMMAC',
                        redirectUrl: expect.any(String)
                    }
                }
            });

            // Verify that the URL in the response matches what we'd expect for redirect
            expect(response.body.data.metadata.redirectUrl).toMatch(/^https?:\/\//);
        });

        /**
         * This test simulates a real NFC scan URL that would be produced by 
         * an NTAG 424 DNA tag with AES encryption for the entire file data
         */
        it('should verify an NTAG 424 DNA tag with SDMENCFileData', async () => {
            // This represents a URL like:
            // https://adaki.me/v?picc=E2347894F792312B&enc=A6B71CC347283FD89ACE1F73D0C53BC4&cmac=F9A7511E3C41A8B7&uid=041E3C8A556480
            const requestBody = {
                sumMessage: {
                    type: 'tag',
                    data: 'picc=E2347894F792312B&enc=A6B71CC347283FD89ACE1F73D0C53BC4&cmac=F9A7511E3C41A8B7&uid=041E3C8A556480'
                }
            };

            const response = await request(app)
                .post('/api/nfc/verify')
                .set('X-API-Key', apiKey)
                .send(requestBody);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
                data: {
                    tagId: expect.stringMatching(/^ntag424-[a-f0-9]+$/),
                    isValid: true,
                    metadata: {
                        tagType: 'NTAG 424 DNA',
                        scanMethod: 'SDMENCFileData',
                        encryptionMethod: 'AES-128',
                        redirectUrl: expect.any(String)
                    }
                }
            });
        });
    });

    describe('NTAG 424 DNA TagTamper Verification', () => {
        /**
         * This test simulates a scan of an NTAG 424 DNA TagTamper variant
         * which includes tamper status in the verification response
         */
        it('should verify TagTamper NFC tag with intact status', async () => {
            // This represents a URL like:
            // https://adaki.me/v?type=tt&picc=F1A53D8B62C70E94&enc=D3F57B8A1C649E230A5F7D1862B4F3C5&cmac=8A41D56F3E72C109&uid=04FB52C2496C81
            const requestBody = {
                sumMessage: {
                    type: 'tagtt',
                    data: 'picc=F1A53D8B62C70E94&enc=D3F57B8A1C649E230A5F7D1862B4F3C5&cmac=8A41D56F3E72C109&uid=04FB52C2496C81'
                }
            };

            const response = await request(app)
                .post('/api/nfc/verify')
                .set('X-API-Key', apiKey)
                .send(requestBody);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
                data: {
                    tagId: expect.stringMatching(/^tamper-[a-f0-9]+$/),
                    isValid: true,
                    metadata: {
                        tagType: 'NTAG 424 DNA TagTamper',
                        tamperStatus: 'intact',
                        encryptionMethod: 'SDMMAC + SDMENCFileData',
                        redirectUrl: expect.any(String)
                    }
                }
            });
        });

        /**
         * This test simulates a scan of an NTAG 424 DNA TagTamper variant
         * that has been tampered with, showing tampered status
         */
        it('should verify TagTamper NFC tag with tampered status', async () => {
            // This represents a URL like:
            // https://adaki.me/v?type=tt&picc=F1A53D8B62C70E94&enc=D3F57B8A1C649E230A5F7D1862B4F3C5&cmac=8A41D56F3E72C109&uid=04FB52C2496C81&ts=1
            const requestBody = {
                sumMessage: {
                    type: 'tagtt',
                    data: 'picc=F1A53D8B62C70E94&enc=D3F57B8A1C649E230A5F7D1862B4F3C5&cmac=8A41D56F3E72C109&uid=04FB52C2496C81&ts=1'
                },
                geoLocation: {
                    latitude: 40.7128,
                    longitude: -74.0060
                }
            };

            const response = await request(app)
                .post('/api/nfc/verify')
                .set('X-API-Key', apiKey)
                .send(requestBody);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
                data: {
                    tagId: expect.stringMatching(/^tamper-[a-f0-9]+$/),
                    isValid: true,
                    metadata: {
                        tagType: 'NTAG 424 DNA TagTamper',
                        tamperStatus: 'tampered',
                        tamperDetectedAt: expect.any(String),
                        encryptionMethod: 'SDMMAC + SDMENCFileData',
                        redirectUrl: expect.any(String)
                    }
                }
            });

            // Verify that tamper detection information is present
            expect(new Date(response.body.data.metadata.tamperDetectedAt)).toBeInstanceOf(Date);
        });
    });

    describe('URL Parameter Parsing Tests', () => {
        /**
         * This test simulates receiving the complete URL that would be generated
         * when an NFC tag is scanned, to ensure our service can properly extract
         * and process the parameters from a real-world URL.
         */
        it('should handle complete URL as data parameter', async () => {
            // This simulates receiving the entire URL that would be produced by an NFC scan
            const fullUrl = 'https://adaki.me/v?picc=E2347894F792312B&cmac=D3A2910582F48A15&uid=041E3C8A556480';

            const requestBody = {
                sumMessage: {
                    type: 'tag',
                    data: fullUrl
                }
            };

            const response = await request(app)
                .post('/api/nfc/verify')
                .set('X-API-Key', apiKey)
                .send(requestBody);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.isValid).toBe(true);
        });

        /**
         * Test to verify the system can handle URL-encoded parameters correctly
         */
        it('should handle URL-encoded parameters', async () => {
            // URL with encoded parameters
            const encodedData = 'picc=E2347894F792312B&cmac=D3A2910582F48A15&uid=041E3C8A556480&data=Special%20value%20with%20spaces';

            const requestBody = {
                sumMessage: {
                    type: 'tag',
                    data: encodedData
                }
            };

            const response = await request(app)
                .post('/api/nfc/verify')
                .set('X-API-Key', apiKey)
                .send(requestBody);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('Error and Edge Cases', () => {
        /**
         * Test to verify the system correctly handles invalid SUM messages
         */
        it('should reject invalid SUM message format', async () => {
            const requestBody = {
                sumMessage: {
                    type: 'tag',
                    data: 'invalid-data-format'
                }
            };

            const response = await request(app)
                .post('/api/nfc/verify')
                .set('X-API-Key', apiKey)
                .send(requestBody);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_FORMAT');
        });

        /**
         * Test to verify the system correctly handles counterfeit tags
         */
        it('should reject counterfeit tag', async () => {
            // Tag with invalid cryptographic data
            const requestBody = {
                sumMessage: {
                    type: 'tag',
                    data: 'picc=E2347894F792312B&cmac=INVALID000000000&uid=041E3C8A556480'
                }
            };

            const response = await request(app)
                .post('/api/nfc/verify')
                .set('X-API-Key', apiKey)
                .send(requestBody);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VERIFICATION_FAILED');
        });
    });
});