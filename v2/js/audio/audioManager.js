export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.audioBuffers = [];
        this.currentSource = null;
        this.startTime = 0;
        this.pauseTime = 0;
        this._isPlaying = false;
        this.finalBuffer = null;
        this.gainNode = null;
    }

    get isPlaying() {
        return this._isPlaying;
    }

    initializeAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        return this.audioContext;
    }

    async processChunk(chunk, settings) {
        this.initializeAudioContext();

        try {
            if (chunk.silence > 0) {
                const silenceBuffer = this.createSilence(chunk.silence);
                if (silenceBuffer && silenceBuffer.length > 0) {
                    this.audioBuffers.push(silenceBuffer);
                }
            } else if (chunk.audio) {
                const audioBuffer = await this.audioContext.decodeAudioData(chunk.audio.slice(0));
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
        this.initializeAudioContext();

        const sampleRate = this.audioContext.sampleRate;
        const numberOfSamples = Math.floor(duration * sampleRate);
        
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
        this.initializeAudioContext();

        const validBuffers = this.audioBuffers.filter(buffer => buffer && buffer.length > 0);
        
        if (validBuffers.length === 0) {
            throw new Error('No valid audio buffers to combine');
        }

        const totalDuration = validBuffers.reduce((acc, buffer) => acc + buffer.duration, 0);
        const totalSamples = Math.floor(totalDuration * this.audioContext.sampleRate);

        try {
            this.finalBuffer = this.audioContext.createBuffer(
                1,
                totalSamples,
                this.audioContext.sampleRate
            );

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
        this.initializeAudioContext();

        if (!this.finalBuffer) {
            console.error('No audio buffer available');
            throw new Error('No audio available to play');
        }

        try {
            if (this.currentSource) {
                this.currentSource.stop();
                this.currentSource.disconnect();
            }

            this.currentSource = this.audioContext.createBufferSource();
            this.currentSource.buffer = this.finalBuffer;
            this.currentSource.connect(this.gainNode);
            
            this.startTime = this.audioContext.currentTime - startTime;
            this.currentSource.start(0, startTime);
            this._isPlaying = true;

            // Handle playback completion
            this.currentSource.onended = () => {
                if (this._isPlaying) {
                    this._isPlaying = false;
                    this.pauseTime = 0;
                    // Notify UI of playback completion
                    window.dispatchEvent(new CustomEvent('audioPlaybackEnded'));
                }
            };
        } catch (error) {
            console.error('Error playing audio:', error);
            this._isPlaying = false;
            throw new Error('Failed to play audio');
        }
    }

    pause() {
        if (this.currentSource && this._isPlaying) {
            try {
                this.currentSource.stop();
                this.currentSource.disconnect();
                this.pauseTime = this.audioContext.currentTime - this.startTime;
                this._isPlaying = false;
            } catch (error) {
                console.error('Error pausing audio:', error);
            }
        }
    }

    togglePlayPause() {
        if (!this.finalBuffer) {
            throw new Error('No audio available');
        }

        if (this._isPlaying) {
            this.pause();
        } else {
            this.play(this.pauseTime);
        }
    }

    skip(seconds) {
        if (!this.finalBuffer) {
            throw new Error('No audio available');
        }

        const currentTime = this._isPlaying
            ? this.audioContext.currentTime - this.startTime
            : this.pauseTime;
            
        const newTime = Math.max(0, Math.min(currentTime + seconds, this.finalBuffer.duration));
        
        if (this._isPlaying) {
            this.pause();
        }
        this.pauseTime = newTime;
        if (this._isPlaying) {
            this.play(newTime);
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
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
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

    cleanup() {
        if (this.currentSource) {
            try {
                this.currentSource.stop();
                this.currentSource.disconnect();
            } catch (e) {
                console.error('Error cleaning up current source:', e);
            }
        }
        this._isPlaying = false;
        this.pauseTime = 0;
        this.startTime = 0;
    }
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
