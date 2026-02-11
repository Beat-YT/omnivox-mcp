const { app, BrowserWindow, session, ipcMain, dialog } = require("electron");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const os = require("os");

app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");


// ~/.omnivox/ for same-machine setups (MCP server reads from here)
const homeDir = path.join(os.homedir(), ".omnivox");
// cwd for cross-machine setups (human can easily find and transfer)
const cwdDir = process.cwd();
// Browser profile cleanup
const browserDir = path.join(homeDir, "browser");

let idAppareil = crypto.randomBytes(20).toString("hex")
let codeUserAgent = "";

function getUserAgent() {
    return `OVX InfoDevice=iOS-26.2_iPad13,1 AppVer=3.11.3 IdAppareil=${idAppareil} Code=${codeUserAgent}`;
}

async function createWindow() {
    // Delete stale browser profile so the MCP server re-imports fresh cookies

    const ses = session.fromPartition("persist:main")

    ses.webRequest.onBeforeRequest((details, callback) => {
        const lowerUrl = details.url.toLowerCase();
        if (lowerUrl.includes("savelogjs") || lowerUrl.includes("omnigarder")) {
            callback({ cancel: true });
            return;
        }
        callback({});
    })

    ses.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders["User-Agent"] = getUserAgent();
        callback({ requestHeaders: details.requestHeaders })
    })

    const win = new BrowserWindow({
        width: 1000,
        height: 638,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            partition: "persist:main",
            sandbox: false,
        }
    });

    function writeToAll(filename, content) {
        const targets = [homeDir, cwdDir];
        for (const dir of targets) {
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, filename), content, "utf8");
        }
    }

    async function dumpCookies() {
        // Clean up browser profile to ensure MCP server imports fresh cookies on next run
        if (fs.existsSync(browserDir)) {
            fs.rmSync(browserDir, { recursive: true, force: true });
            console.log(`Deleted browser profile at ${browserDir}`);
        }

        const cookies = await ses.cookies.get({});
        const content = JSON.stringify(cookies, null, 2);
        writeToAll("cookies.json", content);
        console.log(`Cookies saved to ${path.join(homeDir, "cookies.json")}`);
        if (cwdDir !== homeDir) {
            console.log(`  Also copied to ${path.join(cwdDir, "cookies.json")}`);
        }
    }

    function handleOvxCommand(command, args) {
        console.log("[OVX Command]", `Received command '${command}' with args:`, args);

        if (command === "Storage.SetCodeUserAgent") {
            console.log("[OVX Command]", `Set codeUserAgent to: ${args.Code}`);
            codeUserAgent = args.Code || "";

            const ua = getUserAgent();
            win.webContents.setUserAgent(ua);
            ses.setUserAgent(ua);

            win.webContents.send("Ovx-CodeUserAgentCallback", {
                UserAgentRequete: ua
            });
        } else if (command === "WebUI.SetDefaultPage") {
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
            }

            const content = JSON.stringify(config, null, 2);
            writeToAll("config.json", content);

            console.log(`Config saved to ${path.join(homeDir, "config.json")}`);
            if (cwdDir !== homeDir) {
                console.log(`  Also copied to ${path.join(cwdDir, "config.json")}`);
            }
            dumpCookies().then(() => {
                const locations = [`  ${homeDir}`];
                if (cwdDir !== homeDir) locations.push(`  ${cwdDir}`);

                dialog.showMessageBox(win, {
                    type: "info",
                    title: "Authentification complétée",
                    message: "Session Omnivox capturée avec succès.",
                    detail: `cookies.json et config.json sauvegardés dans :\n${locations.join("\n")}\n\nVous pouvez fermer cette fenêtre.`,
                    buttons: ["Fermer"],
                });
            }).catch(err => {
                console.error("Error dumping cookies:", err);
            });
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
        })
    });

    win.webContents.setUserAgent(getUserAgent());
    ses.setUserAgent(getUserAgent());

    const configPath = [path.join(homeDir, "config.json"), path.join(cwdDir, "config.json")]
        .find(p => fs.existsSync(p));
    if (configPath) {
        const configData = fs.readFileSync(configPath, "utf8");
        const config = JSON.parse(configData);
        codeUserAgent = config.Code || "";
        idAppareil = config.IdAppareil || idAppareil;
        win.loadURL(config.DefaultPage);
    } else {
        win.loadFile("content/index.html")
    }
}

app.whenReady().then(createWindow);
