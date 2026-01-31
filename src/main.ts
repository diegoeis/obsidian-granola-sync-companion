import { App, Plugin, PluginSettingTab, Setting, Notice, Modal } from 'obsidian';
import { IntegrationService } from './services/IntegrationService';
import { PluginDetector, GranolaSyncInfo } from './utils/pluginDetector';

interface CompanionSettings {
    duplicatePreventionEnabled: boolean;
    debugMode: boolean;
}

const DEFAULT_SETTINGS: CompanionSettings = {
    duplicatePreventionEnabled: false,
    debugMode: false
};

export default class GranolaPluginCompanion extends Plugin {
    settings: CompanionSettings;
    integrationService: IntegrationService;
    pluginDetector: PluginDetector;
    private granolaSyncAvailable: boolean = false;
    private ribbonIconEl: HTMLElement | null = null;

    // Event refs para cleanup
    private eventRefs: any[] = [];

    async onload() {
        await this.loadSettings();

        // Inicializa detector de plugins
        this.pluginDetector = new PluginDetector(this.app);
        const granolaSyncInfo = this.pluginDetector.getGranolaSyncInfo();
        this.granolaSyncAvailable = granolaSyncInfo.available;

        // Verifica se Granola Sync está available (instalado E habilitado)
        if (!granolaSyncInfo.available) {
            // Mostra warning apropriado baseado no estado
            this.pluginDetector.showDependencyWarning(granolaSyncInfo);

            // Adiciona configurações limitadas quando Granola Sync não está disponível
            this.addSettingTab(new GranolaCompanionSettingTab(this.app, this, false));

            // Log da razão específica
            if (!granolaSyncInfo.installed) {
                console.log('Granola Plugin Companion loaded (Granola Sync not installed)');
            } else if (!granolaSyncInfo.enabled) {
                console.log('Granola Plugin Companion loaded (Granola Sync installed but disabled)');
            }

            // Escuta evento de plugins habilitados/desabilitados para detectar mudanças
            this.setupPluginChangeListener();

            return; // NÃO inicializar integration service
        }

        // Granola Sync disponível - inicializa funcionalidade completa
        await this.initializeFullFunctionality();

        console.log('Granola Plugin Companion loaded (Granola Sync available)');
    }

    /**
     * Inicializa funcionalidade completa quando Granola Sync está disponível
     */
    private async initializeFullFunctionality() {
        this.integrationService = new IntegrationService(this.app);
        await this.integrationService.initialize(this.settings);

        // Add commands
        this.addCommand({
            id: 'open-granola-companion-settings',
            name: 'Open Granola Companion Settings',
            callback: () => {
                this.openSettings();
            }
        });

        this.addCommand({
            id: 'show-duplicate-stats',
            name: 'Show Duplicate Statistics',
            callback: () => {
                this.showDuplicateStats();
            }
        });

        this.addCommand({
            id: 'refresh-granola-sync-status',
            name: 'Refresh Granola Sync Status',
            callback: () => {
                this.refreshGranolaSyncStatus();
            }
        });

        this.addCommand({
            id: 'remove-duplicate-notes',
            name: 'Remove Duplicate Granola Notes',
            callback: () => {
                this.removeDuplicateNotes();
            }
        });

        // Add settings tab
        this.addSettingTab(new GranolaCompanionSettingTab(this.app, this, true));

        // Configura listener para mudanças de plugins
        this.setupPluginChangeListener();
    }

    /**
     * Configura listener baseado em eventos para detectar mudanças no Granola Sync
     * Substitui o polling de 30 segundos
     */
    private setupPluginChangeListener() {
        // Escuta evento de layout pronto (plugins carregados)
        if ((this.app as any).workspace?.onLayoutReady) {
            (this.app as any).workspace.onLayoutReady(() => {
                this.checkAndHandlePluginChange();
            });
        }

        // Escuta mudanças no registro de plugins do Obsidian
        // Este evento dispara quando plugins são habilitados/desabilitados
        const pluginsApi = (this.app as any).plugins;

        if (pluginsApi) {
            // Método 1: Observa mudanças no objeto plugins através de Proxy
            // (fallback para versões do Obsidian que não expõem eventos)
            const originalEnablePlugin = pluginsApi.enablePlugin?.bind(pluginsApi);
            const originalDisablePlugin = pluginsApi.disablePlugin?.bind(pluginsApi);

            if (originalEnablePlugin) {
                pluginsApi.enablePlugin = async (...args: any[]) => {
                    const result = await originalEnablePlugin(...args);
                    // Delay para dar tempo do plugin carregar
                    setTimeout(() => this.checkAndHandlePluginChange(), 500);
                    return result;
                };
            }

            if (originalDisablePlugin) {
                pluginsApi.disablePlugin = async (...args: any[]) => {
                    const result = await originalDisablePlugin(...args);
                    setTimeout(() => this.checkAndHandlePluginChange(), 500);
                    return result;
                };
            }
        }
    }

