export class TextProcessor {
    processText(text, settings) {
        const chunks = [];
        const paragraphs = this.splitIntoParagraphs(text);
        let currentChunk = '';

        for (const paragraph of paragraphs) {
            // Check for silence marker
            const silenceMatch = paragraph.trim().match(/^{{(\d*\.?\d+)}}$/);
            if (silenceMatch) {
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk.trim());
                    currentChunk = '';
                }
                chunks.push({
                    text: '',
                    silence: parseFloat(silenceMatch[1]),
                    type: 'silence'
                });
                continue;
            }

            // Check if adding this paragraph would exceed the max length
            if ((currentChunk + paragraph).length > settings.maxChars && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }

            // Regular paragraph
            if (paragraph.length > settings.maxChars) {
                // If a single paragraph is too long, split it at sentence boundaries
                const sentences = this.splitIntoSentences(paragraph);
                for (const sentence of sentences) {
                    if ((currentChunk + sentence).length > settings.maxChars && currentChunk.length > 0) {
                        chunks.push(currentChunk.trim());
                        currentChunk = '';
                    }
                    currentChunk += sentence + ' ';
                }
            } else {
                currentChunk += paragraph + '\n\n';
            }
        }

        // Add any remaining text as the final chunk
        if (currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    splitIntoParagraphs(text) {
        // Split on double newlines and filter out empty paragraphs
        return text.split(/\n\s*\n/).filter(para => para.trim().length > 0);
    }

    splitIntoSentences(text) {
        // Basic sentence splitting - can be improved for edge cases
        return text.match(/[^.!?]+[.!?]+/g) || [text];
    }

    getChunkCount(text, settings) {
        return this.processText(text, settings).length;
    }
}
