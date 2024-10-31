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
import { splitTextIntoChunks, validateChunks } from './utils/text.js';

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
            silenceSettings: {
                h1: parseFloat(this.elements.h1Silence.value),
                h2: parseFloat(this.elements.h2Silence.value),
                paragraph: parseFloat(this.elements.paragraphSilence.value),
                chapterEnd: parseFloat(this.elements.chapterEndSilence.value)
            }
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
        if (!this.validateInput()) return;

        this.progressManager.showProgress();
        this.processedChunks = [];

        try {
            const text = this.elements.text.value;
            const chunks = splitTextIntoChunks(text);
            const validation = validateChunks(chunks);
            
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            const format = this.elements.format.value;
            const silenceSettings = this.getSilenceSettings();
            
            // Process each chunk
            const tracker = this.progressManager.createProgressTracker(chunks.length);
            
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                tracker.increment();

                // Skip empty chunks and chapter end markers
                if (!chunk.content.trim()) {
                    if (chunk.type === 'chapter_end' && i < chunks.length - 1) {
                        const silenceBlob = await SilenceGenerator.generateChunkSilence(
                            'chapter_end',
                            silenceSettings,
                            format
                        );
                        if (silenceBlob) {
                            this.processedChunks.push(silenceBlob);
                        }
                    }
                    continue;
                }

                try {
                    const audioBlob = await TTSApi.generateSpeech(chunk.content, {
                        apiKey: this.elements.apiKey.value,
                        model: this.elements.model.value,
                        voice: this.elements.voice.value,
                        format: format
                    });
                    this.processedChunks.push(audioBlob);

                    // Add silence after chunk if needed
                    if (i < chunks.length - 1) {
                        const silenceBlob = await SilenceGenerator.generateChunkSilence(
                            chunk.type,
                            silenceSettings,
                            format
                        );
                        if (silenceBlob) {
                            this.processedChunks.push(silenceBlob);
                        }
                    }
                } catch (error) {
                    console.error(`Error processing chunk ${i + 1}:`, error);
                    throw new Error(`Failed to process chunk ${i + 1}: ${error.message}`);
                }
            }

            if (this.processedChunks.length === 0) {
                throw new Error('No audio was generated. Please check your input text.');
            }

            // Combine all audio
            this.audioBlob = await AudioProcessor.combineAudioBlobs(this.processedChunks, format);
            
            // Set up audio player
            const audioUrl = URL.createObjectURL(this.audioBlob);
            this.audioPlayer.setAudioSource(audioUrl);
            this.elements.downloadBtn.disabled = false;
            
            // Auto-play the generated audio
            this.audioPlayer.play();
        } catch (error) {
            console.error('Speech generation error:', error);
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

        const silenceValidation = SilenceGenerator.validateSilenceSettings(this.getSilenceSettings());
        if (!silenceValidation.valid) {
            alert(silenceValidation.errors.join('\n'));
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
