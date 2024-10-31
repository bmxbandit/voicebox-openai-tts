export class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioBuffers = [];
        this.currentSource = null;
        this.startTime = 0;
        this.pauseTime = 0;
        this.isPlaying = false;
        this.finalBuffer = null;
    }

    async processChunk(chunk, settings) {
        const audioBuffer = await this.audioContext.decodeAudioData(chunk.audio);
        
        // Add pre-silence if specified
        if (settings.preSilence > 0) {
            this.audioBuffers.push(this.createSilence(settings.preSilence));
        }
        
        // Add the audio chunk
        this.audioBuffers.push(audioBuffer);
        
        // Add post-silence if specified
        if (settings.postSilence > 0 || chunk.silence > 0) {
            const silenceDuration = Math.max(settings.postSilence, chunk.silence || 0);
            this.audioBuffers.push(this.createSilence(silenceDuration));
        }
    }

    createSilence(duration) {
        const sampleRate = this.audioContext.sampleRate;
        const numberOfSamples = duration * sampleRate;
        const silenceBuffer = this.audioContext.createBuffer(1, numberOfSamples, sampleRate);
        const channelData = silenceBuffer.getChannelData(0);
        for (let i = 0; i < numberOfSamples; i++) {
            channelData[i] = 0;
        }
        return silenceBuffer;
    }

    async getFinalAudio() {
        // Calculate total duration
        const totalDuration = this.audioBuffers.reduce((acc, buffer) => acc + buffer.duration, 0);
        
        // Create a new buffer for the complete audio
        this.finalBuffer = this.audioContext.createBuffer(
            1,
            totalDuration * this.audioContext.sampleRate,
            this.audioContext.sampleRate
        );
        
        // Combine all buffers
        let offset = 0;
        for (const buffer of this.audioBuffers) {
            this.finalBuffer.copyToChannel(buffer.getChannelData(0), 0, offset);
            offset += buffer.length;
        }
        
        return this.finalBuffer;
    }

    play(startTime = 0) {
        if (this.finalBuffer) {
            this.currentSource = this.audioContext.createBufferSource();
            this.currentSource.buffer = this.finalBuffer;
            this.currentSource.connect(this.audioContext.destination);
            
            this.startTime = this.audioContext.currentTime - startTime;
            this.currentSource.start(0, startTime);
            this.isPlaying = true;
        }
    }

    pause() {
        if (this.currentSource) {
            this.currentSource.stop();
            this.pauseTime = this.audioContext.currentTime - this.startTime;
            this.isPlaying = false;
        }
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play(this.pauseTime);
        }
    }

    skip(seconds) {
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
        if (!this.finalBuffer) return;

        const audioData = await this.encodeAudio(format);
        const blob = new Blob([audioData], { type: `audio/${format}` });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `voicebox_audio.${format}`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    async encodeAudio(format) {
        // For now, we'll use WAV format for simplicity
        // In a production environment, you'd want to implement proper encoding for each format
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
