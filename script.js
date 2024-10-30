class VoiceBox {
    constructor() {
        this.audioPlayer = document.getElementById('audioPlayer');
        this.generateBtn = document.getElementById('generateBtn');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.skipBackBtn = document.getElementById('skipBackBtn');
        this.skipForwardBtn = document.getElementById('skipForwardBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.progressBar = document.querySelector('.progress-bar');
        this.progress = document.querySelector('.progress');
        
        this.apiKeyInput = document.getElementById('apiKey');
        this.modelSelect = document.getElementById('model');
        this.voiceSelect = document.getElementById('voice');
        this.formatSelect = document.getElementById('format');
        this.textArea = document.getElementById('text');
        
        this.audioBlob = null;
        this.isPlaying = false;
        
        this.initializeEventListeners();
        this.loadSavedState();
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
        
        // Save state on input changes
        ['apiKey', 'model', 'voice', 'format', 'text'].forEach(id => {
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
        }
    }

    saveState() {
        const state = {
            apiKey: this.apiKeyInput.value,
            model: this.modelSelect.value,
            voice: this.voiceSelect.value,
            format: this.formatSelect.value,
            text: this.textArea.value
        };
        localStorage.setItem('voiceBoxState', JSON.stringify(state));
    }

    async generateSpeech() {
        if (!this.textArea.value.trim() || !this.apiKeyInput.value) {
            alert('Please enter both text and API key');
            return;
        }

        this.generateBtn.disabled = true;
        this.generateBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Generating...';

        try {
            const response = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKeyInput.value}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.modelSelect.value,
                    input: this.textArea.value,
                    voice: this.voiceSelect.value,
                    response_format: this.formatSelect.value
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to generate speech');
            }

            const audioBlob = await response.blob();
            this.audioBlob = audioBlob;
            
            const audioUrl = URL.createObjectURL(audioBlob);
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
