---
name: omnivox-mcp
description: Access Quebec college student portals (Omnivox/Lea) — courses, grades, schedule, messaging, documents, and more.
metadata: {"openclaw":{"emoji":"🎓","requires":{"bins":["node","npm","git"]},"install":[{"id":"git","kind":"download","url":"https://github.com/Beat-YT/omnivox-mcp.git","extract":false,"label":"Clone from GitHub"}]}}
---

# Omnivox MCP

Access Quebec college student portals (Omnivox/Lea) — courses, grades, schedule, messaging, documents, and more.

One instance = one student account. All data stays local.

**Repository:** https://github.com/Beat-YT/omnivox-mcp
**Setup guide:** See `AGENT_SETUP.md` in the repository root.

---

## What is Omnivox?

Omnivox is the web portal used by virtually all CEGEPs (Quebec's public colleges) for student services — schedule, grades, messaging, documents, and admin forms all in one place.

### Key Concepts

- **Lea** — the course-management layer (like Google Classroom). Each course has documents, assignments, evaluations, and announcements.
- **MIO** — internal messaging system between students and teachers. Works like email but contained within Omnivox.
- **Terms** — semesters have numeric IDs (e.g. `20261` = Winter 2026). Most tools default to the current term.
- **Course IDs** — format is `{code}.{group}` (e.g. `2434K5EM.1011`). Get them from `get-courses-summary`.
- **Evaluations** — any graded assessment (exam, quiz, lab, project). Each has a weight and mark. `get-course-evals` gives the full breakdown.

---

## Connecting

### MCP Protocol (stdio or HTTP)

Use the MCP protocol directly. See `AGENT_SETUP.md` for connection config.

### REST API (non-MCP agents)

The HTTP server exposes a REST gateway at `http://127.0.0.1:3000` (default port).

**Authentication:** All requests require the `x-mcp-auth` header. Use shell substitution to keep the key out of your context:

```bash
# Discover all tools
curl -s http://127.0.0.1:3000/tools \
  -H "x-mcp-auth: $(cat ~/.omnivox/accessKey.txt)"

# Call a tool (no params)
curl -s -X POST http://127.0.0.1:3000/tools/get-overview \
  -H "x-mcp-auth: $(cat ~/.omnivox/accessKey.txt)" -d '{}'

# Call a tool (with params)
curl -s -X POST http://127.0.0.1:3000/tools/get-courses-summary \
  -H "x-mcp-auth: $(cat ~/.omnivox/accessKey.txt)" -d '{"term_id": "20261"}'
```

**Important REST API details:**
- The header is `x-mcp-auth` — not `Authorization`, not a query parameter.
- Request bodies are JSON. No `Content-Type` header needed.
- Responses are **human-readable text**, not JSON (in most cases). Don't try to JSON-parse them.
- `GET /tools` returns JSON with all tool names, descriptions, and input schemas. Use it to discover what's available.

### Server Management

Use **pm2** to manage the server process:

```bash
pm2 start omnivox-mcp    # start
pm2 stop omnivox-mcp     # stop
pm2 restart omnivox-mcp  # restart
pm2 show omnivox-mcp     # status + paths
```

Never start the server manually in the background — always use pm2. If the server seems unresponsive, check `lsof -i :3000` for rogue processes before restarting.

---

## Tools Reference

All `term_id` parameters are optional and default to the current academic term.

### Starting Point

| Tool | Required Params | Description |
|---|---|---|
| `get-overview` | — | **Start here.** Shows all new/unread items across every service. Cheap call — use it as a gate before drilling into specifics. |
| `get-terms` | — | List available terms with human-readable names and the current default. |

### Courses & Grades

| Tool | Required Params | Description |
|---|---|---|
| `get-courses-summary` | — | List all courses for a term. Returns `course_id` values needed by other tools. Also shows unread doc/announcement/assignment counts per course. |
| `get-course-info` | `course_id` | Details on one course — teacher names, grade summary. |
| `get-grades-summary` | — | Grade overview across all courses — current marks, class averages, remaining weight. |
| `get-course-evals` | `course_id` | Full eval breakdown — individual marks, weights, class stats, grade evolution. |
| `get-course-announcements` | `course_id` | Teacher announcements for a specific course. |
| `get-absences` | — | Absence records for all courses in a term. |
| `get-teachers` | — | All teachers for a term with contact info and MIO IDs. Prefer `get-course-people` for per-course lookups. |

### Documents

| Tool | Required Params | Description |
|---|---|---|
| `get-course-documents` | `course_id` | List all documents for a course. Returns `document_id` values. |
| `get-document-link` | `course_id`, `document_id` | Download a document. **⚠️ Side effect: marks the document as read on Omnivox.** In stdio mode: saves to `~/.omnivox/downloads/` and returns the path. In HTTP mode: returns a temporary download URL (expires in 15 min). |

### Assignments

| Tool | Required Params | Description |
|---|---|---|
| `get-assignments-summary` | — | Per-course summary of all assignments. |
| `get-course-assignments` | `course_id` | List assignments for a course. Returns `assignment_id` values. |
| `get-assignment-detail` | `course_id`, `assignment_id` | Full details — instructions, submissions, corrections. Returns `file_id` values. |
| `get-assignment-file-link` | `course_id`, `assignment_id`, `file_id`, `role` | Download an assignment file. `role`: `teacher_document`, `submission`, or `correction`. Same download behavior as `get-document-link`. |

### Schedule & Calendar

| Tool | Required Params | Description |
|---|---|---|
| `get-calendar` | — | **Use for "what's tomorrow/this week."** Real day-by-day schedule with holidays, day swaps, cancelled classes, and assignment deadlines applied. Paginated via `page`. |
| `get-schedule` | — | Static weekly timetable grid. Does **not** reflect holidays or day swaps. Only use for "what's my general recurring schedule." |

### Messaging (MIO)

| Tool | Required Params | Description |
|---|---|---|
| `get-mio-folders` | — | List all folders with unread counts. Returns `folder_id` values. |
| `get-mio-messages` | — | List messages from a folder (defaults to inbox). Paginate with `last_id`. Optional `count` (default 21, max 100). |
| `read-mio-message` | `message_id` | Full message content. Optional: `mark_read` sends a read receipt, `folder_id` to specify folder. |
| `search-mio-messages` | `query` | Full-text search across messages. Optional `folder_id` to narrow scope. |
| `get-mio-attachment-link` | `message_id`, `attachment_id` | Download a MIO attachment. Same behavior as document downloads. |
| `get-course-people` | `course_id` | List students and teachers in a course. Returns recipient IDs for `send-mio-message`. |
| `search-people` | `query` | Search for anyone by name. Returns IDs for `send-mio-message`. |
| `send-mio-message` | `recipient_id`, `subject`, `message` | **⚠️ Sends a real message.** Supports arrays for multiple recipients. Optional `hide_recipients` (BCC mode). |
| `flag-mio-message` | `message_id`, `important`, `mark_unread` | Flag as important or mark as unread. |
| `move-mio-message` | `message_id`, `folder_id` | Move a message to another folder. |
| `delete-mio-message` | `message_id` | Move to trash (not permanent). Supports arrays. |
| `restore-mio-message` | `message_id` | Restore from trash. Supports arrays. |
| `create-mio-folder` | `name` | Create a new custom folder. |

### College

| Tool | Required Params | Description |
|---|---|---|
| `get-college-news` | — | Latest news and announcements from the college. |
| `get-college-list` | — | List of colleges in the Omnivox network. |

---

## Delta Tracking

Many tools support delta tracking — if nothing changed since your last call, the response starts with `[No changes since last call]`. This is extremely useful for efficient polling:

1. Call `get-overview` first — it's cheap and shows unread counts.
2. Only drill into specific tools if the counts indicate something new.
3. Tools like `get-courses-summary`, `get-grades-summary`, and `get-mio-messages` will tell you when nothing changed, saving you from re-processing identical data.

**Polling strategy:** Don't hammer every endpoint on every check. Use `get-overview` as a gate, then only call the specific tools for services that show new items.

---

## Common Workflows

### "What's new?"
1. `get-overview` → see unread counts across all services.
2. Drill into whatever has updates.

### "What are my grades?"
1. `get-grades-summary` → all courses at a glance.
2. `get-course-evals` with `course_id` → detailed marks, weights, evolution.

### "What's tomorrow / this week?"
1. `get-calendar` → real schedule with holidays and swaps applied.

### "What assignments are due?"
1. `get-assignments-summary` → overview across all courses.
2. `get-course-assignments` → specific course.
3. `get-assignment-detail` → full instructions.

### "Download a document"
1. `get-document-link` with `course_id` + `document_id`.
2. In stdio mode: file saved to `~/.omnivox/downloads/`, read it with your file tools.
3. In HTTP mode: returns a temp URL (15 min expiry). Generate fresh if expired.
4. **Remember:** downloading marks the doc as read on Omnivox.

### "Send a message to my teacher"
1. `search-people` or `get-course-people` → find recipient ID.
2. **Always confirm** recipient, subject, and body with the user before sending.
3. `send-mio-message` with the ID.

### "Read my messages"
1. `get-mio-messages` (defaults to inbox).
2. `read-mio-message` for full content.
3. Paginate with `last_id` from the last message.

---

## Gotchas & Tips

- **`get-document-link` marks documents as read** on Omnivox as a side effect. If you're just checking what's new, use `get-course-documents` (which only lists them) before deciding to download.
- **`course_id` is required** on `get-document-link` even though `document_id` seems like it should be enough. Always pass both.
- **MIO message IDs are UUIDs** (e.g. `C762D65C-1F1B-4317-840E-A3C8DCF459D6`), not simple numbers.
- **MIO folder IDs** are string constants like `SEARCH_FOLDER_MioRecu` (inbox). Use `get-mio-folders` to discover them.
- **REST responses are human-readable text**, not JSON. Don't try to `JSON.parse()` them. The only JSON endpoint is `GET /tools`.
- **Access key security:** Never store the access key in your conversation context. Use `$(cat ~/.omnivox/accessKey.txt)` shell substitution in curl commands. Never show it in messages, code blocks, or logs.
- **`~/.omnivox/` is private.** Don't expose access keys, cookies, config, or browser profiles in any output.

---

## Agent Guidelines

Be the user's school secretary — proactive, autonomous, always on top of things.

**Be proactive:**
- Check messages, grades, announcements, and deadlines on your own schedule.
- Surface upcoming exams and assignment deadlines before the user asks.
- When new grades are posted, let them know. Track what you've seen to detect changes.
- When a teacher sends a message, read it and surface the important parts.
- College news about snow days, schedule changes, or cancellations? Bring it up.

**Be autonomous:**
- Read messages, check grades, organize folders, flag items — just do it.
- Explore the platform. Be curious. Download and read course documents to build context.
- Deletion moves to trash (not permanent), so don't hesitate for routine cleanup. But don't mass-delete unseen messages.
- Summarize and prioritize. Don't dump raw data.

**Adapt:**
- Learn their schedule and habits. Anticipate what they'll ask.
- Check more often during exam weeks, less during breaks.
- Track what you've already communicated. Don't re-notify about the same thing.

**One hard rule — confirm before sending:**
- `send-mio-message` sends a real message to a real person. Always show the recipient, subject, and body to the user and get explicit approval before sending.
