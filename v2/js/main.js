import { TextProcessor } from './utils/textProcessor.js';
import { AudioManager } from './audio/audioManager.js';
import { UIManager } from './ui/uiManager.js';
import { StorageManager } from './utils/storageManager.js';
import { ApiClient } from './api/apiClient.js';

class App {
    constructor() {
        // Wait for DOM to be fully loaded before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        try {
            this.storage = new StorageManager();
            this.textProcessor = new TextProcessor();
            this.audioManager = new AudioManager();
            this.ui = new UIManager();
            this.api = new ApiClient();
            
            this.init();
        } catch (error) {
            console.error('Initialization error:', error);
            alert('Failed to initialize application');
        }
    }

    async init() {
        try {
            // Set up storage callbacks
            this.ui.onSaveSettings = (settings) => this.storage.saveSettings(settings);
            this.ui.onSaveTextInput = (text) => this.storage.saveTextInput(text);
            
            // Load saved state
            this.loadSavedState();
            
            // Initialize event listeners
            this.initializeEventListeners();
        } catch (error) {
            console.error('Initialization error:', error);
            this.ui.showError('Failed to initialize application');
        }
    }

    loadSavedState() {
        try {
            // Load and apply settings
            const settings = this.storage.getSettings();
            this.ui.applySettings(settings);

            // Load and set API key
            const apiKey = this.storage.getApiKey();
            if (apiKey) {
                this.ui.elements.apiKey.value = apiKey;
                this.api.setApiKey(apiKey);
            }

            // Load and set text input
            const savedText = this.storage.getTextInput();
            if (savedText) {
                this.ui.setTextInput(savedText);
            }
        } catch (error) {
            console.error('Error loading saved state:', error);
        }
    }

    initializeEventListeners() {
        if (!this.ui.elements) {
            throw new Error('UI elements not initialized');
        }

        try {
            // API Key handling
            this.ui.elements.apiKey?.addEventListener('change', (e) => {
                this.storage.saveApiKey(e.target.value);
                this.api.setApiKey(e.target.value);
            });

            // Preview button
            this.ui.elements.previewBtn?.addEventListener('click', () => {
                try {
                    const text = this.ui.elements.inputText.value;
                    const settings = this.ui.getCurrentSettings();
                    const chunks = this.textProcessor.processText(text, settings);
                    this.ui.displayChunkPreview(chunks);
                } catch (error) {
                    console.error('Preview error:', error);
                    this.ui.showError('Failed to generate preview');
                }
            });

            // Generate button
            this.ui.elements.generateBtn?.addEventListener('click', async () => {
                try {
                    // Validate API key
                    if (!this.api.getApiKey()) {
                        throw new Error('Please enter your OpenAI API key');
                    }

                    // Initialize AudioContext on user interaction
                    this.audioManager.initializeAudioContext();
                    
                    const text = this.ui.elements.inputText.value;
                    if (!text.trim()) {
                        throw new Error('Please enter some text to convert');
                    }

                    const settings = this.ui.getCurrentSettings();
                    this.ui.showProgress();
                    
                    const chunks = this.textProcessor.processText(text, settings);
                    console.log('Processing chunks:', chunks);

                    for (let i = 0; i < chunks.length; i++) {
                        const chunk = chunks[i];
                        
                        if (typeof chunk === 'object' && chunk.type === 'silence') {
                            // Handle silence chunk
                            console.log(`Adding silence: ${chunk.silence}s`);
                            await this.audioManager.processChunk({
                                audio: null,
                                silence: chunk.silence
                            }, settings);
                        } else if (typeof chunk === 'string' && chunk.trim()) {
                            // Handle text chunk
                            console.log(`Processing text chunk: ${chunk.substring(0, 50)}...`);
                            const audioData = await this.api.generateSpeech(chunk, settings);
                            if (audioData) {
                                await this.audioManager.processChunk({
                                    audio: audioData,
                                    silence: 0
                                }, settings);
                            }
                        }

                        this.ui.updateProgress((i + 1) / chunks.length * 100);
                    }

                    const finalAudio = await this.audioManager.getFinalAudio();
                    if (finalAudio) {
                        this.ui.initializePlayer(finalAudio);
                        this.setupAudioControls(); // Re-setup controls after new audio
                    }
                } catch (error) {
                    console.error('Generation error:', error);
                    this.ui.showError(error.message || 'Failed to generate audio');
                }
            });

            this.setupAudioControls();
        } catch (error) {
            console.error('Error setting up event listeners:', error);
            throw new Error('Failed to initialize controls');
        }
    }

    setupAudioControls() {
        // Audio player controls
        this.ui.elements.playPause?.addEventListener('click', () => {
            try {
                this.audioManager.togglePlayPause();
                this.ui.updatePlayPauseButton(this.audioManager.isPlaying);
            } catch (error) {
                console.error('Playback error:', error);
                this.ui.showError('Failed to toggle playback');
            }
        });

        this.ui.elements.rewind15?.addEventListener('click', () => {
            try {
                this.audioManager.skip(-15);
            } catch (error) {
                console.error('Skip error:', error);
                this.ui.showError('Failed to skip backward');
            }
        });

        this.ui.elements.forward15?.addEventListener('click', () => {
            try {
                this.audioManager.skip(15);
            } catch (error) {
                console.error('Skip error:', error);
                this.ui.showError('Failed to skip forward');
            }
        });

        this.ui.elements.downloadBtn?.addEventListener('click', () => {
            try {
                this.audioManager.downloadAudio(this.ui.getCurrentSettings().format);
            } catch (error) {
                console.error('Download error:', error);
                this.ui.showError('Failed to download audio');
            }
        });
    }
}

// Initialize the application
new App();
