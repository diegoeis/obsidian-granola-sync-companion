<!--
Sync Impact Report:
- Version change: 0.0.0 → 1.1.0 (minor version - added Obsidian-specific principles)
- Modified principles: All principles updated for Obsidian plugin context
- Added sections: Obsidian Plugin Standards, Integration Testing Requirements, Plugin Release Management
- Removed sections: N/A (restructured existing sections)
- Templates requiring updates: 
  ✅ .specify/templates/plan-template.md (updated constitution checks)
  ⚠ .specify/templates/spec-template.md (needs Obsidian plugin context)
  ⚠ .specify/templates/tasks-template.md (needs integration testing focus)
  ⚠ .specify/templates/agent-file-template.md (project name placeholder updated)
  ⚠ .specify/templates/checklist-template.md (no changes needed)
- Follow-up TODOs: Update templates with Obsidian plugin specific requirements
-->

# EIS Granola Sync Companion Constitution

## Core Principles

### I. Plugin Integration Architecture
This is a companion plugin to Obsidian Granola Sync (https://github.com/tomelliot/obsidian-granola-sync). All features must integrate seamlessly with the original plugin while maintaining independence. No direct modification of original plugin code allowed.

### II. Extension-First Development
Every feature starts as an extension to existing Granola Sync functionality. Extensions must be optional, non-breaking, and configurable. Users must be able to disable companion features without affecting original plugin operation.

### III. Configuration Independence
Companion plugin must have its own configuration page and settings management. Configuration must not interfere with original plugin settings but should provide integration options where relevant.

### IV. Test-First Development (NON-NEGOTIABLE)
TDD mandatory: Tests written → User approved → Tests fail → Then implement. Red-Green-Refactor cycle strictly enforced for all code changes. Must test both standalone operation and integration with original plugin.

### V. API Integration Standards
All interaction with original plugin must use documented APIs or safe DOM manipulation. No reliance on internal implementation details that may change. Graceful degradation required if original plugin is unavailable.

### VI. User Experience Consistency
Companion features must maintain UI/UX consistency with Obsidian and original plugin design patterns. Configuration pages must follow Obsidian plugin standards.

## Development Standards

### Obsidian Plugin Standards
All development must follow Obsidian plugin development guidelines. Use TypeScript, proper plugin manifest structure, and Obsidian API patterns. Plugin must be compatible with Obsidian versions supported by original Granola Sync.

### Code Quality Requirements
All code must pass linting, formatting, and static analysis before merge. Documentation required for all public APIs. Error handling must be comprehensive and user-friendly.

### Integration Testing Requirements
Must test integration scenarios with original plugin: installation order, configuration conflicts, feature interactions, and graceful degradation when original plugin is disabled or updated.

### Performance & Compatibility
Performance testing required for all user-facing features. Must not impact original plugin performance. Compatibility testing required across different Obsidian versions and operating systems.

## Workflow & Governance

### Development Process
Feature development follows speckit workflow: specify → clarify → plan → tasks → implement. Each phase must consider integration impact on original plugin.

### Review Requirements
All changes require peer review. Constitution compliance verified in all reviews. Integration impact assessment mandatory for all features. Complex changes must be justified with simpler alternatives considered and rejected.

### Plugin Release Management
Version compatibility must be tracked against original plugin versions. Breaking changes must be clearly documented and communicated. Migration paths must be provided for major version changes.

**Version**: 1.1.0 | **Ratified**: 2025-01-20 | **Last Amended**: 2025-01-20
