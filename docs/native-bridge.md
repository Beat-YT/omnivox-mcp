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

The two halves of the bridge ship on different schedules. The page is served fresh from Omnivox on every load; the native half only changes when the user installs an app-store update, which many never do. Every mobile page therefore has to run against every app build still installed somewhere, and the JS is written on that assumption: no command is required to exist and no callback is required to fire.

The mechanisms, all in `ComNatifOvx.js` and `Skytech.Commun.Utils.Support`:

- **Errors are swallowed.** Exceptions thrown by `OvxNatif.ExecuteCommand` are caught and logged as `MOBILE_NATIF_0001`, never re-thrown when the log worker is available. The comments list the app versions those errors came from (`3.0.1: Can't find variable: OvxNatif`, `1.0.4: Error calling method on NPObject`).
- **Missing callbacks are tolerated.** A pending callback that never fires leaves its caller waiting; nothing times out into an error state. `Storage.SetCodeUserAgent` is the one command whose result the boot sequence depends on, and the page fires that callback itself after 8 s.
- **New commands are version-gated.** `createCommand` accepts a `ShouldExecute` gate, typically `Skytech.Commun.Utils.Support.IsMinimumVersion(ios, android)`, so a command is never sent to an app that predates it. Named capability flags follow the same pattern: `SupporteCommandeOpenAppLink` is `IsMinimumVersion("3.11.1", "3.8.6")`, `IsRedesignV400` is `IsMinimumVersion("4.0.0", "4.0.0")`.
- **Old namespaces are kept.** `Ovx.ActiveSupportVieuxNamespaceAndroid()` aliases `Ovx.Device` to `Ovx.Android.Device` for Android ≤ 1.0.3, which used a flat namespace.
- **No app at all is a supported mode.** With `debug` in the user agent on `Win32` (or `window.unitTest`), no native call is made and callbacks fire immediately. This is how Omnivox developers run the mobile site in desktop Chrome.

The contract only grows, and only behind gates. An unknown or unanswered command degrades the page, it does not break it, and a bridge that satisfies a given app version keeps satisfying it: the page can never assume more than that version provides, because real users are still on it.

### Version pinning

`IsMinimumVersion` compares against `Skytech.Commun.Utils.Support.AppVersion`, which is parsed once, in `Support.Initialize()`, from the `AppVer=` field of `window.userAgentRequete` (the OVX user agent, see `Storage.SetCodeUserAgent`). The app version the page believes it is running in is whatever the user agent says.

```
IsMinimumVersion(versionIOS, versionAndroid)
  not the native app             → false
  no minimum for this platform   → true   (null / undefined)
  otherwise                      → AppVer >= minimum
```

Declaring a version pins the set of commands the page will ever emit: anything gated above it is skipped before it reaches `ExecuteCommand`, so an emulated bridge only has to cover what that version's app understood. Features gated above the pinned version stay off without error (the 4.0 layout behind `IsRedesignV400`, for example). Bumping the version opts into them, and into whatever new commands they call.

Two other checks read the same version:

- `Skytech.Commun.Application.IsModuleActif` also requires `IsMinimumVersion(VersionMinimum, VersionMinimum)` from the service manifest (`App/GetOffreService`), so a service can hide itself below a minimum app version.
- `IsLatestAppVersion` compares against `ServerConfig.AppVersionStore`. When behind, the page shows an update prompt as an interception, subject to the cadence rules in `doitAfficherPopupUpdateAppNative`. It does not block.

This project declares `AppVer=3.8.9` (`omnivoxVer` in `shared/constants.cjs`) and emulates the Android side in `src/omnivox-api/puppet/ovxInjection.js`.
