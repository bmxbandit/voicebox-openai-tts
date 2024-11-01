export class ApiClient {
    constructor() {
        this.apiKey = '';
        this.baseUrl = 'https://api.openai.com/v1/audio/speech';
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    getApiKey() {
        return this.apiKey;
    }

    async generateSpeech(text, settings) {
        if (!this.apiKey) {
            throw new Error('API key is required');
        }

        // Don't make API call for empty text
        if (!text || (typeof text === 'string' && !text.trim())) {
            return null;
        }

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: settings.model,
                input: typeof text === 'string' ? text : text.text,
                voice: settings.voice,
                response_format: settings.format
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to generate speech');
        }

        const audioData = await response.arrayBuffer();
        return audioData;
    }
}
