const { app, BrowserWindow } = require('electron');
const path = require('path');
const { getRandomDevice } = require('./devices');
const { Bridge } = require('./bridge');
const { AppSession } = require('./appSession');

const currentDevice = getRandomDevice();

const loginPage = path.join(__dirname, '../content/index.html');
const successPage = path.join(__dirname, '../content/success.html');

async function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 638,
        webPreferences: {
            sandbox: false,
            partition: 'in-memory',
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    win.webContents.session.webRequest.onBeforeRequest((details, callback) => {
        const url = details.url.toLowerCase();
        const noisy = url.includes('savelogjs') || url.includes('omnigarder') || url.includes('analytics');
        callback({ cancel: noisy });
    });

    const appSession = new AppSession(currentDevice);
    const bridge = new Bridge(win.webContents, appSession);

    bridge.on('login', () => win.loadFile(loginPage));
    bridge.on('session', async () => {
        const cookies = await win.webContents.session.cookies.get({});
        appSession.setCookies(cookies);
        await win.loadFile(successPage);
    });

    win.loadFile(loginPage);
}

app.whenReady().then(createWindow);
