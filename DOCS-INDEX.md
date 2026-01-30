# Índice da Documentação - Granola Plugin Companion

## 📚 Visão Geral

Este projeto contém documentação completa para facilitar o desenvolvimento do Granola Plugin Companion. Todos os documentos estão em Markdown e podem ser lidos diretamente no GitHub ou em qualquer editor.

## 📖 Documentos Disponíveis

### 1. [README.md](./README.md)
**O que é**: Documentação principal do projeto
**Quando usar**:
- Primeira vez usando o plugin
- Instalação e configuração
- Visão geral das funcionalidades

**Conteúdo**:
- ✨ Features do plugin
- 📦 Instalação (automática, manual, build)
- ⚙️ Configuração
- 🏗️ Estrutura de arquivos
- 🔗 Links para documentação oficial

---

### 2. [CONTEXT.md](./CONTEXT.md)
**O que é**: Contexto completo do projeto e arquitetura
**Quando usar**:
- Começar a desenvolver no projeto
- Entender como o código está organizado
- Compreender decisões de arquitetura
- Aprender conceitos do Obsidian API

**Conteúdo**:
- 🎯 Visão geral do projeto e problema que resolve
- 🏛️ Arquitetura do plugin (componentes e responsabilidades)
- 🧩 Conceitos do Obsidian API
- 📋 Padrões de código adotados
- 🔄 Fluxo de funcionamento
- ⚠️ Casos especiais (transcripts, modo limitado)
- 🐛 Debugging
- 🎓 Glossário de termos

**Destaques**:
- Explicação detalhada de cada componente (`main.ts`, `IntegrationService`, etc.)
- Diagrama de fluxo de prevenção de duplicatas
- Explicação de como funciona a interceptação do vault
- Conceitos importantes do Obsidian (Vault, TFile, Plugin lifecycle)

---

### 3. [DEVELOPMENT.md](./DEVELOPMENT.md)
**O que é**: Guia prático de desenvolvimento
**Quando usar**:
- Adicionar nova funcionalidade
- Resolver bugs
- Seguir padrões do projeto
- Testar mudanças

**Conteúdo**:
- 🚀 Início rápido (setup)
- 🔄 Workflow de desenvolvimento
- 🎨 Padrões de código (error handling, logging, settings)
- 🧪 Testing (manual e console)
- ⚡ Performance (cache, debouncing, lazy loading)
- 🐛 Debugging tips
- 📝 Git workflow
- ✅ Release checklist
- 🔧 Troubleshooting comum

**Destaques**:
- Templates prontos para features comuns
- Exemplos de código para adicionar comandos, modals, settings
- Checklist de testes manuais
- Cenários de teste importantes
- Dicas de performance

---

### 4. [GRANOLA-SYNC-REFERENCE.md](./GRANOLA-SYNC-REFERENCE.md)
**O que é**: Referência sobre o plugin Granola Sync original
**Quando usar**:
- Entender como Granola Sync funciona
- Compreender estrutura dos arquivos sincronizados
- Entender metadados (granola_id, etc.)
- Resolver problemas de integração

**Conteúdo**:
- 🔄 Como Granola Sync funciona
- 📄 Estrutura de arquivos criados
- 🏷️ Metadados importantes (granola_id, etc.)
- 📛 Padrões de nome de arquivo
- 🔀 Cenários de duplicação
- 🔌 API e integração
- ⚠️ Limitações conhecidas
- 💡 Boas práticas
- 🤝 Como Companion complementa Granola Sync

**Destaques**:
- Explicação detalhada do `granola_id`
- Cenários que causam duplicatas (arquivo movido, renomeado, etc.)
- Estrutura completa de uma nota do Granola
- Como detectar arquivos do Granola
- Edge cases a considerar

---

### 5. [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)
**O que é**: Cheat sheet com comandos e snippets
**Quando usar**:
- Precisar de snippet rápido
- Lembrar comando específico
- Console debugging
- Referência rápida de API

**Conteúdo**:
- 💻 Comandos essenciais (setup, build, git)
- 🎮 Console do Obsidian (testar funcionalidades)
- 📝 Snippets comuns (settings, comandos, modals)
- 📊 Estruturas de dados (TFile, FileCache)
- 🐛 Debugging one-liners
- ⚡ Patterns comuns (singleton, lazy loading, cache)
- ✅ Checklists de debug
- ⌨️ Atalhos úteis

