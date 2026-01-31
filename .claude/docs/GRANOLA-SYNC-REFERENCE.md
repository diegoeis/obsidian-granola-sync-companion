# Referência: Obsidian Granola Sync Plugin

## Visão Geral

O **Obsidian Granola Sync** é o plugin original desenvolvido pela Granola que sincroniza notas de reuniões do aplicativo Granola para o Obsidian.

### Informações Básicas
- **Plugin ID**: `granola-sync`
- **Tipo**: Community Plugin
- **Desenvolvedor**: Granola
- **Função**: Sincronizar reuniões do Granola automaticamente para Obsidian

## Como o Granola Sync Funciona

### 1. Sincronização de Reuniões
- Monitora reuniões no app Granola
- Cria automaticamente notas em Markdown no Obsidian
- Mantém sincronização bidirecional (edições no Obsidian podem voltar para Granola)

### 2. Estrutura de Arquivos Criados

#### Nota de Reunião
```markdown
---
granola_id: abc123-def456-789
title: Weekly Team Meeting
date: 2024-01-22
participants:
  - John Doe
  - Jane Smith
meeting_url: https://granola.ai/meetings/abc123
tags:
  - meeting
  - team
---

# Weekly Team Meeting

## Summary
[Conteúdo da reunião gerado pelo Granola]

## Action Items
- [ ] Task 1
- [ ] Task 2

## Notes
[Notas adicionais]
```

#### Transcript (opcional)
```markdown
---
granola_id: abc123-def456-789
title: Weekly Team Meeting - Transcript
date: 2024-01-22
type: transcript
---

# Transcript

**00:00** John Doe: Let's start the meeting...
**00:32** Jane Smith: I agree with that...
```

### 3. Metadados Importantes

#### `granola_id`
- **Tipo**: String (UUID)
- **Função**: Identificador único da reunião
- **Imutável**: Não muda mesmo se a reunião for editada
- **Uso**: Vincular nota com reunião original no Granola

#### Outros Metadados Comuns
```yaml
title: string              # Título da reunião
date: YYYY-MM-DD          # Data da reunião
time: HH:MM               # Hora de início
duration: number          # Duração em minutos
participants: string[]    # Lista de participantes
meeting_url: string       # Link para reunião no Granola
calendar_event: string    # Link do evento no calendário
tags: string[]           # Tags automáticas
```

## Padrões de Nome de Arquivo

### Formato Padrão
```
[Título] - YYYY-MM-DD.md
```

### Exemplos
```
Weekly Team Meeting - 2024-01-22.md
Product Review - 2024-01-15.md
Client Call - 2024-01-20.md
Weekly Team Meeting - 2024-01-22 1.md  (duplicata)
```

### Conflitos de Nome
Quando há conflito de nome (reunião com mesmo título na mesma data), Granola Sync pode:
1. Adicionar sufixo numérico: `Meeting - 2024-01-22 1.md`
2. Sobrescrever arquivo existente (dependendo da configuração)
3. Criar nova versão

**Problema**: Isto pode criar duplicatas não intencionais, que o Companion previne.

## Configurações do Granola Sync

### Configurações Típicas
- **Pasta de destino**: Onde salvar as notas (ex: `Meetings/`)
- **Template customizado**: Template para formato das notas
- **Sincronização automática**: Ativar/desativar sync automática
- **Incluir transcripts**: Se deve criar arquivo separado de transcript
- **Formato de data**: Como formatar datas nos nomes de arquivo

## Comportamento de Sincronização

### Quando Granola Sync Cria Arquivos

1. **Nova reunião**
   - Primeira sincronização cria novo arquivo
   - Adiciona `granola_id` único

2. **Reunião atualizada**
   - Edições no Granola atualizam nota existente
   - Usa `granola_id` para encontrar arquivo correto
   - **Problema potencial**: Se arquivo foi movido/renomeado, pode criar duplicata

3. **Edições no Obsidian**
   - Mudanças manuais no Obsidian podem sincronizar de volta
   - `granola_id` deve ser mantido intacto

### Cenários de Duplicação (que Companion previne)

