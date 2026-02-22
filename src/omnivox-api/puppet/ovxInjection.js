import { Page } from "puppeteer";
import crypto from "crypto";
import { getConfig, updateConfig } from "../config";
import { buildUserAgent } from "./userAgent";
import { isLogMode } from "../../common/transportMode";
import { device } from "@common/constants";
import { staticResponses, nullCallbackCommands, silentCommands } from "@common/nativeCommands";

/**
 *
 * @param {Page} page
 */
export async function setupPageInjection(page) {
    const token = crypto.randomBytes(32).toString('base64');

    // In-memory stores for native command emulation
    const kvStore = new Map();
    let themeStore = null;

    page.on('console', (msg) => {
        if (msg.type() !== 'debug') return;
        const text = msg.text();
        if (!text.startsWith(token)) return;

        const { command, args } = JSON.parse(text.slice(token.length));
        if (isLogMode()) console.warn("[OVX COMMAND]", `${command} called with:`, args);

        const callbackName = `${command}CallBack`;
        const callback = (data) => {
            if (isLogMode()) console.warn("[OVX COMMAND]", `Executing callback ${callbackName} with data:`, data);
            page.evaluate((_command, _data) => {
                Ovx.ExecuteCallback(_command, _data);
            }, callbackName, data);
        };

        handleCommand(command, args, callback);
    });

    await page.evaluateOnNewDocument((t, platform) => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        Object.defineProperty(navigator, 'platform', { get: () => platform });

        const _debug = console.debug.bind(console);

        // Sync commands return a JSON string directly (like real addJavascriptInterface)
        const syncHandlers = {
            'Android.Device.IsTablet': () => {
                return JSON.stringify({ IsTablet: 'True' });
            },
        };

        // Signature matches real Android: ExecuteCommand(commandName: string, jsonParams: string) => string
        const execCmd = (strNomCommande, jsonString) => {
            if (syncHandlers[strNomCommande]) return syncHandlers[strNomCommande]();

            // Async commands — send to Node.js via console bridge, return "none" like real app
            const args = jsonString ? JSON.parse(jsonString) : {};
            _debug(t + JSON.stringify({ command: strNomCommande, args }));
            return 'none';
        };

        const _nativeStr = 'function ExecuteCommand() { [native code] }';
        const _origToString = Function.prototype.toString;
        const _nativeFns = new Set([execCmd]);
        Function.prototype.toString = function () {
            return _nativeFns.has(this) ? _nativeStr : _origToString.call(this);
        };
        _nativeFns.add(Function.prototype.toString);

        window.OvxNatif = { ExecuteCommand: execCmd };
    }, token, device.platform);

    /**
    *
    * @param {string} command
    * @param {any} args
    * @param {(data: any) => void} callback
    */
    function handleCommand(command, args, callback) {
        if (isLogMode()) console.warn("[OVX COMMAND]", `Handling command: ${command} with args:`, args);

        // Static responses (always the same data)
        if (staticResponses[command]) {
            callback(staticResponses[command]);
            return;
        }

        // UI acknowledgments (callback with null)
        if (nullCallbackCommands.has(command)) {
            callback(null);
            return;
        }

        // Fire-and-forget (no callback)
        if (silentCommands.has(command)) return;

        // Commands with custom logic
        switch (command) {
            case 'Storage.SetCodeUserAgent': {
                if (isLogMode()) console.warn("[OVX COMMAND]", `Set codeUserAgent to: ${args.Code}`);
                const config = updateConfig({ Code: args.Code || "" });
                const ua = buildUserAgent(config.IdAppareil, config.Code);
                page.setUserAgent(ua);
                callback({ UserAgentRequete: ua });
                break;
            }

            case 'Storage.SetInfo': {
                if (isLogMode()) console.warn("[OVX COMMAND]", `Storage.SetInfo: ${args.Key} = ${args.Value}`);
                kvStore.set(args.Key, args.Value);
                const ua = buildUserAgent(getConfig().IdAppareil, getConfig().Code);
                callback({ UserAgentRequete: ua });
                break;
            }

            case 'Storage.GetInfo': {
                const val = kvStore.get(args.Key) || '';
                if (isLogMode()) console.warn("[OVX COMMAND]", `Storage.GetInfo: ${args.Key} → ${val}`);
                callback({ Key: args.Key, Value: val });
                break;
            }

            case 'WebUI.SetDefaultPage': {
                updateConfig({ DefaultPage: args.Url || "" });
                callback(null);
                break;
            }

            case 'Theme.SetTheme': {
                themeStore = { ...args };
                callback(themeStore);
                break;
            }

            case 'Theme.GetTheme': {
                callback(themeStore);
                break;
            }

            default:
                if (isLogMode()) console.warn("[OVX COMMAND]", `Unhandled command: ${command}`);
                break;
        }
    }
}
