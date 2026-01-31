# Obsidian Plugin Development Guide

> **Fonte Oficial**: [Obsidian Plugin Documentation](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)

Esta é a referência completa de desenvolvimento de plugins para Obsidian, baseada na documentação oficial.

---

## 📋 Índice

1. [Plugin Guidelines (CRÍTICO)](#plugin-guidelines)
2. [Plugin Anatomy & Lifecycle](#plugin-anatomy--lifecycle)
3. [User Interface](#user-interface)
4. [File Operations](#file-operations)
5. [Events](#events)
6. [Editor API](#editor-api)
7. [Performance & Optimization](#performance--optimization)
8. [Security](#security)
9. [Mobile Compatibility](#mobile-compatibility)
10. [React Integration](#react-integration)
11. [Anti-Patterns](#anti-patterns)

---

## Plugin Guidelines

> ⚠️ **CRITICAL**: Estas regras são OBRIGATÓRIAS e previnem bugs, vulnerabilidades e problemas de performance.

### General Guidelines

#### ✅ DO: Use `this.app` from plugin instance
```typescript
export default class MyPlugin extends Plugin {
    async onload() {
        const files = this.app.vault.getMarkdownFiles(); // ✅ Correto
    }
}
```

#### ❌ DON'T: Use global `app` object
```typescript
const files = app.vault.getMarkdownFiles(); // ❌ Errado - apenas para debug
```

**Razão**: `window.app` é apenas para debugging no console e pode ser removido no futuro.

---

#### ✅ DO: Minimize console logging
- **Apenas** mostre erros em produção
- Debug logs devem estar atrás de flag de debug

```typescript
if (this.settings.debugMode) {
    console.log('[MyPlugin] Debug info');
}
```

#### ❌ DON'T: Log excessivamente
```typescript
console.log('Processing file...'); // ❌ Poluição no console
```

---

#### ✅ DO: Organize code in folders
```
src/
├── main.ts
├── services/
│   ├── FileService.ts
│   └── IndexService.ts
├── modals/
│   └── ConfirmModal.ts
└── settings/
    └── SettingsTab.ts
```

#### ✅ DO: Rename placeholder classes
- `MyPlugin` → `GranolaCompanionPlugin`
- `MyPluginSettings` → `CompanionSettings`
- `SampleSettingTab` → `CompanionSettingTab`

---

### UI Text Guidelines

#### Settings Formatting
- **Use Sentence case**, not Title Case
- Don't use "settings" in section headings
  - ✅ "Advanced"
  - ❌ "Advanced settings"
- Only use headings if you have **more than one section**
- Keep general settings at top **without heading**

```typescript
// ✅ Correto
new Setting(containerEl)
    .setName('Enable duplicate prevention')  // Sentence case
    .setDesc('Prevents creating duplicate Granola notes');

new Setting(containerEl)
    .setName('Advanced options')  // Não "Advanced Options Settings"
    .setHeading();
```

---

### Security (CRITICAL) 🔒

#### ❌ NEVER use innerHTML/outerHTML/insertAdjacentHTML
**Vulnerabilidade XSS crítica!**

```typescript
// ❌ DANGER: XSS vulnerability!
containerElement.innerHTML = `<div>${userName}</div>`;
```

#### ✅ ALWAYS use DOM API or Obsidian helpers
```typescript
// ✅ Safe: Use createEl
containerEl.createDiv({text: userName});

// ✅ Safe: Use textContent
const div = containerEl.createDiv();
div.textContent = userName;
```

**Obsidian helpers disponíveis:**
- `createEl(tag, options)` - Generic element
- `createDiv(options)` - Div element
- `createSpan(options)` - Span element
- `empty()` - Clear element contents

---

### Resource Management

#### ✅ DO: Use `registerEvent()` for auto-cleanup
```typescript
export default class MyPlugin extends Plugin {
    onload() {
        // ✅ Auto cleanup on plugin unload
        this.registerEvent(
            this.app.vault.on('create', this.onCreate)
        );
    }

    onCreate = (file: TAbstractFile) => {
        console.log('File created:', file.path);
    }
}
```

#### ✅ DO: Use `registerInterval()` for timers
```typescript
onload() {
    this.registerInterval(
        window.setInterval(() => this.checkStatus(), 30000)
    );
}
```

#### ❌ DON'T: Manage event listeners manually
```typescript
// ❌ Memory leak waiting to happen!
const handler = () => { /* ... */ };
this.app.vault.on('create', handler);

onunload() {
    this.app.vault.off('create', handler); // Easy to forget!
}
```

**Exception**: DOM event listeners on elements that will be removed are automatically garbage-collected.

---

#### ❌ DON'T: Detach leaves in onunload
```typescript
// ❌ Don't do this
onunload() {
    this.app.workspace.detachLeavesOfType(MY_VIEW_TYPE);
}
```

**Razão**: When plugin updates, Obsidian reinitializes leaves at their original position.

---

### Commands

#### ❌ AVOID: Setting default hotkeys
- May conflict with other plugins
- Hard to choose hotkeys available on all OS

```typescript
// ❌ Avoid
this.addCommand({
    id: 'my-command',
    name: 'My Command',
    hotkeys: [{ modifiers: ["Mod", "Shift"], key: "k" }] // Risky!
});
```

#### ✅ DO: Use appropriate callback types

```typescript
// Runs unconditionally
this.addCommand({
    id: 'always-runs',
    name: 'Always Runs',
    callback: () => { /* ... */ }
});

// Runs under certain conditions
this.addCommand({
    id: 'conditional',
    name: 'Conditional',
    checkCallback: (checking) => {
        if (this.canRun()) {
            if (!checking) this.doSomething();
            return true;
        }
        return false;
    }
});

// Requires active Markdown editor
this.addCommand({
    id: 'editor-command',
    name: 'Editor Command',
    editorCallback: (editor: Editor) => {
        editor.replaceSelection('Hello!');
    }
});
```

---

### Workspace

#### ❌ AVOID: Accessing `workspace.activeLeaf` directly
```typescript
// ❌ Don't do this
const leaf = this.app.workspace.activeLeaf;
```

#### ✅ DO: Use type-safe accessors
```typescript
// ✅ For Markdown view
const view = this.app.workspace.getActiveViewOfType(MarkdownView);
if (view) {
    const editor = view.editor;
}

// ✅ For active editor (any type)
const editor = this.app.workspace.activeEditor?.editor;
if (editor) {
    // Use editor
}
```

---

#### ❌ AVOID: Managing references to custom views
```typescript
// ❌ Don't store view references
this.registerView(MY_VIEW_TYPE, () => this.view = new MyView());
```

#### ✅ DO: Use factory functions and access via workspace
```typescript
// ✅ Correct
this.registerView(MY_VIEW_TYPE, () => new MyView());

// Access views like this:
for (let leaf of this.app.workspace.getLeavesOfType(MY_VIEW_TYPE)) {
    let view = leaf.view;
    if (view instanceof MyView) {
        // Use view
    }
}
```

**Razão**: Obsidian may call factory function multiple times. Don't assume only one instance.

---

### Vault Operations

#### ✅ PREFER: Editor API over Vault.modify for active file
```typescript
// ✅ Better: Maintains cursor, selection, folding
const editor = this.app.workspace.activeEditor?.editor;
if (editor) {
    editor.replaceRange('new text', { line: 0, ch: 0 });
}

// ❌ Worse: Loses context
await this.app.vault.modify(activeFile, newContent);
```

**Benefits**:
- Maintains cursor position
- Preserves selection
- Keeps folded content
- More efficient for small changes

---

#### ✅ PREFER: `Vault.process` over `Vault.modify` for background edits
```typescript
// ✅ Atomic operation
await this.app.vault.process(file, (content) => {
    return content.replace(/old/g, 'new');
});

// ❌ Race condition possible
const content = await this.app.vault.read(file);
const newContent = content.replace(/old/g, 'new');
await this.app.vault.modify(file, newContent);
```

**Razão**: `process()` prevents conflicts with other plugins making concurrent edits.

---

#### ✅ PREFER: `FileManager.processFrontMatter` for frontmatter
```typescript
// ✅ Atomic, consistent YAML layout
await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
    frontmatter.updated = new Date().toISOString();
});
```

---

#### ✅ PREFER: Vault API over Adapter API
```typescript
// ✅ Better: Cached, serialized
const content = await this.app.vault.read(file);

// ❌ Worse: No cache, race conditions
const content = await this.app.vault.adapter.read(file.path);
```

**Benefits**:
- **Performance**: Caching layer speeds up reads
- **Safety**: Serial operations prevent race conditions

---

#### ❌ AVOID: Iterating all files to find by path
```typescript
// ❌ O(n) - slow!
const file = this.app.vault.getFiles().find(f => f.path === filePath);

// ✅ O(1) - fast!
const file = this.app.vault.getFileByPath('folder/file.md');
const folder = this.app.vault.getFolderByPath('folder');
const abstractFile = this.app.vault.getAbstractFileByPath(path);
```

---

#### ✅ ALWAYS: Use `normalizePath()` for user-defined paths
```typescript
import { normalizePath } from 'obsidian';

const path = normalizePath('//my-folder\\file'); // → "my-folder/file"
```

**What it does**:
- Cleans forward/backward slashes
- Removes leading/trailing slashes
- Replaces non-breaking spaces
- Normalizes Unicode

---

### Editor Extensions

#### ✅ DO: Keep same reference when reconfiguring
```typescript
class MyPlugin extends Plugin {
    private editorExtension: Extension[] = [];

    onload() {
        this.registerEditorExtension(this.editorExtension);
    }

    updateEditorExtension() {
        // ✅ Keep same array reference!
        this.editorExtension.length = 0;
        this.editorExtension.push(this.createEditorExtension());

        // Flush changes
        this.app.workspace.updateOptions();
    }
}
```

**Razão**: Obsidian watches the array reference. Creating new array breaks the link.

---

### Styling

#### ❌ DON'T: Hardcode styles
```typescript
// ❌ Bad: Not customizable
el.style.color = 'white';
el.style.backgroundColor = 'red';
```

#### ✅ DO: Use CSS classes and variables
```typescript
// ✅ Good: Customizable with themes
const el = containerEl.createDiv({cls: 'warning-container'});
```

**CSS:**
```css
.warning-container {
    color: var(--text-normal);
    background-color: var(--background-modifier-error);
}
```

**Benefits**:
- Theme compatibility
- User customization with CSS snippets
- Consistent look with Obsidian

---

### TypeScript Best Practices

#### ✅ PREFER: `const`/`let` over `var`
```typescript
// ✅ Good
const MAX_FILES = 1000;
let count = 0;

// ❌ Bad
var count = 0;
```

---

#### ✅ PREFER: `async`/`await` over Promises
```typescript
// ✅ Good: Readable
async function fetchData(): Promise<string | null> {
    try {
        let res = await requestUrl('https://api.example.com');
        return res.text;
    } catch (e) {
        console.error(e);
        return null;
    }
}

// ❌ Worse: Harder to read
function fetchData(): Promise<string | null> {
    return requestUrl('https://api.example.com')
        .then(res => res.text)
        .catch(e => {
            console.error(e);
            return null;
        });
}
```

---

## Plugin Anatomy & Lifecycle

### Plugin Structure

```typescript
import { Plugin } from 'obsidian';

export default class ExamplePlugin extends Plugin {
    async onload() {
        // ✅ Configure resources needed by the plugin
        // - Register commands
        // - Register views
        // - Register events
        // - Load settings
        // - Initialize services

        console.log('Plugin loaded');
    }

    async onunload() {
        // ✅ Release resources
        // - Clean up custom event listeners (if not using registerEvent)
        // - Clear intervals (if not using registerInterval)
        // - Don't detach leaves!

        console.log('Plugin unloaded');
    }
}
```

**Lifecycle:**
1. User enables plugin → `onload()` runs
2. User disables plugin → `onunload()` runs
3. Plugin updates → `onunload()` + `onload()` runs

**Debugging**: Use `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac) to open Console and see lifecycle logs.

---

## User Interface

### 1. Modals

#### Basic Modal
```typescript
import { App, Modal } from 'obsidian';

export class ExampleModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Look at me, I\'m a modal! 👀' });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty(); // ✅ Always clean up!
    }
}

// Usage
new ExampleModal(this.app).open();
```

---

#### Modal with User Input
```typescript
export class InputModal extends Modal {
    private onSubmit: (result: string) => void;

    constructor(app: App, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: 'What\'s your name?' });

        let name = '';
        new Setting(contentEl)
            .setName('Name')
            .addText((text) =>
                text.onChange((value) => { name = value; })
            );

        new Setting(contentEl)
            .addButton((btn) => btn
                .setButtonText('Submit')
                .setCta() // Call-to-action styling
                .onClick(() => {
                    this.close();
                    this.onSubmit(name);
                })
            );
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// Usage
new InputModal(this.app, (name) => {
    new Notice(`Hello, ${name}!`);
}).open();
```

---

#### SuggestModal (Autocomplete)
```typescript
import { SuggestModal } from 'obsidian';

interface Book {
    title: string;
    author: string;
}

export class BookSuggestModal extends SuggestModal<Book> {
    // ✅ Return suggestions based on query
    getSuggestions(query: string): Book[] {
        const books = this.getAllBooks();
        return books.filter((book) =>
            book.title.toLowerCase().includes(query.toLowerCase())
        );
    }

    // ✅ Render each suggestion
    renderSuggestion(book: Book, el: HTMLElement) {
        el.createEl('div', { text: book.title });
        el.createEl('small', { text: book.author });
    }

    // ✅ Handle selection
    onChooseSuggestion(book: Book, evt: MouseEvent | KeyboardEvent) {
        new Notice(`Selected ${book.title}`);
    }
}
```

---

#### FuzzySuggestModal (Fuzzy Search)
```typescript
import { FuzzySuggestModal } from 'obsidian';

export class BookFuzzySuggestModal extends FuzzySuggestModal<Book> {
    // ✅ Return all items (fuzzy search handled automatically)
    getItems(): Book[] {
        return this.getAllBooks();
    }

    // ✅ Return text to search against
    getItemText(book: Book): string {
        return book.title;
    }

    onChooseItem(book: Book, evt: MouseEvent | KeyboardEvent) {
        new Notice(`Selected ${book.title}`);
    }
}
```

---

### 2. Notices

```typescript
import { Notice } from 'obsidian';

// Simple notice (5 seconds default)
new Notice('Operation completed!');

// Custom duration
new Notice('This will disappear in 10 seconds', 10000);

// With HTML fragment
const fragment = document.createDocumentFragment();
const div = fragment.createDiv();
div.innerHTML = '<strong>Bold</strong> text';
new Notice(fragment);
```

---

### 3. Settings

#### Settings Interface & Persistence
```typescript
interface ExamplePluginSettings {
    featureEnabled: boolean;
    apiKey: string;
    maxFiles: number;
}

const DEFAULT_SETTINGS: Partial<ExamplePluginSettings> = {
    featureEnabled: true,
    apiKey: '',
    maxFiles: 100
};

export default class ExamplePlugin extends Plugin {
    settings: ExamplePluginSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new ExampleSettingTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
```

**Important**: `Object.assign()` is shallow copy. For nested objects, use deep copy.

**`Partial<Type>`**: Makes all properties optional for default values.

---

#### Settings Tab
```typescript
import { App, PluginSettingTab, Setting } from 'obsidian';

export class ExampleSettingTab extends PluginSettingTab {
    plugin: ExamplePlugin;

    constructor(app: App, plugin: ExamplePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // Heading
        new Setting(containerEl)
            .setName('General')
            .setHeading();

        // Toggle
        new Setting(containerEl)
            .setName('Enable feature')
            .setDesc('Enables the main feature')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.featureEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.featureEnabled = value;
                    await this.plugin.saveSettings();
                })
            );

        // Text input
        new Setting(containerEl)
            .setName('API key')
            .setDesc('Your API key')
            .addText(text => text
                .setPlaceholder('Enter API key')
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveSettings();
                })
            );

        // Button
        new Setting(containerEl)
            .setName('Clear cache')
            .setDesc('Clears all cached data')
            .addButton(btn => btn
                .setButtonText('Clear')
                .setCta()
                .onClick(async () => {
                    await this.plugin.clearCache();
                    new Notice('Cache cleared');
                })
            );
    }
}
```

---

#### Available Setting Types

**Text Input:**
```typescript
.addText(text => text.setValue('').onChange(async (v) => {}))
```

**Text Area:**
```typescript
.addTextArea(area => area.setValue('').onChange(async (v) => {}))
```

**Search:**
```typescript
.addSearch(search => search.setValue('').onChange(async (v) => {}))
```

**Toggle:**
```typescript
.addToggle(toggle => toggle.setValue(true).onChange(async (v) => {}))
```

**Dropdown:**
```typescript
.addDropdown(dropdown => dropdown
    .addOption('opt1', 'Option 1')
    .addOption('opt2', 'Option 2')
    .setValue('opt1')
    .onChange(async (v) => {})
)
```

**Slider:**
```typescript
.addSlider(slider => slider
    .setLimits(0, 100, 1)
    .setValue(50)
    .setDynamicTooltip()
    .onChange(async (v) => {})
)
```

**Button:**
```typescript
.addButton(btn => btn
    .setButtonText('Click me')
    .setCta()  // Call-to-action styling
    .onClick(() => {})
)
```

**Moment Format (Date):**
```typescript
.addMomentFormat(format => format
    .setDefaultFormat('YYYY-MM-DD')
    .setValue(this.settings.dateFormat)
    .onChange(async (v) => {})
)
```

---

### 4. HTML Elements

#### Creating Elements
```typescript
// Basic element
containerEl.createEl('h1', { text: 'Heading 1' });

// With CSS class
containerEl.createEl('div', {
    text: 'Content',
    cls: 'my-class'
});

// Nested elements
const book = containerEl.createDiv({ cls: 'book' });
book.createEl('div', { text: 'How to Take Smart Notes', cls: 'book__title' });
book.createEl('small', { text: 'Sönke Ahrens', cls: 'book__author' });
```

#### Helper Methods
```typescript
containerEl.createDiv({ text: 'Div element' });
containerEl.createSpan({ text: 'Span element' });
containerEl.empty(); // Clear all children
```

#### CSS Styling
**styles.css:**
```css
.book {
    border: 1px solid var(--background-modifier-border);
    padding: 10px;
}

.book__title {
    font-weight: 600;
}

.book__author {
    color: var(--text-muted);
}
```

**Use Obsidian CSS variables for theme compatibility:**
- `--text-normal`
- `--text-muted`
- `--text-faint`
- `--background-primary`
- `--background-secondary`
- `--background-modifier-border`
- `--interactive-accent` (links, buttons)

#### Conditional Styles
```typescript
element.toggleClass('danger', status === 'error');
element.addClass('active');
element.removeClass('inactive');
```

---

### 5. Status Bar

```typescript
import { Plugin } from 'obsidian';

export default class ExamplePlugin extends Plugin {
    async onload() {
        const statusBarItem = this.addStatusBarItem();
        statusBarItem.createEl('span', { text: 'Hello from status bar 👋' });
    }
}
```

**Multiple items:**
```typescript
const fruits = this.addStatusBarItem();
fruits.createEl('span', { text: '🍎' });
fruits.createEl('span', { text: '🍌' });

const veggies = this.addStatusBarItem();
veggies.createEl('span', { text: '🥦' });
```

**Note**: Not supported on Obsidian mobile.

---

### 6. Custom Views

#### Basic View Structure
```typescript
import { ItemView, WorkspaceLeaf } from 'obsidian';

export const VIEW_TYPE_EXAMPLE = 'example-view';

export class ExampleView extends ItemView {
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return VIEW_TYPE_EXAMPLE;
    }

    getDisplayText() {
        return 'Example view';
    }

    async onOpen() {
        const container = this.contentEl;
        container.empty();
        container.createEl('h4', { text: 'Example view' });
    }

    async onClose() {
        // Clean up resources
    }
}
```

#### Register View
```typescript
export default class ExamplePlugin extends Plugin {
    async onload() {
        this.registerView(
            VIEW_TYPE_EXAMPLE,
            (leaf) => new ExampleView(leaf) // ✅ Factory function
        );

        this.addCommand({
            id: 'open-view',
            name: 'Open example view',
            callback: () => this.activateView()
        });
    }

    async activateView() {
        const { workspace } = this.app;

        // Check if view already exists
        let leaf = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0];

        if (!leaf) {
            // Create new leaf in right sidebar
            leaf = workspace.getRightLeaf(false);
            await leaf.setViewState({
                type: VIEW_TYPE_EXAMPLE,
                active: true
            });
        }

        // Reveal the leaf
        workspace.revealLeaf(leaf);
    }
}
```

**Warning**: Never store direct references to views. Use `getLeavesOfType()` to access instances.

---

## File Operations

### Vault API

#### List Files
```typescript
// All files
const allFiles = this.app.vault.getFiles();

// Only Markdown files (more efficient!)
const mdFiles = this.app.vault.getMarkdownFiles();

// Specific file/folder
const file = this.app.vault.getFileByPath('folder/file.md');
const folder = this.app.vault.getFolderByPath('folder');
const abstractFile = this.app.vault.getAbstractFileByPath('path');
```

#### Read Files
```typescript
// Read file content
const content = await this.app.vault.read(file);

// Read binary (images, PDFs)
const arrayBuffer = await this.app.vault.readBinary(file);
```

#### Create Files
```typescript
// Create file
const file = await this.app.vault.create('path/file.md', 'content');

// Create with normalized path
import { normalizePath } from 'obsidian';
const file = await this.app.vault.create(
    normalizePath('//folder\\file.md'),
    'content'
);
```

#### Modify Files
```typescript
// Simple modify
await this.app.vault.modify(file, 'new content');

// Atomic modify (prevents race conditions)
await this.app.vault.process(file, (content) => {
    return content.replace(/old/g, 'new');
});
```

#### Delete Files
```typescript
// Move to trash (default)
await this.app.vault.delete(file);

// Permanently delete
await this.app.vault.delete(file, true);
```

#### Rename/Move Files
```typescript
// Rename file
await this.app.vault.rename(file, 'new-name.md');

// Move file
await this.app.vault.rename(file, 'new-folder/file.md');
```

---

### MetadataCache (Frontmatter)

#### ✅ Read Frontmatter (Fast, Cached)
```typescript
// Best practice: Use metadata cache
const cache = this.app.metadataCache.getFileCache(file);
const granolaId = cache?.frontmatter?.granola_id;
const title = cache?.frontmatter?.title;
const tags = cache?.frontmatter?.tags;
```

#### ✅ Modify Frontmatter (Atomic)
```typescript
// Best practice: Use FileManager
await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
    frontmatter.updated = new Date().toISOString();
    frontmatter.status = 'published';
});
```

#### ❌ Don't Parse Manually
```typescript
// ❌ Slow, error-prone, don't do this!
const content = await this.app.vault.read(file);
const match = content.match(/^---\n([\s\S]*?)\n---/);
```

---

### YAML Utilities

```typescript
import { parseYaml, stringifyYaml } from 'obsidian';

