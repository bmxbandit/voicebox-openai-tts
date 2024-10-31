/**
 * Audio player controls and management
 */

import { CONFIG } from '../config.js';

export class AudioPlayer {
    constructor() {
        this.audioElement = document.getElementById(CONFIG.ELEMENTS.audioPlayer);
        this.playPauseBtn = document.getElementById(CONFIG.ELEMENTS.playPauseBtn);
        this.skipBackBtn = document.getElementById(CONFIG.ELEMENTS.skipBackBtn);
        this.skipForwardBtn = document.getElementById(CONFIG.ELEMENTS.skipForwardBtn);
        this.progressBar = document.querySelector(CONFIG.ELEMENTS.progressBar);
        this.progress = document.querySelector(CONFIG.ELEMENTS.progress);
        
        this.isPlaying = false;
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for audio controls
     */
    initializeEventListeners() {
        // Play/Pause button
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        
        // Skip buttons
        this.skipBackBtn.addEventListener('click', () => this.skipBack());
        this.skipForwardBtn.addEventListener('click', () => this.skipForward());
        
        // Progress bar
        this.progress.addEventListener('click', (e) => this.seekAudio(e));
        
        // Audio player events
        this.audioElement.addEventListener('timeupdate', () => this.updateProgress());
        this.audioElement.addEventListener('ended', () => this.handleAudioEnd());
    }

    /**
     * Set the audio source and prepare for playback
     * @param {string} audioUrl - URL of the audio to play
     */
    setAudioSource(audioUrl) {
        this.audioElement.src = audioUrl;
        this.enableControls();
    }

    /**
     * Enable audio control buttons
     */
    enableControls() {
        this.playPauseBtn.disabled = false;
        this.skipBackBtn.disabled = false;
        this.skipForwardBtn.disabled = false;
    }

    /**
     * Disable audio control buttons
     */
    disableControls() {
        this.playPauseBtn.disabled = true;
        this.skipBackBtn.disabled = true;
        this.skipForwardBtn.disabled = true;
    }

    /**
     * Play audio
     */
    play() {
        this.audioElement.play();
        this.isPlaying = true;
        this.playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
    }

    /**
     * Pause audio
     */
    pause() {
        this.audioElement.pause();
        this.isPlaying = false;
        this.playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    }

    /**
     * Toggle between play and pause
     */
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Skip backward by 15 seconds
     */
    skipBack() {
        this.audioElement.currentTime = Math.max(0, this.audioElement.currentTime - 15);
    }

    /**
     * Skip forward by 15 seconds
     */
    skipForward() {
        this.audioElement.currentTime = Math.min(
            this.audioElement.duration,
            this.audioElement.currentTime + 15
        );
    }

    /**
     * Update progress bar based on current playback position
     */
    updateProgress() {
        const progress = (this.audioElement.currentTime / this.audioElement.duration) * 100;
        this.progressBar.style.width = `${progress}%`;
    }

    /**
     * Seek to position in audio when progress bar is clicked
     * @param {Event} event - Click event on progress bar
     */
    seekAudio(event) {
        const rect = this.progress.getBoundingClientRect();
        const pos = (event.clientX - rect.left) / rect.width;
        this.audioElement.currentTime = pos * this.audioElement.duration;
    }

    /**
     * Handle audio playback end
     */
    handleAudioEnd() {
        this.isPlaying = false;
        this.playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    }

    /**
     * Get current playback time
     * @returns {number} Current time in seconds
     */
    getCurrentTime() {
        return this.audioElement.currentTime;
    }

    /**
     * Get total audio duration
     * @returns {number} Duration in seconds
     */
    getDuration() {
        return this.audioElement.duration;
    }

    /**
     * Check if audio is currently playing
     * @returns {boolean} True if playing, false if paused
     */
    isAudioPlaying() {
        return this.isPlaying;
    }
}
