export class UIManager {
    constructor() {
        this.initializeElements();
        this.setupAutoSave();
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
            playPauseBtn: document.getElementById('playPause'),
            playPauseIcon: document.querySelector('#playPause i'),
            chunkCount: document.getElementById('chunkCount'),
            chunkPreview: document.getElementById('chunkPreview')
        };
    }

    setupAutoSave() {
        // Auto-save text input with debouncing
        let timeout;
        this.elements.inputText.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.saveTextInput(e.target.value);
            }, 500); // Save after 500ms of no typing
        });

        // Auto-save settings on change
        document.querySelectorAll('select, input[type="number"]').forEach(element => {
            element.addEventListener('change', () => {
                this.saveSettings();
            });
        });
    }

    getCurrentSettings() {
        return {
            model: document.getElementById('model').value,
            voice: document.getElementById('voice').value,
            format: document.getElementById('format').value,
            maxChars: parseInt(document.getElementById('maxChars').value),
            h1Silence: parseFloat(document.getElementById('h1Silence').value),
            h2Silence: parseFloat(document.getElementById('h2Silence').value),
            chapterEndSilence: parseFloat(document.getElementById('chapterEndSilence').value)
        };
    }

    applySettings(settings) {
        Object.entries(settings).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.value = value;
            }
        });
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
        this.elements.previewSection.classList.remove('d-none');
        this.elements.chunkCount.textContent = `Chunks: ${chunks.length}`;
        
        this.elements.chunkPreview.innerHTML = chunks.map((chunk, index) => {
            const text = typeof chunk === 'string' ? chunk : chunk.text;
            let silenceInfo = '';
            let chunkType = '';
            
            if (typeof chunk === 'object' && chunk.silence > 0) {
                let silenceLabel = '';
                if (chunk.type === 'h1') silenceLabel = 'H1 Tag Silence';
                else if (chunk.type === 'h2') silenceLabel = 'H2 Tag Silence';
                else if (chunk.type === 'chapter-end') silenceLabel = 'Chapter End Silence';
                
                silenceInfo = `<div class="silence-info">
                    <i class="bi bi-volume-mute"></i> 
                    <span class="badge bg-secondary">${silenceLabel}: ${chunk.silence}s</span>
                </div>`;
            }
            
            return `
                <div class="chunk-item">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <strong>Chunk ${index + 1}</strong>
                        ${silenceInfo}
                    </div>
                    <pre class="mt-2 mb-0">${this.escapeHtml(text)}</pre>
                </div>
            `;
        }).join('');
    }

    showProgress() {
        this.elements.progressSection.classList.remove('d-none');
        this.elements.progressBar.style.width = '0%';
        this.elements.progressStatus.textContent = 'Processing...';
    }

    updateProgress(percentage) {
        this.elements.progressBar.style.width = `${percentage}%`;
        this.elements.progressStatus.textContent = 
            `Processing... ${Math.round(percentage)}% complete`;
    }

    initializePlayer(audioBuffer) {
        this.elements.playerSection.classList.remove('d-none');
        this.elements.progressSection.classList.add('d-none');
        this.updatePlayPauseButton(false);
    }

    updatePlayPauseButton(isPlaying) {
        this.elements.playPauseIcon.className = 
            isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill';
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
