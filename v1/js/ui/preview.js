/**
 * Text chunk preview functionality
 */

import { CONFIG } from '../config.js';
import { splitTextIntoChunks, generateChunkPreviewHtml, validateChunks } from '../utils/text.js';

export class PreviewManager {
    constructor() {
        this.previewBtn = document.getElementById(CONFIG.ELEMENTS.previewBtn);
        this.chunkPreview = document.getElementById(CONFIG.ELEMENTS.chunkPreview);
        this.previewModal = new bootstrap.Modal(document.getElementById(CONFIG.ELEMENTS.previewModal));
        this.chunkCountSpan = document.getElementById(CONFIG.ELEMENTS.chunkCount);
        
        // Silence settings elements
        this.silenceInputs = {
            h1: document.getElementById(CONFIG.ELEMENTS.h1Silence),
            h2: document.getElementById(CONFIG.ELEMENTS.h2Silence),
            paragraph: document.getElementById(CONFIG.ELEMENTS.paragraphSilence),
            chapterEnd: document.getElementById(CONFIG.ELEMENTS.chapterEndSilence)
        };
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        this.previewBtn.addEventListener('click', () => this.showPreview());
    }

    /**
     * Get current silence settings
     * @returns {Object} Current silence settings
     */
    getSilenceSettings() {
        return {
            h1: parseFloat(this.silenceInputs.h1.value),
            h2: parseFloat(this.silenceInputs.h2.value),
            paragraph: parseFloat(this.silenceInputs.paragraph.value),
            chapterEnd: parseFloat(this.silenceInputs.chapterEnd.value)
        };
    }

    /**
     * Show preview modal with chunk information
     * @param {string} text - Text to preview
     */
    showPreview(text) {
        const chunks = splitTextIntoChunks(text);
        const validation = validateChunks(chunks);
        
        this.updateChunkCount(chunks.length);
        this.renderPreview(chunks);

        if (!validation.valid) {
            this.showValidationWarning(validation.message);
        }

        this.previewModal.show();
    }

    /**
     * Show validation warning in preview
     * @param {string} message - Warning message
     */
    showValidationWarning(message) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'alert alert-warning mb-3';
        warningDiv.innerHTML = `
            <i class="bi ${CONFIG.PREVIEW_STYLES.WARNING.icon}"></i>
            ${message}
        `;
        this.chunkPreview.insertBefore(warningDiv, this.chunkPreview.firstChild);
    }

    /**
     * Update chunk count display
     * @param {number} count - Number of chunks
     */
    updateChunkCount(count) {
        this.chunkCountSpan.textContent = count;
    }

    /**
     * Render preview content
     * @param {Array} chunks - Array of text chunks
     */
    renderPreview(chunks) {
        const silenceSettings = this.getSilenceSettings();
        this.chunkPreview.innerHTML = generateChunkPreviewHtml(chunks, silenceSettings);
    }

    /**
     * Hide preview modal
     */
    hidePreview() {
        this.previewModal.hide();
    }

    /**
     * Check if preview modal is visible
     * @returns {boolean} Whether the modal is visible
     */
    isPreviewVisible() {
        return document.getElementById(CONFIG.ELEMENTS.previewModal).classList.contains('show');
    }

    /**
     * Update preview when text changes
     * @param {string} text - Current text
     */
    updatePreviewIfVisible(text) {
        if (this.isPreviewVisible()) {
            this.showPreview(text);
        }
    }

    /**
     * Get chunk information for text
     * @param {string} text - Text to analyze
     * @returns {Object} Chunk information
     */
    getChunkInfo(text) {
        const chunks = splitTextIntoChunks(text);
        const validation = validateChunks(chunks);
        
        return {
            chunks,
            count: chunks.length,
            isValid: validation.valid,
            validationMessage: validation.message
        };
    }
}
