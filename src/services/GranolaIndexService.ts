import { App, TFile, Events, TAbstractFile } from 'obsidian';

/**
 * Serviço de indexação baseado em eventos.
 * Mantém um cache em memória dos arquivos Granola, atualizado por eventos do vault.
 * Elimina a necessidade de loops síncronos pesados sobre todos os arquivos.
 */
export class GranolaIndexService extends Events {
    private app: App;

    // Cache principal: granola_id -> TFile[] (múltiplos arquivos podem ter o mesmo granola_id)
    private granolaIdIndex: Map<string, TFile[]> = new Map();

    // Cache reverso: file.path -> granola_id (para remoções rápidas)
    private pathToGranolaId: Map<string, string> = new Map();

    // Flag para indicar se o índice está pronto
    private indexReady: boolean = false;

    // Event handlers refs para cleanup
    private eventRefs: any[] = [];

    private debugMode: boolean = false;

    constructor(app: App) {
        super();
        this.app = app;
    }

    /**
     * Inicializa o índice e registra listeners de eventos
     */
    async initialize(debugMode: boolean = false): Promise<void> {
        this.debugMode = debugMode;

        // Limpa estado anterior se houver
        this.cleanup();

        // Constrói índice inicial (única vez)
        await this.buildInitialIndex();

        // Registra listeners para manter índice atualizado
        this.registerEventListeners();

        this.indexReady = true;

        if (this.debugMode) {
            console.log(`Granola Index: Initialized with ${this.granolaIdIndex.size} indexed files`);
        }
    }

    /**
     * Constrói o índice inicial de forma otimizada
     * Usa metadataCache que já está em memória
     */
    private async buildInitialIndex(): Promise<void> {
        const allFiles = this.app.vault.getFiles();

        for (const file of allFiles) {
            if (file.extension !== 'md') continue;

            this.indexFile(file);
        }
    }

    /**
     * Indexa um único arquivo
     * Suporta múltiplos arquivos com o mesmo granola_id (ex: nota + transcript)
     */
    private indexFile(file: TFile): void {
        if (file.extension !== 'md') return;

        const cache = this.app.metadataCache.getFileCache(file);
        const granolaId = cache?.frontmatter?.granola_id;

        // Remove entrada antiga se existir
        const oldGranolaId = this.pathToGranolaId.get(file.path);
        if (oldGranolaId) {
            const existingFiles = this.granolaIdIndex.get(oldGranolaId);
            if (existingFiles) {
                const filtered = existingFiles.filter(f => f.path !== file.path);
                if (filtered.length > 0) {
                    this.granolaIdIndex.set(oldGranolaId, filtered);
                } else {
                    this.granolaIdIndex.delete(oldGranolaId);
                }
            }
            this.pathToGranolaId.delete(file.path);
        }

        // Adiciona nova entrada se tiver granola_id
        if (granolaId) {
            const existingFiles = this.granolaIdIndex.get(granolaId) || [];
            const wasAlreadyIndexed = existingFiles.some(f => f.path === file.path);

            // Evita duplicatas no array
            if (!wasAlreadyIndexed) {
                existingFiles.push(file);
                if (this.debugMode) {
                    console.log(`Granola Index: Added to index - ${file.path} (granola_id: ${granolaId})`);
                    console.log(`  Total files with this ID: ${existingFiles.length}`);
                }
            }
            this.granolaIdIndex.set(granolaId, existingFiles);
            this.pathToGranolaId.set(file.path, granolaId);

            // Emite evento para listeners externos
            this.trigger('granola-file-indexed', { file, granolaId });
        }
    }

    /**
     * Remove arquivo do índice
     */
    private unindexFile(filePath: string): void {
        const granolaId = this.pathToGranolaId.get(filePath);
        if (granolaId) {
            this.granolaIdIndex.delete(granolaId);
            this.pathToGranolaId.delete(filePath);

            this.trigger('granola-file-unindexed', { filePath, granolaId });
        }
    }

