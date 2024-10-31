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
    maxChars: CONFIG.DEFAULT_MAX_CHARS,
    preSilence: 0,
    postSilence: 0
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
                return { ...DEFAULT_STATE, ...JSON.parse(savedState) };
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
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
                apiKey: state.apiKey || '',
                model: state.model || CONFIG.DEFAULT_MODEL,
                voice: state.voice || CONFIG.DEFAULT_VOICE,
                format: state.format || CONFIG.DEFAULT_FORMAT,
                text: state.text || '',
                maxChars: state.maxChars || CONFIG.DEFAULT_MAX_CHARS,
                preSilence: state.preSilence || 0,
                postSilence: state.postSilence || 0
            }));
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
        const newState = { ...currentState, ...updates };
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
        state[key] = value;
        this.saveState(state);
    }
}
