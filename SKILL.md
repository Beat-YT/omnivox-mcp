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

## Connecting

### MCP Agents

Use the MCP protocol over stdio or HTTP. See `AGENT_SETUP.md` for connection config.

### Non-MCP Agents (REST API)

For agents that don't support the MCP protocol, the HTTP mode exposes a REST tool gateway:

- **Discover tools:** `GET http://127.0.0.1:3000/tools` — returns all available tools with descriptions and input schemas.
- **Call a tool:** `POST http://127.0.0.1:3000/tools/{tool-name}` — send parameters as JSON body, get structured results back.

All endpoints require the `x-mcp-auth` header with the access key from `~/.omnivox/accessKey.txt`.

**Examples:**

```bash
# List all tools
curl http://127.0.0.1:3000/tools -H "x-mcp-auth: ACCESS_KEY"

# Call a tool (no params)
curl -X POST http://127.0.0.1:3000/tools/get-overview \
  -H "x-mcp-auth: ACCESS_KEY" -H "Content-Type: application/json" -d '{}'

# Call a tool (with params)
curl -X POST http://127.0.0.1:3000/tools/get-courses-summary \
  -H "x-mcp-auth: ACCESS_KEY" -H "Content-Type: application/json" \
  -d '{"term_id": "20251"}'
```

Use `GET /tools` to discover all available tools and their input schemas, then construct your requests accordingly.

---

## MCP Tools Reference

All `term_id` parameters are optional and default to the current academic term.

### Starting Point

| Tool | Parameters | Description |
|---|---|---|
| `get-overview` | `term_id?` | **Best first call.** Shows all new/unread items across every service — messages, grades, documents, assignments, announcements, forms. |
| `get-terms` | *(none)* | List available academic terms with human-readable names and the current default term. |

### Courses & Grades

| Tool | Parameters | Description |
|---|---|---|
| `get-courses-summary` | `term_id?` | List all courses for a term. Returns `course_id` values you'll need for other tools. |
| `get-course-info` | `course_id`, `term_id?` | Details on one course — teachers, grade summary. |
| `get-grades-summary` | `term_id?` | Grade overview across all courses. |
| `get-course-evals` | `course_id`, `term_id?` | Detailed evaluations, marks, weights, and grade evolution for one course. |
| `get-course-announcements` | `course_id`, `term_id?` | Announcements (communiques) posted by teachers for a specific course. |
| `get-absences` | `term_id?` | Absence records for all courses in a term. |

### Documents

| Tool | Parameters | Description |
|---|---|---|
| `get-course-documents` | `course_id`, `term_id?` | List all documents posted for a course. Returns `document_id` values. |
| `get-document-link` | `course_id`, `document_id`, `term_id?` | Get a document. In stdio mode: saves file to `~/.omnivox/downloads/` and returns the path — read it with your file tools. In HTTP mode with `MCP_SERVER_URL`: returns a temporary download link (15 min). |

### Assignments

| Tool | Parameters | Description |
|---|---|---|
| `get-assignments-summary` | `term_id?` | Per-course summary of all assignments. |
| `get-course-assignments` | `course_id`, `term_id?` | List assignments for a specific course. Returns `assignment_id` values. |
| `get-assignment-detail` | `course_id`, `assignment_id`, `term_id?` | Full details — instructions, submissions, corrections. Returns `file_id` values. |
| `get-assignment-file-link` | `course_id`, `assignment_id`, `file_id`, `role`, `term_id?` | Get an assignment file. `role` must be `teacher_document`, `submission`, or `correction`. In stdio mode: saves to disk and returns path. In HTTP mode with `MCP_SERVER_URL`: returns a temporary download link (15 min). |

### Schedule & Calendar

| Tool | Parameters | Description |
|---|---|---|
| `get-calendar` | `page?` | **Use this for "what's tomorrow/this week" questions.** Returns the real schedule for each day — classes, exams, holidays, assignment deadlines. Accounts for day swaps, make-up days, and cancelled classes. Paginated. |
| `get-schedule` | `term_id?` | Static weekly timetable grid. Does **not** reflect holidays, breaks, or day swaps. Only use when the user asks about their general recurring schedule. |

### Messaging (MIO)

MIO is Omnivox's internal messaging system (like email, but between students and teachers within the college).