#### Cenário 1: Arquivo Movido
```
1. Granola cria: Meetings/Team Sync - 2024-01-22.md
2. Usuário move para: Archive/2024/Team Sync - 2024-01-22.md
3. Granola sincroniza novamente
4. Granola não encontra arquivo na pasta original
5. Granola cria NOVO arquivo: Meetings/Team Sync - 2024-01-22.md
6. RESULTADO: 2 arquivos com mesmo granola_id
```

#### Cenário 2: Arquivo Renomeado
```
1. Granola cria: Meeting - 2024-01-22.md (granola_id: abc123)
2. Usuário renomeia para: Important Client Call.md
3. Granola sincroniza novamente
4. Não encontra arquivo pelo nome original
5. Cria novo: Meeting - 2024-01-22.md (granola_id: abc123)
6. RESULTADO: Duplicata
```

#### Cenário 3: Sync Conflict
```
1. Granola cria arquivo enquanto Obsidian está offline
2. Usuário cria manualmente arquivo com mesmo nome
3. Obsidian volta online
4. Granola tenta criar arquivo
5. Arquivo existe, mas sem granola_id correto
6. RESULTADO: Conflito ou duplicata
```

## API e Integração

### Como Outros Plugins Detectam Granola Sync

```typescript
// Verificar se plugin está instalado
const plugins = app.plugins;
const isInstalled = plugins.manifests['granola-sync'] !== undefined;

// Verificar se está habilitado
const isEnabled = plugins.enabledPlugins.has('granola-sync');

// Obter instância do plugin
const granolaSync = plugins.getPlugin('granola-sync');
```

### Eventos Relevantes

```typescript
// Quando Granola Sync cria arquivo
app.vault.on('create', (file) => {
    // Verificar se é arquivo do Granola
    const content = await app.vault.read(file);
    if (content.includes('granola_id:')) {
        // É arquivo do Granola
    }
});

// Quando Granola Sync modifica arquivo
app.vault.on('modify', (file) => {
    // Arquivo foi atualizado pela sincronização
});
```

## Identificação de Arquivos do Granola

### Método 1: Por Frontmatter
```typescript
function isGranolaFile(file: TFile): boolean {
    const cache = app.metadataCache.getFileCache(file);
    return cache?.frontmatter?.granola_id !== undefined;
}
```

### Método 2: Por Conteúdo
```typescript
async function isGranolaFile(file: TFile): Promise<boolean> {
    const content = await app.vault.read(file);
    return content.includes('granola_id:');
}
```

### Método 3: Por Padrão de Nome
```typescript
function looksLikeGranolaFile(filename: string): boolean {
    // Padrão: [Título] - YYYY-MM-DD.md
    const pattern = /- \d{4}-\d{2}-\d{2}\.md$/;
    return pattern.test(filename);
}
```

## Limitações Conhecidas

### 1. Detecção de Arquivos Movidos
Granola Sync pode não detectar arquivos que foram movidos para outras pastas, resultando em duplicatas.

### 2. Renomeação de Arquivos
Renomear arquivos pode quebrar vínculo com Granola, causando duplicatas.

### 3. Múltiplos Vaults
Sincronizar mesma conta Granola em múltiplos vaults pode causar conflitos.

### 4. Edições Simultâneas
Editar no Granola e Obsidian simultaneamente pode causar conflitos de merge.

## Boas Práticas ao Trabalhar com Granola Sync

### 1. Não Remover granola_id
```yaml
# NUNCA fazer isso:
---
title: My Meeting
date: 2024-01-22
# granola_id removido!
---
```

### 2. Não Mover Arquivos Frequentemente
Se precisar mover, considere:
- Manter estrutura de pastas consistente
- Usar links simbólicos
- Ou aceitar que Granola pode criar duplicata

### 3. Templates Customizados
Se usar templates, manter `granola_id` visível e intacto:
```markdown
---
granola_id: {{granola_id}}
title: {{title}}
---
```

### 4. Backup
Sempre manter backup antes de mudanças grandes na estrutura de pastas.

## Integração com Granola Companion

### Como Companion Complementa Granola Sync

```
Granola Sync                    Granola Companion
    │                                  │
    │ Tenta criar arquivo              │
    ├─────────────────────────────────>│
    │                                  │ Verifica granola_id
    │                                  │ Arquivo já existe?
    │                                  │
    │<─────────────────────────────────┤ Sim: Retorna existente
    │                                  │ Não: Permite criação
    │
    │ Usa arquivo (novo ou existente)
    │
```

