// src/tests/test-helpers/mock-data.ts

/**
 * Mock verification responses for different types of NFC tags
 */
export const mockTagResponses = {
    // Standard NTAG 424 DNA with SDMMAC
    standardTag: {
        picc: 'E2347894F792312B',
        cmac: 'D3A2910582F48A15',
        uid: '041E3C8A556480',
        response: {
            isValid: true,
            tagId: 'ntag424-e2347894',
            timestamp: new Date(),
            metadata: {
                tagType: 'NTAG 424 DNA',
                scanMethod: 'SDMMAC',
                readCounter: 42,
                redirectUrl: 'https://adaki.io/campaigns/standard-tag'
            }
        }
    },

    // NTAG 424 DNA with AES encryption
    encryptedTag: {
        picc: 'E2347894F792312B',
        enc: 'A6B71CC347283FD89ACE1F73D0C53BC4',
        cmac: 'F9A7511E3C41A8B7',
        uid: '041E3C8A556480',
        response: {
            isValid: true,
            tagId: 'ntag424-e2347894',
            timestamp: new Date(),
            metadata: {
                tagType: 'NTAG 424 DNA',
                scanMethod: 'SDMENCFileData',
                encryptionMethod: 'AES-128',
                readCounter: 17,
                redirectUrl: 'https://adaki.io/campaigns/encrypted-tag'
            }
        }
    },

    // NTAG 424 DNA TagTamper (intact)
    tamperTagIntact: {
        picc: 'F1A53D8B62C70E94',
        enc: 'D3F57B8A1C649E230A5F7D1862B4F3C5',
        cmac: '8A41D56F3E72C109',
        uid: '04FB52C2496C81',
        response: {
            isValid: true,
            tagId: 'tamper-f1a53d8b',
            timestamp: new Date(),
            metadata: {
                tagType: 'NTAG 424 DNA TagTamper',
                tamperStatus: 'intact',
                encryptionMethod: 'SDMMAC + SDMENCFileData',
                readCounter: 3,
                redirectUrl: 'https://adaki.io/campaigns/tamper-proof'
            }
        }
    },

    // NTAG 424 DNA TagTamper (tampered)
    tamperTagBroken: {
        picc: 'F1A53D8B62C70E94',
        enc: 'D3F57B8A1C649E230A5F7D1862B4F3C5',
        cmac: '8A41D56F3E72C109',
        uid: '04FB52C2496C81',
        ts: '1', // tamper status = 1 (tampered)
        response: {
            isValid: true,
            tagId: 'tamper-f1a53d8b',
            timestamp: new Date(),
            metadata: {
                tagType: 'NTAG 424 DNA TagTamper',
                tamperStatus: 'tampered',
                tamperDetectedAt: new Date().toISOString(),
                encryptionMethod: 'SDMMAC + SDMENCFileData',
                readCounter: 8,
                redirectUrl: 'https://adaki.io/campaigns/tamper-detected'
            }
        }
    },

    // Invalid/Counterfeit tag
    invalidTag: {
        picc: 'E2347894F792312B',
        cmac: 'INVALID000000000',
        uid: '041E3C8A556480',
        error: 'Verification failed: Invalid cryptographic signature'
    }
};

/**
 * Mock data for API keys used in testing
 */
export const mockApiKeys = {
    valid: {
        id: 'test-id-1',
        name: 'Test API Key',
        key: 'test-api-key-123456789012345678901234567890',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days in future
    },
    expired: {
        id: 'test-id-2',
        name: 'Expired API Key',
        key: 'expired-api-key-12345678901234567890',
        is_active: true,
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
        updated_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    },
    inactive: {
        id: 'test-id-3',
        name: 'Inactive API Key',
        key: 'inactive-api-key-12345678901234567890',
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: null
    }
};

/**
 * Mock tag database records for testing
 */
export const mockTagRecords = {
    'ntag424-e2347894': {
        id: 'db-id-1',
        tag_id: 'ntag424-e2347894',
        first_verified_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        last_verified_at: new Date().toISOString(),
        verification_count: 42,
        redirect_url: 'https://adaki.io/campaigns/standard-tag',
        is_active: true
    },
    'tamper-f1a53d8b': {
        id: 'db-id-2',
        tag_id: 'tamper-f1a53d8b',
        first_verified_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        last_verified_at: new Date().toISOString(),
        verification_count: 8,
        redirect_url: 'https://adaki.io/campaigns/tamper-proof',
        is_active: true
    }
};