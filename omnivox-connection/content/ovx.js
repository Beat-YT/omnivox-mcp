// Navigator spoofing (must match shared/constants.js device.platform)
Object.defineProperty(navigator, 'platform', { get: () => 'Linux armv8l' });

// Generic callback handler — forwards all native command callbacks to Ovx.ExecuteCallback
window.addEventListener("Ovx-Callback", ({ detail }) => {
    const { callbackName, data } = detail;
    if (typeof Ovx !== 'undefined' && typeof Ovx.ExecuteCallback === 'function') {
        Ovx.ExecuteCallback(callbackName, data);
    }
});
