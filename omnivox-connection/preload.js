const { contextBridge, ipcRenderer } = require("electron");

const OvxNatif = {};

OvxNatif.ExecuteCommand = function (command, args) {
    // IsTablet is the only sync command — handle in-process, no IPC roundtrip
    if (command === 'Android.Device.IsTablet') {
        return JSON.stringify({ IsTablet: 'True' });
    }
    ipcRenderer.send("OvxNatif-ExecuteCommand", command, args);
    return 'none';
};

OvxNatif.DumpCookies = function () {
    return ipcRenderer.send("DumpCookies");
};

contextBridge.exposeInMainWorld("OvxNatif", OvxNatif);

// Generic callback forwarding: main → preload → page
ipcRenderer.on("Ovx-Callback", (_event, callbackName, data) => {
    window.dispatchEvent(new CustomEvent("Ovx-Callback", {
        detail: { callbackName, data }
    }));
});

// Inject page-level overrides (navigator spoofing + callback dispatch)
const fs = require("fs");
const path = require("path");
const ovxCode = fs.readFileSync(path.join(__dirname, "content", "ovx.js"), "utf8");

function inject() {
    const script = document.createElement("script");
    script.textContent = ovxCode;
    document.documentElement.appendChild(script);
}

if (document.documentElement) {
    inject();
} else {
    new MutationObserver((_, obs) => {
        if (document.documentElement) {
            obs.disconnect();
            inject();
        }
    }).observe(document, { childList: true });
}
