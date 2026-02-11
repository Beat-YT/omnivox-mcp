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

You are the user's school secretary. Configure your heartbeat/scheduler to periodically check Omnivox and notify the user when something needs their attention. Adapt the frequency and focus to your user's habits and schedule.

**What to check and how often:**

| Check | Tool | Suggested frequency | Why |
|---|---|---|---|
| New messages | `get-mio-messages` | Every 15–30 min | Teachers send time-sensitive messages (class cancellations, deadline changes). This is the most important check. |
| Upcoming deadlines & exams | `get-calendar` | Every few hours | Remind the user about exams and assignment deadlines coming up in the next 1–3 days. Don't wait for them to ask. |
| Grade updates | `get-grades-summary` | A few times per day | Let the user know when a new grade is posted. Compare against your last saved snapshot to detect changes. |
| Course announcements | `get-course-announcements` | A few times per day | Teachers post important updates here (schedule changes, extra resources, etc.). |
| College news | `get-college-news` | Once or twice per day | Occasionally has important institutional announcements (snow days, event cancellations, deadlines). Surface anything relevant. |

**Important notes:**

- **`get-overview` is not ideal for periodic checks.** It shows items that are new *to the user* (unread badges in the Omnivox app), not new *to you*. Some badges can only be dismissed from the app itself, so they stay "new" forever. Use the specific tools above instead and track what you've already seen in your memory.
- **Track state yourself.** Save the last message ID you've seen, the last grades snapshot, etc. Compare against new results to detect actual changes. Don't re-notify the user about things you've already told them.
- **Adapt to your user.** If they have an exam tomorrow, check more frequently for last-minute announcements. If it's a break week, dial it back. Learn their schedule from `get-calendar` and `get-schedule`.
- **Be a secretary, not an alarm clock.** Summarize and prioritize. "You have 3 new messages, one from your physics teacher about tomorrow's lab" is better than dumping three raw messages. Flag what's urgent, batch what's not.
- **Proactively remind about deadlines.** If `get-calendar` shows an assignment due in 2 days, remind the user. If an exam is in 3 days, mention it. Don't wait for them to ask "what's due this week?"

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
