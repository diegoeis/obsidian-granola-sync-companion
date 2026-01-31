# Granola Plugin Companion - Contexto de Desenvolvimento

## Visão Geral do Projeto

O **Granola Plugin Companion** é um plugin para Obsidian que funciona como extensão do plugin **Obsidian Granola Sync**. Sua função principal é prevenir a criação de notas duplicadas quando o Granola Sync sincroniza reuniões.

### Problema que Resolve
Quando o plugin original Granola Sync sincroniza notas de reuniões, pode criar arquivos duplicados se a mesma nota for modificada ou re-sincronizada. Este companion detecta e previne essas duplicatas baseando-se no `granola_id` único de cada nota.

## Arquitetura do Plugin

### Estrutura de Arquivos
```
src/
├── main.ts                           # Plugin principal e UI
├── services/
│   ├── IntegrationService.ts        # Interceptação de operações do vault
│   └── FileLookupService.ts         # Busca e detecção de duplicatas
└── utils/
    ├── pluginDetector.ts            # Detecção do plugin Granola Sync
    └── yamlParser.ts                # Parser de YAML frontmatter
```

### Componentes Principais

#### 1. **main.ts** - Plugin Principal
- **Classe**: `GranolaPluginCompanion`
- **Responsabilidades**:
  - Lifecycle do plugin (onload, onunload)
  - Gerenciamento de configurações
  - UI (ribbon icon, comandos, settings tab)
  - Detecção contínua do status do Granola Sync
  - Notificações ao usuário

**Conceitos-chave**:
- Verifica se Granola Sync está instalado E habilitado antes de inicializar
- Mantém verificação periódica (30s) para detectar mudanças de status
- Pode funcionar em "modo limitado" quando Granola Sync não está disponível

#### 2. **IntegrationService.ts** - Interceptação
- **Responsabilidades**:
  - Interceptar operações de criação de arquivos no vault
  - Prevenir duplicatas antes da criação
  - Estatísticas de duplicatas

**Como funciona**:
```typescript
// Intercepta vault.create() nativo
vault.create = async function(path, content, options) {
    // Verifica se arquivo já existe com mesmo granola_id
    const result = await fileLookupService.interceptFileCreation(path, content);

    if (result.shouldCreate) {
        return originalCreate(path, content, options);
    }

    // Retorna arquivo existente ao invés de criar duplicata
    return existingFile;
}
```

#### 3. **FileLookupService.ts** - Detecção de Duplicatas
- **Responsabilidades**:
  - Buscar arquivos por `granola_id`
  - Listar todos os arquivos do Granola
  - Identificar grupos de duplicatas
  - Filtrar transcripts (que podem compartilhar granola_id com notas)

**Métodos principais**:
- `findFileByGranolaId()`: Busca arquivo específico
- `getDuplicateFiles()`: Lista grupos de duplicatas
- `interceptFileCreation()`: Lógica de prevenção

#### 4. **pluginDetector.ts** - Detecção de Dependências
- **Responsabilidades**:
  - Verificar instalação do Granola Sync
  - Verificar se está habilitado
  - Mostrar avisos apropriados

**Estados possíveis**:
- ✅ Installed + Enabled = Available (funcionamento completo)
- ⚠️ Installed + Disabled = Indisponível (avisar para habilitar)
- ❌ Not Installed = Indisponível (avisar para instalar)

#### 5. **yamlParser.ts** - Parse de Frontmatter
- **Responsabilidades**:
  - Extrair frontmatter YAML das notas
  - Buscar `granola_id` nos arquivos
  - Parser seguro e performático

## Conceitos do Obsidian API

### 1. Vault e Arquivos
```typescript
// App é a instância principal do Obsidian
app.vault                    // Acesso ao vault
app.vault.getFiles()         // Lista todos os arquivos
app.vault.create()           // Cria arquivo
app.vault.modify()           // Modifica arquivo
app.vault.getAbstractFileByPath() // Busca arquivo por path
```

### 2. Plugin Lifecycle
```typescript
class MyPlugin extends Plugin {
    async onload() {
        // Inicialização: settings, UI, event handlers
    }

    onunload() {
        // Cleanup: remover interceptações, intervals
    }
}
```

### 3. Settings e Storage
```typescript
await this.loadData()        // Carrega configurações salvas
await this.saveData(data)    // Salva configurações
```

### 4. UI Components
```typescript
this.addRibbonIcon()         // Ícone na sidebar
this.addCommand()            // Comando na paleta
this.addSettingTab()         // Tab de configurações
```

## Padrões de Código

### 1. Detecção de Plugin
```typescript
// CORRETO: Usar API oficial
const plugins = app.plugins;
const isEnabled = plugins.enabledPlugins.has('plugin-id');
const plugin = plugins.getPlugin('plugin-id');

// EVITAR: Acessar internals
const plugin = (app as any).plugins.plugins['plugin-id'];
```

### 2. Parse de YAML Frontmatter
```typescript
// Estrutura esperada do Granola Sync:
---
granola_id: abc123-def456
title: Meeting Notes
date: 2024-01-22
---
```

### 3. Interceptação Segura
```typescript
// Sempre salvar referência original
this.originalMethod = vault.create.bind(vault);

// Usar arrow function ou bind para manter contexto
vault.create = async (path, content, options) => {
    // Lógica customizada
    return this.originalMethod(path, content, options);
}

// Restaurar no cleanup
vault.create = this.originalMethod;
```

