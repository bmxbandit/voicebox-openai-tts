# VoiceBox - OpenAI TTS

A web-based text-to-speech application powered by OpenAI's TTS (Text-to-Speech) API. This application allows users to convert text into natural-sounding speech using various AI-generated voices.

## Features

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
- Audio playback controls:
  - Play/Pause
  - 15-second skip forward/backward
  - Download generated audio
- Progress bar for audio playback
- Secure API key input

## How to Use

1. Enter your OpenAI API key in the secure input field
2. Select your preferred model (Standard or High Quality)
3. Choose a voice from the available options
4. Select your desired audio format
5. Enter the text you want to convert to speech
6. Click "Generate" to create the audio
7. Use the playback controls to listen to or download your generated audio

## Requirements

- OpenAI API key with access to TTS API
- Modern web browser
- Internet connection

## Security Note

Your OpenAI API key is processed locally and is never stored on any server.
