import { TFile, App } from 'obsidian';

export interface GranolaFrontmatter {
    granola_id?: string;
    updated_at?: string;
    type?: 'note' | 'transcript';
}

export class YamlParser {
    private app: App;

    constructor(app: App) {
        this.app = app;
    }

    /**
     * Extrai frontmatter YAML de um arquivo
     */
    extractFrontmatter(content: string): { frontmatter: GranolaFrontmatter; body: string } {
        const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);
        
        if (!match) {
            return { frontmatter: {}, body: content };
        }

        const frontmatterText = match[1];
        const body = match[2];
        const frontmatter: GranolaFrontmatter = {};

        try {
            // Parse YAML simples
            const lines = frontmatterText.split('\n');
            for (const line of lines) {
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                    const key = line.substring(0, colonIndex).trim();
                    const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
                    (frontmatter as any)[key] = value;
                }
            }
        } catch (error) {
            console.warn('Error parsing frontmatter:', error);
        }

        return { frontmatter, body };
    }

    /**
     * Verifica se um arquivo tem granola_id no frontmatter
     */
    hasGranolaId(file: TFile): boolean {
        const cache = this.app.metadataCache.getFileCache(file);
        return cache?.frontmatter?.granola_id !== undefined;
    }

    /**
     * Obtém o granola_id de um arquivo
     */
    getGranolaId(file: TFile): string | null {
        const cache = this.app.metadataCache.getFileCache(file);
        return cache?.frontmatter?.granola_id || null;
    }

    /**
     * Obtém o updated_at de um arquivo
     */
    getUpdatedAt(file: TFile): string | null {
        const cache = this.app.metadataCache.getFileCache(file);
        return cache?.frontmatter?.updated_at || null;
    }
}