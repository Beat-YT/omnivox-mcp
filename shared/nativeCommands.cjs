const crypto = require('crypto');

// Static responses for commands that always return the same data
const staticResponses = {
    'WebUI.IsOnline': { IsOnline: 'True' },
    'Application.GetDeviceInfo': {
        Manufacturer: 'samsung',
        Model: 'SM-X700',
        OsVersion: '14',
        Device: 'gts8wifi',
        IsOsModified: false,
    },
    'Application.DeviceStats': {
        totalDiskSpace: 119185342464,
        freeDiskSpace: 72491089920,
        externalTotalDiskSpace: 119185342464,
        externalFreeDiskSpace: 72491089920,
        systemTotalDiskSpace: 3556769792,
        systemFreeDiskSpace: 587202560,
        webViewVersionName: '130.0.6723.83',
        webViewVersionCode: 672308300,
    },
    'Android.Notification.IsGooglePlayServicesAvailable': { IsAvailable: 'True', IsBackgroundRestricted: 'False' },
    'Android.Device.HasCamera': { HasCamera: true },
    'Biometry.GetCapabilities': { BiometryUnavailable: true, IsDevicePasswordSet: false, CanUseHardwareStorage: false },
    'Biometry.GetState': { KeyInStorage: false, BiometrySetupComplete: false },
    'Biometry.GetCapabilitiesAndState': {
        BiometryUnavailable: true, IsDevicePasswordSet: false, CanUseHardwareStorage: false,
        KeyInStorage: false, BiometrySetupComplete: false,
    },
    'Biometry.GenerateSigningKey': { Success: false },
    'Biometry.SignData': { Success: false },
    'Biometry.DeleteKey': { Success: true },
    'Biometry.SetSetupDone': { Success: true },
};

// Commands that fire callback(null) — UI acknowledgments
const nullCallbackCommands = new Set([
    'WebUI.SetWindowOption',
    'WebUI.ResetSession',
    'Display.SetBrightness',
    'Display.Authenticate',
    'Display.OpenCamera',
]);

// Fire-and-forget — accept silently, no callback
const silentCommands = new Set([
    'WebUI.CloseWindow',
    'WebUI.OpenNewWindow',
    'WebUI.Exit',
    'WebUI.Restart',
    'WebUI.SetAltNavigationBarOptions',
    'WebUI.NavigateToStore',
    'Display.SetLanguage',
    'Display.ViewDocument',
    'Display.ViewLogin',
    'Display.ViewStudentEmployee',
    'Display.ViewInfo',
    'Display.ViewCommunicationError',
    'Display.ViewAppSettings',
    'Display.Print',
    'Display.Scanner',
    'Android.Device.SetRedirectNativeCommand',
    'Android.Device.OpenTimePicker',
    'Android.OpenFile',
    'Android.OpenAppLink',
    'Android.Notification.OnReceive',
    'Android.Notification.Register',
    'Clipboard.CopyToClipboard',
]);

function generateFcmToken() {
    return crypto.randomBytes(76).toString('base64');
}

module.exports = { staticResponses, nullCallbackCommands, silentCommands, generateFcmToken };
