# Omnivox MCP

Your own personal bridge to Omnivox — the Quebec college student portal — for AI assistants, side projects, and curious tinkerers.

This started life as an [MCP](https://modelcontextprotocol.io/) server and grew into something broader: a self-hosted toolbox that logs into Omnivox once and then lets *anything* talk to it — Claude over MCP, any assistant that can call plain HTTP tools, your own scripts, or you with `curl` at 2am wondering if a grade got posted.

Under the hood it runs a persistent Puppeteer browser logged into your Omnivox session, executing requests through the site's own JavaScript — so challenge-response auth, cookies, and encoding are all handled natively by Omnivox's own code. On top of that browser it offers four things:

- **An MCP server** — 34 tools covering courses, grades (down to individual evaluations), schedule, calendar, MIO messaging, documents, assignments, and college news.
- **A REST tool gateway** — every MCP tool doubled as a plain HTTP endpoint, with a live catalog at `GET /tools` and a full OpenAPI 3.1 spec at `GET /openapi.json`. Virtually any assistant or agent framework that supports JSON-described tools can use it, MCP support or not. It's also just a nice API for your own projects.
- **A raw Omnivox proxy** — `/Mobl/*` passes any request straight through the authenticated session, for endpoints no tool wraps yet.
- **A research effort** — the mobile API this all sits on is undocumented, so we document it ourselves as we reverse-engineer it. The growing field notes live in [`docs/`](docs/README.md).

Everything runs on your machine (or your server, or a container). One instance = one Omnivox account.

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/Beat-YT/omnivox-mcp.git
cd omnivox-mcp
npm install

# 2. Authenticate (first time only)
cd omnivox-connection
npm install && npm start
# Log in through the Electron window, save cookies.json + config.json,
# then place them in the data/ folder at the project root (or your OMNIVOX_DATA_DIR)

# 3. Start the server
cd ..
npm start              # Express server on port 3000
```

The server starts with MCP-over-HTTP at `/mcp?key=...`, the REST tool gateway, and the proxy. An access key is auto-generated at `data/accessKey.txt` — that's your password to the whole thing, treat it accordingly.

*(There's also a stdio mode, `npm run start:stdio`, where an MCP client launches the server as a subprocess — deprecated and not recommended.)*

### Docker

Prefer containers? Authenticate once with the Electron app, then copy the example compose file and set your data folder path:

```bash
cp docker-compose.example.yml docker-compose.yml
# Edit docker-compose.yml — replace /path/to/config/folder with your data folder
docker compose up -d
```

The included [`docker-compose.example.yml`](docker-compose.example.yml) mounts your data folder into the container at `/data/omnivox`, exposes port 3000, sets a session-keeping refresh interval, and wires up a healthcheck. Your customized `docker-compose.yml` is gitignored.

### Re-authentication

If your session expires or you want a different account, reset and log in again:

```bash
npm run reset
cd omnivox-connection && npm start
# Log in, save the two files, place them back in your data folder
cd .. && npm start
```

`npm run reset` clears `browser/`, `cookies.json`, `config.json`, and `accessKey.txt` from the data folder so the server starts fresh.

### Configuration

Set these as environment variables or in a `.env` file at the project root:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `OMNIVOX_DATA_DIR` | `data/` at the project root | Data directory for config, cookies, browser profile, and access key |
| `MCP_SERVER_URL` | *(none)* | Optional. Public base URL that enables download link generation (`get-document-link` / `get-assignment-file-link`). Set to your public domain (e.g. `https://omnivox.example.com`). |
| `BROWSER_SLEEP` | `false` | When `true`, the browser closes after 5 minutes of inactivity and relaunches on the next request. Saves memory at the cost of a cold-start delay. |
| `BROWSER_REFRESH_INTERVAL` | *(disabled)* | Interval in **minutes** between automatic page refreshes to keep the Omnivox session alive. Recommended for long-lived instances (e.g. `10`). Disabled when `BROWSER_SLEEP` is `true`. |

## Using it

### With an MCP assistant

Connect your MCP client to `http://localhost:3000/mcp?key=YOUR_KEY` via Streamable HTTP transport. That's it — the assistant gets all 34 tools and you can ask about grades, schedules, assignments, or messages in natural language. See `AGENT_SETUP.md` for client configs.

### With any other assistant (REST tool gateway)

No MCP? No problem. Every tool is a plain HTTP endpoint, and the catalog is self-documenting two ways: `GET /tools` returns names, descriptions, and JSON Schema inputs, while `GET /openapi.json` serves a full OpenAPI 3.1 spec — import it into anything that speaks OpenAPI (custom GPT actions, Open WebUI, LangChain toolkits, ...). Feed either to your assistant, POST its tool calls through, done.

```bash
# List all available tools (with their input schemas)
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

The tools endpoint accepts JSON bodies regardless of `Content-Type` — no need to set it explicitly.

### Straight to Omnivox (the proxy)

For anything the tools don't cover, `/Mobl/*` forwards requests directly to Omnivox's mobile API through the authenticated browser — any method, any content type, session cookies included:

```bash
curl -X POST http://localhost:3000/Mobl/LeaEtudiant/GetNotesDetailModel \
  -H "x-mcp-auth: YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"AnSession":"20261","noCours":"2434K6EM","noGroupe":"1011"}'
```

Pair it with the endpoint notes in [`docs/`](docs/README.md) and you have the whole mobile API at your fingertips.

### In your own projects

The gateway isn't just for AI — it's a full Omnivox API for anything that speaks HTTP:

- **Grade dashboard** — pull your grades into a web app or spreadsheet
- **Schedule widget** — your timetable on a home screen or desktop widget
- **Assignment tracker** — notifications for new assignments and deadlines
- **Discord/Slack bot** — get pinged when grades or messages land
- **Mobile app** — a custom Omnivox client with just the features you care about
- **Data export** — archive your grades, documents, and messages

Python, JavaScript, Swift, Kotlin, Go — whatever you like. Start from `GET /tools`.

## The research corner

Omnivox's mobile API has no public documentation, so this repo doubles as a field guide. [`docs/`](docs/README.md) collects what we've mapped so far:

- **Per-module endpoint docs** — request bodies and response shapes for every `/Mobl/` controller we've charted, from LÉA grades to MIO messaging.
- **[The service manifest](docs/services.md)** — how `GetOffreService` describes the modules the app is assembled from, what the flags actually mean, and how its change-detection hash is built.
- **Conventions** — the ×100 fixed-point grade encoding, int-sentinel "no value" markers, term ID format, the common response envelope.

Some of it was found by reading the app's bundle, some by probing live endpoints — including a few natively-served endpoints the official app doesn't even use anymore (that's how per-evaluation grades work here without HTML scraping). If you chart new territory, contributions are warmly welcome.

## Documentation

The [Wiki](https://github.com/Beat-YT/omnivox-mcp/wiki) is the operator's manual:

- [Setup](https://github.com/Beat-YT/omnivox-mcp/wiki/Setup) — prerequisites, installation, first login, Docker, VPS deployment, security precautions
- [Connecting Assistants](https://github.com/Beat-YT/omnivox-mcp/wiki/Connecting-Assistants) — MCP client configs, and non-MCP assistants via the tool catalog / OpenAPI spec
- [Troubleshooting](https://github.com/Beat-YT/omnivox-mcp/wiki/Troubleshooting) — common issues and fixes

For the API surface itself, the server is self-documenting: `GET /tools` and `GET /openapi.json` always reflect the running instance, and the Omnivox mobile API notes live in [`docs/`](docs/README.md).

## Security

The short version: this behaves like a browser you left logged in on your own computer — nothing more, nothing less. The longer version, because it matters:

### Your password and 2FA are untouched

- **You log in yourself, on the real login page.** The Electron app opens the official Omnivox login — password, 2-Step Verification, trusted-device prompt and all. This project never asks for, sees, stores, or replays your password or MFA codes.
- **MFA keeps working.** Omnivox's 2-Step Verification is fully compatible: you complete it once during login, and the resulting session (including the trusted-device cookie) is stored exactly as any browser would store it. Nothing here bypasses, weakens, or automates any Omnivox security mechanism — requests run through Omnivox's own JavaScript, so challenge-response auth and session expiry work exactly as Skytech designed them.
- **Keep MFA enabled.** This project works fine with it, and you should absolutely leave it on.

### What's stored, and where

- **Session cookies and browser profile** — the data folder on your disk (`data/` in the project, gitignored), same as a logged-in browser. Nothing is sent anywhere else.
- **Access key** — `data/accessKey.txt`, auto-generated, protects every endpoint the server exposes.
- **No external servers, no telemetry.** Everything runs on your machine or your server; all traffic goes directly between you and Omnivox. The codebase is open — audit it.

### What the access key can do

Treat `accessKey.txt` like your Omnivox password. Anyone holding it gets your full session: reading grades and messages, sending MIO, downloading documents. If it ever leaks:

1. Delete `accessKey.txt` (a new key is generated on restart), and
2. `npm run reset` + re-login if you want to invalidate the session itself.

### Hardening checklist

- **Don't expose the server to the internet unless you actually need to.** Localhost or LAN is the happy default. If you must go public: TLS via a reverse proxy (e.g. Nginx — [sample config](https://github.com/Beat-YT/omnivox-mcp/wiki/Setup#reverse-proxy-with-nginx-recommended)), and consider IP allowlisting.
- **In Docker, bind to loopback** unless you're fronting it with a proxy: `"127.0.0.1:3000:3000"` instead of `"3000:3000"`.
- **Keep the data folder private** — it's gitignored already; add file permissions, and disk encryption if it's a laptop.
- One instance, one account, by design — there is nothing multi-tenant to leak across.
- More in [Security Precautions](https://github.com/Beat-YT/omnivox-mcp/wiki/Setup#security-precautions).

### A note for Skytech

This is a personal-use client for a student's own account — functionally a browser with an API, authenticating through your own login flow, MFA included, one account per instance. It doesn't harvest credentials, doesn't circumvent any protection, and can't see anything the logged-in student can't already see in the portal themselves. If you're from Skytech or a college and have concerns, please [open an issue](https://github.com/Beat-YT/omnivox-mcp/issues) — happy to talk.

## Disclaimer

This project is unofficial and not affiliated with, endorsed by, or associated with Skytech Communications, Omnivox, or any Quebec college. It is provided as-is for personal and educational use only. Use it at your own risk — the authors are not responsible for any consequences resulting from its use, including but not limited to account restrictions, data loss, or violations of your institution's terms of service.

## License

ISC
