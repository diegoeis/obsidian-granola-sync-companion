const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs-extra');

const production = process.env.NODE_ENV === 'production';
const outDir = 'dist';

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

// Build the plugin
const buildOptions = {
    entryPoints: ['src/main.ts'],
    bundle: true,
    external: ['obsidian', 'electron'],
    format: 'cjs',
    sourcemap: production ? false : 'inline',
    treeShaking: true,
    outfile: `${outDir}/main.js`,
    logLevel: 'info'
};

esbuild.build(buildOptions).then(() => {
    // Copy manifest.json
    fs.copyFileSync('manifest.json', `${outDir}/manifest.json`);
    
    // Copy any other necessary files (styles, etc.)
    if (fs.existsSync('styles.css')) {
        fs.copyFileSync('styles.css', `${outDir}/styles.css`);
    }
    
    console.log('Build completed successfully!');
    console.log(`Files are in the ${outDir} directory.`);
    
    // Copy to Obsidian vault if in development
    if (!production) {
        const vaultPath = '/Users/diegoeis/obs-notes/.obsidian/plugins/granola-plugin-companion';
        if (fs.existsSync(vaultPath)) {
            fs.copySync(outDir, vaultPath, { overwrite: true });
            console.log(`Copied files to ${vaultPath}`);
        } else {
            console.warn(`Vault path not found: ${vaultPath}`);
            console.log(`You can manually copy files from ${outDir} to your vault's plugin directory.`);
        }
    }
}).catch(() => process.exit(1));
