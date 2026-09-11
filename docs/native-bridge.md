# Native bridge

The mobile site is designed to run inside the WebView of the official iOS/Android app, not in a plain browser. `ComNatifOvx.js` (served at `/Views/Commun/Javascript/Application/ComNatifOvx.js`, a copy lives in `omnivox-connection/content/`) defines the JS half of the bridge between the page and the host app. The page uses it to ask the app for things a website cannot do on its own (persist the auth code, read device info, open native viewers) and the app uses it to push events back (notifications, hardware buttons, app lifecycle).

The page exposes everything under a global `window.Ovx` namespace, one function per command (`Ovx.Storage.SetInfo(key, value)`, `Ovx.WebUI.IsOnline(callback)`, …). Every function ends up in a private `ExecuteCommand(name, params)` that hands the call to the native side.

## Transport

`ExecuteCommand` picks the channel from the user agent:

| Platform | Channel | Notes |
|---|---|---|
| Android | `OvxNatif.ExecuteCommand(name, jsonString)` | `OvxNatif` is injected by the app with `addJavascriptInterface`. Called inside a `setTimeout(…, 1)`. |
| iOS (WKWebView) | `window.webkit.messageHandlers.ovx.postMessage({ Command, Params })` | Standard WebKit message handler. |
| iOS (legacy UIWebView) | `ovx://{Command}/?k=v&…` | A throwaway `<iframe>` is navigated to the URL, which the app intercepts with `NSURLProtocol`. Params may be `encodeURIComponent`-ed per command (`UseContextSensitiveEncoding`). |

Return value of `OvxNatif.ExecuteCommand` (Android only):

```
"none"     command accepted, result (if any) arrives through a callback
"retry"    the app has not confirmed the mobile page is loaded yet; the page re-sends once after 100 ms
<json>     sync commands only (see below)
```

### Sync commands

`ExecuteCommandSync` calls `OvxNatif.ExecuteCommand` and parses the returned string as JSON. Only used by `Android.Device.IsTablet` (`{ IsTablet: "True" | "False" }`). Throws on iOS.

## Callbacks (app → page)

Results flow back through a naming convention: the app evaluates `Ovx.ExecuteCallback("{Command}CallBack", data)` in the WebView, which resolves `Ovx.{Namespace}.{Command}CallBack` and invokes it in a `setTimeout(…, 1)`. The `CallBack` function then calls whatever JS callback was pending for that command. Extra arguments to `ExecuteCallback` are forwarded as-is.

Most commands are declared through a `createCommand({ Name })` helper that generates both the caller (`Ovx.X.Y(args, callback)`) and the receiver (`Ovx.X.YCallBack(data)`) from the command name. The hand-written ones follow the same pattern.

`Storage.SetCodeUserAgent` is the only command with a failsafe: if its callback has not fired after 8 s, the page fires it itself and logs `Pas d'appel du callback de SetCodeUserAgent après 8 secondes`. Every other command simply waits.

## Command namespaces

