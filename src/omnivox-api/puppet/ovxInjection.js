import { Page } from "puppeteer";
import crypto from "crypto";
import { OmnivoxConfig } from "../config";
import { isLogMode } from "../../common/transportMode";
import staticCommands from "../../../shared/staticCommands.json" with { type: "json" };

/*
 * Fakes the Android side of the Omnivox WebView <-> native bridge (ComNatifOvx.js)
 * so the mobile pages boot inside headless Puppeteer. Bare minimum only: nothing
 * interacts with the fake app, we just need Skytech.Commun.Utils.HttpRequestWorker.PostJSON
 * to become usable. See docs/native-bridge.md.
 *
 * This is not fragile. The real native app ships through app stores and users update
 * whenever, so Omnivox's JS must run against every app build still installed anywhere:
 * errors from OvxNatif.ExecuteCommand are caught and logged, commands whose callback
 * never fires are tolerated, and new commands sit behind IsMinimumVersion gates. That
 * gate reads AppVer= from the user agent we build (version in shared/omnivoxApp.json),
 * so the page never emits a command newer than the version we declare. An unhandled
 * command below degrades a page feature we do not use; it cannot break the bridge.
 * See "Backward compatibility" and "Version pinning" in docs/native-bridge.md.
 */

/**
 *
 * @param {Page} page
 * @param {OmnivoxConfig} config
 */
export async function setupPageInjection(page, config) {
    const token = crypto.randomBytes(16).toString('hex');

    // In-memory stores for native command emulation
    const kvStore = new Map();
    let themeStore = null;

    await page.exposeFunction(token, (command, args) => {
        if (isLogMode()) console.warn("[OVX COMMAND]", `${command} called with:`, args);

        const callbackName = `${command}CallBack`;
        const callback = (cb_data) => {
            if (isLogMode()) console.warn("[OVX COMMAND]", `Executing callback ${callbackName} with data:`, cb_data);

            page.evaluate((_cbName, _cb_data) => {
                Ovx.ExecuteCallback(_cbName, _cb_data);
            }, callbackName, cb_data);
        };

        handleCommand(command, args, callback).catch((err) => {
            console.warn("[OVX COMMAND]", `${command} failed:`, err.message);
        });
    });

    await page.evaluateOnNewDocument((t, platform) => {
        const bridge = window[t];

        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        Object.defineProperty(navigator, 'platform', { get: () => platform });
        Object.defineProperty(window, t, { value: bridge, enumerable: false, writable: false, configurable: false });
        Object.defineProperty(window, `puppeteer_${t}`, { value: window[`puppeteer_${t}`], enumerable: false, writable: false, configurable: false });

        // Sync commands return a JSON string directly (like real addJavascriptInterface)
        const syncHandlers = {
            'Android.Device.IsTablet': () => {
                return JSON.stringify({ IsTablet: 'True' });
            },
        };

        // Signature matches real Android: ExecuteCommand(commandName: string, jsonParams: string) => string
        const ExecuteCommand = (strNomCommande, jsonString) => {
            if (syncHandlers[strNomCommande]) return syncHandlers[strNomCommande]();

            bridge(strNomCommande, JSON.parse(jsonString || '{}'));
            return 'none';
        };

        // Set ExecuteCommand function signature
        const _nativeStr = 'function ExecuteCommand() { [native code] }';
        const _toStringStr = 'function toString() { [native code] }';
        const _origToString = Function.prototype.toString;
        const _nativeFns = new Set([ExecuteCommand]);
        let _toStringPtr = null;
        Function.prototype.toString = function () {
            if (this === ExecuteCommand) return _nativeStr;
            if (this === _toStringPtr) return _toStringStr;
            return _origToString.call(this);
        };
        _toStringPtr = Function.prototype.toString;

        // define the bridge
        window.OvxNatif = { ExecuteCommand: ExecuteCommand };
    }, token, config.Device.data.device.platform);

    /**
    *
    * @param {string} command
    * @param {any} args
    * @param {(data: any) => void} callback
    */
    async function handleCommand(command, args, callback) {
        if (isLogMode()) console.warn("[OVX COMMAND]", `Handling command: ${command} with args:`, args);

        // Fixed answers, a null entry fires the callback without data
        if (command in staticCommands) {
            callback(staticCommands[command]);
            return;
        }

        // Commands with custom logic. Anything else is fire and forget.
        switch (command) {
            case 'Application.GetDeviceInfo': {
                callback(config.Device.data.deviceInfoMeta);
                break;
            }

            case 'Application.DeviceStats': {
                // "HeadlessChrome/131.0.6778.85"
                const chromeVersion = (await page.browser().version()).split('/').pop();
                callback(config.Device.stats(chromeVersion));
                break;
            }

            case 'Storage.SetCodeUserAgent': {
                if (isLogMode()) console.warn("[OVX COMMAND]", `Set codeUserAgent to: ${args.Code}`);
                config.update({ Code: args.Code || "" });
                const ua = config.userAgent;
                page.setUserAgent(ua);
                callback({ UserAgentRequete: ua });
                break;
            }

            case 'Storage.SetInfo': {
                if (isLogMode()) console.warn("[OVX COMMAND]", `Storage.SetInfo: ${args.Key} = ${args.Value}`);
                kvStore.set(args.Key, args.Value);
                callback({ UserAgentRequete: config.userAgent });
                break;
            }

            case 'Storage.GetInfo': {
                const val = kvStore.get(args.Key) || '';
                if (isLogMode()) console.warn("[OVX COMMAND]", `Storage.GetInfo: ${args.Key} → ${val}`);
                callback({ Key: args.Key, Value: val });
                break;
            }

            case 'WebUI.SetDefaultPage': {
                // Omnivox sends an empty Url on logout; postJson() treats an empty DefaultPage as an expired session
                config.update({ DefaultPage: args.Url ? decodeURIComponent(args.Url) : "" });
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
