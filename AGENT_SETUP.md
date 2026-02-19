# Agent Setup Guide

Step-by-step instructions for AI agents setting up omnivox-mcp. You can run most steps yourself — only the Electron login requires the human.

The server supports two modes:

| Mode | Command | Use case |
|---|---|---|
| **HTTP server** | `npm start` | Express server with REST API + MCP-over-HTTP. Default. |
| **Local (stdio)** | `npm run start:stdio` | MCP client on the same machine launches the server as a child process. |

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

**Option A — HTTP server (default):**

```bash
npm start
```

Express server on port 3000 (override with `PORT`). Auto-generates an access key at `~/.omnivox/accessKey.txt`. All logs go to stderr.

You'll see `Server is running on port 3000` on stderr when ready.

**Recommended: use pm2 for long-running servers:**

```bash
pm2 start npm --name omnivox-mcp -- start
```

**Option B — Local stdio mode:**

```bash
npm run start:stdio
```

Communicates over stdin/stdout. All logs go to stderr. An MCP client should launch this as a subprocess — no HTTP server, no access key, no REST API.

You'll see `MCP server running on stdio transport` on stderr when ready.

This keeps the server running across restarts and gives you easy management:

```bash
pm2 stop omnivox-mcp      # stop
pm2 restart omnivox-mcp   # restart
pm2 logs omnivox-mcp      # view logs
pm2 show omnivox-mcp      # status + paths
```

Never start the server manually in the background — always use pm2. If the server seems unresponsive, check `lsof -i :3000` for rogue processes before restarting.

### 5. Connect

**HTTP mode (MCP):** MCP endpoint: `http://localhost:3000/mcp?key=ACCESS_KEY`

**stdio mode:** Configure your MCP client to launch the server with `npm run start:stdio` as a subprocess. Refer to your client's documentation for config format. No access key needed.

**HTTP mode (REST API — non-MCP agents):** Discover tools at `GET http://localhost:3000/tools`, call them at `POST http://localhost:3000/tools/{tool-name}`. All requests require the `x-mcp-auth` header (not `Authorization`, not a query param) with the access key.

```bash
# Example — use shell substitution to keep the key out of your context
curl -s -X POST http://localhost:3000/tools/get-courses-summary \
  -H "x-mcp-auth: $(cat ~/.omnivox/accessKey.txt)" -d '{}'
```

**Important:** REST responses are human-readable text, not JSON. The only JSON endpoint is `GET /tools`. See `SKILL.md` for the full tool reference and gotchas.

The access key is stored at `~/.omnivox/accessKey.txt`. **Do not store it in your conversation context** — always use `$(cat ~/.omnivox/accessKey.txt)` shell substitution. If the user needs the key, tell them to check that file directly.

### 6. Build user context

Once connected, run these calls and save the results to your memory/persistence so you have context in future conversations:

1. **College name:** Call `get-college-list` — remember the user's college name (e.g. "Cegep de l'Outaouais", "Dawson College").
2. **Current term:** Call `get-terms` — store the current `term_id` and its human-readable name.
3. **Courses:** Call `get-courses-summary` — store the user's course names and `course_id` values so you can refer to them by name.
4. **Read course documents:** Call `get-course-documents` for each course, then download and read key documents (plans de cours, notes, lab handouts). Don't just count them — understand what the user is learning so you can actually help. **Note:** `get-document-link` marks documents as read on Omnivox as a side effect. Track what you've read in your memory.

This only needs to be done once (or when a new term starts). Having this context saved means you don't need to look it up every conversation.

### 7. Set up periodic checks

Add Omnivox to your heartbeat so you stay on top of the user's school life. Add this to your `HEARTBEAT.md` (or equivalent periodic task list):

```markdown
## Omnivox (every 30 minutes)
If 30 minutes since last Omnivox check:
1. Read HEARTBEAT.md from the omnivox-mcp repository and follow it
2. Update lastOmnivoxCheck timestamp in memory
```

**Polling tip:** Use `get-overview` as your primary "what's new" check — it has delta tracking for per-course unread counts and new MIO messages, plus upcoming evals and featured news. See the "Delta Tracking" section in `SKILL.md` for the full strategy.

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
