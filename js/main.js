/**
 * Main application class
 */

import { CONFIG } from './config.js';
import { TTSApi } from './api.js';
import { AudioPlayer } from './audio/player.js';
import { AudioProcessor } from './audio/processor.js';
import { SilenceGenerator } from './audio/silence.js';
import { PreviewManager } from './ui/preview.js';
import { ProgressManager } from './ui/progress.js';
import { StateManager } from './utils/storage.js';
import { splitTextIntoChunks } from './utils/text.js';

class VoiceBox {
    constructor() {
        this.initializeComponents();
        this.initializeEventListeners();
        this.loadSavedState();
    }

    /**
     * Initialize all component classes
     */
    initializeComponents() {
        this.audioPlayer = new AudioPlayer();
        this.previewManager = new PreviewManager();
        this.progressManager = new ProgressManager();
        
        // Initialize UI elements
        this.elements = {
            apiKey: document.getElementById(CONFIG.ELEMENTS.apiKey),
            model: document.getElementById(CONFIG.ELEMENTS.model),
            voice: document.getElementById(CONFIG.ELEMENTS.voice),
            format: document.getElementById(CONFIG.ELEMENTS.format),
            text: document.getElementById(CONFIG.ELEMENTS.text),
            maxChars: document.getElementById(CONFIG.ELEMENTS.maxChars),
            preSilence: document.getElementById(CONFIG.ELEMENTS.preSilence),
            postSilence: document.getElementById(CONFIG.ELEMENTS.postSilence),
            generateBtn: document.getElementById(CONFIG.ELEMENTS.generateBtn),
            downloadBtn: document.getElementById(CONFIG.ELEMENTS.downloadBtn)
        };

        this.processedChunks = [];
        this.audioBlob = null;
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Generate button
        this.elements.generateBtn.addEventListener('click', () => this.generateSpeech());
        
        // Download button
        this.elements.downloadBtn.addEventListener('click', () => this.downloadAudio());
        
        // Text and max chars input
        this.elements.text.addEventListener('input', () => this.handleTextChange());
        this.elements.maxChars.addEventListener('input', () => this.handleTextChange());
        
        // Save state on input changes
        Object.keys(this.elements).forEach(key => {
            const element = this.elements[key];
            if (element && element.addEventListener) {
                element.addEventListener('input', () => this.saveState());
            }
        });
    }

    /**
     * Load saved state
     */
    loadSavedState() {
        const state = StateManager.loadState();
        Object.entries(state).forEach(([key, value]) => {
            if (this.elements[key]) {
                this.elements[key].value = value;
            }
        });
        this.handleTextChange();
    }

    /**
     * Save current state
     */
    saveState() {
        const state = {};
        Object.entries(this.elements).forEach(([key, element]) => {
            if (element && element.value !== undefined) {
                state[key] = element.value;
            }
        });
        StateManager.saveState(state);
    }

    /**
     * Handle text or max characters change
     */
    handleTextChange() {
        const text = this.elements.text.value;
        const maxChars = parseInt(this.elements.maxChars.value);
        this.previewManager.updatePreviewIfVisible(text, maxChars);
        const chunks = splitTextIntoChunks(text, maxChars);
        this.previewManager.updateChunkCount(chunks.length);
    }

    /**
     * Generate speech from text
     */
    async generateSpeech() {
        if (!this.validateInput()) return;

        this.progressManager.showProgress();
        this.processedChunks = [];

        try {
            const text = this.elements.text.value;
            const maxChars = parseInt(this.elements.maxChars.value);
            const chunks = splitTextIntoChunks(text, maxChars);
            const format = this.elements.format.value;
            
            // Add pre-silence if needed
            const preSilence = parseFloat(this.elements.preSilence.value);
            if (preSilence > 0) {
                const silenceBlob = await SilenceGenerator.generateSilence(preSilence, format);
                this.processedChunks.push(silenceBlob);
            }

            // Process each chunk
            const tracker = this.progressManager.createProgressTracker(chunks.length);
            for (let i = 0; i < chunks.length; i++) {
                const audioBlob = await TTSApi.generateSpeech(chunks[i], {
                    apiKey: this.elements.apiKey.value,
                    model: this.elements.model.value,
                    voice: this.elements.voice.value,
                    format: format
                });
                this.processedChunks.push(audioBlob);
                tracker.increment();
            }

            // Add post-silence if needed
            const postSilence = parseFloat(this.elements.postSilence.value);
            if (postSilence > 0) {
                const silenceBlob = await SilenceGenerator.generateSilence(postSilence, format);
                this.processedChunks.push(silenceBlob);
            }

            // Combine all audio chunks
            this.audioBlob = await AudioProcessor.combineAudioBlobs(this.processedChunks, format);
            
            // Set up audio player
            const audioUrl = URL.createObjectURL(this.audioBlob);
            this.audioPlayer.setAudioSource(audioUrl);
            this.elements.downloadBtn.disabled = false;
            
            // Auto-play the generated audio
            this.audioPlayer.play();
        } catch (error) {
            this.progressManager.showError(error.message);
        } finally {
            this.progressManager.hideProgress();
        }
    }

    /**
     * Validate input before processing
     * @returns {boolean} Whether input is valid
     */
    validateInput() {
        if (!this.elements.text.value.trim()) {
            alert('Please enter text to convert to speech');
            return false;
        }
        if (!this.elements.apiKey.value) {
            alert('Please enter your OpenAI API key');
            return false;
        }
        return true;
    }

    /**
     * Download generated audio
     */
    downloadAudio() {
        if (!this.audioBlob) return;
        
        const format = this.elements.format.value;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(this.audioBlob);
        a.download = `voicebox-audio.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VoiceBox();
});
