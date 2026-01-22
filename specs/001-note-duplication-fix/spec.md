# Feature Specification: Note Duplication Fix

**Feature Branch**: `001-note-duplication-fix`  
**Created**: 2025-01-20  
**Status**: Draft  
**Input**: User description: "I want to modify the way original plugin works. I've been experiencing note duplication issues and did a deep dive into the source code to understand what's happening. Here's what I found (I'm not high tech savvy) What I'm experiencing: Original synced note: Talk with John Doe - 2026-01-06.md Duplicated note: Talk with John Doe - 2026-01-06-2026-01-06_10-06-23.md Both notes have the same granola_id: d544a340-5a8c-4eb6-a7d8-6e137e140acf The original plugin works in this way: If file already exists locally (same granola_id + type), sync behavior depends on timestamps and mode: Standard sync (default): If remote updated_at is not newer than local file's updated frontmatter, file is left untouched (manual edits preserved). If remote updated_at is newer, file is overwritten with freshly generated content (manual edits lost). Full sync (mode: "full"): forceOverwrite is true, so file is always rewritten, regardless of timestamps (manual edits lost). It sounds like you're seeing something different: File is sycned You modify file On next sync a new file is created (with datestamp at the end), with same Granola ID and type. If you want to have more detailed frontmatter, you could create a new file that embeds file from granola, and put additional frontmatter you need in there. What I want to do: - Look up files by granola_id in frontmatter, not filename - Preserve existing update/skip logic but ensure it works with ID-based lookup - Handle edge cases (corrupted frontmatter, note vs transcript types) - Add a configuration where user can enable/disable. If enable, we prevent the original plugin from creating new duplicate files when they find an existing note were modified. If disable (default), we permit the original plugin to work like today they work today. In both cases, the original plugin needs to continue syncing new notes, like they used to be."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - ID-Based Note Lookup (Priority: P1)

User modifies a synced note locally and wants to preserve their manual edits during the next sync, preventing duplicate file creation.

**Why this priority**: This is the core problem causing data duplication and user confusion - solving this provides immediate value and prevents data integrity issues.

**Independent Test**: Can be fully tested by modifying a synced note and running sync cycle to verify no duplicate files are created while preserving manual edits.

**Acceptance Scenarios**:

1. **Given** User has a synced note with granola_id "abc123", **When** User modifies the note content, **Then** Next sync updates the same file using ID-based lookup, preserving manual edits
2. **Given** Local file has newer updated_at than remote, **When** Sync runs, **Then** Local file is preserved and no duplicate is created
3. **Given** Remote file has newer updated_at than local, **When** Sync runs, **Then** Local file is updated and no duplicate is created

---

### User Story 2 - Configurable Duplicate Prevention (Priority: P2)

User wants control over whether duplicate prevention is enabled or disabled through configuration settings.

**Why this priority**: Provides user choice and backward compatibility - some users may prefer original behavior while others want duplicate prevention.

**Independent Test**: Can be fully tested by toggling configuration setting and verifying sync behavior changes accordingly.

**Acceptance Scenarios**:

1. **Given** Duplicate prevention is enabled, **When** User modifies synced note, **Then** No duplicate files are created during sync
2. **Given** Duplicate prevention is disabled (default), **When** User modifies synced note, **Then** Original plugin behavior is preserved (duplicates may be created)
3. **Given** User changes configuration setting, **When** Settings are saved, **Then** New sync behavior takes effect immediately

---

### User Story 3 - Edge Case Handling (Priority: P3)

System gracefully handles corrupted frontmatter, missing granola_id, and different note types (notes vs transcripts).

**Why this priority**: Ensures system robustness and prevents crashes or data loss in edge cases.

**Independent Test**: Can be fully tested by creating files with various corruption scenarios and verifying graceful handling.

**Acceptance Scenarios**:

1. **Given** File has corrupted frontmatter with missing granola_id, **When** Sync runs, **Then** System falls back to filename-based lookup with warning
2. **Given** File is a transcript type instead of note type, **When** Sync runs, **Then** System applies appropriate type-specific handling rules
3. **Given** File has invalid granola_id format, **When** Sync runs, **Then** System logs error and skips file gracefully

---

### Edge Cases

- What happens when multiple files have the same granola_id?
- How does system handle corrupted frontmatter or missing granola_id?
- What happens when original plugin is updated while companion plugin is active?
- How does system handle network interruptions during ID-based lookup?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST look up files by granola_id in frontmatter, not filename
- **FR-002**: System MUST preserve existing update/skip logic while implementing ID-based lookup
- **FR-003**: System MUST provide configuration option to enable/disable duplicate prevention
- **FR-004**: System MUST prevent original plugin from creating duplicate files when duplicate prevention is enabled
- **FR-005**: System MUST allow original plugin to work normally when duplicate prevention is disabled
- **FR-006**: System MUST continue syncing new notes regardless of duplicate prevention setting
- **FR-007**: System MUST handle corrupted frontmatter gracefully with fallback behavior
- **FR-008**: System MUST differentiate between note and transcript types for appropriate handling
- **FR-009**: System MUST maintain compatibility with existing original plugin functionality

### Key Entities

- **Note**: Represents a synced note with granola_id, updated_at timestamp, and content
- **Granola ID**: Unique identifier for notes used for ID-based lookup and duplicate detection
- **Configuration Settings**: User preferences for duplicate prevention enable/disable and related options
- **Frontmatter**: YAML metadata at top of notes containing granola_id and timestamps

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero duplicate files created when duplicate prevention is enabled and user modifies existing notes
- **SC-002**: 100% of manual edits preserved during sync when using ID-based lookup
- **SC-003**: Configuration changes take effect immediately without requiring plugin restart
- **SC-004**: Original plugin functionality remains unchanged when duplicate prevention is disabled
- **SC-005**: System gracefully handles 95% of edge cases without crashes or data loss
