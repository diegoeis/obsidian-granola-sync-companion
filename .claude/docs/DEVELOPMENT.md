# Guia de Desenvolvimento - Granola Plugin Companion

## ⚠️ IMPORTANTE: Workflow de Desenvolvimento

### **SEMPRE execute este comando após fazer mudanças:**

```bash
npm run install:dev
```

Este comando faz:
1. Build do plugin (`npm run build`)
2. Copia os arquivos compilados para o diretório do plugin no Obsidian
3. Torna as mudanças disponíveis para teste

### Após `npm run install:dev`:

1. **Recarregue o Obsidian completamente**
   - Feche e reabra o Obsidian, OU
   - Use Command Palette → "Reload app without saving" (Cmd/Ctrl + R)

2. **Verifique que o plugin está habilitado**
   - Settings → Community Plugins → Granola Plugin Companion

3. **Teste suas mudanças**
   - Abra as configurações do plugin para testar UI
   - Use a paleta de comandos (Cmd/Ctrl + P) para comandos novos
   - Verifique o console (Cmd/Ctrl + Shift + I) para logs de debug

---

## Início Rápido

### Setup Inicial
```bash
# Clonar e instalar
git clone <repo>
cd eis-granola-sync-companion
npm install
```

### Estrutura de Trabalho
1. Editar código em `src/`
2. **RODAR: `npm run install:dev`**
3. Recarregar Obsidian
4. Testar funcionalidade
5. Verificar logs no Console (Cmd/Ctrl + Shift + I)

## Workflow de Desenvolvimento

### 1. Adicionar Nova Funcionalidade

#### Template de Feature
```typescript
// 1. Adicionar setting (se necessário)
interface CompanionSettings {
    newFeatureEnabled: boolean;
}

// 2. Criar service (se complexo)
class NewFeatureService {
    constructor(private app: App) {}

    async doSomething() {
        // Implementação
    }
}

// 3. Integrar no main.ts
async onload() {
    if (this.settings.newFeatureEnabled) {
        this.newFeatureService = new NewFeatureService(this.app);
        await this.newFeatureService.initialize();
    }
}

// 4. Adicionar UI setting
new Setting(containerEl)
    .setName('Enable New Feature')
    .setDesc('Description of what it does')
    .addToggle(toggle => toggle
        .setValue(this.plugin.settings.newFeatureEnabled)
        .onChange(async (value) => {
            this.plugin.settings.newFeatureEnabled = value;
            await this.plugin.saveSettings();
        }));
```

### 2. Adicionar Novo Comando

```typescript
this.addCommand({
    id: 'unique-command-id',
    name: 'Command Name in Palette',
    callback: () => {
        this.handleCommand();
    },
    // Opcional: hotkey padrão
    hotkeys: [
        {
            modifiers: ["Mod", "Shift"],
            key: "g",
        }
    ]
});
```

### 3. Criar Nova View/Modal

**✅ Use sempre a API nativa `Modal` do Obsidian**

```typescript
import { Modal, App } from 'obsidian';

class CustomModal extends Modal {
    private data: any;

    constructor(app: App, data: any) {
        super(app);
        this.data = data;
    }

    onOpen() {
        const { contentEl } = this;

        // Título
        contentEl.createEl('h2', { text: 'Modal Title' });

        // Conteúdo
        contentEl.createEl('p', { text: 'Content here' });

        // Botões
        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.marginTop = '20px';

        // Botão de ação principal (destaque)
        buttonContainer.createEl('button', {
            text: 'Confirm',
            cls: 'mod-cta'  // Classe do Obsidian para botões de ação
        }).addEventListener('click', () => {
            this.close();
            // Ação aqui
        });

        // Botão de cancelar
        buttonContainer.createEl('button', {
            text: 'Cancel'
        }).addEventListener('click', () => {
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty(); // Limpa o conteúdo (sempre faça isso)
    }
}

// Usar
new CustomModal(this.app, data).open();
```

**Classes CSS úteis do Obsidian:**
- `mod-cta`: Botão de call-to-action (azul/destaque)
- `mod-warning`: Botão de ação destrutiva (vermelho)
- `modal-button-container`: Container para botões

### 4. Trabalhar com Arquivos

**✅ Use sempre a API `vault` do Obsidian**

