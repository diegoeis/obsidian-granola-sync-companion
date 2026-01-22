import { App, PluginManifest } from 'obsidian';

export interface GranolaSyncInfo {
    installed: boolean;
    available: boolean;
    enabled: boolean;
    manifest?: PluginManifest;
}

export class PluginDetector {
    private app: App;
    private pluginId = 'granola-sync';

    constructor(app: App) {
        this.app = app;
    }

    /**
     * Gets information about the Granola Sync plugin
     */
    getGranolaSyncInfo(): GranolaSyncInfo {
        try {
            const pluginsAPI = (this.app as any).plugins;

            // Check 1: Is the plugin installed? (exists in manifests)
            const manifests = pluginsAPI.manifests || {};
            const manifest = manifests[this.pluginId];
            const isInstalled = !!manifest;

            // Check 2: Is the plugin enabled? (exists in loaded plugins)
            // Try multiple methods for maximum compatibility
            let isEnabled = false;

            // Method 1: Check if plugin instance exists in plugins object
            if (pluginsAPI.plugins && pluginsAPI.plugins[this.pluginId]) {
                isEnabled = true;
            }

            // Method 2: Check enabledPlugins Set (if available)
            if (!isEnabled && pluginsAPI.enabledPlugins) {
                isEnabled = pluginsAPI.enabledPlugins.has(this.pluginId);
            }

            // Check 3: Is the plugin available? (both installed AND enabled)
            const isAvailable = isInstalled && isEnabled;

            return {
                installed: isInstalled,
                enabled: isEnabled,
                available: isAvailable,
                manifest: manifest || undefined
            };
        } catch (error) {
            console.warn('Error checking Granola Sync status:', error);
            return {
                installed: false,
                available: false,
                enabled: false
            };
        }
    }

    /**
     * Shows a warning when Granola Sync is not available
     * Provides specific guidance based on the current state
     */
    showDependencyWarning(info?: GranolaSyncInfo) {
        if (!info) {
            info = this.getGranolaSyncInfo();
        }

        let statusMessage: string;
        let actionMessage: string;

        if (!info.installed) {
            statusMessage = 'Granola Sync is not installed';
            actionMessage = 'Please install <strong>Granola Sync</strong> from the Community Plugins settings.';
        } else if (!info.enabled) {
            statusMessage = 'Granola Sync is installed but disabled';
            actionMessage = 'Please enable <strong>Granola Sync</strong> in the Community Plugins settings.';
        } else {
            statusMessage = 'Granola Sync status unknown';
            actionMessage = 'Please check your plugin configuration.';
        }

        const message = document.createElement('div');
        message.style.cssText = `
            padding: 10px;
            border-left: 4px solid #ff9800;
            margin: 10px 0;
            background: #fff3e0;
        `;
        message.innerHTML = `
            <strong>Granola Plugin Companion</strong> requires <strong>Granola Sync</strong> to function properly.
            <p>${actionMessage}</p>
            <p><em>Current status: ${statusMessage}</em></p>
        `;

        if ((this.app as any).notice) {
            (this.app as any).notice(message, 10000);
        } else {
            console.warn(`Granola Companion: ${statusMessage}`);
        }
    }
}