# Omnivox MCP

An [MCP](https://modelcontextprotocol.io/) server that exposes Quebec college student portals (Omnivox/Lea) through MCP tools and a REST tool gateway.

It runs a persistent Puppeteer browser logged into Omnivox, executing requests through the site's own JavaScript — so challenge-response auth, cookies, and encoding are all handled natively.

## Features

- **30 MCP tools** — courses, grades, schedule, calendar, messaging (MIO), documents, assignments, college news
- **Two transport modes** — stdio (default, for MCP clients) or HTTP (Express server with MCP-over-HTTP + REST tool gateway)
- **REST tool gateway** — all MCP tools exposed as plain HTTP endpoints for non-MCP agents
- **File downloads** — direct binary or temporary browser-friendly links (15 min TTL)
- **Internal messaging** — read, search, send, flag, move, and delete MIO messages
- **Persistent session** — Chrome profile survives restarts, no repeated logins

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/Beat-YT/omnivox-mcp.git
cd omnivox-mcp
npm install

# 2. Authenticate (first time only)
cd omnivox-connection
npm install && npm start
# Log in through the Electron window, then close it

# 3. Start the server
cd ..
npm start          # stdio mode (default) — for MCP clients
npm run start:http # HTTP mode — Express server on port 3000
```

**stdio mode** (default): The MCP client launches the server as a subprocess and communicates over stdin/stdout. No Express server, no access key needed.

**HTTP mode**: Starts an Express server with MCP-over-HTTP at `/mcp?key=...` and a REST tool gateway. Access key is auto-generated at `~/.omnivox/accessKey.txt`.

Each instance serves **one Omnivox account**. The server maintains a single browser session tied to the account you logged in with.

### Re-authentication

If your session expires or you need to log into a different account, reset the session data and re-run the Electron app:

```bash
npm run reset
cd omnivox-connection && npm start
# Log in, wait for the success dialog, then close the window
cd .. && npm start
```

`npm run reset` deletes `~/.omnivox/browser/`, `cookies.json`, and `config.json` so the server starts fresh on next launch.

### Configuration

Set these as environment variables or in a `.env` file at the project root:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `OMNIVOX_DATA_DIR` | `~/.omnivox` | Data directory for config, cookies, browser profile, and access key |
| `MCP_SERVER_URL` | *(none)* | Optional. Public base URL that enables download link generation (`get-document-link` / `get-assignment-file-link`). Set to your public domain (e.g. `https://omnivox.example.com`). |

## Usage

### MCP (for AI assistants)

**stdio mode** (recommended): Add the server to your MCP client config — it launches the server as a subprocess. See `AGENT_SETUP.md` for connection config.

**HTTP mode**: Connect your MCP client to `http://localhost:3000/mcp?key=YOUR_KEY` via Streamable HTTP transport.

Either way, the AI gets access to all 30 tools — ask it about your grades, schedule, assignments, or messages in natural language.

### REST Tool Gateway (HTTP mode)

For agents or apps that don't support MCP, all tools are exposed as plain HTTP endpoints:

```bash
# List all available tools
curl http://localhost:3000/tools -H "x-mcp-auth: YOUR_KEY"

# Get your courses
curl -X POST http://localhost:3000/tools/get-courses-summary \
  -H "x-mcp-auth: YOUR_KEY" -d '{}'

# Check your grades
curl -X POST http://localhost:3000/tools/get-grades-summary \
  -H "x-mcp-auth: YOUR_KEY" -d '{}'

# Read your inbox
curl -X POST http://localhost:3000/tools/get-mio-messages \
  -H "x-mcp-auth: YOUR_KEY" -d '{}'
```

The tools endpoint accepts JSON bodies regardless of `Content-Type` header — no need to set it explicitly.

### Build your own projects

The REST tool gateway isn't just for AI — it's a full Omnivox API you can use in any project:

- **Grade dashboard** — pull your grades into a custom web app or spreadsheet
- **Schedule widget** — display your weekly timetable on a home screen or desktop widget
- **Assignment tracker** — build notifications for new assignments or upcoming deadlines
- **Discord/Slack bot** — get pinged when new grades or messages come in
- **Mobile app** — build a custom Omnivox client with just the features you care about
- **Data export** — archive your grades, documents, and messages for your own records

Any language that can make HTTP requests works — Python, JavaScript, Swift, Kotlin, Go, whatever you prefer. Use `GET /tools` to discover all available tools and their input schemas.

## Documentation

See the [Wiki](https://github.com/Beat-YT/omnivox-mcp/wiki) for full documentation:

- [Setup](https://github.com/Beat-YT/omnivox-mcp/wiki/Setup) — prerequisites, installation, environment variables
- [Architecture](https://github.com/Beat-YT/omnivox-mcp/wiki/Architecture) — how the system is structured
- [MCP Tools](https://github.com/Beat-YT/omnivox-mcp/wiki/MCP-Tools) — all 30 tools with parameters
- [REST Tool Gateway](https://github.com/Beat-YT/omnivox-mcp/wiki/REST-API) — using the tool gateway for non-MCP agents
- [Authentication](https://github.com/Beat-YT/omnivox-mcp/wiki/Authentication) — access keys, web tokens, session management

## Is this safe?

**We never see your password or data.** Everything runs locally on your machine (or your own server):

- **You log in yourself** through the Electron app — your Omnivox password is entered directly on the official Omnivox login page. This project never asks for, stores, or transmits your password.
- **No external servers.** The MCP server runs entirely on your machine. Your data never passes through any third-party service — all requests go directly between your server and Omnivox.
- **Session stays local.** The browser session and cookies are stored in `~/.omnivox/` on your disk. Only you have access to them.
- **Open source.** The entire codebase is here for you to inspect. There are no hidden network calls, analytics, or telemetry.

### Security best practices

- **Never expose the server without HTTPS.** Use a reverse proxy (e.g. Nginx) with TLS. See the [Setup wiki](https://github.com/Beat-YT/omnivox-mcp/wiki/Setup#4-reverse-proxy-with-nginx-recommended) for a sample config.
- **Keep `~/.omnivox/` private.** It contains your Omnivox session and access key. Treat `accessKey.txt` like a password — do not share it with anyone.
- See [Security Precautions](https://github.com/Beat-YT/omnivox-mcp/wiki/Setup#security-precautions) for more details.

## Disclaimer

This project is unofficial and not affiliated with, endorsed by, or associated with Skytech Communications, Omnivox, or any Quebec college. It is provided as-is for personal and educational use only. Use it at your own risk — the authors are not responsible for any consequences resulting from its use, including but not limited to account restrictions, data loss, or violations of your institution's terms of service.

## License

ISC
