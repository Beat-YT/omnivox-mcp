const { app, BrowserWindow, session, ipcMain, dialog } = require("electron");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const { omnivoxVer, deviceInfo } = require("../shared/constants.cjs");
const { staticResponses, nullCallbackCommands, silentCommands } = require("../shared/nativeCommands.cjs");

app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");

let idAppareil = crypto.randomBytes(20).toString("hex");
let codeUserAgent = "";

// In-memory stores for native command emulation
const kvStore = new Map();
let themeStore = null;

function getUserAgent() {
    return `OVX InfoDevice=${deviceInfo} AppVer=${omnivoxVer} IdAppareil=${idAppareil} Code=${codeUserAgent}`;
}

async function createWindow() {
    const ses = session.fromPartition("persist:main");

    ses.webRequest.onBeforeRequest((details, callback) => {
        const lowerUrl = details.url.toLowerCase();
        if (lowerUrl.includes("savelogjs") || lowerUrl.includes("omnigarder")) {
            callback({ cancel: true });
            return;
        }
        callback({});
    });

    ses.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders["User-Agent"] = getUserAgent();
        callback({ requestHeaders: details.requestHeaders });
    });

    const win = new BrowserWindow({
        width: 1000,
        height: 638,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            partition: "persist:main",
            sandbox: false,
        }
    });

    /**
     * Fires a native callback on the page via IPC → preload → Ovx.ExecuteCallback
     */
    function fireCallback(command, data) {
        win.webContents.send("Ovx-Callback", command + "CallBack", data);
    }

    function handleOvxCommand(command, args) {
        console.log("[OVX Command]", command, args);

        // Static responses
        if (staticResponses[command]) {
            fireCallback(command, staticResponses[command]);
            return;
        }

        // UI acknowledgments
        if (nullCallbackCommands.has(command)) {
            fireCallback(command, null);
            return;
        }

        // Fire-and-forget
        if (silentCommands.has(command)) return;

        // Commands with custom logic
        switch (command) {
            case 'Storage.SetCodeUserAgent': {
                codeUserAgent = args.Code || "";
                const ua = getUserAgent();
                win.webContents.setUserAgent(ua);
                ses.setUserAgent(ua);
                fireCallback(command, { UserAgentRequete: ua });
                break;
            }

            case 'Storage.SetInfo': {
                console.log("[OVX Command]", `Storage.SetInfo: ${args.Key} = ${args.Value}`);
                kvStore.set(args.Key, args.Value);
                fireCallback(command, { UserAgentRequete: getUserAgent() });
                break;
            }

            case 'Storage.GetInfo': {
                const val = kvStore.get(args.Key) || '';
                console.log("[OVX Command]", `Storage.GetInfo: ${args.Key} → ${val}`);
                fireCallback(command, { Key: args.Key, Value: val });
                break;
            }

            case 'Theme.SetTheme': {
                themeStore = { ...args };
                fireCallback(command, themeStore);
                break;
            }

            case 'Theme.GetTheme': {
                fireCallback(command, themeStore);
                break;
            }

            case 'WebUI.SetDefaultPage': {
                if (!args?.Url) {
                    console.warn("No Url in SetDefaultPage command");
                    return;
                }

                const url = new URL(decodeURIComponent(args.Url));
                url.hash = "";

                const config = {
                    DefaultPage: url.href,
                    Code: codeUserAgent,
                    IdAppareil: idAppareil
                };

                fireCallback(command, null);

                ses.cookies.get({}).then(cookies => {
                    win.loadFile("content/success.html");
                    win.webContents.once('did-finish-load', () => {
                        win.webContents.send("auth-data", {
                            cookies: JSON.stringify(cookies, null, 2),
                            config: JSON.stringify(config, null, 2)
                        });
                    });
                }).catch(err => {
                    console.error("Error getting cookies:", err);
                });
                break;
            }

            default:
                console.warn("[OVX Command]", `Unhandled: ${command}`);
                break;
        }
    }

    ipcMain.on("OvxNatif-ExecuteCommand", (evt, command, args) => {
        if (typeof args === 'string') {
            args = JSON.parse(args);
        }
        handleOvxCommand(command, args);
    });

    ipcMain.handle('save-file', async (evt, filename, content) => {
        const { canceled, filePath } = await dialog.showSaveDialog(win, {
            defaultPath: filename,
            filters: [{ name: 'JSON', extensions: ['json'] }],
        });
        if (!canceled && filePath) {
            fs.writeFileSync(filePath, content, 'utf8');
            return true;
        }
        return false;
    });

    win.webContents.setUserAgent(getUserAgent());
    ses.setUserAgent(getUserAgent());

    win.loadFile("content/index.html");
}

app.whenReady().then(createWindow);
