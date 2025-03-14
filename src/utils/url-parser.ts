// src/utils/url-parser.ts
import { SumMessage } from '../types/nfc.types';
import logger from './logger';

/**
 * NfcUrlParser provides utilities for handling NFC tag URLs
 * These methods standardize the parsing and processing of 
 * NFC tag URL parameters across the application
 */
export class NfcUrlParser {
    /**
     * Parses parameters from a URL string or query string
     * @param data - URL or query string
     * @returns Extracted parameters as key-value pairs
     */
    static parseParameters(data: string): Record<string, string> {
        logger.debug('[utils/url-parser.ts] Parsing URL parameters', {
            dataLength: data.length,
            isFull: data.includes('http')
        });

        // Handle complete URLs by extracting just the query part
        let queryString = data;

        // If it's a complete URL, extract the query part
        if (data.includes('?')) {
            queryString = data.split('?')[1];
        }

        // Parse URL parameters
        const params: Record<string, string> = {};

        // If empty querystring, return empty params
        if (!queryString || queryString.trim() === '') {
            return params;
        }

        // Split the query string into key-value pairs
        const segments = queryString.split('&');

        segments.forEach(segment => {
            const parts = segment.split('=');
            if (parts.length >= 2) {
                const key = parts[0];
                const value = parts.slice(1).join('='); // Rejoin in case value contains '='
                params[key] = decodeURIComponent(value);
            }
        });

        logger.debug('[utils/url-parser.ts] Parsed parameters', {
            paramCount: Object.keys(params).length,
            params: Object.keys(params)
        });

        return params;
    }

    /**
     * Determines tag type from URL parameters
     * @param params - URL parameters
     * @returns Tag type identifier
     */
    static determineTagType(params: Record<string, string>): string {
        // Check for TagTamper indicators
        if (params.type === 'tt' || params.ts !== undefined) {
            return 'tagtt';
        }

        // Check for encrypted data indicators
        if (params.enc !== undefined) {
            return 'tag'; // Standard NTAG with encryption
        }

        // Default tag type
        return 'tag';
    }

    /**
     * Extracts tag ID from parameters
     * @param params - URL parameters
     * @param tagType - Determined tag type
     * @returns Extracted tag ID
     */
    static extractTagId(params: Record<string, string>, tagType: string): string | null {
        // Extract the PICC data which contains the tag ID
        const piccData = params.picc;

        if (!piccData) {
            logger.warn('[utils/url-parser.ts] No PICC data found in parameters');
            return null;
        }

        // Take first 8 characters of PICC data as tag ID
        const tagIdPart = piccData.substring(0, 8).toLowerCase();

        // Prefix based on tag type
        const prefix = tagType === 'tagtt' ? 'tamper-' : 'ntag424-';

        return `${prefix}${tagIdPart}`;
    }

    /**
     * Converts a URL to a SumMessage format
     * @param url - NFC tag URL or parameter string
     * @returns SumMessage object ready for verification
     */
    static urlToSumMessage(url: string): SumMessage {
        // Extract parameters from the URL
        const params = this.parseParameters(url);

        // Determine tag type based on parameters
        const tagType = this.determineTagType(params);

        // Convert the URL to SUM message format
        return {
            type: tagType,
            data: url.includes('?') ? url.split('?')[1] : url
        };
    }

    /**
     * Generates a test request payload for verification
     * @param tagParams - URL parameters for the tag
     * @param includeLocation - Whether to include geolocation data
     * @returns Request object ready for sending to API
     */
    static generateTestRequest(tagParams: Record<string, string>, includeLocation = false): any {
        // Convert parameters to URL query format
        const queryString = Object.entries(tagParams)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');

        // Determine tag type based on parameters
        const tagType = this.determineTagType(tagParams);

        const request: any = {
            sumMessage: {
                type: tagType,
                data: queryString
            }
        };

        // Add geolocation if requested
        if (includeLocation) {
            request.geoLocation = {
                latitude: 40.7128, // New York coordinates (for example)
                longitude: -74.0060
            };
        }

        return request;
    }

    /**
     * Provides standard test cases for various tag types
     * Used for data-driven testing
     * @returns Array of test cases with URLs and expected results
     */
    static getStandardTestCases(): Array<{
        name: string;
        url: string;
        expectedTagId: string;
        expectedTagType: string;
    }> {
        return [
            {
                name: 'Standard NTAG 424 DNA',
                url: 'https://adaki.me/v?picc=E2347894F792312B&cmac=D3A2910582F48A15&uid=041E3C8A556480',
                expectedTagId: 'ntag424-e2347894',
                expectedTagType: 'NTAG 424 DNA'
            },
            {
                name: 'Encrypted NTAG 424 DNA',
                url: 'https://adaki.me/v?picc=E2347894F792312B&enc=A6B71CC347283FD89ACE1F73D0C53BC4&cmac=F9A7511E3C41A8B7&uid=041E3C8A556480',
                expectedTagId: 'ntag424-e2347894',
                expectedTagType: 'NTAG 424 DNA'
            },
            {
                name: 'NTAG 424 DNA TagTamper (intact)',
                url: 'https://adaki.me/v?type=tt&picc=F1A53D8B62C70E94&enc=D3F57B8A1C649E230A5F7D1862B4F3C5&cmac=8A41D56F3E72C109&uid=04FB52C2496C81',
                expectedTagId: 'tamper-f1a53d8b',
                expectedTagType: 'NTAG 424 DNA TagTamper'
            },
            {
                name: 'NTAG 424 DNA TagTamper (tampered)',
                url: 'https://adaki.me/v?type=tt&picc=F1A53D8B62C70E94&enc=D3F57B8A1C649E230A5F7D1862B4F3C5&cmac=8A41D56F3E72C109&uid=04FB52C2496C81&ts=1',
                expectedTagId: 'tamper-f1a53d8b',
                expectedTagType: 'NTAG 424 DNA TagTamper'
            }
        ];
    }
}