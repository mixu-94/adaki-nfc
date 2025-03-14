// src/tests/test-helpers/mock-setup.ts
import { mockTagResponses, mockApiKeys, mockTagRecords } from './mock-data';
import { NfcVerificationError } from '../../types/nfc.types';

/**
 * Extracts URL parameters from a query string or complete URL
 * @param data - URL query string or complete URL
 * @returns Object containing extracted parameters
 */
function parseParameters(data: string): Record<string, string> {
    // Handle complete URLs by extracting just the query part
    let queryString = data;
    if (data.includes('?')) {
        queryString = data.split('?')[1];
    }

    // Parse the parameters
    const params: Record<string, string> = {};
    const segments = queryString.split('&');

    segments.forEach(segment => {
        const [key, value] = segment.split('=');
        if (key && value) {
            params[key] = decodeURIComponent(value);
        }
    });

    return params;
}

/**
 * Configures all mock implementations for integration testing
 * This function systematically replaces actual service dependencies with
 * controlled test doubles to isolate the API endpoints being tested
 */
export function setupTestMocks(): void {
    // Mock auth service API key validation
    jest.doMock('../../services/auth.service', () => ({
        validateApiKey: jest.fn((apiKey: string) => {
            if (apiKey === mockApiKeys.valid.key) {
                return Promise.resolve(mockApiKeys.valid);
            } else if (apiKey === mockApiKeys.expired.key) {
                return Promise.reject(new Error('API key has expired'));
            } else if (apiKey === mockApiKeys.inactive.key) {
                return Promise.reject(new Error('API key is inactive'));
            } else {
                return Promise.reject(new Error('Invalid API key'));
            }
        }),
        default: {
            validateApiKey: jest.fn((apiKey: string) => {
                if (apiKey === mockApiKeys.valid.key) {
                    return Promise.resolve(mockApiKeys.valid);
                } else if (apiKey === mockApiKeys.expired.key) {
                    return Promise.reject(new Error('API key has expired'));
                } else if (apiKey === mockApiKeys.inactive.key) {
                    return Promise.reject(new Error('API key is inactive'));
                } else {
                    return Promise.reject(new Error('Invalid API key'));
                }
            })
        }
    }));

    // Mock SDM service for tag verification
    jest.doMock('../../services/sdm.service', () => ({
        verifyNfcTag: jest.fn((sumMessage: any) => {
            // Extract parameters from the SUM message data
            const params = parseParameters(sumMessage.data);

            // Check for standard NTAG 424 DNA
            if (params.picc === mockTagResponses.standardTag.picc &&
                params.cmac === mockTagResponses.standardTag.cmac) {
                return Promise.resolve(mockTagResponses.standardTag.response);
            }

            // Check for NTAG 424 DNA with encryption
            if (params.picc === mockTagResponses.encryptedTag.picc &&
                params.enc && params.cmac === mockTagResponses.encryptedTag.cmac) {
                return Promise.resolve(mockTagResponses.encryptedTag.response);
            }

            // Check for TagTamper intact
            if (params.picc === mockTagResponses.tamperTagIntact.picc &&
                params.enc && params.cmac === mockTagResponses.tamperTagIntact.cmac &&
                !params.ts) {
                return Promise.resolve(mockTagResponses.tamperTagIntact.response);
            }

            // Check for TagTamper broken
            if (params.picc === mockTagResponses.tamperTagBroken.picc &&
                params.enc && params.cmac === mockTagResponses.tamperTagBroken.cmac &&
                params.ts === mockTagResponses.tamperTagBroken.ts) {
                return Promise.resolve(mockTagResponses.tamperTagBroken.response);
            }

            // Invalid tag / verification failure
            return Promise.reject(new NfcVerificationError(mockTagResponses.invalidTag.error));
        }),
        default: {
            verifyNfcTag: jest.fn((sumMessage: any) => {
                // Extract parameters from the SUM message data
                const params = parseParameters(sumMessage.data);

                // Check for standard NTAG 424 DNA
                if (params.picc === mockTagResponses.standardTag.picc &&
                    params.cmac === mockTagResponses.standardTag.cmac) {
                    return Promise.resolve(mockTagResponses.standardTag.response);
                }

                // Check for NTAG 424 DNA with encryption
                if (params.picc === mockTagResponses.encryptedTag.picc &&
                    params.enc && params.cmac === mockTagResponses.encryptedTag.cmac) {
                    return Promise.resolve(mockTagResponses.encryptedTag.response);
                }

                // Check for TagTamper intact
                if (params.picc === mockTagResponses.tamperTagIntact.picc &&
                    params.enc && params.cmac === mockTagResponses.tamperTagIntact.cmac &&
                    !params.ts) {
                    return Promise.resolve(mockTagResponses.tamperTagIntact.response);
                }

                // Check for TagTamper broken
                if (params.picc === mockTagResponses.tamperTagBroken.picc &&
                    params.enc && params.cmac === mockTagResponses.tamperTagBroken.cmac &&
                    params.ts === mockTagResponses.tamperTagBroken.ts) {
                    return Promise.resolve(mockTagResponses.tamperTagBroken.response);
                }

                // Invalid tag / verification failure
                return Promise.reject(new NfcVerificationError(mockTagResponses.invalidTag.error));
            })
        }
    }));

    // Mock storage service for database operations
    jest.doMock('../../services/storage.service', () => ({
        logVerification: jest.fn(),
        getTagInfo: jest.fn((tagId: string) => {
            // Use type assertion with 'as' to tell TypeScript that tagId can be used as a key
            return Promise.resolve((mockTagRecords as Record<string, any>)[tagId] || null);
        }),
        getTagStatistics: jest.fn((tagId: string) => {
            return Promise.resolve((mockTagRecords as Record<string, any>)[tagId] || null);
        }),
        updateTagConfiguration: jest.fn((tagId: string, config: any) => {
            if ((mockTagRecords as Record<string, any>)[tagId]) {
                const updatedRecord = {
                    ...(mockTagRecords as Record<string, any>)[tagId],
                    redirect_url: config.redirectUrl || (mockTagRecords as Record<string, any>)[tagId].redirect_url,
                    is_active: config.isActive !== undefined ? config.isActive : (mockTagRecords as Record<string, any>)[tagId].is_active,
                    updated_at: new Date().toISOString()
                };
                return Promise.resolve(updatedRecord);
            }
            return Promise.resolve(null);
        }),
        default: {
            logVerification: jest.fn(),
            getTagInfo: jest.fn((tagId: string) => {
                return Promise.resolve((mockTagRecords as Record<string, any>)[tagId] || null);
            }),
            getTagStatistics: jest.fn((tagId: string) => {
                return Promise.resolve((mockTagRecords as Record<string, any>)[tagId] || null);
            }),
            updateTagConfiguration: jest.fn((tagId: string, config: any) => {
                if ((mockTagRecords as Record<string, any>)[tagId]) {
                    const updatedRecord = {
                        ...(mockTagRecords as Record<string, any>)[tagId],
                        redirect_url: config.redirectUrl || (mockTagRecords as Record<string, any>)[tagId].redirect_url,
                        is_active: config.isActive !== undefined ? config.isActive : (mockTagRecords as Record<string, any>)[tagId].is_active,
                        updated_at: new Date().toISOString()
                    };
                    return Promise.resolve(updatedRecord);
                }
                return Promise.resolve(null);
            })
        }
    }));

    // Mock supabase client
    jest.doMock('../../config/supabase', () => ({
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn()
                }))
            })),
            insert: jest.fn(() => ({
                select: jest.fn(() => ({
                    single: jest.fn()
                }))
            })),
            update: jest.fn(() => ({
                eq: jest.fn(() => ({
                    select: jest.fn(() => ({
                        single: jest.fn()
                    }))
                }))
            }))
        })),
        default: {
            from: jest.fn(() => ({
                select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        single: jest.fn()
                    }))
                })),
                insert: jest.fn(() => ({
                    select: jest.fn(() => ({
                        single: jest.fn()
                    }))
                })),
                update: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        select: jest.fn(() => ({
                            single: jest.fn()
                        }))
                    }))
                }))
            }))
        }
    }));

    // Mock NFC service to pass through to SDM service
    jest.doMock('../../services/nfc.service', () => {
        // Get the mocked SDM service
        const sdmService = require('../../services/sdm.service').default;

        return {
            verifyNfcTag: jest.fn((sumMessage: any, ipAddress?: string, userAgent?: string, geoLocation?: any) => {
                return sdmService.verifyNfcTag(sumMessage);
            }),
            getTagStatistics: jest.fn((tagId: string) => {
                return Promise.resolve((mockTagRecords as Record<string, any>)[tagId] || null);
            }),
            updateTagConfiguration: jest.fn((tagId: string, config: any) => {
                if ((mockTagRecords as Record<string, any>)[tagId]) {
                    const updatedRecord = {
                        ...(mockTagRecords as Record<string, any>)[tagId],
                        redirect_url: config.redirectUrl || (mockTagRecords as Record<string, any>)[tagId].redirect_url,
                        is_active: config.isActive !== undefined ? config.isActive : (mockTagRecords as Record<string, any>)[tagId].is_active,
                        updated_at: new Date().toISOString()
                    };
                    return Promise.resolve(updatedRecord);
                }
                return Promise.resolve(null);
            }),
            default: {
                verifyNfcTag: jest.fn((sumMessage: any, ipAddress?: string, userAgent?: string, geoLocation?: any) => {
                    return sdmService.verifyNfcTag(sumMessage);
                }),
                getTagStatistics: jest.fn((tagId: string) => {
                    return Promise.resolve((mockTagRecords as Record<string, any>)[tagId] || null);
                }),
                updateTagConfiguration: jest.fn((tagId: string, config: any) => {
                    if ((mockTagRecords as Record<string, any>)[tagId]) {
                        const updatedRecord = {
                            ...(mockTagRecords as Record<string, any>)[tagId],
                            redirect_url: config.redirectUrl || (mockTagRecords as Record<string, any>)[tagId].redirect_url,
                            is_active: config.isActive !== undefined ? config.isActive : (mockTagRecords as Record<string, any>)[tagId].is_active,
                            updated_at: new Date().toISOString()
                        };
                        return Promise.resolve(updatedRecord);
                    }
                    return Promise.resolve(null);
                })
            }
        };
    });

    // Mock Redis client
    jest.doMock('../../config/redis', () => ({
        redisClient: {
            isOpen: true,
            connect: jest.fn(),
            sendCommand: jest.fn(),
            on: jest.fn(),
            disconnect: jest.fn()
        },
        default: {
            isOpen: true,
            connect: jest.fn(),
            sendCommand: jest.fn(),
            on: jest.fn(),
            disconnect: jest.fn()
        }
    }));
}

