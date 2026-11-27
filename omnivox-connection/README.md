# omnivox-connection

Electron app that authenticates with Omnivox and captures the session for the MCP server.

Omnivox's mobile web app expects to run inside a native iOS/Android shell that provides an `OvxNatif` bridge. This app emulates that bridge in Electron so the authentication flow completes normally, then lets you save the resulting session file.

## How it works

1. The app picks a random Android tablet from `src/devices.js` and opens a BrowserWindow that presents itself as that device, with the OVX user agent (`OVX InfoDevice=... AppVer=... IdAppareil=... Code=...`).
2. A preload script exposes `OvxNatif` to the page via `contextBridge` and forwards native commands to the main process over IPC.
3. The main process answers the Omnivox native command protocol: static device responses, storage read/write, theme, user-agent updates. Commands it does not know are accepted and ignored.
4. When Omnivox calls `WebUI.SetDefaultPage` (which happens after a successful login), the app navigates to a success page with a download button for `session.json`.

The browser session is kept in memory only. Nothing carries over between launches.

## Prerequisites

- Node.js
- The `shared/` directory at the repo root (provides `staticCommands.json` and `omnivoxApp.json`)

## Usage

```bash
cd omnivox-connection
npm install
npm start
```

A login form is displayed where you enter your Omnivox identifier and date of birth. After authentication, a success page appears with a download button. Save the file into the server's data folder: the `data/` folder at the project root, or your `OMNIVOX_DATA_DIR`.

## Output file

The file is saved through a save dialog. Nothing is written to disk automatically.

| File | Contents |
|---|---|
| `session.json` | `configuration` (`DefaultPage`, `Code`, `IdAppareil`), `device` (the tablet the app presented itself as) and `cookies` (the full cookie jar) |

## Architecture

```
content/
  login.html      Login form (identifier + date of birth)
  login.js        Date field and form submit
  success.html    Post-auth page with the session.json download
  success.js      Download button
  styles.css      Shared styling
  fonts/          Figtree and JetBrains Mono, with their licenses
  ComNatifOvx.js  Omnivox's own native bridge JS (reference copy)
  App.js          Omnivox's bundled mobile app JS (reference copy)

src/
  app.js          Electron main process: window, request filter, wiring
  bridge.js       Native command emulation, the app side of OvxNatif
  appSession.js   Device, configuration and cookies of the session, saved as session.json
  devices.js      Android tablets the app can present itself as
  preload.js      Exposes OvxNatif and AuthData to the pages
```

### Native command emulation

`Bridge.executeCommand` answers a command by what it returns: nothing sends no callback, `null` fires the callback without data, anything else is the callback data.

- **Static responses**: fixed answers listed in `shared/staticCommands.json` (device stats, biometry, notifications). A `null` entry is a plain acknowledgment.
- **Custom logic**: `Application.GetDeviceInfo`, `Storage.SetCodeUserAgent`, `Storage.Set/GetInfo`, `Theme.Set/GetTheme`, `WebUI.SetDefaultPage`, `WebUI.ResetSession`, `Display.ViewLogin`
- **Everything else**: fire and forget, accepted without a callback
