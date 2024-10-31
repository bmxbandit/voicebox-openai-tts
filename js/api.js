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
        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model || CONFIG.DEFAULT_MODEL,
                input: text,
                voice: voice || CONFIG.DEFAULT_VOICE,
                response_format: format || CONFIG.DEFAULT_FORMAT
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to generate speech');
        }

        return await response.blob();
    }

    /**
     * Validate API key by making a test request
     * @param {string} apiKey - OpenAI API key to validate
     * @returns {Promise<boolean>} - Whether the API key is valid
     */
    static async validateApiKey(apiKey) {
        try {
            await this.generateSpeech('Test.', {
                apiKey,
                model: CONFIG.DEFAULT_MODEL,
                voice: CONFIG.DEFAULT_VOICE,
                format: CONFIG.DEFAULT_FORMAT
            });
            return true;
        } catch (error) {
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
}