/**
 * Performs systematic cleanup of all mock implementations
 * This function resets all mock implementations to prevent cross-test contamination
 */
export function teardownTestMocks(): void {
    // Reset all mocks
    jest.resetModules();
    jest.clearAllMocks();
}
// // src/tests/test-helpers/mock-setup.ts
// import { mockTagResponses, mockApiKeys, mockTagRecords } from './mock-data';
// import { NfcVerificationError } from '../../types/nfc.types';

// /**
//  * Extracts URL parameters from a query string or complete URL
//  * @param data - URL query string or complete URL
//  * @returns Object containing extracted parameters
//  */
// function parseParameters(data: string): Record<string, string> {
//     // Handle complete URLs by extracting just the query part
//     let queryString = data;
//     if (data.includes('?')) {
//         queryString = data.split('?')[1];
//     }

//     // Parse the parameters
//     const params: Record<string, string> = {};
//     const segments = queryString.split('&');

//     segments.forEach(segment => {
//         const [key, value] = segment.split('=');
//         if (key && value) {
//             params[key] = decodeURIComponent(value);
//         }
//     });

//     return params;
// }

// /**
//  * Configures all mock implementations for integration testing
//  * This function systematically replaces actual service dependencies with
//  * controlled test doubles to isolate the API endpoints being tested
//  */
// export function setupTestMocks(): void {
//     // Mock auth service API key validation
//     jest.doMock('../../services/auth.service', () => ({
//         validateApiKey: jest.fn((apiKey: string) => {
//             if (apiKey === mockApiKeys.valid.key) {
//                 return Promise.resolve(mockApiKeys.valid);
//             } else if (apiKey === mockApiKeys.expired.key) {
//                 return Promise.reject(new Error('API key has expired'));
//             } else if (apiKey === mockApiKeys.inactive.key) {
//                 return Promise.reject(new Error('API key is inactive'));
//             } else {
//                 return Promise.reject(new Error('Invalid API key'));
//             }
//         }),
//         default: {
//             validateApiKey: jest.fn((apiKey: string) => {
//                 if (apiKey === mockApiKeys.valid.key) {
//                     return Promise.resolve(mockApiKeys.valid);
//                 } else if (apiKey === mockApiKeys.expired.key) {
//                     return Promise.reject(new Error('API key has expired'));
//                 } else if (apiKey === mockApiKeys.inactive.key) {
//                     return Promise.reject(new Error('API key is inactive'));
//                 } else {
//                     return Promise.reject(new Error('Invalid API key'));
//                 }
//             })
//         }
//     }));