```typescript
// Listar arquivos
const files = this.app.vault.getFiles();
const mdFiles = this.app.vault.getMarkdownFiles(); // Mais eficiente!

// Ler arquivo
const content = await this.app.vault.read(file);

// Escrever arquivo
await this.app.vault.create('path/to/file.md', 'content');
await this.app.vault.modify(file, 'new content');

// Deletar arquivo
await this.app.vault.delete(file);

// Renomear/mover
await this.app.vault.rename(file, 'new/path.md');

// Verificar se arquivo existe
const fileExists = this.app.vault.getAbstractFileByPath('path/to/file.md');

// Obter pasta
const folder = this.app.vault.getAbstractFileByPath('path/to/folder');
```

**⚠️ NUNCA use `fs` do Node.js diretamente!**
- Não funciona no mobile
- Quebra sandboxing do Obsidian
- Pode corromper o vault

### 5. Parse de Frontmatter

**✅ Use sempre `metadataCache` para ler frontmatter**

```typescript
// ✅ CORRETO: Usar metadataCache (mais rápido, já está em memória!)
const cache = this.app.metadataCache.getFileCache(file);
const granolaId = cache?.frontmatter?.granola_id;
const title = cache?.frontmatter?.title;

// ❌ ERRADO: Não faça parsing manual!
// Isso é lento e pode quebrar
const content = await this.app.vault.read(file);
const match = content.match(/^---\n([\s\S]*?)\n---/);
```

**Para MODIFICAR frontmatter (use parseYaml):**

```typescript
import { parseYaml, stringifyYaml } from 'obsidian';

async function updateFrontmatter(file: TFile, updates: Record<string, any>) {
    const content = await this.app.vault.read(file);
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    let newContent: string;
    if (match) {
        // Atualizar existente
        const yaml = parseYaml(match[1]);
        Object.assign(yaml, updates);
        const newYaml = stringifyYaml(yaml);
        newContent = content.replace(match[0], `---\n${newYaml}---`);
    } else {
        // Adicionar novo
        const newYaml = stringifyYaml(updates);
        newContent = `---\n${newYaml}---\n${content}`;
    }

    await this.app.vault.modify(file, newContent);
}
```

**⚠️ Importante:** `metadataCache` é assíncrono! Use o evento `changed`:

```typescript
this.registerEvent(
    this.app.metadataCache.on('changed', (file) => {
        const cache = this.app.metadataCache.getFileCache(file);
        // cache agora está atualizado
    })
);
```

## ⚠️ REGRA IMPORTANTE: Use APIs Nativas do Obsidian

**SEMPRE prefira as APIs nativas do Obsidian ao invés de criar implementações customizadas.**

O Obsidian já fornece APIs robustas e testadas para:
- ✅ Modals e diálogos (`Modal`, `SuggestModal`)
- ✅ Notices e notificações (`Notice`)
- ✅ Settings UI (`Setting`, `PluginSettingTab`)
- ✅ File operations (`vault.create`, `vault.read`, `vault.modify`)
- ✅ Event handling (`registerEvent`, `registerInterval`)
- ✅ Metadata parsing (`metadataCache.getFileCache`)

### Por que usar APIs Nativas?

1. **Lifecycle gerenciado automaticamente**: ESC key, cleanup, DOM management
2. **Consistência**: Mesmo look & feel dos modais nativos do Obsidian
3. **Menos bugs**: Código battle-tested usado por milhares de plugins
4. **Menos código**: ~70% menos código para manter
5. **Compatibilidade**: Funciona em todas as plataformas (Desktop, Mobile)

### Exemplo: Modal ❌ ERRADO vs ✅ CORRETO

#### ❌ ERRADO: Implementação Manual (70 linhas)
```typescript
// NÃO FAÇA ISSO!
private showDialog(): Promise<boolean> {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-container';
        // ... 60+ linhas de DOM manipulation
        // ... event listeners manuais
        // ... cleanup manual
        document.body.appendChild(modal);
    });
}
```

#### ✅ CORRETO: API Nativa (15 linhas)
```typescript
// FAÇA ISSO!
class MyModal extends Modal {
    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Title' });
        // contentEl é limpo automaticamente
        // ESC key funciona automaticamente
    }
}

// Uso
new MyModal(this.app).open();
```

## APIs Nativas Essenciais do Obsidian

### 1. Notice (Notificações)

**✅ Use `Notice` ao invés de `alert()` ou custom notifications**

