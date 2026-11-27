const omnivoxApp = require('../../shared/omnivoxApp.json');
const { ipcMain, dialog, BrowserWindow } = require('electron');
const crypto = require('crypto');
const fs = require('fs');

class AppSession {
    constructor(device) {
        this.device = device;
        this.cookies = [];
        this.configuration = {
            DefaultPage: '',
            Code: '',
            IdAppareil: crypto.randomBytes(20).toString('hex'),
        };

        ipcMain.addListener('save-session', (event) => {
            const win = BrowserWindow.fromWebContents(event.sender);

            this.saveSessionFile(win).then((success) => {
                event.sender.send('save-session-result', success);
            });
        });
    }

    async saveSessionFile(win) {
        const { canceled, filePath } = await dialog.showSaveDialog(win, {
            defaultPath: 'session.json',
            filters: [{ name: 'JSON', extensions: ['json'] }],
        });

        if (canceled || !filePath) {
            return false;
        }

        const sessionData = {
            configuration: this.configuration,
            device: this.device,
            cookies: this.cookies,
        };

        const content = JSON.stringify(sessionData, null, 2);
        fs.writeFileSync(filePath, content, 'utf8');

        return true;
    }

    setCookies(cookies) {
        this.cookies = cookies;
    }

    setUserCode(code) {
        this.configuration.Code = code;
    }

    setDefaultPage(url) {
        this.configuration.DefaultPage = url;
    }

    getUserAgent() {
        const { IdAppareil, Code } = this.configuration;
        return `OVX InfoDevice=${this.device.deviceInfo} AppVer=${omnivoxApp.version} IdAppareil=${IdAppareil} Code=${Code}`;
    }

    reset() {
        this.cookies = [];
        this.configuration.DefaultPage = '';
        this.configuration.Code = '';
        this.configuration.IdAppareil = crypto.randomBytes(20).toString('hex');
    }
}

module.exports = { AppSession };