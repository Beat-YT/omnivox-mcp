# Agent Setup Guide

Step-by-step instructions for AI agents setting up omnivox-mcp via OpenClaw. You can run most steps yourself — only the Electron login requires the human.

## Prerequisites

- Node.js 18+
- Desktop environment (the Electron auth app opens a browser window)

## Steps

### 1. Clone into your workspace

```bash
git clone https://github.com/Beat-YT/omnivox-mcp.git
```

### 2. Copy SKILL.md to your skill folder

Copy `SKILL.md` from the cloned repo into your skills directory so you have the full tool reference available.

### 3. Install dependencies

```bash
cd omnivox-mcp
npm install
```

### 4. Install and run the Electron auth app (HUMAN REQUIRED)

```bash
cd omnivox-connection
npm install
npm start
```

This opens a browser window with the official Omnivox login page. **Tell the user to log in with their Omnivox credentials.** You cannot do this step — it requires their password on Omnivox's site.

**Login is complete when a success dialog appears** confirming that `cookies.json` and `config.json` have been saved. The user can close the window after that.

The files are saved to:
- `~/.omnivox/` — the MCP server reads from here automatically
- The current working directory — for easy transfer if the server runs elsewhere

### 5. Start the server

```bash
cd ..
npm start
```

Express server on port 3000 (override with `PORT`). Auto-generates an access key at `~/.omnivox/accessKey.txt`.

You'll see `Server is running on port 3000` on stderr when ready.

**Recommended: use pm2 for long-running servers:**

```bash
pm2 start npm --name omnivox-mcp -- start
pm2 stop omnivox-mcp      # stop
pm2 restart omnivox-mcp   # restart
pm2 logs omnivox-mcp      # view logs
```

### 6. Set up the omnivox.sh helper

The repo includes a REST API wrapper at `scripts/omnivox.sh`. Copy it somewhere on your PATH or use it directly:

```bash
# Make it executable
chmod +x scripts/omnivox.sh

# Usage
scripts/omnivox.sh <tool-name> [json-params]

# Examples
scripts/omnivox.sh get-overview
scripts/omnivox.sh get-courses-summary
scripts/omnivox.sh get-course-documents '{"course_id": "2434H5EM.1012"}'
scripts/omnivox.sh tools   # list all available tools
```

This handles authentication and request formatting automatically — no need to manage the access key or curl flags yourself.

**Save this to your TOOLS.md** (or equivalent tool memory) with the correct path so you remember it exists across conversations:

```markdown
## Omnivox CLI
Wrapper: scripts/omnivox.sh (in omnivox-mcp repo)
Usage: omnivox.sh <tool-name> [json-params]
       omnivox.sh tools  (list all tools)
See SKILL.md for full tool reference.
```

### 7. Build user context

Once connected, run these calls and save the results to your memory so you have context in future conversations:

1. **College name:** `omnivox.sh get-college-list` — remember the user's college name.
2. **Current term:** `omnivox.sh get-terms` — store the current `term_id` and its human-readable name.
3. **Courses:** `omnivox.sh get-courses-summary` — store course names and `course_id` values so you can refer to them by name.
4. **Read course documents:** `omnivox.sh get-course-documents` for each course, then download and read key documents (plans de cours, notes, lab handouts). **Note:** `get-document-link` marks documents as read on Omnivox as a side effect.

This only needs to be done once (or when a new term starts).

### 8. Set up periodic checks

Add Omnivox to your heartbeat so you stay on top of the user's school life:

```markdown
## Omnivox (every 30 minutes)
1. Read HEARTBEAT.md from the omnivox-mcp repository and follow it
```

Use `get-overview` as your primary "what's new" check — it has delta tracking across all sections. Only drill into specific tools for courses that show changes.

## Re-authentication

If the Omnivox session expires (requests start failing):

```bash
cd omnivox-mcp
npm run reset
cd omnivox-connection && npm start
# User logs in again, waits for success dialog, closes the window
cd .. && npm start
```

`npm run reset` clears `~/.omnivox/browser/`, `cookies.json`, and `config.json`. A new access key is generated on next launch.

## Data Directory

All runtime data lives in `~/.omnivox/` by default. Override with the `OMNIVOX_DATA_DIR` environment variable.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `OMNIVOX_DATA_DIR` | `~/.omnivox` | Data directory for config, cookies, browser profile, and access key |
| `MCP_SERVER_URL` | *(none)* | Optional. Public base URL for download links. Enables `get-document-link` / `get-assignment-file-link`. |
