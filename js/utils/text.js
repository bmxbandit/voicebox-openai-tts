/**
 * Text processing utilities
 */

/**
 * Split text into chunks based on paragraph boundaries and maximum character limit
 * @param {string} text - The text to split into chunks
 * @param {number} maxChars - Maximum characters per chunk
 * @returns {Array<string>} Array of text chunks
 */
export function splitTextIntoChunks(text, maxChars) {
    const paragraphs = text.split(/\n\s*\n/);
    const chunks = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        const trimmedParagraph = paragraph.trim();
        if (!trimmedParagraph) continue;

        // If adding this paragraph would exceed maxChars, start a new chunk
        if (currentChunk && (currentChunk.length + trimmedParagraph.length + 2) > maxChars) {
            chunks.push(currentChunk.trim());
            currentChunk = trimmedParagraph;
        } else {
            // Add paragraph to current chunk with double newline if not first paragraph
            currentChunk = currentChunk 
                ? `${currentChunk}\n\n${trimmedParagraph}` 
                : trimmedParagraph;
        }
    }

    // Add the last chunk if there is one
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * Get information about text chunks
 * @param {string} text - The text to analyze
 * @param {number} maxChars - Maximum characters per chunk
 * @returns {Object} Object containing chunk information
 */
export function getChunkInfo(text, maxChars) {
    const chunks = splitTextIntoChunks(text, maxChars);
    return {
        count: chunks.length,
        chunks: chunks.map((chunk, index) => ({
            index,
            text: chunk,
            length: chunk.length,
            paragraphs: chunk.split(/\n\s*\n/).length
        }))
    };
}

/**
 * Generate preview HTML for text chunks
 * @param {Array<string>} chunks - Array of text chunks
 * @returns {string} HTML string for preview
 */
export function generateChunkPreviewHtml(chunks) {
    return chunks.map((chunk, index) => `
        <div class="card mb-2">
            <div class="card-header bg-light">
                Chunk ${index + 1} (${chunk.length} characters)
            </div>
            <div class="card-body">
                <pre class="mb-0" style="white-space: pre-wrap;">${chunk}</pre>
            </div>
        </div>
    `).join('');
}

/**
 * Validate text length against OpenAI's limits
 * @param {string} text - Text to validate
 * @param {number} maxChars - Maximum characters allowed
 * @returns {Object} Validation result
 */
export function validateText(text, maxChars) {
    const chunks = splitTextIntoChunks(text, maxChars);
    const invalid = chunks.some(chunk => chunk.length > maxChars);
    
    return {
        valid: !invalid,
        chunks: chunks.length,
        totalLength: text.length,
        error: invalid ? `Some chunks exceed the ${maxChars} character limit` : null
    };
}
