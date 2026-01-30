import { TFile, App } from 'obsidian';
import { GranolaIndexService } from './GranolaIndexService';
import { GranolaSyncConfigReader } from './GranolaSyncConfigReader';
import { YamlParser } from '../utils/yamlParser';

export class FileLookupService {
    private app: App;
    private indexService: GranolaIndexService;
    private configReader: GranolaSyncConfigReader;
    private yamlParser: YamlParser;
    private settings: any;

    constructor(app: App, indexService: GranolaIndexService) {
        this.app = app;
        this.indexService = indexService;
        this.configReader = new GranolaSyncConfigReader(app);
        this.yamlParser = new YamlParser(app);
    }

    /**
     * Procura arquivo por granola_id usando o índice - O(1)
     */
    async findFileByGranolaId(granolaId: string): Promise<TFile | null> {
        return this.indexService.findByGranolaId(granolaId);
    }

    /**
     * Verifica se já existe arquivo com este granola_id - O(1)
     */
    async fileExistsWithGranolaId(granolaId: string): Promise<boolean> {
        return this.indexService.hasGranolaId(granolaId);
    }

    /**
     * Lista todos os arquivos com granola_id
     */
    async getAllGranolaFiles(): Promise<TFile[]> {
        return this.indexService.getAllGranolaFiles();
    }

    /**
     * Obtém arquivos duplicados (mesmo granola_id)
     * Ignora transcripts que compartilham granola_id com suas notas relacionadas
     */
    async getDuplicateFiles(): Promise<{ granolaId: string; files: TFile[] }[]> {
        return this.indexService.getDuplicateGroups();
    }

    /**
     * Verifica se um arquivo é um transcript baseado nas configurações do Granola Sync
     * Usa múltiplas estratégias de detecção
     */
    private async isTranscript(filePath: string): Promise<boolean> {
        return this.configReader.isTranscript(filePath);
    }

    /**
     * Intercepta criação de arquivo para prevenir duplicatas
     * Agora usa índice O(1) em vez de loop O(n)
     *
     * IMPORTANTE: Não bloqueia criação se:
     * - O arquivo existente é um transcript e o novo é uma nota (ou vice-versa)
     * - Transcripts e notas podem coexistir com o mesmo granola_id
     */
    async interceptFileCreation(filePath: string, content: string): Promise<{ shouldCreate: boolean; alternativePath?: string }> {
        if (!this.settings?.duplicatePreventionEnabled) {
            return { shouldCreate: true };
        }

        const { frontmatter } = this.yamlParser.extractFrontmatter(content);
        const granolaId = frontmatter.granola_id;

        if (!granolaId) {
            return { shouldCreate: true };
        }

        // Pequeno delay para garantir que o índice está sincronizado
        // Isso ajuda em casos onde arquivos são criados em sequência rápida
        await new Promise(resolve => setTimeout(resolve, 50));

        // Busca todos os arquivos com este granola_id (não apenas o primeiro)
        let existingFiles = this.indexService.findAllByGranolaId(granolaId);

        // FALLBACK: Se o índice não encontrou nada, faz uma busca manual no vault
        // Isso pode acontecer se arquivos foram criados sem granola_id e depois atualizados
        if (existingFiles.length === 0) {
            const allFiles = this.app.vault.getMarkdownFiles();
            for (const file of allFiles) {
                const cache = this.app.metadataCache.getFileCache(file);
                const fileGranolaId = cache?.frontmatter?.granola_id;
                if (fileGranolaId === granolaId && file.path !== filePath) {
                    existingFiles.push(file);
                }
            }

            if (this.settings?.debugMode && existingFiles.length > 0) {
                console.log(`Granola Companion: WARNING - Index missed files! Found ${existingFiles.length} file(s) via fallback search`);
                console.log(`  Files: ${existingFiles.map(f => f.path).join(', ')}`);
            }
        }

        if (this.settings?.debugMode) {
            console.log(`Granola Companion: Checking duplicate for ${filePath}`);
            console.log(`  granola_id: ${granolaId}`);
            console.log(`  Found ${existingFiles.length} existing file(s) with this ID`);
            if (existingFiles.length > 0) {
                console.log(`  Existing files: ${existingFiles.map(f => f.path).join(', ')}`);
            }
        }

        if (existingFiles.length === 0) {
            return { shouldCreate: true };
        }

        const newFileIsTranscript = await this.isTranscript(filePath);

        // Procura por um arquivo existente do MESMO TIPO (transcript ou nota)
        let conflictingFile: TFile | undefined;
        for (const file of existingFiles) {
            const existingIsTranscript = await this.isTranscript(file.path);
            // Só é conflito se ambos são do mesmo tipo
            if (existingIsTranscript === newFileIsTranscript) {
                conflictingFile = file;
                break;
            }
        }

        if (!conflictingFile) {
            // Não há conflito - o existente é de tipo diferente (transcript vs nota)
            if (this.settings?.debugMode) {
                console.log(`Granola Companion: Allowing creation - different types (transcript vs note)`);
                console.log(`  New file: ${filePath} (transcript: ${newFileIsTranscript})`);
                console.log(`  Existing files (${existingFiles.length}): ${existingFiles.map(f => f.path).join(', ')}`);

                // Mostra os tipos dos arquivos existentes
                for (const file of existingFiles) {
                    const isTranscript = await this.isTranscript(file.path);
                    console.log(`    - ${file.path} (transcript: ${isTranscript})`);
                }
            }
            return { shouldCreate: true };
        }

        // Arquivo do mesmo tipo com mesmo granola_id já existe - bloquear
        if (this.settings?.debugMode) {
            console.log(`Granola Companion: Preventing duplicate creation for granola_id: ${granolaId}`);
            console.log(`Existing file: ${conflictingFile.path}`);
            console.log(`Attempted new file: ${filePath}`);
            console.log(`Both are transcripts: ${newFileIsTranscript}`);
        }

        return {
            shouldCreate: false,
            alternativePath: conflictingFile.path
        };
    }

    /**
     * Retorna o leitor de configurações do Granola Sync
     */
    getConfigReader(): GranolaSyncConfigReader {
        return this.configReader;
    }

    setSettings(settings: any) {
        this.settings = settings;
    }
}
