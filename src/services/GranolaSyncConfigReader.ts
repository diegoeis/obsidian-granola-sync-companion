import { App } from 'obsidian';

export interface GranolaSyncSettings {
    // Sync geral
    isSyncEnabled: boolean;
    syncInterval: number;
    syncDaysBack: number;
    syncNotes: boolean;
    includePrivateNotes: boolean;

    // Notas
    saveAsIndividualFiles: boolean;
    baseFolderType: 'root' | 'custom';
    customBaseFolder: string;
    subfolderPattern: 'none' | 'month' | 'year';
    filenamePattern: string;

    // Transcripts
    syncTranscripts: boolean;
    transcriptHandling: 'same-location' | 'custom-location';
    customTranscriptBaseFolder: string;
    transcriptSubfolderPattern: 'none' | 'month' | 'year';
    transcriptFilenamePattern: string;

    // Daily notes
    linkFromDailyNotes: boolean;
    dailyNoteLinkHeading: string;
    dailyNoteSectionHeading: string;

    // Metadata
    latestSyncTime: number;
}

const DEFAULT_SETTINGS: Partial<GranolaSyncSettings> = {
    syncTranscripts: false,
    transcriptHandling: 'same-location',
    customTranscriptBaseFolder: '',
    transcriptFilenamePattern: '{title} - {date} - transcript',
    filenamePattern: '{title} - {date}',
};

/**
 * Serviço para ler as configurações do plugin Granola Sync original.
 * Permite que o companion plugin use as mesmas configurações para
 * identificar corretamente notas vs transcripts.
 */
export class GranolaSyncConfigReader {
    private app: App;
    private pluginId = 'granola-sync';
    private cachedSettings: GranolaSyncSettings | null = null;
    private lastReadTime: number = 0;
    private cacheTimeout = 5000; // 5 segundos de cache

    constructor(app: App) {
        this.app = app;
    }

    /**
     * Lê as configurações do Granola Sync do arquivo data.json
     */
    async getSettings(): Promise<GranolaSyncSettings | null> {
        // Retorna cache se ainda válido
        const now = Date.now();
        if (this.cachedSettings && (now - this.lastReadTime) < this.cacheTimeout) {
            return this.cachedSettings;
        }

        try {
            const configPath = `${this.app.vault.configDir}/plugins/${this.pluginId}/data.json`;

            // Verifica se o arquivo existe usando adapter.exists()
            const exists = await this.app.vault.adapter.exists(configPath);
            if (!exists) {
                console.warn('Granola Companion: Granola Sync config file not found at', configPath);
                return null;
            }

            const content = await this.app.vault.adapter.read(configPath);
            const settings = JSON.parse(content) as GranolaSyncSettings;

            // Merge com defaults
            this.cachedSettings = { ...DEFAULT_SETTINGS, ...settings } as GranolaSyncSettings;
            this.lastReadTime = now;

            return this.cachedSettings;
        } catch (error) {
            console.warn('Granola Companion: Error reading Granola Sync config:', error);
            return null;
        }
    }

    /**
     * Verifica se transcripts estão habilitados
     */
    async isTranscriptSyncEnabled(): Promise<boolean> {
        const settings = await this.getSettings();
        return settings?.syncTranscripts ?? false;
    }

    /**
     * Retorna a pasta base dos transcripts
     */
    async getTranscriptFolder(): Promise<string | null> {
        const settings = await this.getSettings();
        if (!settings?.syncTranscripts) return null;

        if (settings.transcriptHandling === 'custom-location') {
            return settings.customTranscriptBaseFolder || null;
        }

        // same-location: usa a mesma pasta das notas
        if (settings.baseFolderType === 'custom') {
            return settings.customBaseFolder || '/';
        }

        return '/'; // root
    }

    /**
     * Retorna a pasta base das notas
     */
    async getNotesFolder(): Promise<string> {
        const settings = await this.getSettings();
        if (!settings) return '/';

        if (settings.baseFolderType === 'custom') {
            return settings.customBaseFolder || '/';
        }

        return '/';
    }

    /**
     * Verifica se um arquivo é um transcript baseado nas configurações
     * Usa múltiplas estratégias:
     * 1. Verifica se está na pasta de transcripts (mais confiável)
     * 2. Verifica se o nome contém "transcript" (fallback)
     */
    async isTranscript(filePath: string): Promise<boolean> {
        const settings = await this.getSettings();
        const normalizedPath = filePath.toLowerCase();

        // Se transcripts não estão habilitados, usa apenas fallback
        if (!settings?.syncTranscripts) {
            // Mesmo sem sync de transcripts habilitado, pode haver transcripts antigos
            // Usa fallback simples
            return normalizedPath.includes('transcript');
        }

        // Estratégia 1: Verificar pasta de transcripts (mais confiável)
        if (settings.transcriptHandling === 'custom-location' && settings.customTranscriptBaseFolder) {
            const transcriptFolder = settings.customTranscriptBaseFolder.toLowerCase().replace(/^\/+/, '');
            // Verifica se o path começa com a pasta de transcripts
            if (normalizedPath.startsWith(transcriptFolder + '/')) {
                return true;
            }
        }

        // Estratégia 2: Fallback - verificar "transcript" no nome do arquivo
        // Isso pega casos como "Meeting - 2025-01-29 - transcript.md"
        return normalizedPath.includes('transcript');
    }

    /**
     * Verifica se um arquivo é uma nota (não transcript) baseado nas configurações
     */
    async isNote(filePath: string): Promise<boolean> {
        return !(await this.isTranscript(filePath));
    }

    /**
     * Limpa o cache para forçar releitura
     */
    clearCache(): void {
        this.cachedSettings = null;
        this.lastReadTime = 0;
    }
}
