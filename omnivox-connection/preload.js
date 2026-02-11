const { contextBridge, ipcRenderer } = require("electron");
const OvxNatif = {};

OvxNatif.ExecuteCommand = function (command, args) {
    console.log("[OVX COMMAND]", `${command} called with:`, args);
    return ipcRenderer.send("OvxNatif-ExecuteCommand", command, args);
}

OvxNatif.DumpCookies = function () {
    return ipcRenderer.send("DumpCookies");
}

contextBridge.exposeInMainWorld("OvxNatif", OvxNatif);

// handle webkit events
window.addEventListener("message", (event) => {
    if (event.data?.type === "OVX_NATIVE_CALL") {
        const { Command, Params } = event.data.payload;
        console.log("[OVX WebKit CALL]", `Forwarding command '${Command}' with params:`, Params);
        ipcRenderer.send("OvxNatif-ExecuteCommand", Command, Params);
    }
});

// forward callbacks to injected page script

ipcRenderer.on("Ovx-CodeUserAgentCallback", (event, data) => {
    window.dispatchEvent(new CustomEvent("Ovx-CodeUserAgentCallback", {
        detail: data
    }));
});


// inject a page script that listens to our custom events and interacts with the page

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
    // Otherwise wait until it does
    new MutationObserver((_, obs) => {
        if (document.documentElement) {
            obs.disconnect();
            inject();
        }
    }).observe(document, { childList: true });
}