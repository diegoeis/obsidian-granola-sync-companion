import { App, TFile, TFolder } from 'obsidian';
import { FileLookupService } from './FileLookupService';

export class IntegrationService {
    private app: App;
    private fileLookupService: FileLookupService;
    private originalCreateFile: any;
    private originalModifyFile: any;
    private settings: any;

    constructor(app: App) {
        this.app = app;
        this.fileLookupService = new FileLookupService(app);
    }

    /**
     * Inicia a interceptação de operações de arquivo
     */
    async initialize(settings: any) {
        this.settings = settings;
        this.fileLookupService.setSettings(settings);

        if (!settings.duplicatePreventionEnabled) {
            return;
        }

        await this.interceptVaultOperations();
        
        if (settings.debugMode) {
            console.log('Granola Companion: Integration service initialized');
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
        vault.create = async function(path: string, content?: string, options?: any) {
            if (!content) {
                return self.originalCreateFile(path, content, options);
            }

            const result = await self.fileLookupService.interceptFileCreation(path, content);
            
            if (result.shouldCreate) {
                return self.originalCreateFile(path, content, options);
            }

            // Arquivo duplicado detectado - notificar usuário
            if (result.alternativePath) {
                self.showDuplicateWarning(path, result.alternativePath);
            }
            
            // Retorna o arquivo existente em vez de criar duplicata
            const existingFile = await self.app.vault.getAbstractFileByPath(result.alternativePath!);
            if (existingFile instanceof TFile) {
                return existingFile;
            }
            
            return self.originalCreateFile(path, content, options);
        };

        if (this.settings.debugMode) {
            console.log('Granola Companion: File operations intercepted');
        }
    }

    /**
     * Mostra aviso sobre duplicata prevenida
     */
    private showDuplicateWarning(attemptedPath: string, existingPath: string) {
        const notice = document.createElement('div');
        notice.innerHTML = `
            <div style="padding: 10px; border-left: 4px solid #ff6b6b; margin: 10px 0;">
                <strong>Granola Companion:</strong> Duplicate file prevented<br>
                <small>Attempted: ${attemptedPath}</small><br>
                <small>Existing: ${existingPath}</small>
            </div>
        `;
        
        // Adiciona ao vault se tiver suporte a notificações customizadas
        if ((this.app as any).notice) {
            (this.app as any).notice(notice, 10000);
        } else {
            console.warn('Granola Companion: Duplicate prevented', { attemptedPath, existingPath });
        }
    }

    /**
     * Para a interceptação
     */
    stop() {
        const vault = this.app.vault;
        if (this.originalCreateFile) {
            vault.create = this.originalCreateFile;
        }
        if (this.originalModifyFile) {
            vault.modify = this.originalModifyFile;
        }
        
        if (this.settings.debugMode) {
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
}