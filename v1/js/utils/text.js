/**
 * Text processing utilities
 */

import { CONFIG } from '../config.js';

/**
 * Represents a text chunk with its type and content
 * @typedef {Object} TextChunk
 * @property {string} type - Type of chunk ('h1', 'h2', 'paragraph', 'chapter_end')
 * @property {string} content - The text content
 * @property {number} length - Length of the content
 * @property {boolean} isValid - Whether length is within limits
 */

/**
 * Split text into chunks based on headings and paragraphs
 * @param {string} text - The text to split into chunks
 * @returns {Array<TextChunk>} Array of text chunks
 */
export function splitTextIntoChunks(text) {
    if (!text || !text.trim()) {
        return [];
    }

    const chunks = [];
    const lines = text.split('\n');
    let currentChunk = '';
    let currentType = 'paragraph';

    function addChunk(content, type) {
        const trimmedContent = content.trim();
        if (trimmedContent || type === 'chapter_end') {
            chunks.push(createChunk(trimmedContent, type));
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Check for chapter end marker
        if (line === CONFIG.TEXT_MARKERS.CHAPTER_END) {
            if (currentChunk) {
                addChunk(currentChunk, currentType);
                currentChunk = '';
            }
            addChunk('', 'chapter_end');
            continue;
        }

        // Check for headings
        if (line.startsWith(CONFIG.TEXT_MARKERS.H1)) {
            if (currentChunk) {
                addChunk(currentChunk, currentType);
            }
            currentChunk = line.substring(CONFIG.TEXT_MARKERS.H1.length);
            currentType = 'h1';
            continue;
        }

        if (line.startsWith(CONFIG.TEXT_MARKERS.H2)) {
            if (currentChunk) {
                addChunk(currentChunk, currentType);
            }
            currentChunk = line.substring(CONFIG.TEXT_MARKERS.H2.length);
            currentType = 'h2';
            continue;
        }

        // Handle paragraphs
        if (currentType === 'h1' || currentType === 'h2') {
            if (line) {
                addChunk(currentChunk, currentType);
                currentChunk = line;
                currentType = 'paragraph';
            }
        } else {
            // If empty line and we have content, start new paragraph
            if (!line && currentChunk) {
                addChunk(currentChunk, currentType);
                currentChunk = '';
            } else if (line) {
                currentChunk = currentChunk 
                    ? `${currentChunk}\n${line}`
                    : line;
            }
        }
    }

    // Add remaining chunk if any
    if (currentChunk) {
        addChunk(currentChunk, currentType);
    }

    return chunks.filter(chunk => {
        // Keep non-empty chunks and chapter end markers
        return chunk.type === 'chapter_end' || chunk.content.trim().length > 0;
    });
}

/**
 * Create a chunk object
 * @param {string} content - Chunk content
 * @param {string} type - Chunk type
 * @returns {TextChunk} Chunk object
 */
function createChunk(content, type) {
    const trimmedContent = content.trim();
    return {
        type,
        content: trimmedContent,
        length: trimmedContent.length,
        isValid: type === 'chapter_end' || (trimmedContent.length > 0 && trimmedContent.length <= CONFIG.MAX_CHARS)
    };
}

/**
 * Generate preview HTML for text chunks
 * @param {Array<TextChunk>} chunks - Array of text chunks
 * @param {Object} silenceSettings - Silence duration settings
 * @returns {string} HTML string for preview
 */
export function generateChunkPreviewHtml(chunks, silenceSettings) {
    return chunks.map((chunk, index) => {
        const isLast = index === chunks.length - 1;
        const nextChunk = !isLast ? chunks[index + 1] : null;
        
        let silenceDuration = 0;
        if (!isLast) {
            if (chunk.type === 'h1') silenceDuration = silenceSettings.h1;
            else if (chunk.type === 'h2') silenceDuration = silenceSettings.h2;
            else if (chunk.type === 'paragraph') silenceDuration = silenceSettings.paragraph;
            else if (chunk.type === 'chapter_end') silenceDuration = silenceSettings.chapterEnd;
        }

        const styles = CONFIG.PREVIEW_STYLES[chunk.type === 'h1' ? 'H1' : chunk.type === 'h2' ? 'H2' : ''];
        const styleString = styles ? `style="font-size:${styles.fontSize};font-weight:${styles.fontWeight};color:${styles.color}"` : '';

        return `
            <div class="card mb-2">
                <div class="card-header bg-light d-flex justify-content-between align-items-center">
                    <span>${getChunkTypeLabel(chunk.type)} ${chunk.type !== 'chapter_end' ? `(${chunk.length} characters)` : ''}</span>
                    ${!chunk.isValid && chunk.type !== 'chapter_end' ? `
                        <span class="text-danger">
                            <i class="bi ${CONFIG.PREVIEW_STYLES.WARNING.icon}"></i> Exceeds ${CONFIG.MAX_CHARS} character limit
                        </span>
                    ` : ''}
                </div>
                ${chunk.content ? `
                    <div class="card-body">
                        <pre class="mb-0" ${styleString}>${chunk.content}</pre>
                    </div>
                ` : ''}
                ${!isLast && silenceDuration > 0 ? `
                    <div class="card-footer bg-light text-center" style="color:${CONFIG.PREVIEW_STYLES.SILENCE_INDICATOR.color};font-size:${CONFIG.PREVIEW_STYLES.SILENCE_INDICATOR.fontSize}">
                        <i class="bi bi-arrow-down"></i>
                        ${silenceDuration} seconds silence
                        <i class="bi bi-arrow-down"></i>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

/**
 * Get display label for chunk type
 * @param {string} type - Chunk type
 * @returns {string} Display label
 */
function getChunkTypeLabel(type) {
    switch (type) {
        case 'h1': return 'Chapter Heading (H1)';
        case 'h2': return 'Section Heading (H2)';
        case 'chapter_end': return 'Chapter End';
        default: return 'Paragraph';
    }
}

/**
 * Validate text chunks
 * @param {Array<TextChunk>} chunks - Array of chunks to validate
 * @returns {Object} Validation result
 */
export function validateChunks(chunks) {
    const invalidChunks = chunks.filter(chunk => !chunk.isValid);
    return {
        valid: invalidChunks.length === 0,
        invalidChunks,
        message: invalidChunks.length > 0
            ? `${invalidChunks.length} chunk(s) exceed the ${CONFIG.MAX_CHARS} character limit`
            : null
    };
}