    /**
     * Verifica e trata mudanças no status do Granola Sync
     */
    private checkAndHandlePluginChange() {
        const currentInfo = this.pluginDetector.getGranolaSyncInfo();
        const wasAvailable = this.granolaSyncAvailable;

        if (currentInfo.available !== wasAvailable) {
            this.handlePluginStatusChange(currentInfo, wasAvailable);
        }
    }

    /**
     * Trata mudança de status do plugin Granola Sync
     */
    private async handlePluginStatusChange(currentInfo: GranolaSyncInfo, wasAvailable: boolean) {
        console.log('Granola Sync availability changed:', {
            from: wasAvailable ? 'available' : 'unavailable',
            to: currentInfo.available ? 'available' : 'unavailable',
            installed: currentInfo.installed,
            enabled: currentInfo.enabled
        });

        // Transição para available
        if (currentInfo.available && !wasAvailable) {
            console.log('Granola Sync now available - initializing integration');

            // Inicializar integration service se ainda não existe
            if (!this.integrationService) {
                this.integrationService = new IntegrationService(this.app);
            }
            await this.integrationService.initialize(this.settings);
        }

        // Transição para unavailable
        if (!currentInfo.available && wasAvailable) {
            console.log('Granola Sync no longer available - stopping integration');

            // Parar integration service
            if (this.integrationService) {
                this.integrationService.stop();
            }
        }

        // Atualizar status armazenado
        this.granolaSyncAvailable = currentInfo.available;

        // Notificar usuário
        this.showStatusChangeNotification(currentInfo);
    }

    onunload() {
        // Limpa event refs
        for (const ref of this.eventRefs) {
            this.app.vault.offref(ref);
            this.app.metadataCache.offref(ref);
        }
        this.eventRefs = [];

        if (this.integrationService) {
            this.integrationService.stop();
        }
        console.log('Granola Plugin Companion unloaded');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);

