const { app, BrowserWindow, session, ipcMain, dialog } = require("electron");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const os = require("os");

const { omnivoxVer, deviceInfo } = require("../shared/constants.cjs");
const { staticResponses, nullCallbackCommands, silentCommands } = require("../shared/nativeCommands.cjs");

app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");

const homeDir = path.join(os.homedir(), ".omnivox");
const browserDir = path.join(homeDir, "browser");

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

    function writeFile(filename, content) {
        fs.mkdirSync(homeDir, { recursive: true });
        fs.writeFileSync(path.join(homeDir, filename), content, "utf8");
    }

    async function dumpCookies() {
        if (fs.existsSync(browserDir)) {
            fs.rmSync(browserDir, { recursive: true, force: true });
            console.log(`Deleted browser profile at ${browserDir}`);
        }

        const cookies = await ses.cookies.get({});
        const content = JSON.stringify(cookies, null, 2);
        writeFile("cookies.json", content);
        console.log(`Cookies saved to ${path.join(homeDir, "cookies.json")}`);
    }

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

                writeFile("config.json", JSON.stringify(config, null, 2));
                console.log(`Config saved to ${path.join(homeDir, "config.json")}`);

                fireCallback(command, null);

                dumpCookies().then(() => {
                    dialog.showMessageBox(win, {
                        type: "info",
                        title: "Authentification complétée",
                        message: "Session Omnivox capturée avec succès.",
                        detail: `cookies.json et config.json sauvegardés dans :\n  ${homeDir}`,
                        buttons: ["Fermer"],
                    }).then(() => app.quit());
                }).catch(err => {
                    console.error("Error dumping cookies:", err);
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

    ipcMain.on('DumpCookies', () => {
        dumpCookies().catch(err => {
            console.error("Error dumping cookies:", err);
        });
    });

    win.webContents.setUserAgent(getUserAgent());
    ses.setUserAgent(getUserAgent());

    const configPath = path.join(homeDir, "config.json");
    if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, "utf8");
        const config = JSON.parse(configData);
        codeUserAgent = config.Code || "";
        idAppareil = config.IdAppareil || idAppareil;
        win.loadURL(config.DefaultPage);
    } else {
        win.loadFile("content/index.html");
    }
}

app.whenReady().then(createWindow);
