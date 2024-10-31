/**
 * OpenAI API interaction module
 */

import { CONFIG } from './config.js';

export class TTSApi {
    /**
     * Generate speech from text using OpenAI's TTS API
     * @param {string} text - The text to convert to speech
     * @param {Object} options - Configuration options
     * @param {string} options.apiKey - OpenAI API key
     * @param {string} options.model - TTS model to use
     * @param {string} options.voice - Voice to use
     * @param {string} options.format - Output format
     * @returns {Promise<Blob>} - Audio blob
     */
    static async generateSpeech(text, { apiKey, model, voice, format }) {
        if (!text || !text.trim()) {
            throw new Error(CONFIG.ERRORS.TEXT_EMPTY);
        }

        if (!apiKey) {
            throw new Error(CONFIG.ERRORS.API_KEY_MISSING);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, CONFIG.REQUEST_OPTIONS.timeout);

        try {
            const response = await fetch(CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                },
                body: JSON.stringify({
                    model: model || CONFIG.DEFAULT_MODEL,
                    input: text.trim(),
                    voice: voice || CONFIG.DEFAULT_VOICE,
                    response_format: format || CONFIG.DEFAULT_FORMAT
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error?.message || `${CONFIG.ERRORS.API_ERROR}${response.status} ${response.statusText}`;
                } catch {
                    errorMessage = `${CONFIG.ERRORS.API_ERROR}${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            // Check if the response is valid
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('audio/')) {
                console.error('Invalid content type:', contentType);
                throw new Error(CONFIG.ERRORS.INVALID_RESPONSE);
            }

            return await response.blob();
        } catch (error) {
            console.error('TTS API Error:', error);

            // Handle specific error types
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            }
            if (error.message.includes('Failed to fetch')) {
                throw new Error(CONFIG.ERRORS.NETWORK_ERROR);
            }

            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }

    /**
     * Validate API key by making a test request
     * @param {string} apiKey - OpenAI API key to validate
     * @returns {Promise<boolean>} - Whether the API key is valid
     */
    static async validateApiKey(apiKey) {
        if (!apiKey) return false;

        try {
            // Make a minimal request to validate the API key
            await this.generateSpeech('Test.', {
                apiKey,
                model: CONFIG.DEFAULT_MODEL,
                voice: CONFIG.DEFAULT_VOICE,
                format: CONFIG.DEFAULT_FORMAT
            });
            return true;
        } catch (error) {
            console.error('API Key Validation Error:', error);
            return false;
        }
    }

    /**
     * Get supported formats from config
     * @returns {Object} - Object containing supported format information
     */
    static getSupportedFormats() {
        return CONFIG.FORMATS;
    }

    /**
     * Check if a format is supported
     * @param {string} format - Format to check
     * @returns {boolean} - Whether the format is supported
     */
    static isFormatSupported(format) {
        return format in CONFIG.FORMATS;
    }

    /**
     * Get the MIME type for a format
     * @param {string} format - Format to get MIME type for
     * @returns {string} - MIME type
     */
    static getFormatMimeType(format) {
        return CONFIG.FORMATS[format]?.mimeType || 'application/octet-stream';
    }
}
