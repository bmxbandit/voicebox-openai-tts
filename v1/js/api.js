/**
 * OpenAI API interaction module
 */

import { CONFIG } from './config.js';

export class TTSApi {
    /**
     * Generate speech from text using OpenAI's TTS API with retry logic
     * @param {string} text - The text to convert to speech
     * @param {Object} options - Configuration options
     * @returns {Promise<Blob>} - Audio blob
     */
    static async generateSpeech(text, { apiKey, model, voice, format }) {
        let attempts = 0;
        const maxAttempts = 3;
        const backoffMs = 1000; // Start with 1 second delay

        while (attempts < maxAttempts) {
            try {
                return await this.makeRequest(text, { apiKey, model, voice, format });
            } catch (error) {
                attempts++;
                console.error(`Attempt ${attempts} failed:`, error);

                // If it's the last attempt, throw the error
                if (attempts === maxAttempts) {
                    throw error;
                }

                // If it's a network error or HTTP2 error, wait and retry
                if (error.message.includes('Network error') || 
                    error.message.includes('ERR_HTTP2_PROTOCOL_ERROR')) {
                    await new Promise(resolve => setTimeout(resolve, backoffMs * attempts));
                    continue;
                }

                // For other errors, throw immediately
                throw error;
            }
        }
    }

    /**
     * Make a single API request
     * @private
     */
    static async makeRequest(text, { apiKey, model, voice, format }) {
        if (!text?.trim()) {
            throw new Error(CONFIG.ERRORS.TEXT_EMPTY);
        }

        if (!apiKey?.trim()) {
            throw new Error(CONFIG.ERRORS.API_KEY_MISSING);
        }

        // Create a new AbortController for this request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            const response = await fetch(CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': '*/*',
                    'Connection': 'keep-alive'
                },
                body: JSON.stringify({
                    model: model || CONFIG.DEFAULT_MODEL,
                    input: text.trim(),
                    voice: voice || CONFIG.DEFAULT_VOICE,
                    response_format: format || CONFIG.DEFAULT_FORMAT
                }),
                signal: controller.signal,
                keepalive: true
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API Error: ${response.status}`);
            }

            // Stream the response to handle large files
            const reader = response.body.getReader();
            const chunks = [];
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }

            // Combine chunks into a single Uint8Array
            const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const combinedChunks = new Uint8Array(totalLength);
            let position = 0;
            
            for (const chunk of chunks) {
                combinedChunks.set(chunk, position);
                position += chunk.length;
            }

            // Create blob with the correct mime type
            const mimeType = CONFIG.FORMATS[format]?.mimeType || 'audio/mpeg';
            return new Blob([combinedChunks], { type: mimeType });

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            }
            if (error.message.includes('Failed to fetch')) {
                throw new Error(CONFIG.ERRORS.NETWORK_ERROR);
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Validate API key
     * @param {string} apiKey - OpenAI API key to validate
     * @returns {Promise<boolean>} - Whether the API key is valid
     */
    static async validateApiKey(apiKey) {
        if (!apiKey?.trim()) return false;

        try {
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
     * Get supported formats
     * @returns {Object} - Supported format information
     */
    static getSupportedFormats() {
        return CONFIG.FORMATS;
    }
}