        // Re-inicializa serviço de integração com novas configurações
        if (this.integrationService) {
            await this.integrationService.initialize(this.settings);
        }
    }

    async showDuplicateStats() {
        if (!this.integrationService) {
            this.showNotice('⚠️ Granola Sync not available', 'warning');
            return;
        }

        // Conta duplicatas por padrão de timestamp (as que o botão pode remover)
        const duplicatePattern = /-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.md$/;
        const allFiles = this.app.vault.getMarkdownFiles();
        const timestampDuplicates: any[] = [];

        for (const file of allFiles) {
            if (duplicatePattern.test(file.path)) {
                const cache = this.app.metadataCache.getFileCache(file);
                const granolaId = cache?.frontmatter?.granola_id;
                if (granolaId) {
                    timestampDuplicates.push(file);
                }
            }
        }

        // Estatísticas gerais (inclui notas que compartilham granola_id)
        const stats = await this.integrationService.getDuplicateStats();

        if (timestampDuplicates.length === 0 && stats.duplicateGroups === 0) {
            this.showNotice('✅ No duplicate files found!', 'success');
            return;
        }

        const message = `
📊 Duplicate Statistics:

🗑️ Removable Duplicates (with timestamp):
• ${timestampDuplicates.length} file(s) can be cleaned up

📁 Granola ID Groups:
• ${stats.duplicateGroups} group(s) with shared IDs
• ${stats.totalDuplicateFiles} total file(s)

${timestampDuplicates.length > 0 ? '\n💡 Use "Remove Duplicates" to clean timestamp duplicates' : ''}
        `;

        this.showNotice(message.trim(), 'info');
    }

    /**
     * Remove arquivos duplicados criados pelo Granola Sync
     * Padrão de duplicata: nome-DATA-DATA_HORA.md
     * Exemplo: sync - Diego e Marcelo - 2026-01-30-2026-01-30_10-24-29.md
     */
    async removeDuplicateNotes() {
        if (!this.integrationService) {
            this.showNotice('⚠️ Granola Sync not available', 'warning');
            return;
        }

        // Padrão regex para detectar duplicatas criadas pelo Obsidian
        // Quando um arquivo já existe, o Obsidian adiciona: -YYYY-MM-DD_HH-MM-SS.md
        // Exemplo: sync - Diego e Marcelo - 2026-01-30-2026-01-30_10-24-29.md
        const duplicatePattern = /-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.md$/;

        const allFiles = this.app.vault.getMarkdownFiles();
        const duplicates: Array<any> = [];

        // Identifica arquivos duplicados pelo padrão de nome E que têm granola_id
        for (const file of allFiles) {
            // Primeiro verifica o padrão de nome
            if (duplicatePattern.test(file.path)) {
                // Depois verifica se tem granola_id (só remove se for arquivo do Granola)
                const cache = this.app.metadataCache.getFileCache(file);
                const granolaId = cache?.frontmatter?.granola_id;

                if (granolaId) {
                    duplicates.push(file);

                    if (this.settings.debugMode) {
                        console.log(`Granola Companion: Found duplicate - ${file.path} (granola_id: ${granolaId})`);
                    }
                } else if (this.settings.debugMode) {
                    console.log(`Granola Companion: Skipping ${file.path} - matches pattern but no granola_id`);
                }
            }
        }

        if (duplicates.length === 0) {
            this.showNotice('✅ No duplicate files found to remove!', 'success');
            return;
        }

        // Mostra confirmação antes de deletar
        const confirmMessage = `Found ${duplicates.length} duplicate file(s):\n\n${duplicates.slice(0, 5).map(f => `• ${f.basename}`).join('\n')}${duplicates.length > 5 ? `\n• ... and ${duplicates.length - 5} more` : ''}\n\nDelete these files?`;

        // Cria modal de confirmação
        const confirmed = await this.showConfirmDialog(
            'Remove Duplicate Notes',
            confirmMessage,
            duplicates.length
        );

        if (!confirmed) {
            this.showNotice('Deletion cancelled', 'info');
            return;
        }

        // Remove os arquivos
        let deletedCount = 0;
        let errorCount = 0;

        for (const file of duplicates) {
            try {
                await this.app.vault.delete(file);
                deletedCount++;

                if (this.settings.debugMode) {
                    console.log(`Granola Companion: Deleted duplicate - ${file.path}`);
                }
            } catch (error) {
                errorCount++;
                console.error(`Granola Companion: Error deleting ${file.path}:`, error);
            }
        }

        // Mostra resultado
        if (errorCount === 0) {
            this.showNotice(`✅ Successfully deleted ${deletedCount} duplicate file(s)!`, 'success');
        } else {
            this.showNotice(`⚠️ Deleted ${deletedCount} file(s), ${errorCount} error(s)`, 'warning');
        }
    }

    /**
     * Mostra diálogo de confirmação usando Modal nativa do Obsidian
     */
    private showConfirmDialog(title: string, message: string, fileCount: number): Promise<boolean> {
        return new Promise((resolve) => {
            const modal = new ConfirmDeleteModal(
                this.app,
                title,
                message,
                fileCount,
                (result) => resolve(result)
            );
            modal.open();
        });
    }

    private showNotice(message: string, type: 'info' | 'success' | 'warning' = 'info') {
        const fragment = document.createDocumentFragment();
        const container = document.createElement('div');
        container.style.cssText = `
            padding: 10px;
            border-left: 4px solid ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#2196f3'};
            margin: 10px 0;
        `;
        container.innerHTML = `<strong>Granola Companion:</strong> ${message}`;
        fragment.appendChild(container);
        new Notice(fragment, 8000);
    }

    openSettings() {
        // This will be implemented in settings tab
    }

    async refreshGranolaSyncStatus() {
        this.checkAndHandlePluginChange();
    }

    private showStatusChangeNotification(info: GranolaSyncInfo) {
        let message: string;
        let iconColor: string;
        let bgColor: string;

        if (info.available) {
            message = '✅ Granola Sync is now available - full functionality enabled';
            iconColor = '#4caf50';
            bgColor = '#f1f8e9';
        } else if (info.installed && !info.enabled) {
            message = '⚠️ Granola Sync is disabled - please enable it to use Granola Companion';
            iconColor = '#ff9800';
            bgColor = '#fff3e0';
        } else {
            message = '⚠️ Granola Sync is not installed - please install it to use Granola Companion';
            iconColor = '#ff9800';
            bgColor = '#fff3e0';
        }

        const fragment = document.createDocumentFragment();
        const container = document.createElement('div');
        container.style.cssText = `
            padding: 15px;
            border-left: 4px solid ${iconColor};
            margin: 10px 0;
            background: ${bgColor};
        `;
        container.innerHTML = `<strong>Granola Companion:</strong> ${message}`;
        fragment.appendChild(container);
        new Notice(fragment, 8000);
    }
}

