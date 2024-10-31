# Voicebox v2 - OpenAI TTS

A streamlined web-based text-to-speech application powered by OpenAI's TTS API. This version features a cleaner architecture, improved user experience, and more efficient text processing.

## Key Features

- **Multiple Voice Options**: Alloy, Echo, Fable, Onyx, Nova, Shimmer
- **Flexible Model Selection**: Standard (tts-1) and High Quality (tts-1-hd)
- **Multiple Audio Formats**: MP3, Opus, AAC, FLAC, PCM
- **Smart Text Processing**:
  - Intelligent paragraph-based chunking
  - Respects maximum character limits
  - Preserves paragraph integrity
- **Customizable Silence**:
  - H1 tag silence (# )
  - H2 tag silence (## )
  - Chapter end silence (###)
  - Pre/post silence for each chunk
- **Modern Audio Player**:
  - Spotify-style interface
  - 15-second skip forward/backward
  - Download capability
- **Progress Tracking**:
  - Real-time processing status
  - Visual chunk preview
  - Progress indicators

## Project Structure

```
v2/
├── index.html           # Main application interface
├── css/
│   └── styles.css      # Application styles
├── js/
│   ├── main.js         # Application entry point
│   ├── api/
│   │   └── apiClient.js    # OpenAI API integration
│   ├── audio/
│   │   └── audioManager.js # Audio processing and playback
│   ├── ui/
│   │   └── uiManager.js    # UI components and interactions
│   └── utils/
│       ├── textProcessor.js    # Text chunking and processing
│       └── storageManager.js   # Local storage management
```

## Improvements from v1

1. **Cleaner Architecture**:
   - Modular code structure
   - Clear separation of concerns
   - Improved maintainability

2. **Enhanced Text Processing**:
   - More reliable paragraph splitting
   - Smarter chunk size management
   - Better handling of special tags

3. **Improved Audio Handling**:
   - Seamless chunk combination
   - Better silence management
   - More reliable playback controls

4. **Better User Experience**:
   - Modern, responsive design
   - Clear progress indicators
   - Improved error handling

5. **Local Storage**:
   - Persistent settings
   - Secure API key storage
   - User preference management

## Usage

1. Open `index.html` in a modern web browser
2. Enter your OpenAI API key
3. Configure your preferences:
   - Select model and voice
   - Choose output format
   - Set silence durations
   - Adjust chunk size if needed
4. Enter or paste your text
5. (Optional) Preview text chunks
6. Generate audio and use the player controls

## Security

- API key is stored locally and never transmitted except to OpenAI
- No server-side storage or processing
- All processing happens in the browser

## Browser Support

Requires a modern browser with support for:
- Web Audio API
- ES6+ JavaScript
- Local Storage
- Fetch API

## Development

The v2 codebase is designed for easy extension and modification:

1. **Adding New Features**:
   - Create new modules in appropriate directories
   - Import and integrate in main.js
   - Follow existing patterns for consistency

2. **Modifying Behavior**:
   - Each module handles specific functionality
   - Changes can be made without affecting other parts
   - Clear separation makes testing easier

3. **Styling Changes**:
   - All styles in styles.css
   - Uses Bootstrap for layout
   - Custom styles for audio player

## Future Improvements

1. Support for more audio formats
2. Advanced text processing options
3. Batch processing capabilities
4. Custom voice fine-tuning
5. Enhanced audio editing features
