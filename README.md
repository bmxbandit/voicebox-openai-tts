# Voicebox - OpenAI TTS

A web-based text-to-speech application powered by OpenAI's TTS API, with support for multiple versions.

## Project Structure

This repository contains multiple versions of the Voicebox application:

### Version 1 (`/v1`)
The original implementation with core TTS functionality:
- Basic text processing
- Audio generation and playback
- Simple user interface
- File-based organization

### Version 2 (`/v2`)
A complete architectural redesign with enhanced features:
- Modular code structure
- Improved text processing
- Enhanced audio handling
- Modern UI with better user experience
- Comprehensive documentation

## Version Management

- Each version is maintained in its own directory
- Breaking changes are introduced in new versions
- Previous versions remain accessible and functional
- See VERSION_CONTROL.md for detailed branching strategy

## Getting Started

### Using Version 1
1. Navigate to the `/v1` directory
2. Open `index.html` in a modern web browser
3. Follow the instructions in v1/README.md

### Using Version 2
1. Navigate to the `/v2` directory
2. Open `index.html` in a modern web browser
3. Follow the instructions in v2/README.md

## Requirements

- OpenAI API key with access to TTS API
- Modern web browser with JavaScript enabled
- Internet connection

## Security Note

Your OpenAI API key is processed locally and is never stored on any server. The application saves your preferences in your browser's local storage for convenience.

## Contributing

Please read VERSION_CONTROL.md for details on our branching strategy and development workflow.
