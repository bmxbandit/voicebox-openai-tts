/**
 * Silence generation for different chunk types
 */

import { CONFIG } from '../config.js';
import { AudioProcessor } from './processor.js';

export class SilenceGenerator {
    /**
     * Generate silence of specified duration
     * @param {number} duration - Duration in seconds
     * @param {string} format - Output format
     * @returns {Promise<Blob>} Audio blob containing silence
     */
    static async generateSilence(duration, format) {
        const sampleRate = CONFIG.SAMPLE_RATE;
        const numSamples = Math.floor(duration * sampleRate);
        
        // Create audio context and buffer
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
        
        // Fill buffer with zeros (silence)
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < numSamples; i++) {
            channelData[i] = 0;
        }
        
        // Convert to specified format
        return AudioProcessor.audioBufferToBlob(buffer, format);
    }

    /**
     * Generate appropriate silence for chunk type
     * @param {string} chunkType - Type of chunk ('h1', 'h2', 'paragraph', 'chapter_end')
     * @param {Object} silenceSettings - Silence duration settings
     * @param {string} format - Output format
     * @returns {Promise<Blob>} Audio blob containing silence
     */
    static async generateChunkSilence(chunkType, silenceSettings, format) {
        let duration = 0;
        
        switch (chunkType) {
            case 'h1':
                duration = silenceSettings.h1;
                break;
            case 'h2':
                duration = silenceSettings.h2;
                break;
            case 'paragraph':
                duration = silenceSettings.paragraph;
                break;
            case 'chapter_end':
                duration = silenceSettings.chapterEnd;
                break;
            default:
                duration = 0;
        }

        if (duration <= 0) return null;
        return this.generateSilence(duration, format);
    }

    /**
     * Add silence between chunks
     * @param {Array<Blob>} audioBlobs - Array of audio blobs
     * @param {Array<Object>} chunks - Array of chunk information
     * @param {Object} silenceSettings - Silence duration settings
     * @param {string} format - Output format
     * @returns {Promise<Array<Blob>>} Array of audio blobs with silence added
     */
    static async addChunkSilence(audioBlobs, chunks, silenceSettings, format) {
        const result = [];
        
        for (let i = 0; i < audioBlobs.length; i++) {
            // Add the audio chunk
            result.push(audioBlobs[i]);
            
            // Add silence after chunk if not last chunk
            if (i < audioBlobs.length - 1) {
                const silenceBlob = await this.generateChunkSilence(
                    chunks[i].type,
                    silenceSettings,
                    format
                );
                if (silenceBlob) {
                    result.push(silenceBlob);
                }
            }
        }
        
        return result;
    }

    /**
     * Calculate total silence duration
     * @param {Array<Object>} chunks - Array of chunk information
     * @param {Object} silenceSettings - Silence duration settings
     * @returns {number} Total silence duration in seconds
     */
    static calculateTotalSilence(chunks, silenceSettings) {
        return chunks.reduce((total, chunk, index) => {
            if (index === chunks.length - 1) return total;
            
            switch (chunk.type) {
                case 'h1':
                    return total + silenceSettings.h1;
                case 'h2':
                    return total + silenceSettings.h2;
                case 'paragraph':
                    return total + silenceSettings.paragraph;
                case 'chapter_end':
                    return total + silenceSettings.chapterEnd;
                default:
                    return total;
            }
        }, 0);
    }

    /**
     * Validate silence settings
     * @param {Object} settings - Silence settings to validate
     * @returns {Object} Validation result
     */
    static validateSilenceSettings(settings) {
        const maxSilence = 10; // Maximum 10 seconds of silence
        const errors = [];

        Object.entries(settings).forEach(([key, value]) => {
            if (value < 0) {
                errors.push(`${key} silence cannot be negative`);
            }
            if (value > maxSilence) {
                errors.push(`${key} silence cannot exceed ${maxSilence} seconds`);
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }
}
