/**
 * Speech generation and processing manager
 */

import { CONFIG } from '../config.js';
import { TTSApi } from '../api.js';
import { AudioProcessor } from './processor.js';
import { SilenceGenerator } from './silence.js';

export class SpeechGenerator {
    /**
     * Generate speech for a set of text chunks
     * @param {Array} chunks - Text chunks to process
     * @param {Object} options - Generation options
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Blob>} Final audio blob
     */
    static async generateSpeechFromChunks(chunks, options, onProgress) {
        const processedChunks = [];
        const { apiKey, model, voice, format, silenceSettings } = options;

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            onProgress(i + 1, chunks.length);

            // Skip empty chunks and handle chapter end markers
            if (!chunk.content.trim()) {
                if (chunk.type === 'chapter_end' && i < chunks.length - 1) {
                    const silenceBlob = await this.generateSilence('chapter_end', silenceSettings, format);
                    if (silenceBlob) processedChunks.push(silenceBlob);
                }
                continue;
            }

            const audioBlob = await this.processChunkWithRetry(chunk, {
                apiKey, model, voice, format
            });
            processedChunks.push(audioBlob);

            // Add silence after chunk if needed
            if (i < chunks.length - 1) {
                const silenceBlob = await this.generateSilence(chunk.type, silenceSettings, format);
                if (silenceBlob) processedChunks.push(silenceBlob);
            }
        }

        if (processedChunks.length === 0) {
            throw new Error('No audio was generated. Please check your input text.');
        }

        return AudioProcessor.combineAudioBlobs(processedChunks, format);
    }

    /**
     * Process a single chunk with retry logic
     * @private
     */
    static async processChunkWithRetry(chunk, options) {
        let retryCount = 0;
        const maxRetries = 3;
        const backoffMs = 1000; // Start with 1 second delay

        while (retryCount < maxRetries) {
            try {
                return await TTSApi.generateSpeech(chunk.content, options);
            } catch (error) {
                retryCount++;
                console.error(`Chunk processing attempt ${retryCount} failed:`, error);

                if (retryCount === maxRetries) {
                    throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
                }

                // Wait before retrying with exponential backoff
                await new Promise(resolve => setTimeout(resolve, backoffMs * Math.pow(2, retryCount - 1)));
            }
        }
    }

    /**
     * Generate silence for a specific chunk type
     * @private
     */
    static async generateSilence(chunkType, silenceSettings, format) {
        let duration = 0;
        
        switch (chunkType) {
            case 'h1': duration = silenceSettings.h1; break;
            case 'h2': duration = silenceSettings.h2; break;
            case 'paragraph': duration = silenceSettings.paragraph; break;
            case 'chapter_end': duration = silenceSettings.chapterEnd; break;
        }

        if (duration <= 0) return null;
        return SilenceGenerator.generateSilence(duration, format);
    }
}
