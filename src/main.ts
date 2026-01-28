import { App, Plugin, PluginSettingTab, Setting, Notice } from 'obsidian';
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

        // Add a ribbon icon
        this.addRibbonIcon('dice', 'Granola Companion', (evt: MouseEvent) => {
            this.showDuplicateStats();
        });

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

            // Adicionar UI completa se ainda não presente
            if (!(this as any).ribbonIconEl) {
                this.addRibbonIcon('dice', 'Granola Companion', (evt: MouseEvent) => {
                    this.showDuplicateStats();
                });
            }
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

        const stats = await this.integrationService.getDuplicateStats();

        if (stats.duplicateGroups === 0) {
            this.showNotice('✅ No duplicate files found!', 'success');
            return;
        }

        const message = `
📊 Duplicate Statistics:
• Groups: ${stats.duplicateGroups}
• Duplicate files: ${stats.totalDuplicateFiles}

Recent duplicates:
${stats.duplicates.slice(0, 5).map(d => `• ${d.granolaId}: ${d.count} files`).join('\n')}
        `;

        this.showNotice(message.trim(), 'info');
    }

    private showNotice(message: string, type: 'info' | 'success' | 'warning' = 'info') {
        const fragment = document.createDocumentFragment();
        const container = document.createElement('div');
        container.style.cssText = `
            padding: 10px;
            border-left: 4px solid ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#2196f3'};
            margin: 10px 0;
            background: ${type === 'success' ? '#f1f8e9' : type === 'warning' ? '#fff3e0' : '#e3f2fd'};
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
                info.createEl('div', { cls: 'setting-item-description', text: 'View duplicate file statistics and cleanup options' });
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
    }
}
