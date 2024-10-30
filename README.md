# Voicebox - OpenAI TTS

A web-based text-to-speech application powered by OpenAI's TTS (Text-to-Speech) API. This application allows users to convert text into natural-sounding speech using various AI-generated voices, with support for handling long texts and audio customization.

## Features

### Voice and Model Options
- Multiple voice options (Alloy, Echo, Fable, Onyx, Nova, Shimmer)
- Two quality models:
  - Standard (tts-1)
  - High Quality (tts-1-hd)
- Multiple audio format support:
  - MP3
  - Opus
  - AAC
  - FLAC
  - PCM

### Text Processing
- Smart text chunking for handling long texts
- Automatic paragraph-aware text splitting
- Visual chunk preview
- Real-time chunk count indicator
- Progress tracking during chunk processing

### Audio Controls
- Play/Pause functionality
- 15-second skip forward/backward
- Progress bar with seek capability
- Download generated audio
- Customizable silence:
  - Add pre-silence (before audio)
  - Add post-silence (after audio)

### User Experience
- Real-time processing status updates
- Preview text chunks before processing
- Save settings between sessions
- Responsive design
- Visual progress indicators

## How to Use

1. Enter your OpenAI API key in the secure input field
2. Configure your preferences:
   - Select model (Standard or High Quality)
   - Choose a voice
   - Select output format
   - Set maximum characters per chunk (default 4096)
   - Configure pre/post silence duration (in seconds)
3. Enter or paste your text
4. (Optional) Preview how the text will be split into chunks
5. Click "Generate" to create the audio
6. Use the playback controls to listen to or download your generated audio

### Text Chunking

The application automatically splits long texts into smaller chunks while preserving paragraph integrity:
- Splits text at paragraph boundaries
- Ensures each chunk stays under the specified character limit
- Maintains readability and context
- Preview feature to review chunk divisions before processing

### Silence Controls

Add silence to your audio:
- Pre-silence: Add silence before the audio starts
- Post-silence: Add silence after the audio ends
- Supports decimal values for precise control (e.g., 0.5 seconds)

## Requirements

- OpenAI API key with access to TTS API
- Modern web browser with JavaScript enabled
- Internet connection

## Security Note

Your OpenAI API key is processed locally and is never stored on any server. The application saves your preferences in your browser's local storage for convenience.

## Technical Details

- Processes text in chunks to handle OpenAI's API limitations
- Combines audio chunks seamlessly
- Generates and adds silence using Web Audio API
- Preserves audio quality during chunk combination
- Supports various audio formats for download
