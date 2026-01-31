# Quick Reference - Granola Plugin Companion

## Comandos Essenciais

### Setup e Build
```bash
# Instalar dependências
npm install

# Dev com hot-reload (vault padrão)
npm run dev:obsidian

# Dev com vault customizado
OUTPUT_DIR=/path/to/vault/.obsidian/plugins/granola-plugin-companion npm run dev

# Build produção
npm run build

# Setup automático
./scripts/setup-obsidian.sh [vault-path]
```

### Git
```bash
# Status atual
git status

# Commit
git add .
git commit -m "feat: descrição"

# Push
git push origin main
```

## Console do Obsidian (Ctrl+Shift+I)

### Acessar Plugin
```javascript
// Instância do companion
const companion = app.plugins.getPlugin('granola-plugin-companion');

// Instância do Granola Sync
const granola = app.plugins.getPlugin('granola-sync');

// Verificar status
app.plugins.enabledPlugins.has('granola-sync');
```

### Testar Funcionalidades
```javascript
// Mostrar estatísticas
await companion.showDuplicateStats();

// Refresh status
await companion.refreshGranolaSyncStatus();

// Ver configurações
console.log(companion.settings);

// Listar arquivos do Granola
const files = await companion.integrationService.fileLookupService.getAllGranolaFiles();
console.log(files.map(f => f.path));

// Ver duplicatas
const dups = await companion.integrationService.fileLookupService.getDuplicateFiles();
console.log(dups);
```

### Inspecionar Vault
```javascript
// Todos os arquivos
app.vault.getFiles();

// Arquivos markdown
app.vault.getMarkdownFiles();

// Arquivo específico
const file = app.vault.getAbstractFileByPath('path/to/file.md');

// Ler conteúdo
const content = await app.vault.read(file);
console.log(content);

// Cache de metadata
const cache = app.metadataCache.getFileCache(file);
console.log(cache.frontmatter);
```

## Snippets Comuns

### Adicionar Nova Setting
```typescript
// 1. Interface
interface CompanionSettings {
    newSetting: boolean;
}

// 2. Default
const DEFAULT_SETTINGS = {
    newSetting: false
};

// 3. UI
new Setting(containerEl)
    .setName('New Setting')
    .setDesc('Description')
    .addToggle(toggle => toggle
        .setValue(this.plugin.settings.newSetting)
        .onChange(async (value) => {
            this.plugin.settings.newSetting = value;
            await this.plugin.saveSettings();
        }));
```

### Adicionar Comando
```typescript
this.addCommand({
    id: 'command-id',
    name: 'Command Name',
    callback: () => {
        // Ação
    }
});
```

### Criar Modal
```typescript
import { Modal } from 'obsidian';

class MyModal extends Modal {
    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Title' });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// Usar
new MyModal(this.app).open();
```

### Notice (Notificação)
```typescript
import { Notice } from 'obsidian';

// Simples
new Notice('Message');

// Com duração (ms)
new Notice('Message', 5000);

// Com elemento customizado
const frag = document.createDocumentFragment();
const div = frag.createDiv();
div.innerHTML = '<strong>Bold</strong> message';
new Notice(frag);
```

### Trabalhar com Arquivos
```typescript
// Criar
await app.vault.create('path/to/file.md', 'content');

// Ler
const content = await app.vault.read(file);

// Modificar
await app.vault.modify(file, 'new content');

// Deletar
await app.vault.delete(file);

// Renomear/Mover
await app.vault.rename(file, 'new/path.md');
```

### Parse YAML Frontmatter
```typescript
function extractFrontmatter(content: string) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    try {
        const yaml = parseYaml(match[1]);
        return yaml;
    } catch (e) {
        return null;
    }
}

// Usar
const fm = extractFrontmatter(content);
const granolaId = fm?.granola_id;
```

### Registrar Eventos
```typescript
// Auto-cleanup no onunload
this.registerEvent(
    app.vault.on('create', (file) => {
        console.log('Created:', file.path);
    })
);

this.registerEvent(
    app.vault.on('modify', (file) => {
        console.log('Modified:', file.path);
    })
);

this.registerEvent(
    app.vault.on('delete', (file) => {
        console.log('Deleted:', file.path);
    })
);
```

### Timer com Auto-cleanup
```typescript
// Método 1: registerInterval
this.registerInterval(
    window.setInterval(() => {
        this.doSomething();
    }, 30000)
);

// Método 2: Manual
onload() {
    this.timer = window.setInterval(() => {
        this.doSomething();
    }, 30000);
}

onunload() {
    if (this.timer) {
        clearInterval(this.timer);
    }
}
```

## Estruturas de Dados

### TFile
```typescript
interface TFile {
    path: string;           // 'folder/file.md'
    name: string;           // 'file.md'
    basename: string;       // 'file'
    extension: string;      // 'md'
    stat: {
        ctime: number;      // Tempo de criação
        mtime: number;      // Tempo de modificação
        size: number;       // Tamanho em bytes
    };
    parent: TFolder;        // Pasta pai
    vault: Vault;           // Referência ao vault
}
```

### FileCache (Metadata)
```typescript
interface FileCache {
    frontmatter?: {
        [key: string]: any;
    };
    links?: Array<{
        link: string;
        displayText: string;
    }>;
    headings?: Array<{
        heading: string;
        level: number;
    }>;
    tags?: Array<{
        tag: string;
        position: Position;
    }>;
}
```

