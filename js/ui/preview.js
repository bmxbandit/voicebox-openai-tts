/**
 * Text chunk preview functionality
 */

import { CONFIG } from '../config.js';
import { getChunkInfo, generateChunkPreviewHtml } from '../utils/text.js';

export class PreviewManager {
    constructor() {
        this.previewBtn = document.getElementById(CONFIG.ELEMENTS.previewBtn);
        this.chunkPreview = document.getElementById(CONFIG.ELEMENTS.chunkPreview);
        this.previewModal = new bootstrap.Modal(document.getElementById(CONFIG.ELEMENTS.previewModal));
        this.chunkCountSpan = document.getElementById(CONFIG.ELEMENTS.chunkCount);
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        this.previewBtn.addEventListener('click', () => this.showPreview());
    }

    /**
     * Show preview modal with chunk information
     * @param {string} text - Text to preview
     * @param {number} maxChars - Maximum characters per chunk
     */
    showPreview(text, maxChars) {
        const chunkInfo = getChunkInfo(text, maxChars);
        this.updateChunkCount(chunkInfo.count);
        this.renderPreview(chunkInfo.chunks);
        this.previewModal.show();
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
     * @param {Array} chunks - Array of chunk information
     */
    renderPreview(chunks) {
        this.chunkPreview.innerHTML = chunks.map((chunk, index) => `
            <div class="card mb-2">
                <div class="card-header bg-light d-flex justify-content-between align-items-center">
                    <span>Chunk ${index + 1} (${chunk.length} characters)</span>
                    <small class="text-muted">${chunk.paragraphs} paragraph(s)</small>
                </div>
                <div class="card-body">
                    <pre class="mb-0" style="white-space: pre-wrap;">${chunk.text}</pre>
                </div>
            </div>
        `).join('');
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
     * Update preview when text or max characters change
     * @param {string} text - Current text
     * @param {number} maxChars - Current max characters
     */
    updatePreviewIfVisible(text, maxChars) {
        if (this.isPreviewVisible()) {
            this.showPreview(text, maxChars);
        }
    }
}
