/**
 * Audio processing and chunk combination
 */

import { CONFIG } from '../config.js';

export class AudioProcessor {
    /**
     * Combine multiple audio blobs into a single audio file
     * @param {Array<Blob>} blobs - Array of audio blobs to combine
     * @param {string} format - Output format (from CONFIG.FORMATS)
     * @returns {Promise<Blob>} Combined audio blob
     */
    static async combineAudioBlobs(blobs, format) {
        const audioBuffers = await Promise.all(
            blobs.map(blob => this.blobToAudioBuffer(blob))
        );
        
        const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.length, 0);
        const sampleRate = audioBuffers[0].sampleRate;
        const numberOfChannels = audioBuffers[0].numberOfChannels;
        
        const offlineContext = new OfflineAudioContext(
            numberOfChannels,
            totalLength,
            sampleRate
        );
        
        let currentOffset = 0;
        
        for (const buffer of audioBuffers) {
            const source = offlineContext.createBufferSource();
            source.buffer = buffer;
            source.connect(offlineContext.destination);
            source.start(currentOffset / sampleRate);
            currentOffset += buffer.length;
        }
        
        const renderedBuffer = await offlineContext.startRendering();
        return this.audioBufferToBlob(renderedBuffer, format);
    }

    /**
     * Convert audio blob to AudioBuffer
     * @param {Blob} blob - Audio blob to convert
     * @returns {Promise<AudioBuffer>} Converted AudioBuffer
     */
    static async blobToAudioBuffer(blob) {
        const arrayBuffer = await blob.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        return await audioContext.decodeAudioData(arrayBuffer);
    }

    /**
     * Convert AudioBuffer to Blob in specified format
     * @param {AudioBuffer} buffer - AudioBuffer to convert
     * @param {string} format - Output format
     * @returns {Promise<Blob>} Converted audio blob
     */
    static async audioBufferToBlob(buffer, format) {
        const formatConfig = CONFIG.FORMATS[format];
        if (!formatConfig) {
            throw new Error(`Unsupported format: ${format}`);
        }

        if (format === 'wav') {
            return this.audioBufferToWav(buffer);
        }

        // For other formats, use MediaRecorder
        return new Promise((resolve, reject) => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createBufferSource();
            source.buffer = buffer;

            const destination = audioContext.createMediaStreamDestination();
            source.connect(destination);

            const mediaRecorder = new MediaRecorder(destination.stream, {
                mimeType: formatConfig.mimeType
            });

            const chunks = [];
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: formatConfig.mimeType });
                resolve(blob);
            };
            mediaRecorder.onerror = (e) => reject(e);

            mediaRecorder.start();
            source.start(0);
            source.stop(buffer.duration);
            setTimeout(() => mediaRecorder.stop(), buffer.duration * 1000 + 100);
        });
    }

    /**
     * Convert AudioBuffer to WAV format blob
     * @param {AudioBuffer} buffer - AudioBuffer to convert
     * @returns {Blob} WAV format blob
     */
    static audioBufferToWav(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = CONFIG.BIT_DEPTH;
        
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;
        
        const buffer32 = new Int32Array(44 + buffer.length * bytesPerSample);
        const view = new DataView(buffer32.buffer);
        
        // Write WAV header
        this.writeWavHeader(view, {
            numChannels,
            sampleRate,
            bitDepth,
            dataLength: buffer.length * bytesPerSample
        });
        
        // Write audio data
        const samples = buffer.getChannelData(0);
        let offset = 44;
        for (let i = 0; i < samples.length; i++) {
            view.setInt16(offset, samples[i] * 0x7FFF, true);
            offset += 2;
        }
        
        return new Blob([buffer32.buffer], { type: 'audio/wav' });
    }

    /**
     * Write WAV header to DataView
     * @param {DataView} view - DataView to write header to
     * @param {Object} params - WAV parameters
     */
    static writeWavHeader(view, { numChannels, sampleRate, bitDepth, dataLength }) {
        const writeString = (view, offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(view, 0, 'RIFF');                     // RIFF identifier
        view.setUint32(4, 36 + dataLength, true);        // RIFF chunk length
        writeString(view, 8, 'WAVE');                     // RIFF type
        writeString(view, 12, 'fmt ');                    // format chunk identifier
        view.setUint32(16, 16, true);                    // format chunk length
        view.setUint16(20, 1, true);                     // sample format (raw)
        view.setUint16(22, numChannels, true);           // channel count
        view.setUint32(24, sampleRate, true);            // sample rate
        view.setUint32(28, sampleRate * numChannels * bitDepth / 8, true); // byte rate
        view.setUint16(32, numChannels * bitDepth / 8, true); // block align
        view.setUint16(34, bitDepth, true);              // bits per sample
        writeString(view, 36, 'data');                    // data chunk identifier
        view.setUint32(40, dataLength, true);            // data chunk length
    }
}
