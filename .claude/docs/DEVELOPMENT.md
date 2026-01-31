# Guia de Desenvolvimento - Granola Companion

> **📖 Leia primeiro**: [OBSIDIAN-PLUGIN-DEVELOPMENT.md](./OBSIDIAN-PLUGIN-DEVELOPMENT.md) - Guia completo de desenvolvimento de plugins Obsidian

Este guia é específico para o Granola Companion. Para informações gerais sobre Obsidian plugin development, consulte o guia completo acima.

---

## ⚠️ WORKFLOW OBRIGATÓRIO

### **SEMPRE execute este comando após fazer mudanças:**

```bash
npm run install:dev
```

**O que faz:**
1. Build do plugin (`npm run build`)
2. Copia arquivos compilados para o diretório do plugin no Obsidian
3. Torna as mudanças disponíveis para teste

### Após `npm run install:dev`:

1. **Recarregue o Obsidian**
   - Feche e reabra o Obsidian, OU
   - Command Palette → "Reload app without saving" (Cmd/Ctrl + R)

2. **Verifique que o plugin está habilitado**
   - Settings → Community Plugins → Granola Companion

3. **Teste suas mudanças**
   - Configurações do plugin para testar UI
   - Console (Cmd/Ctrl + Shift + I) para logs de debug

---

## Início Rápido

### Setup Inicial
```bash
git clone <repo>
cd eis-granola-sync-companion
npm install
```

### Estrutura de Trabalho
1. Editar código em `src/`
2. **RODAR: `npm run install:dev`**
3. Recarregar Obsidian
4. Testar funcionalidade
5. Verificar logs no Console

---

## Arquitetura do Projeto

### Estrutura de Diretórios

```
src/
├── main.ts                      # Plugin principal
├── services/                    # Serviços core
│   ├── GranolaIndexService.ts   # Indexa arquivos por granola_id (O(1) lookup)
│   ├── FileLookupService.ts     # Busca arquivos e previne duplicatas
│   └── GranolaSyncConfigReader.ts # Lê configuração do Granola Sync
├── modals/                      # Modais customizados
│   └── ConfirmDeleteModal.ts    # Modal de confirmação de remoção
└── settings/                    # UI de configurações
    └── CompanionSettingTab.ts   # Tab de settings do plugin
```

### Conceitos Principais

#### 1. Índice de Granola IDs
- **GranolaIndexService**: Map de `granola_id` → `TFile[]`
- **O(1) lookup** ao invés de O(n) scan completo
- Atualizado automaticamente via `metadataCache.on('changed')`

#### 2. Prevenção de Duplicatas
- **FileLookupService**: Intercepta criação de arquivos
- Detecta duplicatas por `granola_id` + `type` (note vs transcript)
- Permite nota + transcrição com mesmo `granola_id`
- Bloqueia nota + nota ou transcrição + transcrição

#### 3. Limpeza de Duplicatas
- Detecta padrão: `-YYYY-MM-DD_HH-MM-SS.md` (timestamp do Obsidian)
- Remove apenas arquivos com `granola_id` (segurança)
- Modal de confirmação com estatísticas

---

## Padrões do Projeto

### 1. SEMPRE Use APIs Nativas do Obsidian

> **📖 Referência completa**: [OBSIDIAN-PLUGIN-DEVELOPMENT.md](./OBSIDIAN-PLUGIN-DEVELOPMENT.md)

**Por que?**
- Lifecycle gerenciado automaticamente
- Menos bugs
- ~70% menos código
- Compatibilidade garantida

**Principais APIs:**
- `Modal`, `Notice`, `Setting` - UI
- `vault.*` - File operations
- `metadataCache.*` - Frontmatter
- `registerEvent`, `registerInterval` - Cleanup automático

---

### 2. Template de Nova Feature

```typescript
// 1. Adicionar setting
interface CompanionSettings {
    newFeatureEnabled: boolean;
}

// 2. Criar service (se complexo)
class NewFeatureService {
    constructor(private app: App) {}

    async initialize() {
        // Setup
    }
}

// 3. Integrar no main.ts
async onload() {
    if (this.settings.newFeatureEnabled) {
        this.featureService = new NewFeatureService(this.app);
        await this.featureService.initialize();
    }
}

// 4. Adicionar UI setting
new Setting(containerEl)
    .setName('Enable New Feature')
    .setDesc('Description')
    .addToggle(toggle => toggle
        .setValue(this.settings.newFeatureEnabled)
        .onChange(async (value) => {
            this.settings.newFeatureEnabled = value;
            await this.saveSettings();
        }));
```