### Benefícios da Integração
1. **Prevenção de Duplicatas**: Companion verifica antes de criar
2. **Transparente**: Granola Sync não precisa saber que Companion existe
3. **Não Invasivo**: Companion não modifica comportamento do Granola Sync
4. **Retroativo**: Companion pode detectar duplicatas existentes

## Estrutura de Dados Esperada

### Arquivo Mínimo Válido
```yaml
---
granola_id: required-uuid-here
---

# Content here
```

### Arquivo Completo Típico
```yaml
---
granola_id: abc123-def456-789012
title: Product Planning Session
date: 2024-01-22
time: "14:00"
duration: 60
participants:
  - alice@company.com
  - bob@company.com
meeting_url: https://granola.ai/meetings/abc123
calendar_event: https://calendar.google.com/event?eid=xxx
tags:
  - product
  - planning
  - quarterly
---

# Product Planning Session

## Attendees
- Alice (Product Manager)
- Bob (Engineering Lead)

## Agenda
1. Q1 Review
2. Q2 Planning
3. Roadmap Discussion

## Notes
[AI-generated summary from Granola]

## Action Items
- [ ] Alice: Review user feedback
- [ ] Bob: Technical feasibility study
- [ ] Both: Sync next week

## Transcript
Available in separate file: [Transcript](./Product Planning Session - 2024-01-22 Transcript.md)
```

## Debugging Granola Sync

### Verificar Status
```typescript
// No console do Obsidian
const granola = app.plugins.getPlugin('granola-sync');

// Verificar configurações
console.log(granola.settings);

// Verificar últimas sincronizações
// (depende da implementação interna)
```

### Logs do Granola Sync
Granola Sync geralmente loga no console do Obsidian:
```
[Granola Sync] Syncing meeting: abc123
[Granola Sync] Created file: Meeting.md
[Granola Sync] Updated file: Meeting.md
```

## Recursos Externos

### Links Úteis
- **Granola App**: https://granola.ai
- **Documentação Granola**: https://granola.ai/docs
- **Suporte**: Dentro do app Granola ou comunidade Obsidian

### Comunidade
- Discord do Obsidian - Canal de plugins
- Fórum do Obsidian - Seção de community plugins
- GitHub Issues do Granola Sync (se disponível)

## Changelog Hipotético (referência)

### v1.0.0
- Sincronização básica de reuniões
- Suporte a templates
- Configuração de pasta de destino

### v1.1.0
- Adicionado suporte a transcripts
- Melhoria na detecção de duplicatas (limitada)
- Templates customizáveis

### v1.2.0
- Sincronização bidirecional
- Performance melhorada
- Suporte a múltiplos calendários

## Notas para Desenvolvimento do Companion

### Assumptions Seguras
- ✅ `granola_id` sempre será UUID único
- ✅ `granola_id` estará no frontmatter YAML
- ✅ Formato de data será consistente
- ✅ Arquivos serão sempre Markdown (.md)

### Assumptions Não Seguras
- ❌ Nome de arquivo seguirá padrão específico (usuário pode renomear)
- ❌ Arquivo estará em pasta específica (usuário pode mover)
- ❌ Frontmatter terá todos os campos (versões podem variar)
- ❌ Um granola_id = um arquivo (pode haver duplicatas existentes)

### Edge Cases a Considerar
1. Usuário deletou arquivo mas Granola ainda tem registro
2. Múltiplas duplicatas do mesmo granola_id
3. Arquivo corrompido ou YAML inválido
4. Granola Sync desabilitado temporariamente
5. Sincronização offline com conflitos
6. Edição manual do granola_id (não deveria acontecer, mas...)

## Compatibilidade de Versões

### Companion deve funcionar com:
- Todas as versões do Granola Sync que incluem `granola_id`
- Obsidian 0.15.0+
- Mobile e Desktop

### Breaking Changes Potenciais
- Se Granola Sync mudar formato do `granola_id`
- Se Granola Sync mudar estrutura do frontmatter
- Se Granola Sync usar outro método de identificação
