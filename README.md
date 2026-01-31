# Granola Plugin Companion

A companion plugin for Obsidian Granola Sync that prevents note duplication and extends functionality.

> 📖 **[Ver Índice Completo da Documentação](./.claude/docs/DOCS-INDEX.md)** - Guia de navegação de todos os documentos disponíveis

## Features

- **Duplicate Prevention**: Prevents creation of duplicate files when synced notes are modified
- **Duplicate Cleanup**: Remove duplicate notes created by Obsidian's conflict resolution
- **Smart Detection**: Only removes files with granola_id, protecting your personal notes
- **Statistics Dashboard**: View duplicate file statistics
- **Configurable Settings**: Enable/disable features as needed
- **Debug Mode**: Enable debug logging for troubleshooting
- **Non-Intrusive**: Works alongside the original Granola Sync plugin without conflicts

## Installation

### Method 1: Automatic Script (Recommended)

```bash
# Install directly into the default vault
./scripts/setup-obsidian.sh

# Or specify a custom vault path
./scripts/setup-obsidian.sh /path/to/your/vault
```

### Method 2: Manual Build

```bash
# Build to a specific folder
OUTPUT_DIR=/path/to/vault/.obsidian/plugins/granola-plugin-companion npm run build

# Or use the predefined scripts
npm run build:obsidian    # Build for default vault
npm run dev:obsidian      # Development with watch for default vault
```

### Method 3: Fully Manual

1. Copy this project into the `.obsidian/plugins/` folder of your vault
2. Create the folder `granola-plugin-companion`
3. Copy `manifest.json` and the `src` folder into it

## Configuration

Go to **Settings → Community Plugins → Granola Plugin Companion**

### Settings

- **Enable Duplicate Prevention**: Toggle to prevent duplicate file creation
- **Debug Mode**: Enable debug logging for troubleshooting

### Actions

- **Show Duplicate Stats**: View statistics about duplicate files
- **Remove Duplicates**: Clean up duplicate notes created by Obsidian (with confirmation dialog)

## Compatibility

- Works with the Obsidian Granola Sync plugin
- Compatible with Obsidian 0.15.0 and later
- Desktop and mobile support

## Development

```bash
# Install dependencies
npm install

# Development build with watch
npm run dev

# Production build
npm run build
```

## Best Practices

This plugin follows best practices for Obsidian plugin development:

- **Official API**: Uses `app.plugins.getPlugin()` and `app.plugins.enabledPlugins.has()`
- **Security**: Safely checks installation without depending on internal/unstable APIs
- **Performance**: Optimized periodic checks to avoid impacting performance
- **Compatibility**: Works with older Obsidian versions using fallbacks

## Official Documentation

For more information about Obsidian plugin development:

- **Getting Started Guide**: https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin
- **Plugin Anatomy**: https://docs.obsidian.md/Plugins/Getting+started/Anatomy+of+a+plugin
- **Development Workflow**: https://docs.obsidian.md/Plugins/Getting+started/Development+workflow
- **Performance Optimization**: https://docs.obsidian.md/plugins/guides/load-time
- **Secure Storage**: https://docs.obsidian.md/plugins/guides/secret-storage
- **Custom Views**: https://docs.obsidian.md/plugins/guides/bases-view

## File Structure

**In the Project:**
- `src/main.ts` - Main plugin code
- `src/models/` - Data models
- `src/services/` - Business logic services
- `src/ui/` - UI components
- `src/utils/` - Utility helpers
- `src/types/` - TypeScript type definitions
- `manifest.json` - Obsidian plugin manifest
- `scripts/setup-obsidian.sh` - Automatic installation script

**In the Installed Plugin:**
- `main.js` - Compiled plugin bundle
- `manifest.json` - Plugin manifest

*Note: Only `main.js` and `manifest.json` are required for the plugin to work in Obsidian.*

## Documentation

### For Developers
- **[CONTEXT.md](./CONTEXT.md)** - Contexto completo do projeto, arquitetura e conceitos
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Guia de desenvolvimento, workflows e padrões
- **[GRANOLA-SYNC-REFERENCE.md](./GRANOLA-SYNC-REFERENCE.md)** - Referência sobre o plugin Granola Sync original
- **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - Comandos, snippets e referências rápidas

### Quick Start para Desenvolvimento
1. Ler `CONTEXT.md` para entender o projeto
2. Seguir `DEVELOPMENT.md` para setup
3. Usar `QUICK-REFERENCE.md` como cheat sheet
4. Consultar `GRANOLA-SYNC-REFERENCE.md` para entender o plugin original

## License

MIT License
