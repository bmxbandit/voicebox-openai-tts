export class TextProcessor {
    processText(text, settings) {
        const chunks = [];
        const paragraphs = this.splitIntoParagraphs(text);
        let currentChunk = '';

        for (let i = 0; i < paragraphs.length; i++) {
            const paragraph = paragraphs[i].trim();
            
            // Check for silence marker
            const silenceMatch = paragraph.match(/^{{(\d*\.?\d+)}}$/);
            if (silenceMatch) {
                // If we have accumulated text, add it as a chunk before the silence
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk.trim());
                    currentChunk = '';
                }
                
                // Add the silence marker
                chunks.push({
                    text: '',
                    silence: parseFloat(silenceMatch[1]),
                    type: 'silence'
                });
                
                continue;
            }

            // Handle regular text
            if (paragraph.length > settings.maxChars) {
                // If the current paragraph alone exceeds max chars
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk.trim());
                    currentChunk = '';
                }
                
                // Split long paragraph into sentences
                const sentences = this.splitIntoSentences(paragraph);
                let sentenceChunk = '';
                
                for (const sentence of sentences) {
                    if ((sentenceChunk + sentence).length > settings.maxChars) {
                        if (sentenceChunk.length > 0) {
                            chunks.push(sentenceChunk.trim());
                            sentenceChunk = '';
                        }
                        if (sentence.length > settings.maxChars) {
                            // If a single sentence is too long, split it into chunks
                            const words = sentence.split(' ');
                            let wordChunk = '';
                            for (const word of words) {
                                if ((wordChunk + word).length > settings.maxChars) {
                                    if (wordChunk.length > 0) {
                                        chunks.push(wordChunk.trim());
                                        wordChunk = '';
                                    }
                                }
                                wordChunk += word + ' ';
                            }
                            if (wordChunk.length > 0) {
                                sentenceChunk = wordChunk;
                            }
                        } else {
                            sentenceChunk = sentence + ' ';
                        }
                    } else {
                        sentenceChunk += sentence + ' ';
                    }
                }
                
                if (sentenceChunk.length > 0) {
                    chunks.push(sentenceChunk.trim());
                }
            } else {
                // Check if adding this paragraph would exceed the max length
                if ((currentChunk + paragraph).length > settings.maxChars) {
                    chunks.push(currentChunk.trim());
                    currentChunk = paragraph + '\n\n';
                } else {
                    currentChunk += paragraph + '\n\n';
                }
            }
        }

        // Add any remaining text as the final chunk
        if (currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    splitIntoParagraphs(text) {
        // Split on newlines and filter out empty paragraphs
        return text.split(/\n/).map(para => para.trim()).filter(para => para.length > 0);
    }

    splitIntoSentences(text) {
        // More comprehensive sentence splitting
        return text.match(/[^.!?]+[.!?]+|\s*[.!?]+|[^.!?]+$/g)
            ?.map(sentence => sentence.trim())
            .filter(sentence => sentence.length > 0) || [text];
    }

    getChunkCount(text, settings) {
        return this.processText(text, settings).length;
    }
}