---

### 3. Logging Consistente

```typescript
// Usar prefixo consistente
private log(message: string, data?: any) {
    if (this.settings.debugMode) {
        console.log(`Granola Companion: ${message}`, data || '');
    }
}

// Sempre mostrar warnings e errors
console.warn(`Granola Companion: WARNING - ${message}`);
console.error(`Granola Companion: ERROR - ${message}`, error);
```

---

### 4. Event Handling

**✅ SEMPRE use `registerEvent`**

```typescript
// ✅ Auto cleanup
this.registerEvent(
    this.app.vault.on('create', (file) => {
        this.handleFileCreate(file);
    })
);

// ❌ NUNCA gerencie manualmente
const handler = () => {};
this.app.vault.on('create', handler); // Memory leak!
```

**Eventos importantes:**
- `vault.on('create')` - Arquivo criado
- `vault.on('modify')` - Conteúdo modificado
- `metadataCache.on('changed')` - Frontmatter atualizado ⭐ (use este!)

---

### 5. Trabalhar com Granola Files

#### Detectar arquivo do Granola
```typescript
function isGranolaFile(file: TFile): boolean {
    const cache = this.app.metadataCache.getFileCache(file);
    return cache?.frontmatter?.granola_id !== undefined;
}
```

#### Distinguir nota vs transcrição
```typescript
function getGranolaType(file: TFile): 'note' | 'transcript' | null {
    const cache = this.app.metadataCache.getFileCache(file);
    return cache?.frontmatter?.type || null;
}
```

#### Buscar por granola_id
```typescript
// Via índice (O(1) - fast!)
const files = this.indexService.findAllByGranolaId(granolaId);

// Via scan completo (O(n) - slow, só usar como fallback)
const allFiles = this.app.vault.getMarkdownFiles();
const matches = allFiles.filter(f => {
    const cache = this.app.metadataCache.getFileCache(f);
    return cache?.frontmatter?.granola_id === granolaId;
});
```

---

## Testing

### 1. Console Testing
```typescript
// No DevTools Console (Ctrl+Shift+I)

// Acessar plugin
const plugin = app.plugins.getPlugin('granola-companion');

// Testar métodos
await plugin.showDuplicateStats();
plugin.refreshGranolaSyncStatus();

// Inspecionar estado
console.log(plugin.settings);
console.log(plugin.indexService.getStats());
```

---

### 2. Manual Testing Checklist

**Inicialização:**
- [ ] Plugin carrega sem erros
- [ ] Detecta Granola Sync (se instalado)
- [ ] Mostra aviso se Granola Sync não está instalado

**Prevenção de Duplicatas:**
- [ ] Bloqueia criação de nota + nota com mesmo granola_id
- [ ] Bloqueia criação de transcrição + transcrição com mesmo granola_id
- [ ] Permite criação de nota + transcrição com mesmo granola_id
- [ ] Notificação aparece quando duplicata é bloqueada
- [ ] Debug logs aparecem (se debug mode ativo)

**Limpeza de Duplicatas:**
- [ ] "Show Duplicate Stats" mostra estatísticas corretas
- [ ] "Remove Duplicates" remove apenas arquivos duplicados
- [ ] Modal de confirmação aparece
- [ ] Apenas arquivos com granola_id são removidos
- [ ] Notificação de sucesso aparece

**Settings:**
- [ ] Todas as configurações salvam corretamente
- [ ] Mudanças aplicam sem reload (quando possível)

---

### 3. Test Scenarios

#### Cenário 1: Granola Sync não instalado
1. Desinstalar Granola Sync
2. Recarregar Obsidian
3. ✅ Aviso aparece: "Granola Sync plugin not detected"
4. ✅ Settings mostram mensagem de dependência
5. Instalar Granola Sync
6. ✅ Plugin detecta e inicializa

#### Cenário 2: Prevenção de Duplicata - Mesmo Tipo
1. Ativar "Duplicate Prevention"
2. Criar nota `Meeting.md` com frontmatter:
   ```yaml
   ---
   granola_id: test-123-abc
   type: note
   ---
   ```
3. Tentar criar segunda nota com mesmo `granola_id`
4. ✅ Segunda nota NÃO é criada
5. ✅ Notificação: "Duplicate prevented"
6. ✅ Console log (se debug mode)