### Settings Pattern
```typescript
interface Settings {
    setting1: boolean;
    setting2: string;
    setting3: number;
}

const DEFAULT_SETTINGS: Settings = {
    setting1: true,
    setting2: 'default',
    setting3: 100
};

class MyPlugin extends Plugin {
    settings: Settings;

    async onload() {
        await this.loadSettings();
    }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
```

## Debugging

### Console Logs
```typescript
// Info
console.log('[Plugin]', message, data);

// Warning
console.warn('[Plugin]', message, data);

// Error
console.error('[Plugin]', message, error);

// Time profiling
console.time('operation');
doOperation();
console.timeEnd('operation');

// Table
console.table(arrayOfObjects);
```

### Breakpoints
```typescript
// No código
debugger;  // Pausa execução se DevTools estiver aberto
```

### Performance
```typescript
// Profiling
console.time('heavy-operation');
await heavyOperation();
console.timeEnd('heavy-operation');

// Memory
console.log('Memory:', performance.memory);
```

## Patterns Comuns

### Singleton Service
```typescript
class MyService {
    private static instance: MyService;

    static getInstance(app: App): MyService {
        if (!MyService.instance) {
            MyService.instance = new MyService(app);
        }
        return MyService.instance;
    }

    private constructor(private app: App) {}
}
```

### Lazy Loading
```typescript
private _service: HeavyService | null = null;

get service(): HeavyService {
    if (!this._service) {
        this._service = new HeavyService(this.app);
    }
    return this._service;
}
```

### Debounce
```typescript
private debounceTimer: number | null = null;

debounce(fn: () => void, delay: number = 500) {
    if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(fn, delay);
}

// Usar
this.debounce(() => this.processFile(file), 500);
```

### Cache com Invalidação
```typescript
private cache: Map<string, any> = new Map();

// No onload
this.registerEvent(
    app.vault.on('modify', (file) => {
        this.cache.delete(file.path);
    })
);

async getData(file: TFile) {
    if (this.cache.has(file.path)) {
        return this.cache.get(file.path);
    }

    const data = await this.computeData(file);
    this.cache.set(file.path, data);
    return data;
}
```

## Checklist de Debug

### Plugin não carrega
- [ ] Verificar erros no console (Ctrl+Shift+I)
- [ ] Verificar `manifest.json` está válido
- [ ] Verificar `main.js` existe e não está vazio
- [ ] Verificar permissões de arquivo
- [ ] Recarregar Obsidian completamente
- [ ] Verificar versão mínima do Obsidian

### Funcionalidade não funciona
- [ ] Verificar setting está habilitado
- [ ] Verificar logs no console
- [ ] Ativar debug mode
- [ ] Verificar dependências (Granola Sync)
- [ ] Verificar eventos estão registrados
- [ ] Verificar cleanup não foi chamado prematuramente

### Performance ruim
- [ ] Verificar quantidade de arquivos no vault
- [ ] Verificar cache está funcionando
- [ ] Verificar loops desnecessários
- [ ] Usar console.time() para profiling
- [ ] Verificar memory leaks

## Atalhos Úteis

### Obsidian
- `Ctrl+P`: Command Palette
- `Ctrl+Shift+I`: DevTools
- `Ctrl+R`: Reload (no DevTools)
- `Ctrl+,`: Settings
- `Ctrl+O`: Quick Switcher

### DevTools
- `Ctrl+Shift+C`: Inspect Element
- `Ctrl+Shift+M`: Device Toolbar
- `Ctrl+Shift+P`: Command Menu (DevTools)
- `Ctrl+F`: Find in file
- `Ctrl+Shift+F`: Find in all files

## Recursos Rápidos

### TypeScript Types
```typescript
import {
    App,
    Plugin,
    PluginManifest,
    TFile,
    TFolder,
    TAbstractFile,
    Vault,
    Notice,
    Modal,
    Setting,
    PluginSettingTab
} from 'obsidian';
```

### CSS Classes úteis
```css
.mod-cta              /* Primary button */
.mod-warning          /* Warning style */
.setting-item         /* Setting row */
.setting-item-info    /* Setting label/desc */
.setting-item-control /* Setting input */
.modal                /* Modal container */
.notice               /* Notice style */
```

### Vault Events
```typescript
'create'   // Arquivo criado
'modify'   // Arquivo modificado
'delete'   // Arquivo deletado
'rename'   // Arquivo renomeado
'closed'   // Vault fechado
```

### Workspace Events
```typescript
'layout-change'        // Layout mudou
'active-leaf-change'   // Aba ativa mudou
'file-open'           // Arquivo aberto
'quit'                // Obsidian fechando
```

## Troubleshooting One-Liners

```javascript
// Recarregar plugin sem recarregar Obsidian
await app.plugins.disablePlugin('granola-plugin-companion');
await app.plugins.enablePlugin('granola-plugin-companion');

// Limpar cache de metadata
app.metadataCache.trigger('changed');

// Force reload de arquivo
await app.vault.adapter.read(file.path);

// Listar todos plugins
console.log(Object.keys(app.plugins.manifests));

// Verificar plugin habilitado
Array.from(app.plugins.enabledPlugins);

// Current file
app.workspace.getActiveFile();

// All open files
app.workspace.getLeavesOfType('markdown').map(leaf => leaf.view.file);
```

## Environment Info

```javascript
// Platform info
console.log({
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    isMobile: Platform.isMobile,
    isDesktop: Platform.isDesktopApp,
    vaultPath: app.vault.adapter.basePath
});

// Obsidian version
console.log('Obsidian version:', (app as any).appVersion);

// Plugin info
const manifest = app.plugins.manifests['granola-plugin-companion'];
console.log('Plugin version:', manifest.version);
```
