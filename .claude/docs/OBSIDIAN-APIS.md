# Obsidian Native APIs - Quick Reference

> **Regra de Ouro**: SEMPRE use APIs nativas do Obsidian ao invés de criar implementações customizadas!

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
}
new MyModal(this.app).open();
```

### Notice
```typescript
import { Notice } from 'obsidian';
new Notice('Message', 5000); // duration in ms
```

### Setting
```typescript
import { Setting } from 'obsidian';

new Setting(containerEl)
    .setName('Name')
    .setDesc('Description')
    .addToggle(toggle => toggle.setValue(true));
```

### SuggestModal (Fuzzy Search)
```typescript
import { SuggestModal } from 'obsidian';

class MySuggest extends SuggestModal<string> {
    getSuggestions(query: string): string[] { return []; }
    renderSuggestion(value: string, el: HTMLElement) {}
    onChooseSuggestion(value: string) {}
}
```

### Menu (Context Menu)
```typescript
import { Menu } from 'obsidian';

const menu = new Menu();
menu.addItem(item => item.setTitle('Delete').onClick(() => {}));
menu.showAtMouseEvent(event);
```

## File Operations

### Vault API
```typescript
// List files
const mdFiles = this.app.vault.getMarkdownFiles();
const allFiles = this.app.vault.getFiles();

// Read/Write
const content = await this.app.vault.read(file);
await this.app.vault.create('path.md', 'content');
await this.app.vault.modify(file, 'new content');

// Delete/Rename
await this.app.vault.delete(file);
await this.app.vault.rename(file, 'new-path.md');

// Check existence
const exists = this.app.vault.getAbstractFileByPath('path.md');
```

### MetadataCache (Frontmatter)
```typescript
// ✅ Read frontmatter (fast, cached)
const cache = this.app.metadataCache.getFileCache(file);
const value = cache?.frontmatter?.key;

// ❌ Don't parse manually!
```

## Event Handling

### Register Events (Auto Cleanup)
```typescript
// ✅ ALWAYS use registerEvent
this.registerEvent(
    this.app.vault.on('create', (file) => {})
);

// Vault events: create, delete, rename, modify
// MetadataCache events: changed, resolved
```

### Register Intervals
```typescript
// ✅ ALWAYS use registerInterval
this.registerInterval(
    window.setInterval(() => {}, 30000)
);
```

## Utilities

### YAML Parsing
```typescript
import { parseYaml, stringifyYaml } from 'obsidian';

const obj = parseYaml('key: value');
const yaml = stringifyYaml({ key: 'value' });
```

### Markdown Rendering
```typescript
import { MarkdownRenderer } from 'obsidian';

await MarkdownRenderer.renderMarkdown(
    '# Title',
    containerEl,
    '',
    this
);
```

### HTML Element Creation
```typescript
// Obsidian adds helper methods to HTMLElement
containerEl.createEl('h2', { text: 'Title', cls: 'my-class' });
containerEl.createDiv({ cls: 'container' });
containerEl.createSpan({ text: 'text' });
```

## CSS Classes

### Buttons
- `mod-cta`: Call-to-action (blue/primary)
- `mod-warning`: Warning/destructive (red)
- `mod-muted`: Muted/secondary

### Layout
- `modal-button-container`: Flex container for buttons
- `setting-item`: Setting row
- `setting-item-info`: Setting name/description
- `setting-item-control`: Setting control (toggle, input, etc)

## Common Patterns

### Save Settings
```typescript
async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
}

async saveSettings() {
    await this.saveData(this.settings);
}
```

### Command Registration
```typescript
this.addCommand({
    id: 'my-command',
    name: 'My Command',
    callback: () => {},
    hotkeys: [{ modifiers: ["Mod"], key: "k" }]
});
```

### Ribbon Icon
```typescript
this.addRibbonIcon('dice', 'Tooltip', () => {});
// Icons: check, cross, settings, trash, pencil, etc.
```

## Anti-Patterns (DON'T DO THIS!)

### ❌ Manual DOM Management
```typescript
// DON'T: Create modal manually
const modal = document.createElement('div');
document.body.appendChild(modal);
// Memory leaks, no ESC handling, breaks mobile

// DO: Use Modal class
class MyModal extends Modal { /* ... */ }
```

### ❌ Manual Event Listeners
```typescript
// DON'T: Add listeners without cleanup
const handler = () => {};
this.app.vault.on('create', handler);

// DO: Use registerEvent
this.registerEvent(this.app.vault.on('create', handler));
```

### ❌ Using Node.js fs
```typescript
// DON'T: Use fs directly
import * as fs from 'fs';
fs.readFileSync('path'); // Breaks mobile!

// DO: Use vault API
await this.app.vault.read(file);
```

### ❌ Manual Frontmatter Parsing
```typescript
// DON'T: Parse YAML manually
const match = content.match(/^---\n([\s\S]*?)\n---/);

// DO: Use metadataCache
const cache = this.app.metadataCache.getFileCache(file);
const value = cache?.frontmatter?.key;
```

## Resources

- [Obsidian API Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Type Definitions](https://github.com/obsidianmd/obsidian-api)
- [Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
