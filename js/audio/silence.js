/**
 * Silence generation for pre and post audio
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
     * Add silence to the beginning and/or end of an audio blob
     * @param {Blob} audioBlob - Original audio blob
     * @param {Object} options - Silence options
     * @param {number} options.preSilence - Seconds of silence to add at start
     * @param {number} options.postSilence - Seconds of silence to add at end
     * @param {string} options.format - Output format
     * @returns {Promise<Blob>} Audio blob with added silence
     */
    static async addSilence(audioBlob, { preSilence = 0, postSilence = 0, format }) {
        // If no silence requested, return original blob
        if (preSilence === 0 && postSilence === 0) {
            return audioBlob;
        }

        const blobs = [];
        
        // Generate and add pre-silence
        if (preSilence > 0) {
            const preSilenceBlob = await this.generateSilence(preSilence, format);
            blobs.push(preSilenceBlob);
        }
        
        // Add original audio
        blobs.push(audioBlob);
        
        // Generate and add post-silence
        if (postSilence > 0) {
            const postSilenceBlob = await this.generateSilence(postSilence, format);
            blobs.push(postSilenceBlob);
        }
        
        // Combine all blobs
        return AudioProcessor.combineAudioBlobs(blobs, format);
    }

    /**
     * Calculate silence duration in samples
     * @param {number} seconds - Duration in seconds
     * @returns {number} Number of samples
     */
    static calculateSilenceSamples(seconds) {
        return Math.floor(seconds * CONFIG.SAMPLE_RATE);
    }

    /**
     * Validate silence duration
     * @param {number} duration - Duration in seconds
     * @returns {boolean} Whether the duration is valid
     */
    static validateSilenceDuration(duration) {
        return duration >= 0 && duration <= 60; // Maximum 1 minute of silence
    }
}