```typescript
import { Notice } from 'obsidian';

// Simples
new Notice('Operation completed!');

// Com duração customizada (em ms)
new Notice('This will disappear in 10 seconds', 10000);

// Com fragmento HTML customizado
const fragment = document.createDocumentFragment();
const div = fragment.createDiv();
div.innerHTML = '<strong>Bold text</strong> and normal text';
new Notice(fragment);
```

### 2. Setting (Configurações UI)

**✅ Use `Setting` para criar UI de configurações**

```typescript
new Setting(containerEl)
    .setName('Feature Name')
    .setDesc('Description of what this does')
    .addToggle(toggle => toggle
        .setValue(this.settings.featureEnabled)
        .onChange(async (value) => {
            this.settings.featureEnabled = value;
            await this.saveSettings();
        }));

// Dropdown
new Setting(containerEl)
    .setName('Select Option')
    .addDropdown(dropdown => dropdown
        .addOption('option1', 'Option 1')
        .addOption('option2', 'Option 2')
        .setValue(this.settings.selectedOption)
        .onChange(async (value) => {
            this.settings.selectedOption = value;
            await this.saveSettings();
        }));

// Text input
new Setting(containerEl)
    .setName('API Key')
    .addText(text => text
        .setPlaceholder('Enter your API key')
        .setValue(this.settings.apiKey)
        .onChange(async (value) => {
            this.settings.apiKey = value;
            await this.saveSettings();
        }));

// Botão
new Setting(containerEl)
    .setName('Action')
    .setDesc('Click to perform action')
    .addButton(button => button
        .setButtonText('Do Something')
        .setCta() // Makes it a call-to-action button
        .onClick(() => {
            this.performAction();
        }));
```

### 3. SuggestModal (Autocomplete/Fuzzy Search)

**✅ Use `SuggestModal` para seleção com busca**

```typescript
import { SuggestModal } from 'obsidian';

class FileSuggestModal extends SuggestModal<TFile> {
    getSuggestions(query: string): TFile[] {
        return this.app.vault.getMarkdownFiles()
            .filter(file => file.basename.toLowerCase().includes(query.toLowerCase()));
    }

    renderSuggestion(file: TFile, el: HTMLElement) {
        el.createEl('div', { text: file.basename });
        el.createEl('small', { text: file.path });
    }

    onChooseSuggestion(file: TFile, evt: MouseEvent | KeyboardEvent) {
        new Notice(`Selected: ${file.basename}`);
        // Fazer algo com o arquivo selecionado
    }
}

// Usar
new FileSuggestModal(this.app).open();
```

### 4. Menu (Context Menu)

**✅ Use `Menu` para menus contextuais**

```typescript
import { Menu } from 'obsidian';

const menu = new Menu();

menu.addItem((item) =>
    item
        .setTitle('Delete')
        .setIcon('trash')
        .onClick(() => {
            // Deletar
        })
);

menu.addItem((item) =>
    item
        .setTitle('Rename')
        .setIcon('pencil')
        .onClick(() => {
            // Renomear
        })
);

menu.showAtMouseEvent(event);
```

### 5. MarkdownRenderer (Renderizar Markdown)

**✅ Use `MarkdownRenderer` para mostrar markdown renderizado**

```typescript
import { MarkdownRenderer } from 'obsidian';

const markdownText = '# Title\n\nSome **bold** text';
const containerEl = document.createElement('div');

await MarkdownRenderer.renderMarkdown(
    markdownText,
    containerEl,
    '', // sourcePath (pode ser vazio)
    this // component (para cleanup)
);
```

### 6. parseYaml e stringifyYaml

**✅ Use funções built-in para YAML**

```typescript
import { parseYaml, stringifyYaml } from 'obsidian';

// Parse
const data = parseYaml('key: value\nlist:\n  - item1\n  - item2');

// Stringify
const yaml = stringifyYaml({ key: 'value', list: ['item1', 'item2'] });
```

## Padrões de Código

### 1. Error Handling

```typescript
// SEMPRE usar try-catch em operações assíncronas
async initialize() {
    try {
        await this.loadData();
        await this.setupServices();
    } catch (error) {
        console.error('Failed to initialize:', error);

        // Notificar usuário se crítico
        new Notice('Failed to initialize Granola Companion');

        // Cleanup se necessário
        this.cleanup();
    }
}

// Validar inputs
function processFile(file: TFile | null) {
    if (!file) {
        console.warn('No file provided');
        return;
    }

    if (file.extension !== 'md') {
        console.warn('File is not markdown:', file.path);
        return;
    }

    // Processar
}
```

