# Obsidian Native APIs - Quick Reference

> **📖 Guia completo**: [OBSIDIAN-PLUGIN-DEVELOPMENT.md](./OBSIDIAN-PLUGIN-DEVELOPMENT.md)

Esta é uma referência rápida das APIs mais usadas. Para informações detalhadas, consulte o guia completo acima.

---

## ⚠️ Regra de Ouro

**SEMPRE use APIs nativas do Obsidian ao invés de criar implementações customizadas!**

**Por que?**
- ✅ Lifecycle gerenciado automaticamente (ESC key, cleanup)
- ✅ Consistência (mesmo look & feel do Obsidian)
- ✅ Menos bugs (código battle-tested)
- ✅ Menos código (~70% menos linhas)
- ✅ Compatibilidade (desktop + mobile)

---

## UI Components

### Modal
```typescript
import { Modal } from 'obsidian';

class MyModal extends Modal {
    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Title' });
        // Auto cleanup, ESC handling
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty(); // ✅ Always clean up!
    }
}

// Usage
new MyModal(this.app).open();
```

---

### Notice
```typescript
import { Notice } from 'obsidian';

// Simple (5s default)
new Notice('Message');

// Custom duration
new Notice('Message', 10000); // 10 seconds
```

---

### Setting
```typescript
import { Setting } from 'obsidian';

// Toggle
new Setting(containerEl)
    .setName('Enable feature')
    .setDesc('Description')
    .addToggle(toggle => toggle
        .setValue(true)
        .onChange(async (value) => {
            this.settings.enabled = value;
            await this.saveSettings();
        }));

// Text input
new Setting(containerEl)
    .setName('API Key')
    .addText(text => text
        .setPlaceholder('Enter key')
        .setValue(this.settings.apiKey)
        .onChange(async (value) => {
            this.settings.apiKey = value;
            await this.saveSettings();
        }));

// Button
new Setting(containerEl)
    .setName('Action')
    .addButton(btn => btn
        .setButtonText('Click')
        .setCta() // Call-to-action styling
        .onClick(() => {
            this.doSomething();
        }));

// Dropdown
new Setting(containerEl)
    .setName('Select')
    .addDropdown(dropdown => dropdown
        .addOption('opt1', 'Option 1')
        .addOption('opt2', 'Option 2')
        .setValue(this.settings.option)
        .onChange(async (value) => {
            this.settings.option = value;
            await this.saveSettings();
        }));
```

---

### SuggestModal (Fuzzy Search)
```typescript
import { SuggestModal } from 'obsidian';

class MySuggest extends SuggestModal<string> {
    getSuggestions(query: string): string[] {
        return ['item1', 'item2'].filter(i =>
            i.includes(query.toLowerCase())
        );
    }

    renderSuggestion(value: string, el: HTMLElement) {
        el.createEl('div', { text: value });
    }

    onChooseSuggestion(value: string) {
        new Notice(`Selected: ${value}`);
    }
}

// Usage
new MySuggest(this.app).open();
```

---

### Menu (Context Menu)
```typescript
import { Menu } from 'obsidian';

const menu = new Menu();
menu.addItem(item => item
    .setTitle('Delete')
    .setIcon('trash')
    .onClick(() => {})
);
menu.showAtMouseEvent(event);
```

---

## File Operations

### Vault API

```typescript
// List files
const mdFiles = this.app.vault.getMarkdownFiles(); // ✅ More efficient
const allFiles = this.app.vault.getFiles();

// Get specific file
const file = this.app.vault.getFileByPath('folder/file.md'); // ✅ O(1)
const folder = this.app.vault.getFolderByPath('folder');
const abstractFile = this.app.vault.getAbstractFileByPath('path');

// ❌ DON'T: O(n) scan
const file = this.app.vault.getFiles().find(f => f.path === 'path'); // Slow!

// Read
const content = await this.app.vault.read(file);
const arrayBuffer = await this.app.vault.readBinary(file);

// Create
const file = await this.app.vault.create('path/file.md', 'content');

// Modify
await this.app.vault.modify(file, 'new content');

// Atomic modify (prevents race conditions)
await this.app.vault.process(file, (content) => {
    return content.replace(/old/g, 'new');
});

// Delete
await this.app.vault.delete(file); // Move to trash
await this.app.vault.delete(file, true); // Permanent

// Rename/Move
await this.app.vault.rename(file, 'new-name.md');
await this.app.vault.rename(file, 'new-folder/file.md');
```

