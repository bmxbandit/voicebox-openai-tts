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
        // Set up storage callbacks
        this.ui.onSaveSettings = (settings) => this.storage.saveSettings(settings);
        this.ui.onSaveTextInput = (text) => this.storage.saveTextInput(text);
        
        // Load saved state
        this.loadSavedState();
        
        // Initialize event listeners
        this.initializeEventListeners();
    }

    loadSavedState() {
        // Load and apply settings
        const settings = this.storage.getSettings();
        this.ui.applySettings(settings);

        // Load and set API key
        const apiKey = this.storage.getApiKey();
        if (apiKey) {
            document.getElementById('apiKey').value = apiKey;
            this.api.setApiKey(apiKey);
        }

        // Load and set text input
        const savedText = this.storage.getTextInput();
        if (savedText) {
            this.ui.setTextInput(savedText);
        }
    }

    initializeEventListeners() {
        // API Key handling
        document.getElementById('apiKey').addEventListener('change', (e) => {
            this.storage.saveApiKey(e.target.value);
            this.api.setApiKey(e.target.value);
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
            // Initialize AudioContext on user interaction
            this.audioManager.initializeAudioContext();
            
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
                console.error('Audio processing error:', error);
                this.ui.showError(error.message);
            }
        });

        // Audio player controls
        document.getElementById('playPause').addEventListener('click', () => {
            try {
                this.audioManager.togglePlayPause();
                this.ui.updatePlayPauseButton(this.audioManager.isPlaying);
            } catch (error) {
                console.error('Playback error:', error);
                this.ui.showError(error.message);
            }
        });

        document.getElementById('rewind15').addEventListener('click', () => {
            try {
                this.audioManager.skip(-15);
            } catch (error) {
                console.error('Skip error:', error);
                this.ui.showError(error.message);
            }
        });

        document.getElementById('forward15').addEventListener('click', () => {
            try {
                this.audioManager.skip(15);
            } catch (error) {
                console.error('Skip error:', error);
                this.ui.showError(error.message);
            }
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            try {
                this.audioManager.downloadAudio(this.ui.getCurrentSettings().format);
            } catch (error) {
                console.error('Download error:', error);
                this.ui.showError(error.message);
            }
        });
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