### 2. Logging Consistente

```typescript
// Usar prefixo consistente
private log(message: string, data?: any) {
    if (this.settings.debugMode) {
        console.log(`[Granola Companion] ${message}`, data || '');
    }
}

// Níveis de log
private logInfo(message: string) {
    console.log(`[Granola Companion] ${message}`);
}

private logWarn(message: string) {
    console.warn(`[Granola Companion] ${message}`);
}

private logError(message: string, error?: Error) {
    console.error(`[Granola Companion] ${message}`, error || '');
}
```

### 3. Settings Management

```typescript
// Sempre usar defaults
const DEFAULT_SETTINGS: CompanionSettings = {
    feature1: true,
    feature2: false,
    setting1: 'default value'
};

async loadSettings() {
    // Merge com defaults
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
}

async saveSettings() {
    await this.saveData(this.settings);

    // Re-aplicar configurações
    await this.applySettings();
}

async applySettings() {
    // Lógica para aplicar mudanças sem reload completo
    if (this.service) {
        await this.service.updateConfig(this.settings);
    }
}
```

### 4. Event Handling

**✅ SEMPRE use `registerEvent` para cleanup automático**

```typescript
// ✅ CORRETO: registerEvent gerencia cleanup automaticamente
this.registerEvent(
    this.app.vault.on('create', (file) => {
        this.handleFileCreate(file);
    })
);

this.registerEvent(
    this.app.metadataCache.on('changed', (file) => {
        this.handleMetadataChange(file);
    })
);

// Obsidian remove automaticamente no onunload()
```

**Eventos importantes do Vault:**
- `create`: Arquivo/pasta criado
- `delete`: Arquivo/pasta deletado
- `rename`: Arquivo/pasta renomeado
- `modify`: Conteúdo do arquivo modificado

**Eventos importantes do MetadataCache:**
- `changed`: Frontmatter ou cache atualizado (use este!)
- `resolved`: Cache inicial carregado

**❌ ERRADO: Não gerencie event listeners manualmente**
```typescript
// NÃO FAÇA ISSO!
const handler = () => { /* ... */ };
this.app.vault.on('create', handler);

onunload() {
    // Você vai esquecer de remover e ter memory leak!
    this.app.vault.off('create', handler);
}
```

### 5. Intervalos e Timers

```typescript
// Sempre registrar para cleanup
this.registerInterval(
    window.setInterval(() => {
        this.checkStatus();
    }, 30000)
);

// OU gerenciar manualmente
onload() {
    this.statusInterval = window.setInterval(() => {
        this.checkStatus();
    }, 30000);
}

onunload() {
    if (this.statusInterval) {
        clearInterval(this.statusInterval);
    }
}
```

## Testing

### 1. Console Testing
```typescript
// No DevTools Console do Obsidian (Ctrl+Shift+I)

// Acessar plugin
const plugin = app.plugins.getPlugin('granola-plugin-companion');

// Testar métodos
await plugin.showDuplicateStats();
plugin.refreshGranolaSyncStatus();

// Inspecionar estado
console.log(plugin.settings);
console.log(plugin.integrationService);

// Listar arquivos do Granola
const files = await plugin.integrationService.fileLookupService.getAllGranolaFiles();
console.log(files.map(f => f.path));
```

### 2. Manual Testing Checklist
- [ ] Plugin carrega sem erros
- [ ] Settings salvam corretamente
- [ ] Comandos funcionam na paleta
- [ ] Ribbon icon aparece e funciona
- [ ] Detecção do Granola Sync funciona
- [ ] Prevenção de duplicatas funciona
- [ ] Notificações aparecem
- [ ] Debug mode mostra logs
- [ ] Plugin descarrega limpo (sem memory leaks)

### 3. Test Scenarios

#### Cenário 1: Granola Sync não instalado
1. Desinstalar Granola Sync
2. Recarregar Obsidian
3. Verificar: Aviso aparece
4. Verificar: Settings mostram mensagem de dependência
5. Instalar Granola Sync
6. Verificar: Plugin detecta e inicializa

#### Cenário 2: Prevenção de Duplicata
1. Ativar "Duplicate Prevention"
2. Criar nota com granola_id: `test-123`
3. Tentar criar outra nota com mesmo granola_id
4. Verificar: Segunda nota não é criada
5. Verificar: Notificação aparece
6. Verificar: Console mostra log (se debug mode)