    /**
     * Registra listeners de eventos do vault e metadataCache
     */
    private registerEventListeners(): void {
        // Evento: arquivo criado
        const createRef = this.app.vault.on('create', (file: TAbstractFile) => {
            if (file instanceof TFile && file.extension === 'md') {
                // Aguarda metadataCache processar o arquivo
                setTimeout(() => this.indexFile(file), 100);

                if (this.debugMode) {
                    console.log(`Granola Index: File created - ${file.path}`);
                }
            }
        });
        this.eventRefs.push(createRef);

        // Evento: arquivo deletado
        const deleteRef = this.app.vault.on('delete', (file: TAbstractFile) => {
            if (file instanceof TFile) {
                this.unindexFile(file.path);

                if (this.debugMode) {
                    console.log(`Granola Index: File deleted - ${file.path}`);
                }
            }
        });
        this.eventRefs.push(deleteRef);

        // Evento: arquivo renomeado
        const renameRef = this.app.vault.on('rename', (file: TAbstractFile, oldPath: string) => {
            if (file instanceof TFile && file.extension === 'md') {
                // Remove índice do caminho antigo
                this.unindexFile(oldPath);
                // Re-indexa com novo caminho
                setTimeout(() => this.indexFile(file), 100);

                if (this.debugMode) {
                    console.log(`Granola Index: File renamed - ${oldPath} -> ${file.path}`);
                }
            }
        });
        this.eventRefs.push(renameRef);

        // Evento: metadataCache atualizado (mais importante!)
        // Este evento dispara quando o frontmatter de um arquivo muda
        const cacheRef = this.app.metadataCache.on('changed', (file: TFile) => {
            if (file.extension === 'md') {
                const cache = this.app.metadataCache.getFileCache(file);
                const granolaId = cache?.frontmatter?.granola_id;

                // Só processa e loga se o arquivo tiver granola_id
                if (granolaId) {
                    this.indexFile(file);

                    if (this.debugMode) {
                        console.log(`Granola Index: Metadata changed - ${file.path}`);
                    }
                }
            }
        });
        this.eventRefs.push(cacheRef);
    }

    /**
     * Busca arquivo por granola_id - O(1) em vez de O(n)
     * Retorna o primeiro arquivo encontrado (para compatibilidade)
     */
    findByGranolaId(granolaId: string): TFile | null {
        const files = this.granolaIdIndex.get(granolaId);
        return files && files.length > 0 ? files[0] : null;
    }

    /**
     * Busca TODOS os arquivos com um granola_id - O(1)
     * Usado para verificar conflitos entre notas e transcripts
     */
    findAllByGranolaId(granolaId: string): TFile[] {
        return this.granolaIdIndex.get(granolaId) || [];
    }

    /**
     * Verifica se existe arquivo com granola_id - O(1)
     */
    hasGranolaId(granolaId: string): boolean {
        const files = this.granolaIdIndex.get(granolaId);
        return files !== undefined && files.length > 0;
    }

    /**
     * Retorna todos os arquivos Granola indexados
     */
    getAllGranolaFiles(): TFile[] {
        const allFiles: TFile[] = [];
        for (const files of this.granolaIdIndex.values()) {
            allFiles.push(...files);
        }
        return allFiles;
    }

    /**
     * Retorna o granola_id de um arquivo pelo path - O(1)
     */
    getGranolaIdByPath(filePath: string): string | null {
        return this.pathToGranolaId.get(filePath) || null;
    }

    /**
     * Retorna estatísticas do índice
     */
    getStats(): { totalIndexed: number; ready: boolean } {
        return {
            totalIndexed: this.granolaIdIndex.size,
            ready: this.indexReady
        };
    }

    /**
     * Obtém duplicatas de forma eficiente
     * Como o índice é 1:1 (granola_id -> file), duplicatas são
     * detectadas durante a indexação quando um granola_id já existe
     */
    getDuplicateGroups(): { granolaId: string; files: TFile[] }[] {
        // Para encontrar duplicatas, precisamos agrupar por granola_id
        // considerando que podem existir arquivos com mesmo granola_id
        // que ainda não foram indexados (o índice mantém apenas o último)

        const allFiles = this.app.vault.getFiles();
        const granolaIdMap = new Map<string, TFile[]>();

        for (const file of allFiles) {
            if (file.extension !== 'md') continue;

            const cache = this.app.metadataCache.getFileCache(file);
            const granolaId = cache?.frontmatter?.granola_id;

            if (granolaId) {
                if (!granolaIdMap.has(granolaId)) {
                    granolaIdMap.set(granolaId, []);
                }
                granolaIdMap.get(granolaId)!.push(file);
            }
        }

        // Filtra apenas grupos com duplicatas (excluindo transcripts)
        const duplicates: { granolaId: string; files: TFile[] }[] = [];

        for (const [granolaId, files] of granolaIdMap) {
            const nonTranscriptFiles = files.filter(
                file => !file.name.toLowerCase().includes('transcript')
            );

            if (nonTranscriptFiles.length > 1) {
                duplicates.push({ granolaId, files: nonTranscriptFiles });
            }
        }

        return duplicates;
    }

    /**
     * Força re-indexação de um arquivo específico
     */
    reindexFile(file: TFile): void {
        this.indexFile(file);
    }

    /**
     * Limpa recursos e event listeners
     */
    cleanup(): void {
        // Remove event listeners
        for (const ref of this.eventRefs) {
            this.app.vault.offref(ref);
            this.app.metadataCache.offref(ref);
        }
        this.eventRefs = [];

        // Limpa caches
        this.granolaIdIndex.clear();
        this.pathToGranolaId.clear();
        this.indexReady = false;

        if (this.debugMode) {
            console.log('Granola Index: Cleaned up');
        }
    }
}
