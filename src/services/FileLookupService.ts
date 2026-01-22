import { TFile, App, TFolder } from 'obsidian';
import { YamlParser } from '../utils/yamlParser';

export class FileLookupService {
    private app: App;
    private yamlParser: YamlParser;

    constructor(app: App) {
        this.app = app;
        this.yamlParser = new YamlParser(app);
    }

    /**
     * Procura arquivo por granola_id em todo o vault
     */
    async findFileByGranolaId(granolaId: string): Promise<TFile | null> {
        const allFiles = this.app.vault.getFiles();
        
        for (const file of allFiles) {
            const fileGranolaId = this.yamlParser.getGranolaId(file);
            if (fileGranolaId === granolaId) {
                return file;
            }
        }
        
        return null;
    }

    /**
     * Verifica se já existe arquivo com este granola_id
     */
    async fileExistsWithGranolaId(granolaId: string): Promise<boolean> {
        const existingFile = await this.findFileByGranolaId(granolaId);
        return existingFile !== null;
    }

    /**
     * Lista todos os arquivos com granola_id
     */
    async getAllGranolaFiles(): Promise<TFile[]> {
        const allFiles = this.app.vault.getFiles();
        const granolaFiles: TFile[] = [];
        
        for (const file of allFiles) {
            if (this.yamlParser.hasGranolaId(file)) {
                granolaFiles.push(file);
            }
        }
        
        return granolaFiles;
    }

    /**
     * Obtém arquivos duplicados (mesmo granola_id)
     * Ignora transcripts que compartilham granola_id com suas notas relacionadas
     */
    async getDuplicateFiles(): Promise<{ granolaId: string; files: TFile[] }[]> {
        const granolaFiles = await this.getAllGranolaFiles();
        const granolaIdMap = new Map<string, TFile[]>();

        // Agrupa todos os arquivos por granola_id (incluindo transcripts)
        for (const file of granolaFiles) {
            const granolaId = this.yamlParser.getGranolaId(file);
            if (granolaId) {
                if (!granolaIdMap.has(granolaId)) {
                    granolaIdMap.set(granolaId, []);
                }
                granolaIdMap.get(granolaId)!.push(file);
            }
        }

        const duplicates: { granolaId: string; files: TFile[] }[] = [];

        for (const [granolaId, files] of granolaIdMap) {
            // Filtra transcripts do grupo
            const nonTranscriptFiles = files.filter(
                file => !file.name.toLowerCase().includes('transcript')
            );

            // Só considera duplicata se houver mais de 1 arquivo que NÃO seja transcript
            if (nonTranscriptFiles.length > 1) {
                duplicates.push({ granolaId, files: nonTranscriptFiles });
            }
        }

        return duplicates;
    }

    /**
     * Intercepta criação de arquivo para prevenir duplicatas
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

        const existingFile = await this.findFileByGranolaId(granolaId);
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

    private settings: any;
    
    setSettings(settings: any) {
        this.settings = settings;
    }
}