//     // Mock SDM service for tag verification
//     jest.doMock('../../services/sdm.service', () => ({
//         verifyNfcTag: jest.fn((sumMessage: any) => {
//             // Extract parameters from the SUM message data
//             const params = parseParameters(sumMessage.data);

//             // Check for standard NTAG 424 DNA
//             if (params.picc === mockTagResponses.standardTag.picc &&
//                 params.cmac === mockTagResponses.standardTag.cmac) {
//                 return Promise.resolve(mockTagResponses.standardTag.response);
//             }

//             // Check for NTAG 424 DNA with encryption
//             if (params.picc === mockTagResponses.encryptedTag.picc &&
//                 params.enc && params.cmac === mockTagResponses.encryptedTag.cmac) {
//                 return Promise.resolve(mockTagResponses.encryptedTag.response);
//             }

//             // Check for TagTamper intact
//             if (params.picc === mockTagResponses.tamperTagIntact.picc &&
//                 params.enc && params.cmac === mockTagResponses.tamperTagIntact.cmac &&
//                 !params.ts) {
//                 return Promise.resolve(mockTagResponses.tamperTagIntact.response);
//             }

//             // Check for TagTamper broken
//             if (params.picc === mockTagResponses.tamperTagBroken.picc &&
//                 params.enc && params.cmac === mockTagResponses.tamperTagBroken.cmac &&
//                 params.ts === mockTagResponses.tamperTagBroken.ts) {
//                 return Promise.resolve(mockTagResponses.tamperTagBroken.response);
//             }