---

### MetadataCache (Frontmatter)

```typescript
// ✅ Read frontmatter (fast, cached)
const cache = this.app.metadataCache.getFileCache(file);
const granolaId = cache?.frontmatter?.granola_id;
const title = cache?.frontmatter?.title;

// ✅ Modify frontmatter (atomic)
await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
    frontmatter.updated = new Date().toISOString();
});

// ❌ DON'T: Parse manually (slow, error-prone)
const content = await this.app.vault.read(file);
const match = content.match(/^---\n([\s\S]*?)\n---/);
```

---

### Normalize Path

```typescript
import { normalizePath } from 'obsidian';

const path = normalizePath('//folder\\file.md'); // → "folder/file.md"
```

**What it does:**
- Cleans slashes
- Removes leading/trailing slashes
- Replaces non-breaking spaces
- Normalizes Unicode

---

## Event Handling

### ✅ ALWAYS use `registerEvent()`

```typescript
// ✅ Auto cleanup on plugin unload
this.registerEvent(
    this.app.vault.on('create', (file) => {
        console.log('File created:', file.path);
    })
);

// ❌ DON'T: Manual cleanup (memory leak!)
const handler = () => {};
this.app.vault.on('create', handler);
onunload() {
    this.app.vault.off('create', handler); // Easy to forget!
}
```

---

### Vault Events

- **`create`**: File or folder created
- **`modify`**: File content modified
- **`delete`**: File or folder deleted
- **`rename`**: File or folder renamed/moved

```typescript
this.registerEvent(
    this.app.vault.on('rename', (file, oldPath) => {
        console.log(`${oldPath} → ${file.path}`);
    })
);
```

---

### MetadataCache Events

- **`changed`**: Metadata updated (frontmatter, links, headings) ⭐
- **`resolved`**: Initial cache loaded

```typescript
this.registerEvent(
    this.app.metadataCache.on('changed', (file) => {
        const cache = this.app.metadataCache.getFileCache(file);
        console.log('Frontmatter:', cache?.frontmatter);
    })
);
```

**Important**: Use `changed` to detect frontmatter updates, not `vault.on('modify')`.

---

### ✅ ALWAYS use `registerInterval()`

```typescript
this.registerInterval(
    window.setInterval(() => {
        this.checkStatus();
    }, 30000)
);
```

---

## Editor API

```typescript
// In command
this.addCommand({
    id: 'example',
    name: 'Example',
    editorCallback: (editor: Editor) => {
        // Insert at cursor
        editor.replaceRange('text', editor.getCursor());

        // Replace selection
        const selection = editor.getSelection();
        editor.replaceSelection(selection.toUpperCase());

        // Get content
        const content = editor.getValue();
        const line = editor.getLine(5);
    }
});

// Elsewhere
const view = this.app.workspace.getActiveViewOfType(MarkdownView);
if (view) {
    const editor = view.editor;
}
```

---

## Utilities

### YAML Parsing
```typescript
import { parseYaml, stringifyYaml } from 'obsidian';

const obj = parseYaml('key: value');
const yaml = stringifyYaml({ key: 'value' });
```

---

### HTML Element Creation
```typescript
// Obsidian adds helper methods
containerEl.createEl('h2', { text: 'Title', cls: 'my-class' });
containerEl.createDiv({ cls: 'container' });
containerEl.createSpan({ text: 'text' });
containerEl.empty(); // Clear children
```

---

### Markdown Rendering
```typescript
import { MarkdownRenderer } from 'obsidian';

await MarkdownRenderer.renderMarkdown(
    '# Title\n\nContent',
    containerEl,
    '', // sourcePath
    this // component
);
```

---