### 4. Verificação Periódica
```typescript
// Usar interval com cleanup
this.statusCheckInterval = setInterval(() => {
    this.checkStatus();
}, 30000);

// SEMPRE limpar no onunload
clearInterval(this.statusCheckInterval);
```

## Configurações do Plugin

```typescript
interface CompanionSettings {
    duplicatePreventionEnabled: boolean;  // Liga/desliga prevenção
    debugMode: boolean;                   // Logs detalhados
}
```

## Fluxo de Funcionamento

### 1. Inicialização
```
onload()
  ↓
Detectar Granola Sync
  ↓
Se disponível → Inicializar IntegrationService
  ↓
Interceptar vault.create()
  ↓
Adicionar UI (ribbon, comandos, settings)
  ↓
Iniciar verificação periódica
```

### 2. Prevenção de Duplicata
```
Granola Sync tenta criar arquivo
  ↓
vault.create() interceptado
  ↓
FileLookupService verifica granola_id
  ↓
Já existe?
  ├─ SIM → Retorna arquivo existente + aviso
  └─ NÃO → Cria normalmente
```

### 3. Detecção de Mudança de Status
```
Interval (30s)
  ↓
Verificar status do Granola Sync
  ↓
Status mudou?
  ├─ Ficou disponível → Inicializar integration
  └─ Ficou indisponível → Parar integration
  ↓
Notificar usuário
```

## Casos Especiais

### 1. Transcripts
Transcripts podem compartilhar `granola_id` com suas notas relacionadas, mas não são duplicatas. O FileLookupService filtra arquivos com "transcript" no nome ao detectar duplicatas.

### 2. Modo Limitado
Quando Granola Sync não está disponível:
- Settings tab mostra apenas aviso de dependência
- Não inicializa IntegrationService
- Mantém verificação periódica para detectar quando ficar disponível

### 3. Notificações
```typescript
// Usar Notice API do Obsidian
new Notice(fragment, duration);

// Fallback para console.log se Notice não disponível
```

## Debugging

### Debug Mode
Ativar em Settings → Debug Mode
```typescript
if (this.settings.debugMode) {
    console.log('Granola Companion:', message);
}
```

### Logs Importantes
- "Granola Plugin Companion loaded (Granola Sync available)"
- "Preventing duplicate creation for granola_id: xxx"
- "Granola Sync availability changed"

## Build e Deploy

### Scripts NPM
```bash
npm run dev              # Build com watch
npm run build            # Build produção
npm run dev:obsidian     # Build direto no vault padrão
npm run build:obsidian   # Build produção no vault padrão
```

### Setup Automático
```bash
./scripts/setup-obsidian.sh [vault-path]
```

### Arquivos Necessários no Plugin
- `main.js` - Código compilado
- `manifest.json` - Metadados do plugin
- `styles.css` (opcional)

## Boas Práticas

### 1. Performance
- Cache de resultados quando possível
- Evitar scans completos do vault repetidamente
- Usar verificações incrementais

### 2. Compatibilidade
- Sempre fornecer fallbacks para API antiga
- Testar em desktop E mobile
- Respeitar minAppVersion

### 3. Segurança
- Nunca assumir que plugins externos existem
- Validar dados do frontmatter
- Tratar erros gracefully

### 4. UX
- Notificações claras e acionáveis
- Não bloquear UI
- Fornecer feedback imediato

## Próximas Funcionalidades (Roadmap)

Baseado na estrutura atual, possíveis extensões:
1. Auto-merge de duplicatas existentes
2. UI para gerenciar duplicatas manualmente
3. Configuração de pastas específicas
4. Integração mais profunda com Granola Sync
5. Backup antes de prevenir duplicatas

## Referências

### Documentação Oficial Obsidian
- [Plugin Development](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Plugin Anatomy](https://docs.obsidian.md/Plugins/Getting+started/Anatomy+of+a+plugin)
- [Vault API](https://docs.obsidian.md/Reference/TypeScript+API/Vault)

### Plugin Granola Sync Original
- ID: `granola-sync`
- Função: Sincroniza notas de reuniões do Granola
- Adiciona `granola_id` único no frontmatter

## Comandos Úteis

### Verificar Status do Plugin
```typescript
// No console do Obsidian (Ctrl+Shift+I)
app.plugins.getPlugin('granola-plugin-companion')
app.plugins.getPlugin('granola-sync')
app.plugins.enabledPlugins.has('granola-sync')
```

### Inspecionar Arquivo
```typescript
const file = app.vault.getAbstractFileByPath('path/to/file.md');
const content = await app.vault.read(file);
console.log(content);
```

## Glossário

- **Vault**: Diretório raiz do Obsidian contendo todas as notas
- **TFile**: Tipo TypeScript representando arquivo no Obsidian
- **Frontmatter**: Metadados YAML no topo dos arquivos Markdown
- **granola_id**: Identificador único das notas do Granola Sync
- **Plugin Manifest**: Arquivo JSON com metadados do plugin
- **Community Plugin**: Plugin desenvolvido pela comunidade, não oficial
- **Ribbon**: Barra lateral esquerda do Obsidian
- **Command Palette**: Paleta de comandos (Ctrl+P)
