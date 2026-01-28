import { App, TFile, Notice } from 'obsidian';
import { FileLookupService } from './FileLookupService';
import { GranolaIndexService } from './GranolaIndexService';

export class IntegrationService {
    private app: App;
    private indexService: GranolaIndexService;
    private fileLookupService: FileLookupService;
    private originalCreateFile: any;
    private originalModifyFile: any;
    private settings: any;
    private isIntercepting: boolean = false;

    constructor(app: App) {
        this.app = app;
        this.indexService = new GranolaIndexService(app);
        this.fileLookupService = new FileLookupService(app, this.indexService);
    }

    /**
     * Inicia a interceptação de operações de arquivo
     */
    async initialize(settings: any) {
        this.settings = settings;
        this.fileLookupService.setSettings(settings);

        // Inicializa o índice baseado em eventos
        await this.indexService.initialize(settings.debugMode);

        if (!settings.duplicatePreventionEnabled) {
            // Se desabilitado, garante que não está interceptando
            if (this.isIntercepting) {
                this.stopInterception();
            }
            return;
        }

        // Só intercepta se ainda não estiver interceptando
        if (!this.isIntercepting) {
            await this.interceptVaultOperations();
        }

        if (settings.debugMode) {
            console.log('Granola Companion: Integration service initialized');
            console.log(`Granola Companion: Index stats - ${this.indexService.getStats().totalIndexed} files indexed`);
        }
    }

    /**
     * Intercepta operações do vault para prevenir duplicatas
     */
    private async interceptVaultOperations() {
        const vault = this.app.vault;

        // Salva métodos originais
        this.originalCreateFile = vault.create.bind(vault);
        this.originalModifyFile = vault.modify.bind(vault);

        // Intercepta criação de arquivos
        const self = this;
        vault.create = async function (path: string, content?: string, options?: any) {
            if (!content) {
                return self.originalCreateFile(path, content, options);
            }

            // Usa o serviço otimizado com índice O(1)
            const result = await self.fileLookupService.interceptFileCreation(path, content);

            if (result.shouldCreate) {
                return self.originalCreateFile(path, content, options);
            }

            // Arquivo duplicado detectado - notificar usuário
            if (result.alternativePath) {
                self.showDuplicateWarning(path, result.alternativePath);
            }

            // Retorna o arquivo existente em vez de criar duplicata
            const existingFile = self.app.vault.getAbstractFileByPath(result.alternativePath!);
            if (existingFile instanceof TFile) {
                return existingFile;
            }

            return self.originalCreateFile(path, content, options);
        };

        this.isIntercepting = true;

        if (this.settings.debugMode) {
            console.log('Granola Companion: File operations intercepted');
        }
    }

    /**
     * Para a interceptação
     */
    private stopInterception() {
        const vault = this.app.vault;
        if (this.originalCreateFile) {
            vault.create = this.originalCreateFile;
        }
        if (this.originalModifyFile) {
            vault.modify = this.originalModifyFile;
        }
        this.isIntercepting = false;

        if (this.settings?.debugMode) {
            console.log('Granola Companion: Interception stopped');
        }
    }

    /**
     * Mostra aviso sobre duplicata prevenida
     */
    private showDuplicateWarning(attemptedPath: string, existingPath: string) {
        const fragment = document.createDocumentFragment();
        const container = document.createElement('div');
        container.innerHTML = `
            <strong>Granola Companion:</strong> Duplicate file prevented<br>
            <small>Attempted: ${attemptedPath}</small><br>
            <small>Existing: ${existingPath}</small>
        `;
        fragment.appendChild(container);
        new Notice(fragment, 10000);
    }

    /**
     * Para a interceptação e limpa recursos
     */
    stop() {
        this.stopInterception();
        this.indexService.cleanup();

        if (this.settings?.debugMode) {
            console.log('Granola Companion: Integration service stopped');
        }
    }

    /**
     * Verifica se um arquivo parece ser do Granola Sync
     */
    isGranolaSyncFile(path: string, content?: string): boolean {
        // Verifica pelo padrão de nome
        const granolaPattern = /- \d{4}-\d{2}-\d{2}/;
        if (granolaPattern.test(path)) {
            return true;
        }

        // Verifica pelo conteúdo se fornecido
        if (content) {
            const granolaIdMatch = content.match(/granola_id:\s*([a-f0-9-]+)/i);
            if (granolaIdMatch) {
                return true;
            }
        }

        return false;
    }

    /**
     * Obtém estatísticas de duplicatas
     */
    async getDuplicateStats() {
        const duplicates = await this.fileLookupService.getDuplicateFiles();
        const totalDuplicates = duplicates.reduce((sum, group) => sum + group.files.length - 1, 0);

        return {
            duplicateGroups: duplicates.length,
            totalDuplicateFiles: totalDuplicates,
            duplicates: duplicates.map(group => ({
                granolaId: group.granolaId,
                count: group.files.length,
                files: group.files.map(f => f.path)
            }))
        };
    }

    /**
     * Retorna o serviço de índice para acesso externo
     */
    getIndexService(): GranolaIndexService {
        return this.indexService;
    }
}