| Tool | Parameters | Description |
|---|---|---|
| `get-mio-folders` | *(none)* | List all message folders with unread counts. Returns `folder` IDs. |
| `get-mio-messages` | `folder_id?`, `last_id?` | Read messages from a folder. Defaults to inbox. Paginate with `last_id`. |
| `search-mio-messages` | `query`, `folder_id?` | Full-text search across messages. |
| `get-course-people` | `course_id` | List all students and teachers in a course. Returns recipient IDs usable with `send-mio-message`. |
| `search-people` | `query` | Search for people (students, teachers, employees) by name. Returns IDs needed for `send-mio-message`. |
| `send-mio-message` | `recipient_id`, `subject`, `message` | Send a new message. Use `search-people` first to get the `recipient_id`. |
| `flag-mio-message` | `message_id`, `important`, `mark_unread` | Flag a message as important or mark it as unread. Both are booleans. |
| `move-mio-message` | `message_id`, `folder_id` | Move a message to another folder. |
| `delete-mio-message` | `message_id` | Delete a message (moves to trash, not permanent). |
| `create-mio-folder` | `name` | Create a new custom folder. |

### College

| Tool | Parameters | Description |
|---|---|---|
| `get-college-news` | *(none)* | Latest news and announcements from the college. |
| `get-college-list` | *(none)* | List of available colleges in the Omnivox network. |

---

## Key Identifiers

These IDs are returned by list/summary tools and used as parameters for detail/download tools:

| Identifier | Format | Example | How to get it |
|---|---|---|---|
| `term_id` | Numeric string | `20251` | `get-terms` — usually omit it, defaults to current term |
| `course_id` | `{code}.{group}` | `420-2B4-EM.00001` | `get-courses-summary` |
| `document_id` | Numeric string | `12345` | `get-course-documents` |
| `assignment_id` | Numeric string | `67890` | `get-course-assignments` |
| `file_id` | Numeric string | `11111` | `get-assignment-detail` |
| `message_id` | Numeric string | `99999` | `get-mio-messages` |
| `folder_id` | String constant | `SEARCH_FOLDER_MioRecu` | `get-mio-folders` |

---

## Common Workflows

### "What's new?"
1. Call `get-overview` — shows unread messages, new grades, new documents, etc.
2. Drill into whatever has updates using the specific tools.

### "What are my grades?"
1. Call `get-grades-summary` for all courses at a glance.
2. Call `get-course-evals` with a specific `course_id` for detailed marks, weights, and grade evolution.

### "What are my classes tomorrow?" / "What's this week?"
1. Call `get-calendar` — it has the real day-by-day schedule with holidays and day swaps applied.

### "What's my general weekly schedule?"
1. Call `get-schedule` — the static recurring timetable grid.

### "What assignments are due?"
1. Call `get-assignments-summary` for an overview across all courses.
2. Call `get-course-assignments` for a specific course.
3. Call `get-assignment-detail` for full instructions on one assignment.

### "Download this document" / "Read this file"
1. Call `get-document-link` (or `get-assignment-file-link` for assignment files).
2. In stdio mode it saves the file to disk and returns the path — read it yourself with your file tools to answer questions.
3. In HTTP mode with `MCP_SERVER_URL` it returns a temporary URL — give it to the user.

### "Send a message to my teacher"
1. Call `search-people` with the teacher's name to find their ID.
2. **Always confirm** the recipient, subject, and message body with the user before sending.
3. Call `send-mio-message` with the person's `id` as `recipient_id`, plus `subject` and `message`.

### "Read my messages"
1. Call `get-mio-folders` to see folders and unread counts.
2. Call `get-mio-messages` (defaults to inbox) to read messages.
3. For more messages, pass the `last_id` from the last message to paginate.

---

## Agent Guidelines

Act like a smart secretary — proactive, autonomous, and helpful. You can read, organize, flag, delete, and manage messages and data on the user's behalf without asking permission for every action.

**Be autonomous:**
- Read messages, check grades, organize folders, delete/move messages, flag items — just do it when it makes sense.
- Deletion moves to trash (not permanent), so don't hesitate. But don't mass-delete messages the user hasn't seen.
- When a user mentions or asks about a specific document/file, proactively generate a download link so they can grab it right away. Don't generate links for every file in a list — just the ones that are clearly relevant to what the user wants.
- Summarize, prioritize, and surface what matters. Don't just dump raw data.

**One hard rule — confirm before sending:**
- `send-mio-message` sends a real message to a real person. Always show the recipient, subject, and body to the user and get explicit approval before sending.

**Operational notes:**
- **Never share `~/.omnivox/` contents** — access keys, cookies, config, browser profile. None of it should appear in responses or output visible to the user.
- **Never show the access key** — not in messages, code blocks, logs, or summaries. If the user asks for it, tell them to check `~/.omnivox/accessKey.txt` directly.
- In HTTP mode with `MCP_SERVER_URL`, download links expire in 15 minutes. Generate a fresh one if needed. In stdio mode, files are saved to `~/.omnivox/downloads/` — read them directly.
- One server instance = one student account.