//             // Invalid tag / verification failure
//             return Promise.reject(new NfcVerificationError(mockTagResponses.invalidTag.error));
//         }),
//         default: {
//             verifyNfcTag: jest.fn((sumMessage: any) => {
//                 // Extract parameters from the SUM message data
//                 const params = parseParameters(sumMessage.data);

//                 // Check for standard NTAG 424 DNA
//                 if (params.picc === mockTagResponses.standardTag.picc &&
//                     params.cmac === mockTagResponses.standardTag.cmac) {
//                     return Promise.resolve(mockTagResponses.standardTag.response);
//                 }

//                 // Check for NTAG 424 DNA with encryption
//                 if (params.picc === mockTagResponses.encryptedTag.picc &&
//                     params.enc && params.cmac === mockTagResponses.encryptedTag.cmac) {
//                     return Promise.resolve(mockTagResponses.encryptedTag.response);
//                 }

//                 // Check for TagTamper intact
//                 if (params.picc === mockTagResponses.tamperTagIntact.picc &&
//                     params.enc && params.cmac === mockTagResponses.tamperTagIntact.cmac &&
//                     !params.ts) {
//                     return Promise.resolve(mockTagResponses.tamperTagIntact.response);
//                 }

//                 // Check for TagTamper broken
//                 if (params.picc === mockTagResponses.tamperTagBroken.picc &&
//                     params.enc && params.cmac === mockTagResponses.tamperTagBroken.cmac &&
//                     params.ts === mockTagResponses.tamperTagBroken.ts) {
//                     return Promise.resolve(mockTagResponses.tamperTagBroken.response);
//                 }

//                 // Invalid tag / verification failure
//                 return Promise.reject(new NfcVerificationError(mockTagResponses.invalidTag.error));
//             })
//         }
//     }));

//     // Mock storage service for database operations
//     jest.doMock('../../services/storage.service', () => ({
//         logVerification: jest.fn(),
//         getTagInfo: jest.fn((tagId: string) => {
//             return Promise.resolve(mockTagRecords[tagId] || null);
//         }),
//         getTagStatistics: jest.fn((tagId: string) => {
//             return Promise.resolve(mockTagRecords[tagId] || null);
//         }),
//         updateTagConfiguration: jest.fn((tagId: string, config: any) => {
//             if (mockTagRecords[tagId]) {
//                 const updatedRecord = {
//                     ...mockTagRecords[tagId],
//                     redirect_url: config.redirectUrl || mockTagRecords[tagId].redirect_url,
//                     is_active: config.isActive !== undefined ? config.isActive : mockTagRecords[tagId].is_active,
//                     updated_at: new Date().toISOString()
//                 };
//                 return Promise.resolve(updatedRecord);
//             }
//             return Promise.resolve(null);
//         }),
//         default: {
//             logVerification: jest.fn(),
//             getTagInfo: jest.fn((tagId: string) => {
//                 return Promise.resolve(mockTagRecords[tagId] || null);
//             }),
//             getTagStatistics: jest.fn((tagId: string) => {
//                 return Promise.resolve(mockTagRecords[tagId] || null);
//             }),
//             updateTagConfiguration: jest.fn((tagId: string, config: any) => {
//                 if (mockTagRecords[tagId]) {
//                     const updatedRecord = {
//                         ...mockTagRecords[tagId],
//                         redirect_url: config.redirectUrl || mockTagRecords[tagId].redirect_url,
//                         is_active: config.isActive !== undefined ? config.isActive : mockTagRecords[tagId].is_active,
//                         updated_at: new Date().toISOString()
//                     };
//                     return Promise.resolve(updatedRecord);
//                 }
//                 return Promise.resolve(null);
//             })
//         }
//     }));

