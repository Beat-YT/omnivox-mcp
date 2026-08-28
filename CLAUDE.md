# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Omnivox-MCP is an MCP (Model Context Protocol) server that exposes a Quebec college student portal (Omnivox/Lea) through both MCP tools and REST API endpoints. It scrapes and transforms data from Omnivox's mobile API into structured, validated responses. See `SKILL.md` for tool descriptions and usage documentation.

## Commands

- **Start server (HTTP):** `npm start` — default mode, Express server on port 3000 (or `PORT` env var) with REST API and MCP-over-HTTP
- **Start server (stdio):** `npm run start:stdio` — communicates over stdin/stdout for MCP clients like Claude Desktop *(deprecated, not recommended)*
- **No test suite or build step configured.** The project runs TypeScript directly via `tsx`.

## Transport Modes

The server supports two transport modes, selected at startup:

- **HTTP (default):** `npm start` — starts an Express server with the Streamable HTTP MCP transport at `/mcp?key=...`, REST tool gateway, and access key authentication.
- **stdio (deprecated, not recommended):** `npm run start:stdio` — the MCP client launches the server as a subprocess and communicates over stdin/stdout. No Express server, no access key, no REST API. All logs go to stderr to keep stdout clean for the MCP protocol.

## Architecture

### Startup Flow (`src/index.js`)

Both modes share the same entry point. The `--http` flag selects the transport:

**Always runs:**
1. MCP tools (auto-discovered from `src/mcp/tools/`)
2. Puppeteer browser instance

**stdio mode (default — no `--http` flag) (deprecated, not recommended):**
3. Connects `mcpServer` to a `StdioServerTransport`

**HTTP mode (`--http` flag):**
3. Calls `StartExpressServer()` from `src/express/server.ts`, which:
   - Initializes the access key (generates/loads API auth key)
   - Sets up Express app with MCP-over-HTTP router at `/mcp`
   - Applies access key validation middleware
   - Auto-discovers route files from `src/express/routes/`
   - Listens on `PORT` (default 3000)

### Layer Architecture

```
MCP Tools (src/mcp/tools/)     Express Routes (src/express/routes/) [HTTP mode only]
        \                              /
         \                            /
    Transformers (src/mcp/transformers/) + Schemas (src/mcp/schemas/)
                    |
          API Requests (src/omnivox-api/requests/)
                    |
              Puppeteer Browser
          (src/omnivox-api/puppet/)
```

- **API Requests** (`src/omnivox-api/requests/`): Raw calls to Omnivox mobile API endpoints. POST/JSON requests use `makeSkytechRequest()` which runs `Skytech.Commun.Utils.HttpRequestWorker.PostJSON` inside `page.evaluate()`. Download requests use `makePuppeteerDownload()` which opens a new browser page and runs `fetch()` with a custom `X-Ovx-Download` header — the request interceptor strips this header and overrides with navigation headers so Omnivox sees a real browser navigation.
- **Transformers** (`src/mcp/transformers/`): Convert raw API responses into validated Zod schemas. Each transformer maps to a specific schema.
- **Schemas** (`src/mcp/schemas/`): Zod schemas defining the structured output shapes.
- **MCP Server** (`src/mcp/server.ts`): Creates and exports the `mcpServer` instance.
- **MCP Tools** (`src/mcp/tools/`): Register tools on the `mcpServer` instance (imported from `src/mcp/server.ts`). Auto-discovered at startup by scanning the directory.
- **Express Server** (`src/express/server.ts`): Creates the Express app, MCP-over-HTTP transport, access key middleware, and route auto-discovery. Exports `StartExpressServer()`. Only used in HTTP mode.
- **Routes** (`src/express/routes/`): Express routers auto-discovered at startup. Only used in HTTP mode.

### Omnivox Proxy (HTTP mode only)

The `/Mobl/*` route (`src/express/routes/proxy.ts`) is a pass-through proxy to Omnivox's mobile API. Any HTTP method and content type is accepted. It uses `makeProxyFetch()` from the Puppeteer module to execute a `fetch()` inside the logged-in browser page, forwarding the request with Omnivox's session cookies and returning the raw response (status, content type, body). This lets external clients hit Omnivox endpoints directly through the server's authenticated session without going through an MCP tool.

### REST Tool Gateway (HTTP mode only)

For agents that don't support the MCP protocol, the Express server exposes all MCP tools over plain HTTP:

- **`GET /tools`** — returns all registered tools with descriptions and JSON Schema input definitions.
- **`POST /tools/{tool-name}`** — calls a tool by name. Send parameters as JSON body, get structured results back.

All endpoints require the `x-mcp-auth` header. This is implemented in `src/express/routes/tools.ts`, which reads from the `mcpServer` instance's internal tool registry and calls tool handlers directly — bypassing the MCP protocol entirely.

### Path Aliases (tsconfig.json)

