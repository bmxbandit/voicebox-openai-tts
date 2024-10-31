/**
 * Main application class
 */

import { CONFIG } from './config.js';
import { AudioPlayer } from './audio/player.js';
import { SpeechGenerator } from './audio/generator.js';
import { PreviewManager } from './ui/preview.js';
import { ProgressManager } from './ui/progress.js';
import { StateManager } from './utils/storage.js';
import { splitTextIntoChunks, validateChunks } from './utils/text.js';

class VoiceBox {
    constructor() {
        this.initializeComponents();
        this.initializeEventListeners();
        this.loadSavedState();
        this.isProcessing = false;
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
            generateBtn: document.getElementById(CONFIG.ELEMENTS.generateBtn),
            downloadBtn: document.getElementById(CONFIG.ELEMENTS.downloadBtn),
            h1Silence: document.getElementById(CONFIG.ELEMENTS.h1Silence),
            h2Silence: document.getElementById(CONFIG.ELEMENTS.h2Silence),
            paragraphSilence: document.getElementById(CONFIG.ELEMENTS.paragraphSilence),
            chapterEndSilence: document.getElementById(CONFIG.ELEMENTS.chapterEndSilence)
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
        
        // Text input
        this.elements.text.addEventListener('input', () => this.handleTextChange());
        
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
        
        // Load basic settings
        Object.entries(state).forEach(([key, value]) => {
            if (this.elements[key] && key !== 'silenceSettings') {
                this.elements[key].value = value;
            }
        });

        // Load silence settings
        if (state.silenceSettings) {
            this.elements.h1Silence.value = state.silenceSettings.h1;
            this.elements.h2Silence.value = state.silenceSettings.h2;
            this.elements.paragraphSilence.value = state.silenceSettings.paragraph;
            this.elements.chapterEndSilence.value = state.silenceSettings.chapterEnd;
        }

        this.handleTextChange();
    }

    /**
     * Save current state
     */
    saveState() {
        const state = {
            apiKey: this.elements.apiKey.value,
            model: this.elements.model.value,
            voice: this.elements.voice.value,
            format: this.elements.format.value,
            text: this.elements.text.value,
            silenceSettings: this.getSilenceSettings()
        };
        StateManager.saveState(state);
    }

    /**
     * Handle text change
     */
    handleTextChange() {
        const text = this.elements.text.value;
        const chunks = splitTextIntoChunks(text);
        this.previewManager.updatePreviewIfVisible(text);
        this.previewManager.updateChunkCount(chunks.length);
    }

    /**
     * Get current silence settings
     */
    getSilenceSettings() {
        return {
            h1: parseFloat(this.elements.h1Silence.value),
            h2: parseFloat(this.elements.h2Silence.value),
            paragraph: parseFloat(this.elements.paragraphSilence.value),
            chapterEnd: parseFloat(this.elements.chapterEndSilence.value)
        };
    }

    /**
     * Generate speech from text
     */
    async generateSpeech() {
        if (this.isProcessing) {
            console.log('Already processing, please wait...');
            return;
        }

        if (!this.validateInput()) return;

        this.isProcessing = true;
        this.progressManager.showProgress();

        try {
            const text = this.elements.text.value;
            const chunks = splitTextIntoChunks(text);
            const validation = validateChunks(chunks);
            
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            // Prepare generation options
            const options = {
                apiKey: this.elements.apiKey.value,
                model: this.elements.model.value,
                voice: this.elements.voice.value,
                format: this.elements.format.value,
                silenceSettings: this.getSilenceSettings()
            };

            // Generate speech with progress tracking
            this.audioBlob = await SpeechGenerator.generateSpeechFromChunks(
                chunks,
                options,
                (current, total) => this.progressManager.updateChunkProgress(current, total)
            );
            
            // Set up audio player
            const audioUrl = URL.createObjectURL(this.audioBlob);
            this.audioPlayer.setAudioSource(audioUrl);
            this.elements.downloadBtn.disabled = false;
            
            // Auto-play the generated audio
            this.audioPlayer.play();
            
            // Show success message
            this.progressManager.showSuccess('Audio generated successfully!');
        } catch (error) {
            console.error('Speech generation error:', error);
            this.progressManager.showError(error.message);
        } finally {
            this.isProcessing = false;
            this.progressManager.hideProgress();
        }
    }

    /**
     * Validate input before processing
     */
    validateInput() {
        if (!this.elements.text.value.trim()) {
            this.progressManager.showError(CONFIG.ERRORS.TEXT_EMPTY);
            return false;
        }
        if (!this.elements.apiKey.value) {
            this.progressManager.showError(CONFIG.ERRORS.API_KEY_MISSING);
            return false;
        }

        const silenceSettings = this.getSilenceSettings();
        Object.entries(silenceSettings).forEach(([key, value]) => {
            if (value < 0 || value > 10) {
                this.progressManager.showError(`${key} silence must be between 0 and 10 seconds`);
                return false;
            }
        });

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
