const { ipcMain } = require('electron');
const { EventEmitter } = require('events');
const { getRandomFreeDiskSpace, getWebViewVersion } = require('./devices');
const staticCommands = require('../../shared/staticCommands.json');

// Native half of the Omnivox bridge, see docs/native-bridge.md
class Bridge extends EventEmitter {
    constructor(contents, appSession) {
        super();
        this.contents = contents;
        this.appSession = appSession;
        this.storage = new Map();
        this.themeStore = null;

        ipcMain.on('ovx-command', async (event, command, json) => {
            const args = JSON.parse(json || '{}');
            console.log('[OVX Command]', command, args);

            const data = await this.executeCommand(command, args);
            if (data !== undefined) this.executeCallback(command, data);
        });

        contents.debugger.attach();
        this.applyUserAgent();
    }

    /*
     * The return value is what the page gets back: undefined fires no callback,
     * null fires it without data, anything else is the callback data.
     * A command that is not listed is fire and forget.
     */
    async executeCommand(command, args) {
        if (command in staticCommands) return staticCommands[command];

        switch (command) {
            case 'Application.GetDeviceInfo':
                return this.appSession.device.deviceInfoMeta;

            case 'Application.DeviceStats':
                const diskSpace = this.appSession.device.diskSpace || 0;
                const freeSpace = getRandomFreeDiskSpace(diskSpace);
                const system = getRandomFreeDiskSpace(freeSpace, 0.3);
                
                return {
                    totalDiskSpace: diskSpace,
                    freeDiskSpace: freeSpace,
                    externalTotalDiskSpace: diskSpace,
                    externalFreeDiskSpace: freeSpace,
                    systemTotalDiskSpace: system,
                    systemFreeDiskSpace: 0,
                    webViewVersionName: process.versions.chrome,
                    webViewVersionCode: getWebViewVersion()
                };

            case 'Storage.SetCodeUserAgent':
                this.appSession.setUserCode(args.Code || '');
                return { UserAgentRequete: this.applyUserAgent() };

            case 'Storage.SetInfo':
                this.storage.set(args.Key, args.Value);
                return { UserAgentRequete: this.appSession.getUserAgent() };

            case 'Storage.GetInfo':
                return { Key: args.Key, Value: this.storage.get(args.Key) || '' };

            case 'Theme.SetTheme':
                this.themeStore = { ...args };
                return this.themeStore;

            case 'Theme.GetTheme':
                return this.themeStore;

            case 'WebUI.SetDefaultPage': {
                // Omnivox sends an empty Url on logout
                if (!args.Url) {
                    this.appSession.setDefaultPage('');
                    return null;
                }

                const url = new URL(decodeURIComponent(args.Url));
                url.hash = '';

                this.appSession.setDefaultPage(url.href);
                this.emit('session');
                return null;
            }

            case 'WebUI.ResetSession':
                this.appSession.reset();
                this.storage.clear();
                this.themeStore = null;
                this.applyUserAgent();

                await this.contents.session.clearStorageData();
                return null;

            case 'Display.ViewLogin':
                this.emit('login');
                return;
        }
    }

    executeCallback(command, data) {
        const name = JSON.stringify(command + 'CallBack');
        const script = `window.Ovx?.ExecuteCallback(${name}, ${JSON.stringify(data)})`;

        // The page may be gone by the time its answer is ready
        this.contents.executeJavaScript(script).catch(() => { });
    }

    applyUserAgent() {
        const userAgent = this.appSession.getUserAgent();
        const { platform, userAgentMetadata } = this.appSession.device.device;

        this.contents.debugger.sendCommand('Emulation.setUserAgentOverride', {
            userAgent,
            platform,
            userAgentMetadata,
        });

        return userAgent;
    }
}

module.exports = { Bridge };
