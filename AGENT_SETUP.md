# Agent Setup Guide

Step-by-step instructions for AI agents setting up omnivox-mcp. You can run most steps yourself — only the Electron login requires the human.

The server supports two modes:

| Mode | Command | Use case |
|---|---|---|
| **Local (stdio)** | `npm start` | MCP client on the same machine launches the server as a child process. Default. |
| **Public HTTP server** | `npm run start:http` | Remote clients connect over the network. Exposes REST API + MCP-over-HTTP. |

## Prerequisites

- Node.js 18+
- Desktop environment (the Electron auth app opens a browser window)

## Steps

### 1. Clone and install

```bash
git clone https://github.com/Beat-YT/omnivox-mcp.git
cd omnivox-mcp
npm install
```

### 2. Install the Electron auth app

```bash
cd omnivox-connection
npm install
```

### 3. Launch the Electron app (HUMAN REQUIRED)

```bash
npm start
```

This opens a browser window with the official Omnivox login page. **Tell the user to log in with their Omnivox credentials.** You cannot do this step — it requires their password on Omnivox's site.

**Login is complete when a success dialog appears** confirming that `cookies.json` and `config.json` have been saved. The user can close the window after that.

The files are saved to two locations:
- `~/.omnivox/` — for same-machine setups (the MCP server reads from here automatically)
- The current working directory — for cross-machine setups (easy to find and transfer)

If the MCP server runs on a different machine, the user needs to copy `cookies.json` and `config.json` to `~/.omnivox/` on that machine.

### 4. Start the server

```bash
cd ..
```

**Option A — Local stdio mode (default):**

```bash
npm start
```

Communicates over stdin/stdout. All logs go to stderr. An MCP client should launch this as a subprocess — no HTTP server, no access key, no REST API.

You'll see `MCP server running on stdio transport` on stderr when ready.

**Option B — Public HTTP server:**

```bash
npm run start:http
```

Express server on port 3000 (override with `PORT`). Auto-generates an access key at `~/.omnivox/accessKey.txt`. All logs go to stderr.

You'll see `Server is running on port 3000` on stderr when ready.

### 5. Connect

**stdio mode:** Configure the MCP client to launch as a subprocess.

OpenClaw — add to `~/.openclaw/openclaw.json`:

```json
{
  "mcpServers": {
    "omnivox": {
      "command": "npx",
      "args": ["tsx", "src/index"],
      "cwd": "/path/to/omnivox-mcp",
      "status": "active"
    }
  }
}
```

No access key needed.

**HTTP mode (MCP):** MCP endpoint: `http://localhost:3000/mcp?key=ACCESS_KEY`

**HTTP mode (REST API — non-MCP agents):** Discover tools at `GET http://localhost:3000/tools`, call them at `POST http://localhost:3000/tools/{tool-name}`. Requires `x-mcp-auth` header with the access key. See `SKILL.md` for details and examples.

The access key is stored at `~/.omnivox/accessKey.txt`. **Do not show it to the user** — if they need it, tell them to check that file directly.

### 6. Build user context

Once connected, run these calls and save the results to your memory/persistence so you have context in future conversations:

1. **College name:** Call `get-college-list` — remember the user's college name (e.g. "Cegep de l'Outaouais", "Dawson College").
2. **Current term:** Call `get-terms` — store the current `term_id` and its human-readable name.
3. **Courses:** Call `get-courses-summary` — store the user's course names and `course_id` values so you can refer to them by name.

This only needs to be done once (or when a new term starts). Having this context saved means you don't need to look it up every conversation.

### 7. Set up periodic checks

Add Omnivox to your heartbeat so you stay on top of the user's school life. Add this to your `HEARTBEAT.md` (or equivalent periodic task list):

```markdown
## Omnivox (every 30 minutes)
If 30 minutes since last Omnivox check:
1. Read HEARTBEAT.md from the omnivox-mcp repository and follow it
2. Update lastOmnivoxCheck timestamp in memory
```

## Data Directory

All runtime data lives in `~/.omnivox/` by default:

```
~/.omnivox/
├── browser/       — Persistent Chrome profile
├── cookies.json   — Session cookies from the Electron auth app
├── config.json    — Omnivox instance config (URL, device ID, auth code)
└── accessKey.txt  — API access key (HTTP mode only, auto-generated)
```

Override with the `OMNIVOX_DATA_DIR` environment variable (used by Docker and custom deployments).

## Re-authentication

If the Omnivox session expires (requests start failing):

```bash
npm run reset
cd omnivox-connection && npm start
# User logs in again, waits for success dialog, closes the window
cd .. && npm start
```

`npm run reset` clears `~/.omnivox/browser/`, `cookies.json`, and `config.json`. In HTTP mode, a new access key is generated on next launch.

## Docker Setup (Alternative — HTTP mode)

Docker runs the server in HTTP mode for remote access.

### 1. Authenticate first (HUMAN REQUIRED)

The Electron auth app still needs to run on the host machine. Follow steps 1–3 above.

### 2. Build and run

```bash
docker compose up --build
```

The container volume-mounts `~/.omnivox/` from the host.

### 3. Connect

MCP endpoint at `http://localhost:3000/mcp?key=ACCESS_KEY`.

### Re-authentication (Docker)

```bash
docker compose down
npm run reset
cd omnivox-connection && npm start
# User logs in again, closes the window
cd ..
docker compose up --build
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port (HTTP mode only) |
| `OMNIVOX_DATA_DIR` | `~/.omnivox` | Data directory for config, cookies, browser profile, and access key |
| `MCP_SERVER_URL` | *(none)* | Optional. Public base URL for download links (HTTP mode only). Enables `get-document-link` / `get-assignment-file-link`. |
