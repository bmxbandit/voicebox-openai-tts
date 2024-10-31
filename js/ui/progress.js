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
        
        this.isProcessing = false;
    }

    /**
     * Show processing progress indicators
     */
    showProgress() {
        this.isProcessing = true;
        this.processingProgress.style.display = 'block';
        this.setGenerateButtonLoading(true);
        this.updateChunkProgress(0, 0);
    }

    /**
     * Hide processing progress indicators
     */
    hideProgress() {
        this.isProcessing = false;
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
        
        const percentage = total > 0 ? (current / total) * 100 : 0;
        this.progressBar.style.width = `${percentage}%`;
        
        // Update generate button text
        if (this.isProcessing) {
            this.generateBtn.innerHTML = `<i class="bi bi-hourglass-split"></i> Processing ${current}/${total}`;
        }
    }

    /**
     * Set generate button to loading state
     * @param {boolean} isLoading - Whether the button should show loading state
     */
    setGenerateButtonLoading(isLoading) {
        this.generateBtn.disabled = isLoading;
        if (!isLoading) {
            this.generateBtn.innerHTML = '<i class="bi bi-mic-fill"></i> Generate';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        // Create error alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
        alertDiv.innerHTML = `
            <i class="bi ${CONFIG.PREVIEW_STYLES.WARNING.icon}"></i>
            <strong>Error:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert after the progress bar
        this.processingProgress.parentNode.insertBefore(alertDiv, this.processingProgress.nextSibling);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
        }, 5000);

        this.hideProgress();
    }

    /**
     * Show success message
     * @param {string} message - Success message to display
     */
    showSuccess(message) {
        // Create success alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
        alertDiv.innerHTML = `
            <i class="bi bi-check-circle-fill"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert after the progress bar
        this.processingProgress.parentNode.insertBefore(alertDiv, this.processingProgress.nextSibling);

        // Auto-hide after 3 seconds
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
        }, 3000);
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
            }),

            /**
             * Update total steps
             * @param {number} newTotal - New total number of steps
             */
            updateTotal: (newTotal) => {
                totalSteps = newTotal;
                this.updateChunkProgress(currentStep, totalSteps);
            }
        };
    }
}