- `@api/*` → `src/omnivox-api/requests/*`
- `@schemas/*` → `src/mcp/schemas/*`
- `@transformers/*` → `src/mcp/transformers/*`
- `@typings/*` → `src/omnivox-api/typings/*`
- `@common/*` → `src/common/*`

### Authentication

- **Access Key** (HTTP mode only): All REST routes (except token-validated download routes) require `x-mcp-auth` header. MCP endpoint requires `key` query parameter. Auto-generated 32-byte hex key stored in `<data dir>/accessKey.txt`. Not used in stdio mode — the MCP client manages access.
- **Challenge-Response**: Handled automatically by Puppeteer — Omnivox's own JS (`Skytech.Commun.Utils.HttpRequestWorker.PostJSON`) manages the `x-ke` challenge internally.
- **Web Tokens** (HTTP mode only): Time-limited tokens (15 min) for document/assignment file downloads without requiring the access key. Used by `get-document-link` and `get-assignment-file-link` tools.
- **Persistent Browser Profile**: Chrome profile at `<data dir>/browser/` persists across restarts. Cookies are imported from the Electron auth app's exported files on first launch.

### Puppeteer Module (`src/omnivox-api/puppet/`)

Runs a Puppeteer browser logged into Omnivox. All requests go through this browser — there is no separate HTTP client.

- **`index.ts`**: Exports `InitializePuppet()`, `waitForReady()`, `makeSkytechRequest<T>(url, data)`, `makePuppeteerDownload(url)`, and `loadPageInFrame(url)`. The browser instance is stored at module scope.
- **`interceptors.ts`**: Blocks noisy requests (SaveLogJS, Omnigarder) and handles download request header overrides (strips `X-Ovx-Download`, injects navigation headers).
- **`ovxInjection.js`**: Injects `OvxNatif` bridge so Omnivox's JS thinks it's running inside the native iOS app.
- **`userAgent.js`**: Builds the OVX user-agent string with device ID and auth code.

### Electron Auth App (`omnivox-connection/`)

Separate Electron app that authenticates with Omnivox, captures session cookies, and offers `cookies.json` + `config.json` for download via save dialogs — nothing is written to the data folder automatically; the user places the files there. Not part of the main server runtime.

### Runtime Data (`data/` at the project root — override with `OMNIVOX_DATA_DIR` env var)

- `browser/` - Persistent Chrome profile (session cookies live here after first import)
- `cookies.json` - Session cookies exported by the Electron auth app
- `config.json` - Omnivox config (DefaultPage URL, auth Code, device ID)
- `accessKey.txt` - API access key (HTTP mode only)
- `deltaSnapshots.json` - Persisted delta tracker snapshots for "what changed since last call"

### Delta Tracker (`src/common/deltaTracker.ts`)

In-memory + persisted snapshot store that lets tools show what changed between calls. On subsequent calls, each item in the response gets an inline delta annotation like `[+3 total documents, +1 unread]`. First call has no delta. No changes shows `[No changes since last call]` in the header. Snapshots persist to `deltaSnapshots.json` across restarts.

Tools with delta tracking:
- `get-courses-summary` — 8 metrics per course (total/unread documents, announcements, assignments, evals/grades)
- `get-grades-summary` — `new_evaluations_count`, `accumulated_weight` per course
- `get-assignments-summary` — `total_assignments`, `new_assignments_count`, `new_correction_count` per course
- `get-absences` — `total_hours_absent` per course
- `get-mio-folders` — `unread_msg_count`, `total_msg_count` per folder
- `get-overview` — `count` per service

### Logging

- **HTTP request logs**: Always on in HTTP mode (console + `server.log` file). Gated by `isHttpMode()`.
- **OVX command logs** (`[OVX COMMAND]` in `ovxInjection.js`): Only logged when `--log` flag is passed.
- All other server logs use `console.warn` (stderr), not `console.log` (stdout). This keeps stdout clean for the MCP stdio protocol.

### Key Patterns

- **ES Modules**: Project uses `"type": "module"` - all imports use ESM syntax.
- **Mixed JS/TS**: Entry point (`index.js`) and security files are JavaScript; MCP layer (tools, schemas, transformers), Express layer (server, routes), and API requests are TypeScript.
- **All requests via Puppeteer**: POST/JSON uses `makeSkytechRequest()`, downloads use `makePuppeteerDownload()`, page rendering uses `loadPageInFrame()`. No axios or separate HTTP client.
- **Plugin Discovery**: Both MCP tools and routes are auto-loaded by scanning their directories - no manual registration needed.
- **Term ID Caching**: `src/common/omnivoxHelper.ts` caches the current term ID for 5 days to avoid redundant API calls. Most tools accept an optional `term_id` parameter, falling back to cached current term.
- **No named functions in `page.evaluate()`**: tsx/esbuild injects `__name()` wrappers on `function` declarations. Always use arrow functions inside `evaluate()`.
- **Logs on stderr**: All Node.js `console.log` calls have been replaced with `console.warn` so stdout is reserved for MCP protocol messages.
