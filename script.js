class VoiceBox {
    constructor() {
        this.initializeElements();
        this.audioBlob = null;
        this.isPlaying = false;
        this.chunks = [];
        this.processedChunks = [];
        
        this.initializeEventListeners();
        this.loadSavedState();
        this.updateChunkInfo();
    }

    initializeElements() {
        // Audio elements
        this.audioPlayer = document.getElementById('audioPlayer');
        this.generateBtn = document.getElementById('generateBtn');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.skipBackBtn = document.getElementById('skipBackBtn');
        this.skipForwardBtn = document.getElementById('skipForwardBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.progressBar = document.querySelector('.progress-bar');
        this.progress = document.querySelector('.progress');
        
        // Input elements
        this.apiKeyInput = document.getElementById('apiKey');
        this.modelSelect = document.getElementById('model');
        this.voiceSelect = document.getElementById('voice');
        this.formatSelect = document.getElementById('format');
        this.textArea = document.getElementById('text');
        this.maxCharsInput = document.getElementById('maxChars');
        this.preSilenceInput = document.getElementById('preSilence');
        this.postSilenceInput = document.getElementById('postSilence');
        
        // Preview elements
        this.previewBtn = document.getElementById('previewBtn');
        this.chunkPreview = document.getElementById('chunkPreview');
        this.previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
        
        // Progress elements
        this.processingProgress = document.getElementById('processingProgress');
        this.currentChunkSpan = document.getElementById('currentChunk');
        this.totalChunksSpan = document.getElementById('totalChunks');
        this.chunkCountSpan = document.getElementById('chunkCount');
    }

    initializeEventListeners() {
        // Generate button
        this.generateBtn.addEventListener('click', () => this.generateSpeech());
        
        // Play/Pause button
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        
        // Skip buttons
        this.skipBackBtn.addEventListener('click', () => this.skipBack());
        this.skipForwardBtn.addEventListener('click', () => this.skipForward());
        
        // Download button
        this.downloadBtn.addEventListener('click', () => this.downloadAudio());
        
        // Progress bar
        this.progress.addEventListener('click', (e) => this.seekAudio(e));
        
        // Audio player events
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('ended', () => this.handleAudioEnd());
        
        // Preview button
        this.previewBtn.addEventListener('click', () => this.showPreview());
        
        // Text and max chars input
        this.textArea.addEventListener('input', () => {
            this.updateChunkInfo();
            this.saveState();
        });
        this.maxCharsInput.addEventListener('input', () => {
            this.updateChunkInfo();
            this.saveState();
        });
        
        // Save state on input changes
        ['apiKey', 'model', 'voice', 'format', 'preSilence', 'postSilence'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.saveState());
        });
    }

    loadSavedState() {
        const savedState = localStorage.getItem('voiceBoxState');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.apiKeyInput.value = state.apiKey || '';
            this.modelSelect.value = state.model || 'tts-1';
            this.voiceSelect.value = state.voice || 'alloy';
            this.formatSelect.value = state.format || 'mp3';
            this.textArea.value = state.text || '';
            this.maxCharsInput.value = state.maxChars || 4096;
            this.preSilenceInput.value = state.preSilence || 0;
            this.postSilenceInput.value = state.postSilence || 0;
        }
    }

    saveState() {
        const state = {
            apiKey: this.apiKeyInput.value,
            model: this.modelSelect.value,
            voice: this.voiceSelect.value,
            format: this.formatSelect.value,
            text: this.textArea.value,
            maxChars: this.maxCharsInput.value,
            preSilence: this.preSilenceInput.value,
            postSilence: this.postSilenceInput.value
        };
        localStorage.setItem('voiceBoxState', JSON.stringify(state));
    }

    splitTextIntoChunks(text) {
        const maxChars = parseInt(this.maxCharsInput.value);
        const paragraphs = text.split(/\n\s*\n/);
        const chunks = [];
        let currentChunk = '';

        for (const paragraph of paragraphs) {
            const trimmedParagraph = paragraph.trim();
            if (!trimmedParagraph) continue;

            if (currentChunk && (currentChunk.length + trimmedParagraph.length + 2) > maxChars) {
                chunks.push(currentChunk.trim());
                currentChunk = trimmedParagraph;
            } else {
                currentChunk = currentChunk ? `${currentChunk}\n\n${trimmedParagraph}` : trimmedParagraph;
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    updateChunkInfo() {
        const chunks = this.splitTextIntoChunks(this.textArea.value);
        this.chunks = chunks;
        this.chunkCountSpan.textContent = chunks.length;
    }

    showPreview() {
        const chunks = this.splitTextIntoChunks(this.textArea.value);
        this.chunkPreview.innerHTML = chunks.map((chunk, index) => `
            <div class="card mb-2">
                <div class="card-header bg-light">
                    Chunk ${index + 1} (${chunk.length} characters)
                </div>
                <div class="card-body">
                    <pre class="mb-0" style="white-space: pre-wrap;">${chunk}</pre>
                </div>
            </div>
        `).join('');
        this.previewModal.show();
    }

    async generateSilence(duration) {
        const sampleRate = 44100;
        const numSamples = Math.floor(duration * sampleRate);
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < numSamples; i++) {
            channelData[i] = 0;
        }
        
        return new Promise((resolve) => {
            const offlineContext = new OfflineAudioContext(1, numSamples, sampleRate);
            const source = offlineContext.createBufferSource();
            source.buffer = buffer;
            source.connect(offlineContext.destination);
            source.start();
            
            offlineContext.startRendering().then((renderedBuffer) => {
                const wavData = this.bufferToWav(renderedBuffer);
                resolve(new Blob([wavData], { type: 'audio/wav' }));
            });
        });
    }

    bufferToWav(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;
        
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;
        
        const buffer32 = new Int32Array(44 + buffer.length * bytesPerSample);
        const view = new DataView(buffer32.buffer);
        
        /* RIFF identifier */
        writeString(view, 0, 'RIFF');
        /* RIFF chunk length */
        view.setUint32(4, 36 + buffer.length * bytesPerSample, true);
        /* RIFF type */
        writeString(view, 8, 'WAVE');
        /* format chunk identifier */
        writeString(view, 12, 'fmt ');
        /* format chunk length */
        view.setUint32(16, 16, true);
        /* sample format (raw) */
        view.setUint16(20, format, true);
        /* channel count */
        view.setUint16(22, numChannels, true);
        /* sample rate */
        view.setUint32(24, sampleRate, true);
        /* byte rate (sample rate * block align) */
        view.setUint32(28, sampleRate * blockAlign, true);
        /* block align (channel count * bytes per sample) */
        view.setUint16(32, blockAlign, true);
        /* bits per sample */
        view.setUint16(34, bitDepth, true);
        /* data chunk identifier */
        writeString(view, 36, 'data');
        /* data chunk length */
        view.setUint32(40, buffer.length * bytesPerSample, true);
        
        const samples = buffer.getChannelData(0);
        let offset = 44;
        for (let i = 0; i < samples.length; i++) {
            view.setInt16(offset, samples[i] * 0x7FFF, true);
            offset += 2;
        }
        
        return buffer32.buffer;
        
        function writeString(view, offset, string) {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        }
    }

    async combineAudioBlobs(blobs) {
        const audioBuffers = await Promise.all(
            blobs.map(async (blob) => {
                const arrayBuffer = await blob.arrayBuffer();
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                return await audioContext.decodeAudioData(arrayBuffer);
            })
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
        const wavData = this.bufferToWav(renderedBuffer);
        return new Blob([wavData], { type: 'audio/wav' });
    }

    async generateSpeech() {
        if (!this.textArea.value.trim() || !this.apiKeyInput.value) {
            alert('Please enter both text and API key');
            return;
        }

        this.generateBtn.disabled = true;
        this.generateBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Generating...';
        this.processingProgress.style.display = 'block';
        this.processedChunks = [];

        try {
            const chunks = this.splitTextIntoChunks(this.textArea.value);
            this.totalChunksSpan.textContent = chunks.length;
            
            // Generate pre-silence if needed
            const preSilence = parseFloat(this.preSilenceInput.value);
            if (preSilence > 0) {
                const silenceBlob = await this.generateSilence(preSilence);
                this.processedChunks.push(silenceBlob);
            }

            // Process each chunk
            for (let i = 0; i < chunks.length; i++) {
                this.currentChunkSpan.textContent = i + 1;
                document.querySelector('#processingProgress .progress-bar').style.width = 
                    `${((i + 1) / chunks.length) * 100}%`;

                const response = await fetch('https://api.openai.com/v1/audio/speech', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKeyInput.value}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: this.modelSelect.value,
                        input: chunks[i],
                        voice: this.voiceSelect.value,
                        response_format: 'mp3'  // Use MP3 for chunks for better processing
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || 'Failed to generate speech');
                }

                const audioBlob = await response.blob();
                this.processedChunks.push(audioBlob);
            }

            // Generate post-silence if needed
            const postSilence = parseFloat(this.postSilenceInput.value);
            if (postSilence > 0) {
                const silenceBlob = await this.generateSilence(postSilence);
                this.processedChunks.push(silenceBlob);
            }

            // Combine all audio chunks
            this.audioBlob = await this.combineAudioBlobs(this.processedChunks);
            const audioUrl = URL.createObjectURL(this.audioBlob);
            this.audioPlayer.src = audioUrl;
            
            this.playPauseBtn.disabled = false;
            this.skipBackBtn.disabled = false;
            this.skipForwardBtn.disabled = false;
            this.downloadBtn.disabled = false;
            
            // Auto-play the generated audio
            this.playAudio();
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            this.generateBtn.disabled = false;
            this.generateBtn.innerHTML = '<i class="bi bi-mic-fill"></i> Generate';
            this.processingProgress.style.display = 'none';
        }
    }

    playAudio() {
        this.audioPlayer.play();
        this.isPlaying = true;
        this.playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
    }

    pauseAudio() {
        this.audioPlayer.pause();
        this.isPlaying = false;
        this.playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pauseAudio();
        } else {
            this.playAudio();
        }
    }

    skipBack() {
        this.audioPlayer.currentTime = Math.max(0, this.audioPlayer.currentTime - 15);
    }

    skipForward() {
        this.audioPlayer.currentTime = Math.min(
            this.audioPlayer.duration,
            this.audioPlayer.currentTime + 15
        );
    }

    updateProgress() {
        const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
        this.progressBar.style.width = `${progress}%`;
    }

    seekAudio(event) {
        const rect = this.progress.getBoundingClientRect();
        const pos = (event.clientX - rect.left) / rect.width;
        this.audioPlayer.currentTime = pos * this.audioPlayer.duration;
    }

    handleAudioEnd() {
        this.isPlaying = false;
        this.playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    }

    downloadAudio() {
        if (!this.audioBlob) return;
        
        const format = this.formatSelect.value;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(this.audioBlob);
        a.download = `voicebox-audio.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new VoiceBox();
});