#### Cenário 3: Estatísticas
1. Criar múltiplas notas com mesmo granola_id
2. Executar comando "Show Duplicate Statistics"
3. Verificar: Estatísticas corretas
4. Verificar: Lista mostra duplicatas

## Performance

### 1. Evitar Scans Completos
```typescript
// MAU: Scan completo frequente
setInterval(() => {
    const allFiles = this.app.vault.getFiles();
    allFiles.forEach(file => {
        // processamento pesado
    });
}, 1000);

// BOM: Cache e invalidação
private fileCache: Map<string, FileData> = new Map();

this.registerEvent(
    this.app.vault.on('modify', (file) => {
        this.fileCache.delete(file.path);
    })
);

async getFileData(file: TFile): Promise<FileData> {
    if (this.fileCache.has(file.path)) {
        return this.fileCache.get(file.path)!;
    }

    const data = await this.computeFileData(file);
    this.fileCache.set(file.path, data);
    return data;
}
```

### 2. Debouncing
```typescript
private debounceTimer: number | null = null;

handleFileChange(file: TFile) {
    if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
        this.processFile(file);
    }, 500);
}
```

### 3. Lazy Loading
```typescript
// Carregar serviços pesados sob demanda
private _heavyService: HeavyService | null = null;

get heavyService(): HeavyService {
    if (!this._heavyService) {
        this._heavyService = new HeavyService(this.app);
    }
    return this._heavyService;
}
```

## Debugging Tips

### 1. Habilitar Source Maps
```typescript
// esbuild.config.mjs
export default {
    sourcemap: 'inline',  // ou 'external'
    // ...
}
```

### 2. Breakpoints
```typescript
// Adicionar breakpoint no código
debugger;

// Abrir DevTools, código vai pausar aqui
```

### 3. Performance Profiling
```typescript
console.time('operation-name');
await doExpensiveOperation();
console.timeEnd('operation-name');
```

### 4. Memory Leaks
```typescript
// Verificar se cleanup está funcionando
onunload() {
    console.log('Cleaning up...');

    // Verificar se tudo foi limpo
    if (this.intervals.size > 0) {
        console.warn('Intervals not cleared!', this.intervals);
    }
}
```

## Git Workflow

### Commit Messages
```
feat: add duplicate auto-merge functionality
fix: resolve memory leak in file watcher
docs: update development guide
refactor: simplify interceptor logic
perf: optimize granola_id lookup
test: add manual test scenarios
```

### Branches
```bash
main              # Código estável
feature/xxx       # Nova funcionalidade
fix/xxx          # Bug fix
refactor/xxx     # Refatoração
```

## Release Checklist

- [ ] Versão atualizada em `manifest.json`
- [ ] Versão atualizada em `package.json`
- [ ] CHANGELOG atualizado
- [ ] README atualizado se necessário
- [ ] Testado em Obsidian Desktop
- [ ] Testado em Obsidian Mobile (se aplicável)
- [ ] Build de produção limpo
- [ ] Commit e tag de versão
- [ ] Release notes escritas

## Troubleshooting Comum

### Plugin não carrega
1. Verificar erros no console
2. Verificar `manifest.json` válido
3. Verificar `main.js` existe
4. Verificar permissões de arquivos

### Interceptação não funciona
1. Verificar se Granola Sync está ativo
2. Verificar se duplicate prevention está habilitado
3. Verificar logs no debug mode
4. Verificar se método original foi salvo

### Performance ruim
1. Verificar quantos arquivos no vault
2. Verificar se há loops infinitos
3. Verificar se cache está funcionando
4. Usar Performance Profiler

### Notificações não aparecem
1. Verificar se Notice API está disponível
2. Verificar console para fallback logs
3. Verificar se elemento DOM foi criado

## Recursos Adicionais

### TypeScript
- Usar tipos do Obsidian: `TFile`, `TFolder`, `App`, etc.
- Evitar `any`, usar `unknown` se necessário
- Definir interfaces para dados complexos

### CSS Styling
```css
/* styles.css */
.granola-companion-modal {
    padding: 20px;
}

.granola-duplicate-warning {
    border-left: 4px solid var(--color-red);
    padding: 10px;
}
```

### Icons
```typescript
// Usar ícones do Lucide (built-in no Obsidian)
this.addRibbonIcon('dice', 'Tooltip', callback);

// Ícones disponíveis: dice, check, alert-triangle, settings, etc.
```
