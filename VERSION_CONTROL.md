# Version Control Strategy

## Current Version (v1)
The current version in the main branch represents the stable v1 implementation with the following structure:
- Web-based interface for OpenAI TTS
- Core modules:
  - Audio processing (generator.js, player.js, processor.js, silence.js)
  - UI components (preview.js, progress.js)
  - Utilities (storage.js, text.js)
  - API integration (api.js)

## Version 2 Development Strategy

### 1. Git Branch Structure
```
main (v1)
  └── develop
       └── feature/v2-architecture
            ├── feature/v2-audio
            ├── feature/v2-ui
            └── feature/v2-api
```

### 2. Implementation Steps

1. Create a new `develop` branch from `main`
   ```bash
   git checkout -b develop main
   ```

2. Create the v2 architecture branch
   ```bash
   git checkout -b feature/v2-architecture develop
   ```

3. Create feature-specific branches for major components
   ```bash
   git checkout -b feature/v2-audio feature/v2-architecture
   git checkout -b feature/v2-ui feature/v2-architecture
   git checkout -b feature/v2-api feature/v2-architecture
   ```

### 3. Version Management

#### Directory Structure
Consider reorganizing the project structure to support multiple versions:

```
voicebox/
├── v1/                     # Current version
│   ├── js/
│   ├── index.html
│   └── ...
├── v2/                     # New version
│   ├── src/
│   ├── dist/
│   └── ...
└── shared/                 # Shared utilities
    └── ...
```

#### Version Tagging
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Tag releases appropriately:
  ```bash
  git tag -a v1.0.0 -m "Version 1 stable release"
  git tag -a v2.0.0 -m "Version 2 stable release"
  ```

### 4. Development Guidelines

1. **Code Migration**
   - Identify reusable components from v1
   - Refactor and improve existing functionality
   - Document breaking changes

2. **Testing**
   - Maintain separate test suites for each version
   - Ensure backward compatibility where needed
   - Implement integration tests for shared components

3. **Documentation**
   - Maintain separate documentation for each version
   - Clear upgrade guides
   - API changes documentation

### 5. Deployment Strategy

1. **Branch Protection**
   - Protect `main` and `develop` branches
   - Require pull request reviews
   - Enforce status checks

2. **Release Process**
   - Feature branches → v2-architecture
   - v2-architecture → develop (with review)
   - develop → main (after thorough testing)

### 6. Maintenance

- Continue bug fixes for v1 in `main` branch
- Cherry-pick critical fixes between versions
- Maintain clear changelog for each version

## Commands for Common Tasks

### Starting New Feature
```bash
git checkout -b feature/v2-[feature-name] feature/v2-architecture
```

### Merging Completed Feature
```bash
git checkout feature/v2-architecture
git merge feature/v2-[feature-name]
```

### Creating Release
```bash
git checkout main
git merge develop
git tag -a v2.0.0 -m "Version 2 release"
git push origin v2.0.0
```

## Migration Notes

1. **Code Reuse Considerations**
   - Identify core utilities that can be shared
   - Document dependencies between components
   - Plan API compatibility layers if needed

2. **Breaking Changes**
   - Document all breaking changes
   - Provide migration guides
   - Consider backward compatibility where possible

3. **Testing Strategy**
   - Unit tests for new components
   - Integration tests for system behavior
   - Migration test cases

This strategy ensures clean separation between versions while maintaining project history and enabling efficient development of new features.
