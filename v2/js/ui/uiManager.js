export class UIManager {
    constructor() {
        this.initializeElements();
        this.setupAutoSave();
        this.setupPlaybackEndedListener();
    }

    initializeElements() {
        this.elements = {
            apiKey: document.getElementById('apiKey'),
            inputText: document.getElementById('inputText'),
            previewBtn: document.getElementById('previewBtn'),
            generateBtn: document.getElementById('generateBtn'),
            previewSection: document.getElementById('previewSection'),
            progressSection: document.getElementById('progressSection'),
            playerSection: document.getElementById('playerSection'),
            progressBar: document.querySelector('.progress-bar'),
            progressStatus: document.getElementById('progressStatus'),
            playPause: document.getElementById('playPause'),
            playPauseIcon: document.querySelector('#playPause i'),
            rewind15: document.getElementById('rewind15'),
            forward15: document.getElementById('forward15'),
            downloadBtn: document.getElementById('downloadBtn'),
            chunkCount: document.getElementById('chunkCount'),
            chunkPreview: document.getElementById('chunkPreview'),
            model: document.getElementById('model'),
            voice: document.getElementById('voice'),
            format: document.getElementById('format'),
            maxChars: document.getElementById('maxChars')
        };

        Object.entries(this.elements).forEach(([key, element]) => {
            if (!element) {
                console.error(`Required element not found: ${key}`);
            }
        });
    }

    setupPlaybackEndedListener() {
        window.addEventListener('audioPlaybackEnded', () => {
            this.updatePlayPauseButton(false);
        });
    }

    setupAutoSave() {
        let timeout;
        this.elements.inputText?.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.saveTextInput(e.target.value);
            }, 500);
        });

        const settingsElements = [
            this.elements.model,
            this.elements.voice,
            this.elements.format,
            this.elements.maxChars
        ];

        settingsElements.forEach(element => {
            element?.addEventListener('change', () => {
                this.saveSettings();
            });
        });
    }

    getCurrentSettings() {
        return {
            model: this.elements.model?.value || 'tts-1',
            voice: this.elements.voice?.value || 'alloy',
            format: this.elements.format?.value || 'mp3',
            maxChars: parseInt(this.elements.maxChars?.value || '4096')
        };
    }

    applySettings(settings) {
        if (settings.model && this.elements.model) {
            this.elements.model.value = settings.model;
        }
        if (settings.voice && this.elements.voice) {
            this.elements.voice.value = settings.voice;
        }
        if (settings.format && this.elements.format) {
            this.elements.format.value = settings.format;
        }
        if (settings.maxChars && this.elements.maxChars) {
            this.elements.maxChars.value = settings.maxChars;
        }
    }

    setTextInput(text) {
        if (this.elements.inputText) {
            this.elements.inputText.value = text;
        }
    }

    saveSettings() {
        if (this.onSaveSettings) {
            this.onSaveSettings(this.getCurrentSettings());
        }
    }

    saveTextInput(text) {
        if (this.onSaveTextInput) {
            this.onSaveTextInput(text);
        }
    }

    displayChunkPreview(chunks) {
        if (!this.elements.previewSection || !this.elements.chunkPreview) {
            console.error('Preview elements not found');
            return;
        }

        this.elements.previewSection.classList.remove('d-none');
        this.elements.chunkCount.textContent = `Chunks: ${chunks.length}`;
        
        this.elements.chunkPreview.innerHTML = chunks.map((chunk, index) => {
            if (typeof chunk === 'object' && chunk.type === 'silence') {
                return `
                    <div class="chunk-item silence-chunk">
                        <div class="d-flex justify-content-between align-items-center">
                            <strong>Silence Break</strong>
                            <div class="silence-info">
                                <i class="bi bi-volume-mute"></i> 
                                <span class="badge bg-secondary">${chunk.silence} seconds</span>
                            </div>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="chunk-item">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <strong>Text Chunk ${index + 1}</strong>
                    </div>
                    <pre class="mt-2 mb-0">${this.escapeHtml(chunk)}</pre>
                </div>
            `;
        }).join('');
    }

    showProgress() {
        if (this.elements.progressSection) {
            this.elements.progressSection.classList.remove('d-none');
            this.elements.progressBar.style.width = '0%';
            this.elements.progressStatus.textContent = 'Processing...';
        }
    }

    updateProgress(percentage) {
        if (this.elements.progressBar && this.elements.progressStatus) {
            this.elements.progressBar.style.width = `${percentage}%`;
            this.elements.progressStatus.textContent = 
                `Processing... ${Math.round(percentage)}% complete`;
        }
    }

    initializePlayer(audioBuffer) {
        if (this.elements.playerSection && this.elements.progressSection) {
            this.elements.playerSection.classList.remove('d-none');
            this.elements.progressSection.classList.add('d-none');
            this.updatePlayPauseButton(false);
            
            // Enable player controls
            this.elements.playPause.disabled = false;
            this.elements.rewind15.disabled = false;
            this.elements.forward15.disabled = false;
            this.elements.downloadBtn.disabled = false;
        }
    }

    updatePlayPauseButton(isPlaying) {
        if (this.elements.playPauseIcon) {
            this.elements.playPauseIcon.className = 
                isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill';
        }
    }

    showError(message) {
        alert(message);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