| Namespace | Commands | Purpose |
|---|---|---|
| `Application` | `DeviceStats`, `GetDeviceInfo`, `OpenMioPage`, `GetLeaAutoLoginUrl` | Device identity, disk stats, deep links into MIO / LÉA |
| `WebUI` | `OpenNewWindow`, `CloseWindow`, `SetDefaultPage`, `SetWindowOption`, `ResetSession`, `Exit`, `Restart`, `IsOnline`, `NavigateToStore`, `SetAltNavigationBarOptions` | Window management, landing page, connectivity, store links |
| `Storage` | `SetCodeUserAgent`, `SetInfo`, `GetInfo` | Persist the auth code and small key/value pairs in the app |
| `Clipboard` | `CopyToClipboard` | |
| `Display` | `SetLanguage`, `ViewDocument`, `ViewLogin`, `ViewStudentEmployee`, `ViewInfo`, `ViewCommunicationError`, `ViewAppSettings`, `Print`, `Scanner`, `Authenticate`, `SetBrightness`, `OpenCamera` | Native screens and viewers |
| `Biometry` | `GetCapabilities`, `GetState`, `GetCapabilitiesAndState`, `GenerateSigningKey`, `SignData`, `SetSetupDone`, `DeleteKey` | Biometric login (hardware-backed key) |
| `Theme` | `SetTheme` | Colour theme handed to the native chrome |
| `Android.Device` | `IsTablet` (sync), `HasCamera`, `SetRedirectNativeCommand`, `OpenTimePicker` | Device queries, hardware back button redirect |
| `Android` | `OpenFile`, `OpenAppLink`, `SetFileChosenCallback` | File and intent handoff |
| `Android.Notification` | `IsGooglePlayServicesAvailable`, `Register`, `OnReceive` | FCM |
| `IOS.Notification` | `GetEnabledRemoteNotificationTypes`, `RegisterForRemoteNotification`, `OnReceivedNotification`, `SetBadge` | APNs |
| `IOS.Purchase` / `Android.Purchase` | `GetProductInfo`, `RequestPayment`, `GetListPaymentQueued`, `FinishTransaction` / `GetSkuDetails`, `RequestPayment`, `GetPurchases`, `Consume` | In-app purchases |

Callbacks the app calls on its own (no matching command): `Application.OnBecomeActive`, `WebUI.OnMemoryWarningCallBack`, `WebUI.OnResizeCallBack`, `WebUI.OnWillEnterBackgroundCallBack`, `Android.Device.OnTouch`, `Android.FileChosenCallBack`, `Application.UrlProtocolReceiveCallBack`.

## Commands that matter for a session

The rest of the bridge is UI. These are the calls that affect how requests are built and signed:

- **`Storage.SetCodeUserAgent`** `{ Code }` → `{ UserAgentRequete }`. The page hands the app the auth code received at login; the app rebuilds its user agent from it and echoes the result. The page stores it in `window.userAgentRequete` and re-runs `Skytech.Commun.Utils.Support.Initialize()` so the app version and platform are re-parsed from the new UA. Without this callback the page waits the full 8 s failsafe on every boot.
- **`Storage.SetInfo`** `{ Key, Value }` → `{ UserAgentRequete }` and **`Storage.GetInfo`** `{ Key }` → `{ Key, Value }`. Small key/value store the page expects to read back.
- **`WebUI.SetDefaultPage`** `{ Url }`. The URL the app should load on next launch.
- **`Application.GetDeviceInfo`** → `{ Manufacturer, Model, OsVersion, Device, IsOsModified }` and **`Application.DeviceStats`**. Sent along with analytics and used for version gating.
- **`WebUI.IsOnline`** → `{ IsOnline: "True" }`. Checked before network calls.

## Backward compatibility

A new command only becomes usable once both the iOS and Android apps ship an update, and users update at their own pace. The web side is therefore written to tolerate any app version:

- Errors thrown by `OvxNatif.ExecuteCommand` are caught and logged (`MOBILE_NATIF_0001`), never re-thrown when the log worker is available. The comments list the app versions those errors came from (`3.0.1: Can't find variable: OvxNatif`, `1.0.4: Error calling method on NPObject`).
- `createCommand` accepts a `ShouldExecute` gate, typically `Skytech.Commun.Utils.Support.IsMinimumVersion(android, ios)`, to skip commands old apps do not know.
- `Ovx.ActiveSupportVieuxNamespaceAndroid()` aliases `Ovx.Device` to `Ovx.Android.Device` for Android ≤ 1.0.3, which used a flat namespace.
- With `debug` in the user agent on `Win32` (or `window.unitTest`), no native call is made and callbacks fire immediately. This is how Omnivox developers run the mobile site in desktop Chrome.

The practical consequence: an unknown or unanswered command degrades the page, it does not break it.