## CSS Classes

### Buttons
- `mod-cta`: Call-to-action (blue/primary)
- `mod-warning`: Warning/destructive (red)
- `mod-muted`: Muted/secondary

### Layout
- `modal-button-container`: Button container
- `setting-item`: Setting row
- `setting-item-info`: Setting name/description
- `setting-item-control`: Setting control

### CSS Variables
- `--text-normal`
- `--text-muted`
- `--text-faint`
- `--background-primary`
- `--background-secondary`
- `--background-modifier-border`
- `--interactive-accent`

---

## Common Patterns

### Settings Persistence
```typescript
interface MySettings {
    enabled: boolean;
}

const DEFAULT_SETTINGS: Partial<MySettings> = {
    enabled: true
};

async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
}

async saveSettings() {
    await this.saveData(this.settings);
}
```

---

### Command Registration
```typescript
this.addCommand({
    id: 'my-command',
    name: 'My Command',
    callback: () => {},
    // Optional hotkey
    hotkeys: [{ modifiers: ["Mod"], key: "k" }]
});
```

---

### Ribbon Icon
```typescript
this.addRibbonIcon('dice', 'Tooltip', () => {});
// Icons: check, cross, settings, trash, pencil, star, etc.
```

---

## ❌ Anti-Patterns (DON'T DO THIS!)

### 1. Manual DOM Management
```typescript
// ❌ DON'T
const modal = document.createElement('div');
document.body.appendChild(modal); // Memory leaks!

// ✅ DO
class MyModal extends Modal { /* ... */ }
```

---

### 2. Manual Event Listeners
```typescript
// ❌ DON'T
const handler = () => {};
this.app.vault.on('create', handler);

// ✅ DO
this.registerEvent(this.app.vault.on('create', handler));
```

---

### 3. Using Node.js `fs`
```typescript
// ❌ DON'T
import * as fs from 'fs';
fs.readFileSync('path'); // Breaks mobile!

// ✅ DO
await this.app.vault.read(file);
```

---

### 4. Manual Frontmatter Parsing
```typescript
// ❌ DON'T
const content = await this.app.vault.read(file);
const match = content.match(/^---\n([\s\S]*?)\n---/);

// ✅ DO
const cache = this.app.metadataCache.getFileCache(file);
const value = cache?.frontmatter?.key;
```

---

### 5. innerHTML for User Input
```typescript
// ❌ DON'T - XSS vulnerability!
el.innerHTML = `<div>${userName}</div>`;

// ✅ DO
el.createDiv({ text: userName });
```

---

### 6. Iterating All Files
```typescript
// ❌ DON'T - O(n) slow!
const file = this.app.vault.getFiles().find(f => f.path === path);

// ✅ DO - O(1) fast!
const file = this.app.vault.getFileByPath(path);
```

---

### 7. Using Global `app`
```typescript
// ❌ DON'T
const files = app.vault.getFiles(); // Only for debugging!

// ✅ DO
const files = this.app.vault.getFiles();
```

---

### 8. Hardcoded Styling
```typescript
// ❌ DON'T
el.style.color = 'white';
el.style.backgroundColor = 'red';

// ✅ DO
const el = containerEl.createDiv({ cls: 'warning' });
// CSS: .warning { color: var(--text-normal); }
```

---

## Performance Tips

1. **Use `getFileByPath()` instead of iterating** (O(1) vs O(n))
2. **Use `metadataCache` for frontmatter** (cached)
3. **Use `onLayoutReady` for heavy operations** (don't delay startup)
4. **Filter events early** (don't process all files)
5. **Cache results when possible**

---

## Resources

- 📖 [OBSIDIAN-PLUGIN-DEVELOPMENT.md](./OBSIDIAN-PLUGIN-DEVELOPMENT.md) - Guia completo
- 📖 [DEVELOPMENT.md](./DEVELOPMENT.md) - Padrões do projeto
- 🌐 [Obsidian Plugin Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- 🌐 [Obsidian API Types](https://github.com/obsidianmd/obsidian-api)

---

**Última Atualização**: 2026-01-30
