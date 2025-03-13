// src/utils/url-handler.ts
import logger from './logger';

/**
 * Utility for handling NFC tag URL operations
 * Provides functionality for parsing and processing NFC tag URLs
 */
export class UrlHandler {
    /**
     * Parses parameters from a URL string or query string
     * @param data - URL or query string
     * @returns Extracted parameters as key-value pairs
     */
    static parseParameters(data: string): Record<string, string> {
        logger.debug('[utils/url-handler.ts] Parsing URL parameters', {
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

        logger.debug('[utils/url-handler.ts] Parsed parameters', {
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
            logger.warn('[utils/url-handler.ts] No PICC data found in parameters');
            return null;
        }

        // Take first 8 characters of PICC data as tag ID
        const tagIdPart = piccData.substring(0, 8).toLowerCase();

        // Prefix based on tag type
        const prefix = tagType === 'tagtt' ? 'tamper-' : 'ntag424-';

        return `${prefix}${tagIdPart}`;
    }

    /**
     * Pre-processes a SUM message data field for verification
     * Handles both complete URLs and raw query parameters
     * @param data - SUM message data field
     * @returns Processed data ready for verification
     */
    static preprocessSumMessageData(data: string): string {
        // If data is a complete URL, extract just the query parameters
        if (data.startsWith('http')) {
            // URL with domain, extract query
            try {
                const url = new URL(data);
                return url.search.startsWith('?') ? url.search.substring(1) : url.search;
            } catch (error) {
                logger.warn('[utils/url-handler.ts] Invalid URL in SUM message data', { error });
                // Return original data if URL parsing fails
                return data;
            }
        }

        return data;
    }
}