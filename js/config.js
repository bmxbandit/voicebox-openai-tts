/**
 * Application configuration and constants
 */

export const CONFIG = {
    // API Configuration
    API_ENDPOINT: 'https://api.openai.com/v1/audio/speech',
    DEFAULT_MODEL: 'tts-1',
    DEFAULT_VOICE: 'alloy',
    DEFAULT_FORMAT: 'mp3',
    
    // Audio Configuration
    SAMPLE_RATE: 44100,
    BIT_DEPTH: 16,
    
    // Text Processing
    MAX_CHARS: 4096,
    TEXT_MARKERS: {
        H1: '# ',
        H2: '## ',
        CHAPTER_END: '###'
    },
    
    // Default Silence Durations (seconds)
    DEFAULT_SILENCE: {
        H1: 2.0,
        H2: 1.5,
        PARAGRAPH: 1.0,
        CHAPTER_END: 3.0
    },
    
    // Storage Keys
    STORAGE_KEY: 'voiceBoxState',
    
    // Supported Formats
    FORMATS: {
        wav: { mimeType: 'audio/wav', extension: 'wav', description: 'WAV' },
        mp3: { mimeType: 'audio/mp3', extension: 'mp3', description: 'MP3' },
        aac: { mimeType: 'audio/aac', extension: 'aac', description: 'AAC' },
        flac: { mimeType: 'audio/flac', extension: 'flac', description: 'FLAC' },
        opus: { mimeType: 'audio/opus', extension: 'opus', description: 'Opus' },
        pcm: { mimeType: 'audio/pcm', extension: 'pcm', description: 'PCM' }
    },
    
    // UI Elements
    ELEMENTS: {
        // Existing elements
        audioPlayer: 'audioPlayer',
        generateBtn: 'generateBtn',
        playPauseBtn: 'playPauseBtn',
        skipBackBtn: 'skipBackBtn',
        skipForwardBtn: 'skipForwardBtn',
        downloadBtn: 'downloadBtn',
        progressBar: '.progress-bar',
        progress: '.progress',
        apiKey: 'apiKey',
        model: 'model',
        voice: 'voice',
        format: 'format',
        text: 'text',
        previewBtn: 'previewBtn',
        chunkPreview: 'chunkPreview',
        previewModal: 'previewModal',
        processingProgress: 'processingProgress',
        currentChunk: 'currentChunk',
        totalChunks: 'totalChunks',
        chunkCount: 'chunkCount',

        // New elements for silence controls
        h1Silence: 'h1Silence',
        h2Silence: 'h2Silence',
        paragraphSilence: 'paragraphSilence',
        chapterEndSilence: 'chapterEndSilence',
        
        // Guide elements
        textGuide: 'textGuide',
        textExample: 'textExample'
    },
    
    // Preview Styles
    PREVIEW_STYLES: {
        H1: {
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#2c3e50'
        },
        H2: {
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#34495e'
        },
        WARNING: {
            color: '#e74c3c',
            icon: 'bi-exclamation-triangle-fill'
        },
        SILENCE_INDICATOR: {
            color: '#95a5a6',
            fontSize: '0.875rem'
        }
    }
};