// Parse YAML
const data = parseYaml('key: value\nlist:\n  - item1\n  - item2');

// Stringify to YAML
const yaml = stringifyYaml({
    key: 'value',
    list: ['item1', 'item2']
});
```

---

## Events

### Event Registration (Auto Cleanup)

#### ✅ ALWAYS use `registerEvent()`
```typescript
import { Plugin } from 'obsidian';

export default class ExamplePlugin extends Plugin {
    async onload() {
        // ✅ Auto cleanup on plugin unload
        this.registerEvent(
            this.app.vault.on('create', (file) => {
                console.log('File created:', file.path);
            })
        );

        this.registerEvent(
            this.app.vault.on('modify', (file) => {
                console.log('File modified:', file.path);
            })
        );

        this.registerEvent(
            this.app.metadataCache.on('changed', (file) => {
                console.log('Metadata changed:', file.path);
            })
        );
    }
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

- **`changed`**: File metadata updated (frontmatter, links, headings)
- **`resolved`**: Initial metadata cache loaded

```typescript
this.registerEvent(
    this.app.metadataCache.on('changed', (file) => {
        const cache = this.app.metadataCache.getFileCache(file);
        console.log('Frontmatter:', cache?.frontmatter);
    })
);
```

**Important**: Use `changed` event to detect frontmatter updates, not `vault.on('modify')`.

---

### Timing Events (Intervals)

#### ✅ ALWAYS use `registerInterval()`
```typescript
import { moment, Plugin } from 'obsidian';

export default class ExamplePlugin extends Plugin {
    statusBar: HTMLElement;

    async onload() {
        this.statusBar = this.addStatusBarItem();
        this.updateStatusBar();

        // ✅ Auto cleanup
        this.registerInterval(
            window.setInterval(() => this.updateStatusBar(), 1000)
        );
    }

    updateStatusBar() {
        this.statusBar.setText(moment().format('H:mm:ss'));
    }
}
```

**Date/Time**: Obsidian includes Moment.js - import from 'obsidian'

---

## Editor API

### Access Editor

```typescript
// In command
this.addCommand({
    id: 'example',
    name: 'Example',
    editorCallback: (editor: Editor) => {
        // Use editor here
    }
});

// Elsewhere
const view = this.app.workspace.getActiveViewOfType(MarkdownView);
if (view) {
    const editor = view.editor;
    const cursor = editor.getCursor();
}
```

**Why use Editor instead of CodeMirror?**
- Abstracts CM6 and CM5 (legacy desktop)
- Works on all platforms
- Stable API

---

### Insert Text at Cursor

```typescript
import { Editor, moment, Plugin } from 'obsidian';

this.addCommand({
    id: 'insert-todays-date',
    name: 'Insert today\'s date',
    editorCallback: (editor: Editor) => {
        editor.replaceRange(
            moment().format('YYYY-MM-DD'),
            editor.getCursor()
        );
    }
});
```

---

### Replace Selection

```typescript
this.addCommand({
    id: 'convert-to-uppercase',
    name: 'Convert to uppercase',
    editorCallback: (editor: Editor) => {
        const selection = editor.getSelection();
        editor.replaceSelection(selection.toUpperCase());
    }
});
```

---

### Get Editor Content

```typescript
// Get all content
const content = editor.getValue();

// Get line
const line = editor.getLine(lineNumber);

// Get range
const text = editor.getRange(
    { line: 0, ch: 0 },
    { line: 5, ch: 10 }
);
```

---

## Performance & Optimization

### Load Time Optimization

**Plugin load time directly impacts app startup.**

Check load time: Settings → General → Advanced → stopwatch icon

---

#### Optimization Strategies

1. **Use production builds** (minified)
2. **Simplify `onload()`** - only essential initialization
3. **Avoid expensive operations in `onload()`**
4. **Mind view constructors** - views reopen on startup

---

#### Use `onLayoutReady` for Deferred Code

```typescript
export default class ExamplePlugin extends Plugin {
    async onload() {
        // ✅ Fast initialization only
        await this.loadSettings();

        // ✅ Defer heavy operations
        this.app.workspace.onLayoutReady(() => {
            this.indexAllFiles();
            this.startBackgroundSync();
        });
    }
}
```

---

#### Critical: `vault.on('create')` Pitfall

**Problem**: During vault initialization, `create` fires for **every existing file**.

**❌ BAD**: Fires for thousands of files on startup
```typescript
onload() {
    this.registerEvent(
        this.app.vault.on('create', this.onCreate)
    );
}

onCreate() {
    // This runs for EVERY file during startup!
    this.processFile();
}
```

**✅ Option A: Check if layout is ready**
```typescript
onCreate() {
    if (!this.app.workspace.layoutReady) {
        return; // Skip during startup
    }
    this.processFile();
}
```

**✅ Option B: Register after layout ready** (Preferred)
```typescript
onload() {
    this.app.workspace.onLayoutReady(() => {
        this.registerEvent(
            this.app.vault.on('create', this.onCreate)
        );
    });
}
```

---

### Caching Strategies

```typescript
class MyPlugin extends Plugin {
    private fileCache = new Map<string, FileData>();

    async getFileData(file: TFile): Promise<FileData> {
        // Check cache first
        if (this.fileCache.has(file.path)) {
            return this.fileCache.get(file.path)!;
        }

        // Compute and cache
        const data = await this.computeFileData(file);
        this.fileCache.set(file.path, data);
        return data;
    }

    onload() {
        // Invalidate cache on modify
        this.registerEvent(
            this.app.vault.on('modify', (file) => {
                this.fileCache.delete(file.path);
            })
        );
    }
}
```

---

### Debouncing

```typescript
class MyPlugin extends Plugin {
    private debounceTimer: number | null = null;

    handleFileChange(file: TFile) {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = window.setTimeout(() => {
            this.processFile(file);
        }, 500);
    }
}
```

---

## Security

### Secret Storage

**Problems with storing secrets in data.json:**
- Stored in plaintext
- Duplicated across plugins
- Hard to maintain/update

**Solution: Use SecretStorage**

```typescript
export interface MyPluginSettings {
    apiKeyName: string; // Stores secret NAME, not value
}

// Settings tab
import { SecretComponent, Setting } from 'obsidian';

new Setting(containerEl)
    .setName('API key')
    .setDesc('Select a secret from SecretStorage')
    .addComponent(el => new SecretComponent(this.app, el)
        .setValue(this.plugin.settings.apiKeyName)
        .onChange(value => {
            this.plugin.settings.apiKeyName = value;
            this.plugin.saveSettings();
        })
    );

// Retrieve secret value
const secret = this.app.secretStorage.get(this.settings.apiKeyName);
if (secret) {
    // Use secret value
}
```

**Why `addComponent`?** `SecretComponent` needs App instance in constructor.

---

## Mobile Compatibility

### Node.js and Electron APIs

**❌ These will crash on mobile:**
- `fs` (Node.js filesystem)
- `path` (Node.js path)
- `child_process`
- `electron`

**✅ Use Obsidian APIs instead:**
- `this.app.vault.*` (filesystem)
- `normalizePath()` (path handling)

---

### Check Dependencies

```bash
# Check if dependency uses Node/Electron APIs
npm ls <dependency>
```

**If dependency uses Node APIs:**
1. Find alternative package
2. Request mobile-compatible version
3. Mark plugin as desktop-only in manifest

---

### Lookbehind in Regex

**Only supported on iOS 16.4+**

```typescript
// ❌ Crashes on older iOS
const regex = /(?<=prefix)content/;

// ✅ Compatible
const regex = /prefix(content)/;
const match = text.match(regex);
const content = match?.[1];
```

---

### Pop-Out Windows

**Key Concepts:**
- Each pop-out window has separate globals
- Own `Window` object
- Own `Document` object
- Fresh copies of all global constructors

---

#### ❌ Anti-Patterns
```typescript
// ❌ Always appends to main window
document.body.appendChild(myElement);

// ❌ False in pop-out window
if (myElement instanceof HTMLElement) { }

// ❌ False in pop-out window
if (event instanceof MouseEvent) { }
```

---

#### ✅ Correct Patterns
```typescript
// ✅ Append to same window as someElement
someElement.doc.body.appendChild(myElement);

// ✅ Cross-window compatible
if (myElement.instanceOf(HTMLElement)) { }

element.on('click', '.my-class', (event) => {
    if (event.instanceOf(MouseEvent)) { }
});
```

---

#### Obsidian APIs for Pop-Out Support

**Global variables:**
- `activeWindow` - Currently focused window
- `activeDocument` - Document of focused window

**Element accessors:**
- `element.win` - Window object element belongs to
- `element.doc` - Document object element belongs to

**Cross-window instanceof:**
```typescript
element.instanceOf(HTMLElement)
event.instanceOf(MouseEvent)
```

**Migration callback:**
```typescript
HTMLElement.onWindowMigrated(callback)
```

---

## React Integration

### Setup

```bash
npm install react react-dom
npm install --save-dev @types/react @types/react-dom
```

**tsconfig.json:**
```json
{
    "compilerOptions": {
        "jsx": "react-jsx"
    }
}
```

---

### React Component

```typescript
// ReactView.tsx
export const ReactView = () => {
    return <h4>Hello, React!</h4>;
};
```

---

### Mount React Component

```typescript
import { StrictMode } from 'react';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { ReactView } from './ReactView';

class ExampleView extends ItemView {
    root: Root | null = null;

    async onOpen() {
        this.root = createRoot(this.contentEl);
        this.root.render(
            <StrictMode>
                <ReactView />
            </StrictMode>
        );
    }

    async onClose() {
        this.root?.unmount(); // ✅ Clean up!
    }
}
```

---

### App Context Pattern

```typescript
// context.ts
import { createContext } from 'react';
import { App } from 'obsidian';

export const AppContext = createContext<App | undefined>(undefined);

// hooks.ts
import { useContext } from 'react';
import { AppContext } from './context';

export const useApp = (): App | undefined => {
    return useContext(AppContext);
};

// Mount with context
this.root.render(
    <AppContext.Provider value={this.app}>
        <ReactView />
    </AppContext.Provider>
);

// Use in components
import { useApp } from './hooks';

export const ReactView = () => {
    const { vault } = useApp();
    return <h4>{vault.getName()}</h4>;
};
```

---

## Anti-Patterns

### ❌ Summary of What NOT to Do

1. **Using global `app` object**
2. **innerHTML/outerHTML for user input** (XSS)
3. **Not cleaning up resources in onunload**
4. **Managing direct references to views**
5. **Using `workspace.activeLeaf` directly**
6. **Iterating all files to find by path** (O(n) vs O(1))
7. **`Vault.modify` on active file** (use Editor API)
8. **Hardcoded styling** (use CSS classes)
9. **Using `var`** (use const/let)
10. **`vault.on('create')` in onload** (use onLayoutReady)
11. **`document.body` in pop-out windows** (use element.doc)
12. **`instanceof` in pop-out windows** (use element.instanceOf)
13. **Manual event listener management** (use registerEvent)
14. **Manual frontmatter parsing** (use metadataCache)
15. **Node.js APIs** (breaks mobile)

---

## Resources

### Official Documentation
- [Obsidian Plugin Documentation](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [Obsidian API Types](https://github.com/obsidianmd/obsidian-api)
- [Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)

### Community
- [Obsidian Discord](https://discord.gg/obsidianmd) - #plugin-dev channel
- [Obsidian Forum](https://forum.obsidian.md/) - Developer & API section

---

**Last Updated**: 2026-01-30
**Based on**: Official Obsidian Plugin Documentation