**Destaques**:
- Comandos prontos para copy-paste
- Snippets testados e funcionais
- One-liners para console do Obsidian
- Checklists práticos de troubleshooting

---

### 6. [DOCS-INDEX.md](./DOCS-INDEX.md) _(este arquivo)_
**O que é**: Índice de navegação da documentação
**Quando usar**:
- Não saber qual documento ler
- Procurar informação específica
- Overview da documentação disponível

---

## 🗺️ Guia de Uso por Situação

### "Nunca trabalhei neste projeto"
1. Leia [README.md](./README.md) primeiro
2. Depois [CONTEXT.md](./CONTEXT.md) completo
3. Configure ambiente com [DEVELOPMENT.md](./DEVELOPMENT.md) → Início Rápido
4. Mantenha [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) aberto para consultas

### "Quero adicionar uma nova funcionalidade"
1. [DEVELOPMENT.md](./DEVELOPMENT.md) → Workflow de Desenvolvimento → Adicionar Nova Funcionalidade
2. [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → Snippets Comuns
3. [CONTEXT.md](./CONTEXT.md) → Padrões de Código (para seguir padrões existentes)

### "Encontrei um bug"
1. [DEVELOPMENT.md](./DEVELOPMENT.md) → Debugging Tips
2. [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → Debugging
3. [CONTEXT.md](./CONTEXT.md) → Fluxo de Funcionamento (entender o que deveria acontecer)

### "Como o Granola Sync funciona?"
1. [GRANOLA-SYNC-REFERENCE.md](./GRANOLA-SYNC-REFERENCE.md) completo

### "Preciso testar uma mudança"
1. [DEVELOPMENT.md](./DEVELOPMENT.md) → Testing
2. [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → Console do Obsidian

### "Qual comando para fazer X?"
1. [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → buscar por keyword

### "Como funciona componente X do código?"
1. [CONTEXT.md](./CONTEXT.md) → Arquitetura do Plugin → buscar componente

### "Performance está ruim"
1. [DEVELOPMENT.md](./DEVELOPMENT.md) → Performance
2. [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → Patterns Comuns → Cache

### "Vou fazer release"
1. [DEVELOPMENT.md](./DEVELOPMENT.md) → Release Checklist

---

## 🔍 Busca Rápida por Tópico

### Arquitetura & Conceitos
- **Visão geral**: [CONTEXT.md](./CONTEXT.md) → Visão Geral do Projeto
- **Componentes**: [CONTEXT.md](./CONTEXT.md) → Arquitetura do Plugin
- **Fluxo**: [CONTEXT.md](./CONTEXT.md) → Fluxo de Funcionamento
- **API do Obsidian**: [CONTEXT.md](./CONTEXT.md) → Conceitos do Obsidian API

### Desenvolvimento
- **Setup**: [DEVELOPMENT.md](./DEVELOPMENT.md) → Início Rápido
- **Adicionar feature**: [DEVELOPMENT.md](./DEVELOPMENT.md) → Workflow → Adicionar Nova Funcionalidade
- **Padrões de código**: [CONTEXT.md](./CONTEXT.md) → Padrões de Código + [DEVELOPMENT.md](./DEVELOPMENT.md) → Padrões de Código
- **Testing**: [DEVELOPMENT.md](./DEVELOPMENT.md) → Testing

### Granola Sync
- **Como funciona**: [GRANOLA-SYNC-REFERENCE.md](./GRANOLA-SYNC-REFERENCE.md) → Como o Granola Sync Funciona
- **Estrutura de arquivos**: [GRANOLA-SYNC-REFERENCE.md](./GRANOLA-SYNC-REFERENCE.md) → Estrutura de Arquivos Criados
- **granola_id**: [GRANOLA-SYNC-REFERENCE.md](./GRANOLA-SYNC-REFERENCE.md) → Metadados Importantes
- **Duplicatas**: [GRANOLA-SYNC-REFERENCE.md](./GRANOLA-SYNC-REFERENCE.md) → Cenários de Duplicação

### Código & Snippets
- **Comandos**: [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → Comandos Essenciais
- **Console testing**: [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → Console do Obsidian
- **Snippets**: [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → Snippets Comuns
- **Patterns**: [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → Patterns Comuns

### Debugging & Troubleshooting
- **Debug mode**: [CONTEXT.md](./CONTEXT.md) → Debugging
- **Tips**: [DEVELOPMENT.md](./DEVELOPMENT.md) → Debugging Tips
- **One-liners**: [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → Troubleshooting One-Liners
- **Checklists**: [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → Checklist de Debug

### Performance
- **Otimizações**: [DEVELOPMENT.md](./DEVELOPMENT.md) → Performance
- **Cache**: [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → Cache com Invalidação
- **Patterns**: [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → Patterns Comuns

---

## 📐 Estrutura dos Documentos

### Nível de Detalhe
```
README.md                      ⭐ Básico - Overview
  ↓
CONTEXT.md                     ⭐⭐ Intermediário - Conceitos e Arquitetura
  ↓
DEVELOPMENT.md                 ⭐⭐⭐ Avançado - Práticas e Workflows
  ↓
QUICK-REFERENCE.md            ⭐ Referência - Comandos e Snippets
  ↓
GRANOLA-SYNC-REFERENCE.md     ⭐⭐ Especializado - Plugin Original
```

### Público-Alvo
- **README.md**: Usuários e desenvolvedores novos
- **CONTEXT.md**: Desenvolvedores que vão trabalhar no código
- **DEVELOPMENT.md**: Desenvolvedores ativos no projeto
- **QUICK-REFERENCE.md**: Todos os desenvolvedores (referência)
- **GRANOLA-SYNC-REFERENCE.md**: Desenvolvedores que precisam entender integração

---

## 🎯 Objetivos da Documentação

### ✅ Você deve conseguir:
1. **Entender o projeto** sem precisar perguntar
2. **Começar a desenvolver** rapidamente
3. **Seguir padrões** do projeto naturalmente
4. **Resolver problemas** com a documentação
5. **Encontrar respostas** facilmente
6. **Contribuir** com confiança

### 📈 Documentação Viva
Esta documentação deve ser:
- ✏️ Atualizada quando código muda
- 📝 Expandida quando surgem dúvidas frequentes
- 🔄 Revisada periodicamente
- 💡 Melhorada com feedback da equipe

---

## 🤝 Como Contribuir com a Documentação

### Quando atualizar:
- ✨ Nova funcionalidade adicionada → Atualizar CONTEXT.md e DEVELOPMENT.md
- 🐛 Bug comum resolvido → Adicionar em DEVELOPMENT.md → Troubleshooting
- 💡 Descobriu snippet útil → Adicionar em QUICK-REFERENCE.md
- 🔄 Mudança de arquitetura → Atualizar CONTEXT.md
- 📚 Aprendizado sobre Granola Sync → Adicionar em GRANOLA-SYNC-REFERENCE.md

### Como atualizar:
1. Editar arquivo Markdown relevante
2. Manter formatação consistente
3. Adicionar exemplos quando possível
4. Atualizar índice se necessário
5. Commit com mensagem descritiva

---

## 📞 Precisa de Ajuda?

### Fluxo de busca:
1. **Procurar neste índice** primeiro
2. **Ler documento relevante** indicado
3. **Usar busca (Ctrl+F)** dentro do documento
4. **Consultar QUICK-REFERENCE** para snippets
5. **Verificar código-fonte** se ainda não encontrou
6. **Adicionar na documentação** se descobrir algo novo

---

## 🔖 Bookmarks Úteis

### Para ter sempre à mão:
- 🚀 [Setup inicial](./DEVELOPMENT.md#início-rápido)
- 🎮 [Console commands](./QUICK-REFERENCE.md#console-do-obsidian-ctrlshifti)
- 🔧 [Snippets](./QUICK-REFERENCE.md#snippets-comuns)
- 🐛 [Debug checklist](./QUICK-REFERENCE.md#checklist-de-debug)
- 📊 [Arquitetura](./CONTEXT.md#arquitetura-do-plugin)
- 🔄 [Fluxo de duplicatas](./CONTEXT.md#2-prevenção-de-duplicata)

---

## 📊 Estatísticas da Documentação

- **Total de documentos**: 6
- **Linhas de documentação**: ~2500+
- **Tópicos cobertos**: 50+
- **Exemplos de código**: 100+
- **Comandos e snippets**: 80+

---

**Última atualização**: 2024-01-22
**Versão da documentação**: 1.0.0
