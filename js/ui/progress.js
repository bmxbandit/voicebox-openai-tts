/**
 * Progress indicators and status updates
 */

import { CONFIG } from '../config.js';

export class ProgressManager {
    constructor() {
        this.processingProgress = document.getElementById(CONFIG.ELEMENTS.processingProgress);
        this.currentChunkSpan = document.getElementById(CONFIG.ELEMENTS.currentChunk);
        this.totalChunksSpan = document.getElementById(CONFIG.ELEMENTS.totalChunks);
        this.generateBtn = document.getElementById(CONFIG.ELEMENTS.generateBtn);
        this.progressBar = document.querySelector('#processingProgress .progress-bar');
    }

    /**
     * Show processing progress indicators
     */
    showProgress() {
        this.processingProgress.style.display = 'block';
        this.setGenerateButtonLoading(true);
    }

    /**
     * Hide processing progress indicators
     */
    hideProgress() {
        this.processingProgress.style.display = 'none';
        this.setGenerateButtonLoading(false);
    }

    /**
     * Update chunk processing progress
     * @param {number} current - Current chunk number
     * @param {number} total - Total number of chunks
     */
    updateChunkProgress(current, total) {
        this.currentChunkSpan.textContent = current;
        this.totalChunksSpan.textContent = total;
        
        const percentage = (current / total) * 100;
        this.progressBar.style.width = `${percentage}%`;
    }

    /**
     * Set generate button to loading state
     * @param {boolean} isLoading - Whether the button should show loading state
     */
    setGenerateButtonLoading(isLoading) {
        this.generateBtn.disabled = isLoading;
        this.generateBtn.innerHTML = isLoading 
            ? '<i class="bi bi-hourglass-split"></i> Generating...'
            : '<i class="bi bi-mic-fill"></i> Generate';
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        alert(message); // Could be enhanced with a better UI for error messages
        this.hideProgress();
    }

    /**
     * Reset progress indicators
     */
    reset() {
        this.hideProgress();
        this.updateChunkProgress(0, 0);
    }

    /**
     * Create a progress tracker for async operations
     * @param {number} totalSteps - Total number of steps
     * @returns {Object} Progress tracker methods
     */
    createProgressTracker(totalSteps) {
        let currentStep = 0;

        return {
            /**
             * Increment progress by one step
             */
            increment: () => {
                currentStep++;
                this.updateChunkProgress(currentStep, totalSteps);
            },

            /**
             * Set progress to specific step
             * @param {number} step - Step number
             */
            setStep: (step) => {
                currentStep = step;
                this.updateChunkProgress(currentStep, totalSteps);
            },

            /**
             * Get current progress
             * @returns {Object} Current progress information
             */
            getProgress: () => ({
                current: currentStep,
                total: totalSteps,
                percentage: (currentStep / totalSteps) * 100
            })
        };
    }
}
