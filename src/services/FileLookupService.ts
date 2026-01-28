import { TFile, App } from 'obsidian';
import { GranolaIndexService } from './GranolaIndexService';
import { YamlParser } from '../utils/yamlParser';

export class FileLookupService {
    private app: App;
    private indexService: GranolaIndexService;
    private yamlParser: YamlParser;
    private settings: any;

    constructor(app: App, indexService: GranolaIndexService) {
        this.app = app;
        this.indexService = indexService;
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
     * Intercepta criação de arquivo para prevenir duplicatas
     * Agora usa índice O(1) em vez de loop O(n)
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

        // Busca O(1) no índice
        const existingFile = this.indexService.findByGranolaId(granolaId);
        if (!existingFile) {
            return { shouldCreate: true };
        }

        // Arquivo com mesmo granola_id já existe
        if (this.settings?.debugMode) {
            console.log(`Granola Companion: Preventing duplicate creation for granola_id: ${granolaId}`);
            console.log(`Existing file: ${existingFile.path}`);
            console.log(`Attempted new file: ${filePath}`);
        }

        return {
            shouldCreate: false,
            alternativePath: existingFile.path
        };
    }

    setSettings(settings: any) {
        this.settings = settings;
    }
}
