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

```typescript
import { Modal, App } from 'obsidian';

class CustomModal extends Modal {
    constructor(app: App, private data: any) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Modal Title' });

        // Adicionar conteúdo
        contentEl.createEl('p', { text: 'Content here' });

        // Botões
        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

        buttonContainer.createEl('button', {
            text: 'Confirm',
            cls: 'mod-cta'
        }).addEventListener('click', () => {
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// Usar
new CustomModal(this.app, data).open();
```

### 4. Trabalhar com Arquivos

```typescript
// Listar arquivos
const files = this.app.vault.getFiles();
const mdFiles = files.filter(f => f.extension === 'md');

// Ler arquivo
const content = await this.app.vault.read(file);

// Escrever arquivo
await this.app.vault.create('path/to/file.md', 'content');
await this.app.vault.modify(file, 'new content');

// Deletar arquivo
await this.app.vault.delete(file);

// Renomear/mover
await this.app.vault.rename(file, 'new/path.md');
```

### 5. Parse de Frontmatter

```typescript
// Extrair frontmatter
import { parseYaml } from 'obsidian';

function extractFrontmatter(content: string) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) return null;

    try {
        return parseYaml(match[1]);
    } catch (error) {
        console.error('Failed to parse YAML:', error);
        return null;
    }
}

// Modificar frontmatter
function updateFrontmatter(content: string, updates: Record<string, any>): string {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
        // Adicionar novo frontmatter
        const yaml = Object.entries(updates)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        return `---\n${yaml}\n---\n${content}`;
    }

    // Atualizar existente
    // Implementação depende da complexidade
}
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

```typescript
// Registrar eventos para cleanup automático
this.registerEvent(
    this.app.vault.on('create', (file) => {
        this.handleFileCreate(file);
    })
);

this.registerEvent(
    this.app.vault.on('modify', (file) => {
        this.handleFileModify(file);
    })
);

// Obsidian automaticamente remove no onunload
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
