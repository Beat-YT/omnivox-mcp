const { contextBridge, ipcRenderer } = require('electron');

// Sync commands return their JSON right away, like a real addJavascriptInterface call
const syncCommands = {
    'Android.Device.IsTablet': { IsTablet: 'True' },
};

contextBridge.exposeInMainWorld('OvxNatif', {
    ExecuteCommand(command, json) {
        if (command in syncCommands) return JSON.stringify(syncCommands[command]);

        ipcRenderer.send('ovx-command', command, json);
        return 'none';
    },
});

contextBridge.exposeInMainWorld('AuthData', {
    downloadSession: () => new Promise((resolve) => {
        ipcRenderer.once('save-session-result', (event, success) => resolve(success));
        ipcRenderer.send('save-session');
    }),
});
