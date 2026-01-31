# Claude Context Directory

This directory contains documentation and context files to help Claude understand and work with this project.

## 📁 Structure

```
.claude/
├── docs/                      # Complete project documentation
│   ├── DOCS-INDEX.md          # Documentation navigation guide
│   ├── CONTEXT.md             # Project architecture & concepts
│   ├── DEVELOPMENT.md         # Development guide & best practices
│   ├── OBSIDIAN-APIS.md       # Obsidian native APIs reference
│   ├── QUICK-REFERENCE.md     # Commands & snippets cheat sheet
│   ├── GRANOLA-SYNC-REFERENCE.md  # Granola Sync plugin reference
│   └── CHANGELOG.md           # Version history
├── specs/                     # Feature specifications and plans
│   └── 001-note-duplication-fix/  # Initial feature spec
│       ├── spec.md            # Feature specification
│       ├── plan.md            # Implementation plan
│       └── checklists/        # Task checklists
└── settings.local.json        # Claude Code local settings
```

## 📖 Documentation

All documentation has been moved to `.claude/docs/` for better organization and Claude context management.

### Start Here
👉 **[DOCS-INDEX.md](./docs/DOCS-INDEX.md)** - Complete navigation guide to all documentation

### Quick Links

**Documentation:**
- 🎯 [Project Context](./docs/CONTEXT.md) - Architecture & concepts
- 🚀 [Development Guide](./docs/DEVELOPMENT.md) - How to develop
- 🔧 [Obsidian APIs](./docs/OBSIDIAN-APIS.md) - Native APIs reference
- ⚡ [Quick Reference](./docs/QUICK-REFERENCE.md) - Commands & snippets
- 📦 [Granola Sync](./docs/GRANOLA-SYNC-REFERENCE.md) - Original plugin info
- 📝 [Changelog](./docs/CHANGELOG.md) - Version history

**Specifications:**
- 📋 [Specs Directory](./specs/) - Feature specifications and implementation plans

## 🤖 For Claude

When working on this project:

1. **Always read [DOCS-INDEX.md](./docs/DOCS-INDEX.md) first** to understand available documentation
2. **Use native Obsidian APIs** - see [OBSIDIAN-APIS.md](./docs/OBSIDIAN-APIS.md)
3. **Follow project patterns** - see [CONTEXT.md](./docs/CONTEXT.md)
4. **Check existing solutions** before implementing new ones
5. **Update documentation** when making significant changes

## 🔄 Workflow

After making code changes, **always** run:
```bash
npm run install:dev
```

Then reload Obsidian to test.

See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for complete workflow.