/**
 * Modal de confirmação para deletar arquivos duplicados
 * Usa a API nativa do Obsidian para gerenciar lifecycle, ESC, etc.
 */
class ConfirmDeleteModal extends Modal {
    private onSubmit: (result: boolean) => void;
    private title: string;
    private message: string;
    private fileCount: number;

    constructor(
        app: App,
        title: string,
        message: string,
        fileCount: number,
        onSubmit: (result: boolean) => void
    ) {
        super(app);
        this.title = title;
        this.message = message;
        this.fileCount = fileCount;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;

        // Título com ícone de aviso
        contentEl.createEl('h2', {
            text: `⚠️ ${this.title}`,
            cls: 'modal-title'
        });

        // Mensagem
        contentEl.createEl('p', {
            text: this.message,
            cls: 'modal-content'
        });

        // Container de botões
        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.marginTop = '20px';

        // Botão de confirmar
        const confirmBtn = buttonContainer.createEl('button', {
            text: `Delete ${this.fileCount} file${this.fileCount > 1 ? 's' : ''}`,
            cls: 'mod-warning'
        });
        confirmBtn.addEventListener('click', () => {
            this.close();
            this.onSubmit(true);
        });

        // Botão de cancelar
        const cancelBtn = buttonContainer.createEl('button', {
            text: 'Cancel'
        });
        cancelBtn.addEventListener('click', () => {
            this.close();
            this.onSubmit(false);
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class GranolaCompanionSettingTab extends PluginSettingTab {
    plugin: GranolaPluginCompanion;
    private granolaSyncAvailable: boolean;

    constructor(app: App, plugin: GranolaPluginCompanion, granolaSyncAvailable: boolean = true) {
        super(app, plugin);
        this.granolaSyncAvailable = granolaSyncAvailable;
    }

    display(): void {
        let { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Granola Plugin Companion Settings' });

        // Mostra aviso se Granola Sync não estiver disponível
        if (!this.granolaSyncAvailable) {
            const warningEl = containerEl.createEl('div', { cls: 'setting-item' });
            warningEl.createEl('div', { cls: 'setting-item-info' }, (info) => {
                info.createEl('div', { text: '⚠️ Plugin Dependency Required' });
            });

            warningEl.createEl('div', { cls: 'setting-item-description' }, (desc) => {
                desc.innerHTML = `
                    <p><strong>Granola Plugin Companion</strong> requires the original <strong>Obsidian Granola Sync</strong> plugin to function properly.</p>
                    <p>Please install and enable <strong>Granola Sync</strong> from the Community Plugins catalog.</p>
                    <p><em>Current status: Granola Sync not detected</em></p>
                `;
            });
            return;
        }

        new Setting(containerEl)
            .setName('Enable Duplicate Prevention')
            .setDesc('Prevent creation of duplicate files when synced notes are modified')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.duplicatePreventionEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.duplicatePreventionEnabled = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Debug Mode')
            .setDesc('Enable debug logging for troubleshooting')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.debugMode)
                .onChange(async (value) => {
                    this.plugin.settings.debugMode = value;
                    await this.plugin.saveSettings();
                }));

        // Adiciona botão para mostrar estatísticas
        containerEl.createEl('div', { cls: 'setting-item' }, (div) => {
            div.createEl('div', { cls: 'setting-item-info' }, (info) => {
                info.createEl('div', { text: 'Statistics' });
                info.createEl('div', { cls: 'setting-item-description', text: 'View duplicate file statistics' });
            });

            div.createEl('div', { cls: 'setting-item-control' }, (control) => {
                const button = control.createEl('button', {
                    cls: 'mod-cta',
                    text: 'Show Duplicate Stats'
                });

                button.onclick = () => {
                    this.plugin.showDuplicateStats();
                };
            });
        });

        // Adiciona botão para remover duplicatas
        containerEl.createEl('div', { cls: 'setting-item' }, (div) => {
            div.createEl('div', { cls: 'setting-item-info' }, (info) => {
                info.createEl('div', { text: 'Cleanup' });
                info.createEl('div', { cls: 'setting-item-description', text: 'Remove duplicate Granola notes created by the Obsidian conflict resolution' });
            });

            div.createEl('div', { cls: 'setting-item-control' }, (control) => {
                const button = control.createEl('button', {
                    cls: 'mod-warning',
                    text: 'Remove Duplicates'
                });

                button.onclick = async () => {
                    await this.plugin.removeDuplicateNotes();
                };
            });
        });
    }
}
