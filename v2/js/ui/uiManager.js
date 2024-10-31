export class UIManager {
    constructor() {
        this.initializeElements();
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

    getCurrentSettings() {
        return {
            model: document.getElementById('model').value,
            voice: document.getElementById('voice').value,
            format: document.getElementById('format').value,
            maxChars: parseInt(document.getElementById('maxChars').value),
            preSilence: parseFloat(document.getElementById('preSilence').value),
            postSilence: parseFloat(document.getElementById('postSilence').value),
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

    displayChunkPreview(chunks) {
        this.elements.previewSection.classList.remove('d-none');
        this.elements.chunkCount.textContent = `Chunks: ${chunks.length}`;
        
        this.elements.chunkPreview.innerHTML = chunks.map((chunk, index) => {
            const text = typeof chunk === 'string' ? chunk : chunk.text;
            const silence = typeof chunk === 'object' ? 
                `<small class="text-muted">(Silence: ${chunk.silence}s)</small>` : '';
            
            return `
                <div class="chunk-item">
                    <strong>Chunk ${index + 1}</strong> ${silence}
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
        // You could implement a more sophisticated error display system
        alert(message);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
