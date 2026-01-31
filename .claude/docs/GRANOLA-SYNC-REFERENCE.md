# Referência: Obsidian Granola Sync Plugin

> **Fonte Oficial**: [github.com/tomelliot/obsidian-granola-sync](https://github.com/tomelliot/obsidian-granola-sync)

## Visão Geral

O **Obsidian Granola Sync** é o plugin oficial que sincroniza notas e transcrições do aplicativo Granola (granola.ai) para o Obsidian.

### Informações Básicas
- **Plugin ID**: `granola-sync`
- **Tipo**: Community Plugin
- **Desenvolvedor**: Tom Elliott
- **Repositório**: https://github.com/tomelliot/obsidian-granola-sync
- **Plataformas**: **Desktop apenas** (mobile não suportado)
- **Função**: Busca documentos do Granola, converte de ProseMirror JSON para Markdown e salva como arquivos `.md`

## Como o Granola Sync Funciona

### 1. Autenticação
**Credenciais lidas diretamente do sistema de arquivos**
- O plugin lê as credenciais do Granola do diretório de dados da aplicação
- Não requer entrada manual de credenciais
- Código em `src/services/credentials.ts`

### 2. Processo de Sincronização
1. Busca documentos do Granola via API
2. Converte de ProseMirror JSON para Markdown
3. Aplica metadata via frontmatter
4. Detecta duplicatas usando `granola_id`
5. Salva arquivos `.md` no vault
6. Suporta sincronização periódica automática com intervalo configurável

### 3. Conversão de Formato
- **Origem**: ProseMirror JSON (formato interno do Granola)
- **Destino**: Markdown (.md)
- **Limitação**: Conversão limitada a elementos Markdown suportados

## Configurações do Plugin

### Sincronização de Notas

**Opções disponíveis:**
- ✅ Habilitar/desabilitar sincronização de notas
- ✅ Incluir notas privadas (raw private notes)
- ✅ Escolher destino:
  - Pasta específica
  - Daily notes
  - Estrutura de pastas de daily notes com seções opcionais

### Sincronização de Transcrições

**Opções disponíveis:**
- ✅ Habilitar/desabilitar sincronização de transcrições
- ✅ Escolher destino:
  - Pasta dedicada de transcrições
  - Estrutura de daily notes

### Sincronização Automática
- ✅ Intervalo de sincronização customizável
- ✅ Sincronização periódica em background

## Estrutura de Arquivos

### Nota Individual (Notes)

```markdown
---
granola_id: doc-abc123-def456
title: "Team Planning Meeting"
type: note
created: 2024-01-15T10:00:00Z
updated: 2024-01-15T12:00:00Z
attendees:
  - john@company.com
  - jane@company.com
transcript: "[[Transcripts/Team Planning Meeting - Transcript]]"
---

# Team Planning Meeting

## Enhanced Notes
[Conteúdo processado pelo Granola]

## Action Items
- Follow up with stakeholders
- Schedule next meeting
```

### Transcrição (Transcripts)

```markdown
---
granola_id: doc-abc123-def456
title: "Team Planning Meeting - Transcript"
type: transcript
created: 2024-01-15T10:00:00Z
updated: 2024-01-15T12:00:00Z
attendees:
  - john@company.com
  - jane@company.com
note: "[[Meetings/Team Planning Meeting]]"
---

# Transcript

**00:00** John: Let's start with the agenda...
**00:32** Jane: I agree, let's begin...
```

### Nota em Daily Notes

```markdown
---
granola_id: doc-abc123-def456
title: "Team Planning"
type: note
created: 2024-01-15T10:00:00Z
updated: 2024-01-15T12:00:00Z
attendees:
  - john@company.com
note: "[[2024-01-15#Team Planning]]"
---
```

**Nota**: Daily notes usam âncoras de heading (ex: `[[2024-01-15#Title]]`) ao invés de wiki-links diretos.

## Frontmatter Metadata

### Campos Universais (Sempre Presentes)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `granola_id` | String (UUID) | Identificador único **consistente** entre nota e transcrição |
| `type` | String | `"note"` ou `"transcript"` |
| `title` | String | Nome do documento |
| `created` | ISO timestamp | Data/hora de criação |
| `updated` | ISO timestamp | Data/hora da última atualização |
| `attendees` | Array | Lista de participantes da reunião |

### Campos Condicionais

| Campo | Presente Em | Descrição |
|-------|-------------|-----------|
| `transcript` | Notas (arquivos individuais) | Wiki-link para arquivo de transcrição |
| `note` | Transcrições | Wiki-link para nota (ou âncora em daily note) |

### ⚠️ Importante: `granola_id`

- **Imutável**: Nunca muda, mesmo após edições
- **Compartilhado**: Nota e transcrição têm o MESMO `granola_id`
- **Único**: Identifica a reunião original no Granola
- **Crítico**: Usado para prevenir duplicatas e vincular arquivos relacionados

## Comportamento de Vinculação

### Arquivos Individuais

Quando notas são salvas como arquivos individuais E transcrições são sincronizadas:
- ✅ **Vinculação bidirecional automática** é criada
- Nota → Link para transcrição
- Transcrição → Link para nota
- Ambos compartilham o mesmo `granola_id`

### Daily Notes

- Transcrições referenciam daily notes via **âncoras de heading**
- Formato: `[[2024-01-15#Meeting Title]]`
- Sem arquivo separado de nota

## Organização de Conteúdo

### Com Notas Privadas Habilitadas

```markdown
## Private Notes
[Notas brutas privadas]

## Enhanced Notes
[Notas processadas pelo AI]
```

### Sem Notas Privadas

```markdown
[Conteúdo processado diretamente]
```

### Formato Combinado (Nota + Transcrição)

```markdown
## Private Notes
[Notas privadas]

## Enhanced Notes
[Notas processadas]

## Transcript
[Transcrição completa]
```

**Ordem fixa**: Private Notes → Enhanced Notes → Transcript

## Naming Conventions

### Notas
- Salvas com título original
- Ou formato de daily note (se configurado)

### Transcrições
- Título original + sufixo **"- Transcript"**
- Exemplo: `Team Meeting - Transcript.md`

### Pastas
**Opções de destino:**
- Pasta individual customizada
- Daily notes
- Estrutura de pastas de daily notes

## Limitações Conhecidas

### 1. Desktop Apenas
- ❌ **Mobile não suportado**
- Plugin funciona apenas no Obsidian Desktop
- Documentado explicitamente pelo desenvolvedor

### 2. Conversão ProseMirror
- Limitado a elementos Markdown suportados
- Alguns elementos ProseMirror podem não converter perfeitamente

### 3. Sem API Pública
- Não há API ou webhooks documentados
- Integração ocorre via:
  - Leitura de credenciais do filesystem
  - Manipulação do vault
  - Eventos padrão do Obsidian

## Detecção de Arquivos do Granola

### Método 1: Via Metadata Cache (Recomendado)

```typescript
function isGranolaFile(file: TFile): boolean {
    const cache = this.app.metadataCache.getFileCache(file);
    return cache?.frontmatter?.granola_id !== undefined;
}
```

### Método 2: Verificar Tipo Específico

```typescript
function isGranolaNote(file: TFile): boolean {
    const cache = this.app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;
    return fm?.granola_id !== undefined && fm?.type === 'note';
}

function isGranolaTranscript(file: TFile): boolean {
    const cache = this.app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;
    return fm?.granola_id !== undefined && fm?.type === 'transcript';
}
```

### Método 3: Verificar se é Transcrição pelo Nome

```typescript
function isTranscriptByName(filename: string): boolean {
    return filename.toLowerCase().includes('transcript');
}
```

## Integração com Outros Plugins

### Detectar Granola Sync

```typescript
// Verificar se está instalado
const isInstalled = this.app.plugins.manifests['granola-sync'] !== undefined;

// Verificar se está habilitado
const isEnabled = this.app.plugins.enabledPlugins.has('granola-sync');

// Obter instância (se disponível)
const granolaSync = this.app.plugins.getPlugin('granola-sync');
```

### Eventos Úteis

```typescript
// Quando arquivo é criado
this.registerEvent(
    this.app.vault.on('create', (file) => {
        const cache = this.app.metadataCache.getFileCache(file);
        if (cache?.frontmatter?.granola_id) {
            // É arquivo do Granola
        }
    })
);

// Quando metadata muda
this.registerEvent(
    this.app.metadataCache.on('changed', (file) => {
        // Granola pode ter atualizado o arquivo
    })
);
```

## Cenários de Duplicação

### Por que Duplicatas Acontecem

O Granola Sync pode criar duplicatas quando:

1. **Arquivo movido**: Sync não encontra arquivo na pasta original
2. **Arquivo renomeado**: Sync busca por nome original
3. **Múltiplas sincronizações**: Race conditions durante sync
4. **Conflitos de nome**: Obsidian adiciona timestamp automático

### Padrão de Duplicata do Obsidian

Quando arquivo já existe, Obsidian adiciona timestamp:

```
Original:  Meeting - 2024-01-30.md
Duplicata: Meeting - 2024-01-30-2024-01-30_10-24-29.md
```

**Padrão**: `-YYYY-MM-DD_HH-MM-SS.md` no final

## Como Companion Previne Duplicatas

### Estratégia

```
Granola Sync                    Companion
    │                              │
    │ Tenta criar arquivo          │
    ├──────────────────────────────>│
    │                              │ Intercepta criação
    │                              │ Verifica granola_id
    │                              │ Busca arquivo existente
    │                              │
    │<──────────────────────────────┤
    │ Retorna: arquivo existente   │
    │ (se encontrado) ou           │
    │ permite criação (se novo)    │
```

### Deduplicação Inteligente

- ✅ Permite nota + transcrição com MESMO `granola_id`
- ❌ Bloqueia nota + nota com MESMO `granola_id`
- ❌ Bloqueia transcrição + transcrição com MESMO `granola_id`
- ✅ Detecta tipo pelo caminho ou campo `type`

## Boas Práticas

### ✅ Fazer

1. **Manter `granola_id` intacto**
   - Nunca remover ou modificar
   - Essencial para prevenção de duplicatas

2. **Estrutura de pastas consistente**
   - Evitar mover arquivos frequentemente
   - Se mover, aceitar que pode gerar duplicata (até Companion interceptar)

3. **Backup regular**
   - Antes de mudanças grandes na estrutura

4. **Usar Companion para cleanup**
   - Remover duplicatas existentes via botão "Remove Duplicates"

### ❌ Evitar

1. **Remover `granola_id`**
   ```yaml
   # NUNCA fazer isso:
   ---
   title: Meeting
   # granola_id removido! Vai quebrar!
   ---
   ```

2. **Modificar `type`**
   - Pode quebrar detecção de duplicatas
   - Companion usa `type` para diferenciar nota vs transcript

3. **Renomear arquivos de sync ativo**
   - Pode causar duplicatas na próxima sync
   - Melhor: Desabilitar sync, renomear, re-habilitar

## Tech Stack

### Tecnologias (do repositório oficial)

- **TypeScript**: 93.8%
- **JavaScript**: 6.2%
- **Testing**: Jest framework
- **Build**: esbuild

### Release Process

```bash
# Automático via script
node scripts/release.js [version]

# Build
npm run build

# Tests
npm run test
npm run test:watch
npm run test:coverage
```

## Recursos e Links

### Oficial
- **Granola App**: https://granola.ai
- **GitHub**: https://github.com/tomelliot/obsidian-granola-sync
- **Obsidian Plugin**: Buscar "Granola" no marketplace

### Comunidade
- Discord do Obsidian - Canal de plugins
- Fórum do Obsidian - Community plugins

## Notas para Desenvolvimento do Companion

### Assumptions Seguras ✅

- `granola_id` sempre será UUID único
- `granola_id` estará no frontmatter YAML
- `type` será `"note"` ou `"transcript"`
- Arquivos serão sempre Markdown (.md)
- Metadata cache do Obsidian estará disponível

### Assumptions Não Seguras ❌

- Nome de arquivo seguirá padrão (usuário pode renomear)
- Arquivo estará em pasta específica (usuário pode mover)
- Frontmatter terá todos os campos (versões podem variar)
- Um `granola_id` = um arquivo (podem existir duplicatas)

### Edge Cases a Considerar

1. ⚠️ Arquivo deletado mas Granola ainda tem registro
2. ⚠️ Múltiplas duplicatas do mesmo `granola_id`
3. ⚠️ YAML frontmatter corrompido ou inválido
4. ⚠️ Granola Sync desabilitado temporariamente
5. ⚠️ Sincronização offline com conflitos
6. ⚠️ Edição manual do `granola_id` (improvável mas possível)
7. ⚠️ Arquivo sem `type` no frontmatter (versões antigas?)

### Compatibilidade

**Companion deve funcionar com:**
- Todas as versões do Granola Sync que incluem `granola_id`
- Obsidian Desktop
- ⚠️ Mobile: Granola Sync não suporta, mas Companion deve ser gracioso

**Breaking Changes Potenciais:**
- Mudança no formato do `granola_id`
- Mudança na estrutura do frontmatter
- Novo método de identificação (além de `granola_id`)

## Troubleshooting

### Granola Sync não sincroniza

1. Verificar se credenciais estão corretas (Granola app)
2. Verificar conexão com internet
3. Verificar logs no console (Cmd/Ctrl + Shift + I)
4. Verificar se plugin está habilitado

### Companion não detecta arquivos

1. Verificar se arquivo tem `granola_id` no frontmatter
2. Verificar metadata cache (pode demorar alguns segundos)
3. Habilitar Debug Mode nas configurações do Companion
4. Verificar console para logs

### Duplicatas ainda sendo criadas

1. Verificar se "Duplicate Prevention" está habilitado no Companion
2. Verificar se Companion está instalado E habilitado
3. Verificar logs de debug para entender o que está acontecendo
4. Usar "Show Duplicate Stats" para ver estado atual
