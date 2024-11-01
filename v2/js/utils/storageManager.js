export class StorageManager {
    constructor() {
        this.SETTINGS_KEY = 'voicebox_settings';
        this.API_KEY = 'voicebox_api_key';
        this.TEXT_INPUT = 'voicebox_text_input';
    }

    saveSettings(settings) {
        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    getSettings() {
        try {
            const settings = localStorage.getItem(this.SETTINGS_KEY);
            return settings ? JSON.parse(settings) : this.getDefaultSettings();
        } catch (error) {
            console.error('Error loading settings:', error);
            return this.getDefaultSettings();
        }
    }

    saveApiKey(apiKey) {
        try {
            localStorage.setItem(this.API_KEY, apiKey);
        } catch (error) {
            console.error('Error saving API key:', error);
        }
    }

    getApiKey() {
        return localStorage.getItem(this.API_KEY) || '';
    }

    saveTextInput(text) {
        try {
            localStorage.setItem(this.TEXT_INPUT, text);
        } catch (error) {
            console.error('Error saving text input:', error);
        }
    }

    getTextInput() {
        return localStorage.getItem(this.TEXT_INPUT) || '';
    }

    getDefaultSettings() {
        return {
            model: 'tts-1',
            voice: 'alloy',
            format: 'mp3',
            maxChars: 4096,
            h1Silence: 2,
            h2Silence: 1.5,
            chapterEndSilence: 3
        };
    }

    clearSettings() {
        try {
            localStorage.removeItem(this.SETTINGS_KEY);
            localStorage.removeItem(this.API_KEY);
            localStorage.removeItem(this.TEXT_INPUT);
        } catch (error) {
            console.error('Error clearing settings:', error);
        }
    }
}
