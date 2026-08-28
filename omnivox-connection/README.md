# omnivox-connection

Electron app that authenticates with Omnivox and captures the session for the MCP server.

Omnivox's mobile web app expects to run inside a native iOS/Android shell that provides an `OvxNatif` bridge. This app emulates that bridge in Electron so the authentication flow completes normally, then lets you download the resulting session files.

## How it works

1. The app opens a BrowserWindow with a spoofed mobile user-agent (`OVX InfoDevice=... AppVer=... IdAppareil=... Code=...`).
2. A preload script injects `OvxNatif` into the page via `contextBridge`, forwarding all native commands to the main process over IPC.
3. The main process handles the Omnivox native command protocol — static device responses, storage read/write, theme, user-agent updates, etc. Commands that aren't needed are silently acknowledged or ignored.
4. When Omnivox calls `WebUI.SetDefaultPage` (which happens after a successful login), the app navigates to a success page with download buttons for `cookies.json` and `config.json`.

## Prerequisites

- Node.js
- The `shared/` directory at the repo root (provides `constants.cjs` and `nativeCommands.cjs`)

## Usage

```bash
cd omnivox-connection
npm install
npm start
```

A login form is displayed where you enter your Omnivox identifier and date of birth. After authentication, a success page appears with two download buttons. Save both files into the server's data folder — the `data/` folder at the project root, or your `OMNIVOX_DATA_DIR` — so the MCP server can pick them up.

## Output files

Both files are downloaded via save dialogs — nothing is written to disk automatically.

| File | Contents |
|---|---|
| `cookies.json` | Full cookie jar from the Electron session |
| `config.json` | `{ DefaultPage, Code, IdAppareil }` — the entry URL and auth credentials |

The MCP server's Puppeteer instance imports these on first launch to establish its own authenticated session.

## Architecture

```
content/
  index.html      Login form (identifier + date of birth)
  success.html    Post-auth download page for cookies.json and config.json
  styles.css      Shared styling
  ovx.js          Page-level injection: navigator spoofing + callback dispatch
  ComNatifOvx.js  Omnivox's own native bridge JS (reference copy)
  App.js          Omnivox's bundled mobile app JS (reference copy)

index.js          Electron main process — window, IPC handlers, native command emulation
preload.js        Exposes OvxNatif and AuthData bridges, injects ovx.js, forwards callbacks
```

### Native command emulation

The main process handles three categories of Omnivox native commands:

- **Static responses** — commands with fixed return values (device info, biometry, notifications)
- **Null-callback commands** — UI acknowledgments that just fire `callback(null)`
- **Silent commands** — fire-and-forget commands (window management, navigation, display)
- **Custom logic** — `Storage.SetCodeUserAgent`, `Storage.Set/GetInfo`, `Theme.Set/GetTheme`, `WebUI.SetDefaultPage`

These are defined in `shared/nativeCommands.cjs` and shared with the MCP server's own Puppeteer injection.
