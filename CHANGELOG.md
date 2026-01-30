# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-01-30

### Added
- **Duplicate Cleanup Feature**: New "Remove Duplicates" button in plugin settings
  - Detects duplicates by Obsidian timestamp pattern: `-YYYY-MM-DD_HH-MM-SS.md`
  - Only removes files with `granola_id` to protect user's personal notes
  - Shows confirmation dialog with list of files before deletion
  - Provides detailed feedback on deletion results

- **Improved Statistics**: Enhanced "Show Duplicate Stats" feature
  - Shows count of removable duplicates (with timestamp)
  - Shows count of Granola ID groups (normal note+transcript pairs)
  - Clear distinction between cleanable and informational duplicates

- **Fallback Search**: Added manual vault search when index misses files
  - Detects when index hasn't indexed a file yet
  - Performs full vault scan as backup
  - Logs warning in debug mode when fallback is used

- **Smart Event Filtering**: Only process metadata changes for Granola files
  - Dramatically reduces unnecessary processing
  - Checks for `granola_id` before indexing
  - Improves overall plugin performance

### Changed
- **Removed Ribbon Icon**: Cleaned up UI by removing unnecessary dice icon
- **Notice Styling**: Removed background color for better readability
- **Index Synchronization**: Added 50ms delay before duplicate checks for better reliability

### Improved
- **Debug Logging**: Added comprehensive debug logs
  - File indexing events
  - Duplicate detection checks
  - Fallback search usage
  - Index statistics

- **Documentation**:
  - Updated DEVELOPMENT.md with clear `npm run install:dev` workflow
  - Added development best practices
  - Updated README with new features
  - Added inline code documentation

### Fixed
- Race condition in duplicate detection by adding index sync delay
- Index missing files issue with fallback search
- Performance issue with unnecessary metadata processing

## [0.1.0] - 2026-01-29

### Added
- Initial release
- Duplicate prevention system
- Granola Sync integration
- Basic settings UI
- Debug mode

### Features
- Intercept file creation to prevent duplicates
- O(1) file lookup with GranolaIndexService
- Plugin detection and dependency checking
- Event-based architecture
