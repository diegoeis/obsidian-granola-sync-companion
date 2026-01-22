# Granola Plugin Companion

A companion plugin for Obsidian Granola Sync that prevents note duplication and extends functionality.

## Features

- **Duplicate Prevention**: Prevents creation of duplicate files when synced notes are modified
- **Configurable Settings**: User can enable/disable duplicate prevention
- **Debug Mode**: Enable debug logging for troubleshooting
- **Non-Intrusive**: Works alongside the original Granola Sync plugin without conflicts

## Installation

### Método 1: Script Automático (Recomendado)

```bash
# Instalar diretamente no vault padrão
./scripts/setup-obsidian.sh

# Ou especificar caminho do vault
./scripts/setup-obsidian.sh /caminho/para/seu/vault
```

### Método 2: Build Manual

```bash
# Build para pasta específica
OUTPUT_DIR=/caminho/do/vault/.obsidian/plugins/granola-plugin-companion npm run build

# Ou usar os scripts predefinidos
npm run build:obsidian    # Build para vault padrão
npm run dev:obsidian      # Development com watch para vault padrão
```

### Método 3: Manual

1. Copie este projeto para a pasta `.obsidian/plugins/` do seu vault
2. Crie a pasta `granola-plugin-companion`
3. Copie `manifest.json` e a pasta `src` para dentro

## Configuration

- **Enable Duplicate Prevention**: Toggle to prevent duplicate file creation
- **Debug Mode**: Enable debug logging for troubleshooting

## Compatibility

- Works with Obsidian Granola Sync plugin
- Compatible with Obsidian 0.15.0 and later
- Desktop and mobile support

## Development

```bash
# Install dependencies
npm install

# Development build com watch
npm run dev

# Production build
npm run build
```

## Best Practices

Este plugin segue as melhores práticas de desenvolvimento para plugins Obsidian:

- **API Oficial**: Usa `app.plugins.getPlugin()` e `app.plugins.enabledPlugins.has()`
- **Segurança**: Verificação segura de instalação sem depender de APIs específicas
- **Performance**: Verificação periódica otimizada para não impactar performance
- **Compatibilidade**: Funciona com versões antigas do Obsidian usando fallback

## Documentation Oficial

Para mais informações sobre desenvolvimento de plugins Obsidian:

- **Guia de Início**: https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin
- **Anatomia do Plugin**: https://docs.obsidian.md/Plugins/Getting+started/Anatomy+of+a+plugin
- **Fluxo de Desenvolvimento**: https://docs.obsidian.md/Plugins/Getting+started/Development+workflow
- **Otimização de Performance**: https://docs.obsidian.md/plugins/guides/load-time
- **Armazenamento Seguro**: https://docs.obsidian.md/plugins/guides/secret-storage
- **Views Personalizados**: https://docs.obsidian.md/plugins/guides/bases-view

## Estrutura de Arquivos

**No Projeto:**
- `src/main.ts` - Código principal do plugin
- `src/models/` - Modelos de dados
- `src/services/` - Serviços de negócio
- `src/ui/` - Componentes de interface
- `src/utils/` - Utilitários diversos
- `src/types/` - Definições de tipos TypeScript
- `manifest.json` - Manifesto do plugin Obsidian
- `scripts/setup-obsidian.sh` - Script de instalação automática

**No Plugin Instalado:**
- `main.js` - Plugin compilado (bundle)
- `manifest.json` - Manifesto do plugin

*Nota: Apenas `main.js` e `manifest.json` são necessários para o plugin funcionar no Obsidian.*

## License

MIT License