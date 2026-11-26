const { app, BrowserWindow, session, ipcMain, dialog } = require("electron");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const { omnivoxVer, deviceInfo } = require("../shared/constants.cjs");
const { staticResponses, nullCallbackCommands, silentCommands } = require("../shared/nativeCommands.cjs");

app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");

const LOGIN_PAGE = path.join(__dirname, "content", "index.html");
const SUCCESS_PAGE = path.join(__dirname, "content", "success.html");

let idAppareil = crypto.randomBytes(20).toString("hex");
let codeUserAgent = "";

// In-memory stores for native command emulation
const kvStore = new Map();
let themeStore = null;

function getUserAgent() {
    return `OVX InfoDevice=${deviceInfo} AppVer=${omnivoxVer} IdAppareil=${idAppareil} Code=${codeUserAgent}`;
}

// The login session lives in memory only: every launch starts logged out, and the
// cookies handed to the server are never left behind in this app's profile.
const PARTITION = "auth";

/** Removes the on-disk session that versions using "persist:main" left behind. */
function removeLegacySession() {
    try {
        fs.rmSync(path.join(app.getPath("userData"), "Partitions", "main"), { recursive: true, force: true });
    } catch (err) {
        console.warn("Could not remove the old persisted session:", err.message);
    }
}

async function createWindow() {
    removeLegacySession();
    const ses = session.fromPartition(PARTITION);

    ses.webRequest.onBeforeRequest((details, callback) => {
        const lowerUrl = details.url.toLowerCase();
        if (lowerUrl.includes("savelogjs") || lowerUrl.includes("omnigarder") || lowerUrl.includes("analytics")) {
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
            partition: PARTITION,
            sandbox: false,
        }
    });

    /**
     * Fires a native callback on the page via IPC → preload → Ovx.ExecuteCallback
     */
    function fireCallback(command, data) {
        win.webContents.send("Ovx-Callback", command + "CallBack", data);
    }

    let captured = false;

    function showLogin(args) {
        captured = false;
        const query = {};
        if (args.Identifiant) query.n = String(args.Identifiant);
        win.loadFile(LOGIN_PAGE, { query });
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

            case 'WebUI.ResetSession': {
                codeUserAgent = "";
                idAppareil = crypto.randomBytes(20).toString("hex");
                kvStore.clear();
                themeStore = null;
                const ua = getUserAgent();
                win.webContents.setUserAgent(ua);
                ses.setUserAgent(ua);
                ses.clearStorageData().then(() => {
                    fireCallback(command, null);
                });
                break;
            }

            case 'Display.ViewLogin': {
                showLogin(args);
                break;
            }

            case 'WebUI.SetDefaultPage': {
                // An empty Url is Omnivox logging the session out, not a login.
                if (!args.Url) {
                    fireCallback(command, null);
                    return;
                }

                let url;
                try {
                    url = new URL(decodeURIComponent(args.Url));
                } catch {
                    console.warn("Invalid Url in SetDefaultPage command:", args.Url);
                    fireCallback(command, null);
                    return;
                }
                url.hash = "";

                // Omnivox can repeat the command; the first one is the login.
                if (captured) {
                    fireCallback(command, null);
                    return;
                }
                captured = true;

                const config = {
                    DefaultPage: url.href,
                    Code: codeUserAgent,
                    IdAppareil: idAppareil
                };

                fireCallback(command, null);

                ses.cookies.get({}).then(async cookies => {
                    await win.loadFile(SUCCESS_PAGE);
                    win.webContents.send("auth-data", {
                        cookies: JSON.stringify(cookies, null, 2),
                        config: JSON.stringify(config, null, 2)
                    });
                }).catch(err => {
                    captured = false;
                    console.error("Error capturing the session:", err);
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
            try {
                args = JSON.parse(args);
            } catch {
                args = {};
            }
        }
        try {
            handleOvxCommand(command, args && typeof args === 'object' ? args : {});
        } catch (err) {
            console.error("[OVX Command]", `${command} failed:`, err);
        }
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

    win.loadFile(LOGIN_PAGE);
}

app.whenReady().then(createWindow);
