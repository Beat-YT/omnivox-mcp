import { Page } from "puppeteer";
import { getConfig, updateConfig } from "../config";
import { buildUserAgent } from "./userAgent";

/**
 * 
 * @param {Page} page 
 */
export async function setupPageInjection(page) {
    await page.exposeFunction("Ovx_NatifCall", (command, args) => {
        console.log("[OVX COMMAND]", `${command} called with:`, args);
        const callbackName = `${command}CallBack`;
        const callback = function (data) {
            console.log("[OVX COMMAND]", `Executing callback ${callbackName} with data:`, data);
            page.evaluate((_command, _data) => {
                Ovx.ExecuteCallback(
                    _command,
                    _data
                );
            }, callbackName, data);
        }

        handleCommand(command, args, callback);
    })

    await page.evaluateOnNewDocument(() => {
        window.OvxNatif = {
            ExecuteCommand: (command, args) => window.Ovx_NatifCall(command, args),
        };

        window.webkit = window.webkit || {};
        window.webkit.messageHandlers = window.webkit.messageHandlers || {};
        window.webkit.messageHandlers.ovx = {
            postMessage: (payload) => {
                const { Command, Params } = payload;
                window.Ovx_NatifCall(Command, Params);
            }
        };
    });

    /**
    * 
    * @param {string} command 
    * @param {any} args 
    * @param {(data: any) => void} callback
    */
    function handleCommand(command, args, callback) {
        console.log("[OVX COMMAND]", `Handling command: ${command} with args:`, args);

        switch (command) {
            case 'Storage.SetCodeUserAgent': {
                console.log("[OVX COMMAND]", `Set codeUserAgent to: ${args.Code}`);
                const config = updateConfig({ Code: args.Code || "" });
                const ua = buildUserAgent(config.IdAppareil, config.Code);
                page.setUserAgent(ua);
                callback({ UserAgentRequete: ua });
                break;
            }

            case 'WebUI.IsOnline': {
                callback({ IsOnline: "True" });
                break;
            }

            case 'IOS.Notification.SetBadge': {
                callback({ Number: args?.Number?.toString() });
                break;
            }

            case 'Application.GetDeviceInfo': {

            }
        }
    }
}