#### Cenário 3: Prevenção de Duplicata - Tipos Diferentes
1. Criar nota com `granola_id: test-456-def` e `type: note`
2. Criar transcrição com `granola_id: test-456-def` e `type: transcript`
3. ✅ Ambos são criados (tipos diferentes!)
4. ✅ Sem notificação de duplicata

#### Cenário 4: Limpeza de Duplicatas
1. Criar múltiplas duplicatas manualmente:
   - `Meeting - 2024-01-30.md`
   - `Meeting - 2024-01-30 - 2024-01-30_10-24-29.md` (duplicata)
   - `Meeting - 2024-01-30 - 2024-01-30_10-25-15.md` (duplicata)
2. Executar comando "Show Duplicate Statistics"
3. ✅ Mostra: "2 removable duplicates, 0 ID-group duplicates"
4. Clicar "Remove Duplicates"
5. ✅ Modal de confirmação aparece
6. Confirmar
7. ✅ Apenas arquivos com timestamp são removidos
8. ✅ Arquivo original permanece

---

## Performance

### Regras de Performance

1. **Use o índice do GranolaIndexService**
   - O(1) lookup vs O(n) scan completo

2. **Não faça scan completo no `metadataCache.on('changed')`**
   - Este evento dispara para TODOS os arquivos markdown
   - Filtre apenas arquivos com `granola_id`

3. **Use `onLayoutReady` para operações pesadas**
   - Não atrase o startup do Obsidian

4. **Cache resultados quando possível**

---

### Padrão de Cache

```typescript
class MyService {
    private cache = new Map<string, Data>();

    async getData(key: string): Promise<Data> {
        if (this.cache.has(key)) {
            return this.cache.get(key)!;
        }

        const data = await this.computeData(key);
        this.cache.set(key, data);
        return data;
    }

    clearCache(key: string) {
        this.cache.delete(key);
    }
}
```

---

## Debugging

### 1. Habilitar Debug Mode
Settings → Granola Companion → Enable Debug Mode

### 2. Console Logs
```bash
# Abrir DevTools
Cmd/Ctrl + Shift + I

# Ver logs
Granola Companion: <message>
Granola Index: <message>
```

### 3. Breakpoints
```typescript
// Adicionar no código
debugger;

// DevTools pausa aqui
```

### 4. Performance Profiling
```typescript
console.time('operation-name');
await doExpensiveOperation();
console.timeEnd('operation-name');
```

---

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
fix/xxx           # Bug fix
refactor/xxx      # Refatoração
```

---

## Troubleshooting

### Plugin não carrega
1. Verificar erros no console
2. Verificar `manifest.json` válido
3. Verificar `main.js` existe após build
4. Rodar `npm run install:dev` novamente

### Prevenção de duplicatas não funciona
1. Verificar se "Duplicate Prevention" está habilitado
2. Verificar se Granola Sync está ativo
3. Verificar logs no debug mode
4. Verificar se arquivo tem `granola_id` no frontmatter

### Performance ruim
1. Verificar quantos arquivos no vault
2. Verificar se há loops infinitos nos event handlers
3. Verificar se índice está populado
4. Usar Performance Profiler

---

## Release Checklist

- [ ] Versão atualizada em `manifest.json`
- [ ] Versão atualizada em `package.json`
- [ ] CHANGELOG atualizado
- [ ] README atualizado se necessário
- [ ] Testado em Obsidian Desktop
- [ ] Build de produção limpo (`npm run build`)
- [ ] Sem erros no console
- [ ] Commit e push
- [ ] Tag de versão criada
- [ ] Release notes escritas

---

## Recursos Adicionais

### Documentação Interna
- 📖 [OBSIDIAN-PLUGIN-DEVELOPMENT.md](./OBSIDIAN-PLUGIN-DEVELOPMENT.md) - Guia completo de Obsidian plugin development
- 📖 [OBSIDIAN-APIS.md](./OBSIDIAN-APIS.md) - Referência rápida de APIs
- 📖 [GRANOLA-SYNC-REFERENCE.md](./GRANOLA-SYNC-REFERENCE.md) - Informações sobre Granola Sync plugin

### Documentação Externa
- [Obsidian Plugin Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Obsidian API Types](https://github.com/obsidianmd/obsidian-api)
- [Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)

---

**Última Atualização**: 2026-01-30
