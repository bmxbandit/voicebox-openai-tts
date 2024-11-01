export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.audioBuffers = [];
        this.currentSource = null;
        this.startTime = 0;
        this.pauseTime = 0;
        this.isPlaying = false;
        this.finalBuffer = null;
    }

    initializeAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        return this.audioContext;
    }

    async processChunk(chunk, settings) {
        // Ensure AudioContext is initialized
        this.initializeAudioContext();

        try {
            if (chunk.silence > 0) {
                // Handle silence chunk
                const silenceBuffer = this.createSilence(chunk.silence);
                if (silenceBuffer && silenceBuffer.length > 0) {
                    this.audioBuffers.push(silenceBuffer);
                }
            } else if (chunk.audio) {
                // Handle audio chunk
                const audioBuffer = await this.audioContext.decodeAudioData(chunk.audio);
                if (audioBuffer && audioBuffer.length > 0) {
                    this.audioBuffers.push(audioBuffer);
                }
            }
        } catch (error) {
            console.error('Error processing audio chunk:', error);
            throw new Error('Failed to process audio chunk');
        }
    }

    createSilence(duration) {
        if (!this.audioContext) {
            this.initializeAudioContext();
        }

        const sampleRate = this.audioContext.sampleRate;
        const numberOfSamples = Math.floor(duration * sampleRate);
        
        // Ensure we're creating a valid buffer
        if (numberOfSamples <= 0) {
            console.warn('Invalid silence duration:', duration);
            return null;
        }

        try {
            const silenceBuffer = this.audioContext.createBuffer(1, numberOfSamples, sampleRate);
            const channelData = silenceBuffer.getChannelData(0);
            for (let i = 0; i < numberOfSamples; i++) {
                channelData[i] = 0;
            }
            return silenceBuffer;
        } catch (error) {
            console.error('Error creating silence buffer:', error);
            return null;
        }
    }

    async getFinalAudio() {
        if (!this.audioContext) {
            this.initializeAudioContext();
        }

        // Filter out any null or invalid buffers
        const validBuffers = this.audioBuffers.filter(buffer => buffer && buffer.length > 0);
        
        if (validBuffers.length === 0) {
            throw new Error('No valid audio buffers to combine');
        }

        // Calculate total duration
        const totalDuration = validBuffers.reduce((acc, buffer) => acc + buffer.duration, 0);
        const totalSamples = Math.floor(totalDuration * this.audioContext.sampleRate);

        try {
            // Create a new buffer for the complete audio
            this.finalBuffer = this.audioContext.createBuffer(
                1,
                totalSamples,
                this.audioContext.sampleRate
            );

            // Combine all buffers
            let offset = 0;
            for (const buffer of validBuffers) {
                this.finalBuffer.copyToChannel(buffer.getChannelData(0), 0, offset);
                offset += buffer.length;
            }

            // Clear individual buffers to free memory
            this.audioBuffers = [];

            return this.finalBuffer;
        } catch (error) {
            console.error('Error creating final audio:', error);
            throw new Error('Failed to combine audio chunks');
        }
    }

    play(startTime = 0) {
        if (!this.audioContext) {
            this.initializeAudioContext();
        }

        if (!this.finalBuffer) {
            throw new Error('No audio available to play');
        }

        try {
            if (this.currentSource) {
                this.currentSource.stop();
            }

            this.currentSource = this.audioContext.createBufferSource();
            this.currentSource.buffer = this.finalBuffer;
            this.currentSource.connect(this.audioContext.destination);
            
            this.startTime = this.audioContext.currentTime - startTime;
            this.currentSource.start(0, startTime);
            this.isPlaying = true;
        } catch (error) {
            console.error('Error playing audio:', error);
            throw new Error('Failed to play audio');
        }
    }

    pause() {
        if (this.currentSource && this.isPlaying) {
            try {
                this.currentSource.stop();
                this.pauseTime = this.audioContext.currentTime - this.startTime;
                this.isPlaying = false;
            } catch (error) {
                console.error('Error pausing audio:', error);
            }
        }
    }

    togglePlayPause() {
        if (!this.finalBuffer) {
            throw new Error('No audio available');
        }

        if (this.isPlaying) {
            this.pause();
        } else {
            this.play(this.pauseTime);
        }
    }

    skip(seconds) {
        if (!this.finalBuffer) {
            throw new Error('No audio available');
        }

        const currentTime = this.isPlaying
            ? this.audioContext.currentTime - this.startTime
            : this.pauseTime;
            
        const newTime = Math.max(0, Math.min(currentTime + seconds, this.finalBuffer.duration));
        
        if (this.isPlaying) {
            this.pause();
            this.play(newTime);
        } else {
            this.pauseTime = newTime;
        }
    }

    async downloadAudio(format) {
        if (!this.finalBuffer) {
            throw new Error('No audio available to download');
        }

        try {
            const audioData = await this.encodeAudio(format);
            const blob = new Blob([audioData], { type: `audio/${format}` });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `voicebox_audio.${format}`;
            a.click();
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading audio:', error);
            throw new Error('Failed to download audio');
        }
    }

    async encodeAudio(format) {
        if (!this.finalBuffer) {
            throw new Error('No audio available to encode');
        }

        const length = this.finalBuffer.length;
        const channels = this.finalBuffer.numberOfChannels;
        const sampleRate = this.finalBuffer.sampleRate;
        
        const buffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(buffer);
        
        // Write WAV header
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, channels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, length * 2, true);
        
        // Write audio data
        const data = this.finalBuffer.getChannelData(0);
        let offset = 44;
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, data[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
        
        return buffer;
    }
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
