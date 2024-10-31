/**
 * Storage utilities for managing application state
 */

import { CONFIG } from '../config.js';

/**
 * Default state values
 */
const DEFAULT_STATE = {
    apiKey: '',
    model: CONFIG.DEFAULT_MODEL,
    voice: CONFIG.DEFAULT_VOICE,
    format: CONFIG.DEFAULT_FORMAT,
    text: '',
    silenceSettings: {
        h1: CONFIG.DEFAULT_SILENCE.H1,
        h2: CONFIG.DEFAULT_SILENCE.H2,
        paragraph: CONFIG.DEFAULT_SILENCE.PARAGRAPH,
        chapterEnd: CONFIG.DEFAULT_SILENCE.CHAPTER_END
    }
};

export class StateManager {
    /**
     * Load saved state from localStorage
     * @returns {Object} The loaded state or default values
     */
    static loadState() {
        try {
            const savedState = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                return {
                    ...DEFAULT_STATE,
                    ...parsedState,
                    silenceSettings: {
                        ...DEFAULT_STATE.silenceSettings,
                        ...(parsedState.silenceSettings || {})
                    }
                };
            }
        } catch (error) {
            console.warn('Error loading saved state:', error);
        }
        return { ...DEFAULT_STATE };
    }

    /**
     * Save current state to localStorage
     * @param {Object} state - Current application state
     */
    static saveState(state) {
        try {
            const stateToSave = {
                apiKey: state.apiKey || '',
                model: state.model || CONFIG.DEFAULT_MODEL,
                voice: state.voice || CONFIG.DEFAULT_VOICE,
                format: state.format || CONFIG.DEFAULT_FORMAT,
                text: state.text || '',
                silenceSettings: {
                    h1: state.silenceSettings?.h1 ?? CONFIG.DEFAULT_SILENCE.H1,
                    h2: state.silenceSettings?.h2 ?? CONFIG.DEFAULT_SILENCE.H2,
                    paragraph: state.silenceSettings?.paragraph ?? CONFIG.DEFAULT_SILENCE.PARAGRAPH,
                    chapterEnd: state.silenceSettings?.chapterEnd ?? CONFIG.DEFAULT_SILENCE.CHAPTER_END
                }
            };
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    /**
     * Update specific state values
     * @param {Object} currentState - Current state object
     * @param {Object} updates - Object containing state updates
     * @returns {Object} Updated state
     */
    static updateState(currentState, updates) {
        const newState = {
            ...currentState,
            ...updates,
            silenceSettings: {
                ...currentState.silenceSettings,
                ...(updates.silenceSettings || {})
            }
        };
        this.saveState(newState);
        return newState;
    }

    /**
     * Clear all saved state
     */
    static clearState() {
        try {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing state:', error);
        }
    }

    /**
     * Get specific state value
     * @param {string} key - State key to retrieve
     * @returns {any} Value for the specified key or default value
     */
    static getStateValue(key) {
        const state = this.loadState();
        return state[key] !== undefined ? state[key] : DEFAULT_STATE[key];
    }

    /**
     * Set specific state value
     * @param {string} key - State key to update
     * @param {any} value - New value
     */
    static setStateValue(key, value) {
        const state = this.loadState();
        if (key === 'silenceSettings' && typeof value === 'object') {
            state.silenceSettings = {
                ...state.silenceSettings,
                ...value
            };
        } else {
            state[key] = value;
        }
        this.saveState(state);
    }

    /**
     * Get silence settings
     * @returns {Object} Current silence settings
     */
    static getSilenceSettings() {
        const state = this.loadState();
        return state.silenceSettings || DEFAULT_STATE.silenceSettings;
    }

    /**
     * Update silence settings
     * @param {Object} settings - New silence settings
     */
    static updateSilenceSettings(settings) {
        const state = this.loadState();
        state.silenceSettings = {
            ...state.silenceSettings,
            ...settings
        };
        this.saveState(state);
    }
}