//     // Mock supabase client
//     jest.doMock('../../config/supabase', () => ({
//         from: jest.fn(() => ({
//             select: jest.fn(() => ({
//                 eq: jest.fn(() => ({
//                     single: jest.fn()
//                 }))
//             })),
//             insert: jest.fn(() => ({
//                 select: jest.fn(() => ({
//                     single: jest.fn()
//                 }))
//             })),
//             update: jest.fn(() => ({
//                 eq: jest.fn(() => ({
//                     select: jest.fn(() => ({
//                         single: jest.fn()
//                     }))
//                 }))
//             }))
//         })),
//         default: {
//             from: jest.fn(() => ({
//                 select: jest.fn(() => ({
//                     eq: jest.fn(() => ({
//                         single: jest.fn()
//                     }))
//                 })),
//                 insert: jest.fn(() => ({
//                     select: jest.fn(() => ({
//                         single: jest.fn()
//                     }))
//                 })),
//                 update: jest.fn(() => ({
//                     eq: jest.fn(() => ({
//                         select: jest.fn(() => ({
//                             single: jest.fn()
//                         }))
//                     }))
//                 }))
//             }))
//         }
//     }));

//     // Mock NFC service to pass through to SDM service
//     jest.doMock('../../services/nfc.service', () => {
//         // Get the mocked SDM service
//         const sdmService = require('../../services/sdm.service').default;

//         return {
//             verifyNfcTag: jest.fn((sumMessage: any, ipAddress?: string, userAgent?: string, geoLocation?: any) => {
//                 return sdmService.verifyNfcTag(sumMessage);
//             }),
//             getTagStatistics: jest.fn((tagId: string) => {
//                 return Promise.resolve(mockTagRecords[tagId] || null);
//             }),
//             updateTagConfiguration: jest.fn((tagId: string, config: any) => {
//                 if (mockTagRecords[tagId]) {
//                     const updatedRecord = {
//                         ...mockTagRecords[tagId],
//                         redirect_url: config.redirectUrl || mockTagRecords[tagId].redirect_url,
//                         is_active: config.isActive !== undefined ? config.isActive : mockTagRecords[tagId].is_active,
//                         updated_at: new Date().toISOString()
//                     };
//                     return Promise.resolve(updatedRecord);
//                 }
//                 return Promise.resolve(null);
//             }),
//             default: {
//                 verifyNfcTag: jest.fn((sumMessage: any, ipAddress?: string, userAgent?: string, geoLocation?: any) => {
//                     return sdmService.verifyNfcTag(sumMessage);
//                 }),
//                 getTagStatistics: jest.fn((tagId: string) => {
//                     return Promise.resolve(mockTagRecords[tagId] || null);
//                 }),
//                 updateTagConfiguration: jest.fn((tagId: string, config: any) => {
//                     if (mockTagRecords[tagId]) {
//                         const updatedRecord = {
//                             ...mockTagRecords[tagId],
//                             redirect_url: config.redirectUrl || mockTagRecords[tagId].redirect_url,
//                             is_active: config.isActive !== undefined ? config.isActive : mockTagRecords[tagId].is_active,
//                             updated_at: new Date().toISOString()
//                         };
//                         return Promise.resolve(updatedRecord);
//                     }
//                     return Promise.resolve(null);
//                 })
//             }
//         };
//     });

//     // Mock Redis client
//     jest.doMock('../../config/redis', () => ({
//         redisClient: {
//             isOpen: true,
//             connect: jest.fn(),
//             sendCommand: jest.fn(),
//             on: jest.fn(),
//             disconnect: jest.fn()
//         },
//         default: {
//             isOpen: true,
//             connect: jest.fn(),
//             sendCommand: jest.fn(),
//             on: jest.fn(),
//             disconnect: jest.fn()
//         }
//     }));
// }

// /**
//  * Performs systematic cleanup of all mock implementations
//  * This function resets all mock implementations to prevent cross-test contamination
//  */
// export function teardownTestMocks(): void {
//     // Reset all mocks
//     jest.resetModules();
//     jest.clearAllMocks();
// }