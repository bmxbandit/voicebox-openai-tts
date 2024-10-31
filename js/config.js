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
    DEFAULT_MAX_CHARS: 4096,
    
    // Storage Keys
    STORAGE_KEY: 'voiceBoxState',
    
    // Supported Formats
    FORMATS: {
        mp3: { mimeType: 'audio/mp3', extension: 'mp3', description: 'MP3 (Compressed)' },
        wav: { mimeType: 'audio/wav', extension: 'wav', description: 'WAV (Uncompressed)' },
        aac: { mimeType: 'audio/aac', extension: 'aac', description: 'AAC (Compressed)' },
        flac: { mimeType: 'audio/flac', extension: 'flac', description: 'FLAC (Lossless)' },
        opus: { mimeType: 'audio/opus', extension: 'opus', description: 'Opus (Compressed)' },
        pcm: { mimeType: 'audio/pcm', extension: 'pcm', description: 'PCM (Raw)' }
    },
    
    // UI Elements
    ELEMENTS: {
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
        maxChars: 'maxChars',
        preSilence: 'preSilence',
        postSilence: 'postSilence',
        previewBtn: 'previewBtn',
        chunkPreview: 'chunkPreview',
        previewModal: 'previewModal',
        processingProgress: 'processingProgress',
        currentChunk: 'currentChunk',
        totalChunks: 'totalChunks',
        chunkCount: 'chunkCount'
    }
};
