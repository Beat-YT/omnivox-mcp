window.addEventListener("Ovx-CodeUserAgentCallback", ({ detail }) => {
    console.log("CodeUserAgentCallback Page Event:", detail);
    Ovx.Storage.SetCodeUserAgentCallBack(detail);
});

// fake webkit message handler
window.webkit = window.webkit || {};
window.webkit.messageHandlers = window.webkit.messageHandlers || {};


window.webkit.messageHandlers.ovx = {
    postMessage(payload) {
        window.postMessage({
            type: "OVX_NATIVE_CALL",
            payload
        }, "*");
    }
};