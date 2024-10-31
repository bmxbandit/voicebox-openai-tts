import { TextProcessor } from './utils/textProcessor.js';
import { AudioManager } from './audio/audioManager.js';
import { UIManager } from './ui/uiManager.js';
import { StorageManager } from './utils/storageManager.js';
import { ApiClient } from './api/apiClient.js';

class App {
    constructor() {
        this.storage = new StorageManager();
        this.textProcessor = new TextProcessor();
        this.audioManager = new AudioManager();
        this.ui = new UIManager();
        this.api = new ApiClient();
        
        this.init();
    }

    async init() {
        // Load saved settings
        this.loadSettings();
        
        // Initialize event listeners
        this.initializeEventListeners();
    }

    loadSettings() {
        const settings = this.storage.getSettings();
        this.ui.applySettings(settings);
    }

    initializeEventListeners() {
        // API Key handling
        document.getElementById('apiKey').addEventListener('change', (e) => {
            this.storage.saveApiKey(e.target.value);
            this.api.setApiKey(e.target.value);
        });

        // Configuration changes
        document.querySelectorAll('select, input[type="number"]').forEach(element => {
            element.addEventListener('change', () => {
                this.storage.saveSettings(this.ui.getCurrentSettings());
            });
        });

        // Preview button
        document.getElementById('previewBtn').addEventListener('click', () => {
            const text = document.getElementById('inputText').value;
            const settings = this.ui.getCurrentSettings();
            const chunks = this.textProcessor.processText(text, settings);
            this.ui.displayChunkPreview(chunks);
        });

        // Generate button
        document.getElementById('generateBtn').addEventListener('click', async () => {
            const text = document.getElementById('inputText').value;
            const settings = this.ui.getCurrentSettings();
            
            try {
                this.ui.showProgress();
                const chunks = this.textProcessor.processText(text, settings);
                
                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    const audioData = await this.api.generateSpeech(chunk, settings);
                    await this.audioManager.processChunk(audioData, settings);
                    this.ui.updateProgress((i + 1) / chunks.length * 100);
                }

                const finalAudio = await this.audioManager.getFinalAudio();
                this.ui.initializePlayer(finalAudio);
            } catch (error) {
                this.ui.showError(error.message);
            }
        });

        // Audio player controls
        document.getElementById('playPause').addEventListener('click', () => {
            this.audioManager.togglePlayPause();
            this.ui.updatePlayPauseButton(this.audioManager.isPlaying());
        });

        document.getElementById('rewind15').addEventListener('click', () => {
            this.audioManager.skip(-15);
        });

        document.getElementById('forward15').addEventListener('click', () => {
            this.audioManager.skip(15);
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.audioManager.downloadAudio(this.ui.getCurrentSettings().format);
        });
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
