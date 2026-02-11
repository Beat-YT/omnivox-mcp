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

Omnivox is the web portal used by virtually all CEGEPs (Quebec's public colleges) for student services. Think of it as the college's all-in-one platform — schedule, grades, messaging, documents, and administrative forms all live here.

### Lea

Lea is the course-management service inside Omnivox (similar to Google Classroom or Moodle). Each course on Lea has:

- **Documents** — files posted by teachers (slides, notes, readings, lab handouts).
- **Assignments** — homework, labs, and projects to submit. Each assignment has instructions, submission slots, and sometimes corrected copies with feedback.
- **Evaluations (evals)** — graded assessments. An eval can be an exam, a quiz, a project, a lab, or any piece of work that counts toward the final grade. Each eval has a weight (percentage of the final grade) and a mark. The `get-course-evals` tool returns the full breakdown: individual eval marks, class averages, weights, and the cumulative grade so far.
- **Announcements** — course-specific messages from the teacher to the whole class.

### MIO (Messagerie Interne Omnivox)

MIO is Omnivox's internal email system. Students and teachers use it to communicate within the college — it works like email but is contained within the Omnivox platform. Messages can be organized into folders, flagged as important, and searched.

### Terms and Course IDs

Quebec CEGEPs run on a semester system (Fall and Winter, with an optional Summer session). Each semester is called a **term** and has a numeric ID (e.g., `20251` for Winter 2025). Courses have IDs like `4202B4EM.00001` where the prefix is the course code and the suffix is the group number.

---

## Connecting

### MCP Agents

Use the MCP protocol over stdio or HTTP. See `AGENT_SETUP.md` for connection config.

### Non-MCP Agents (REST API)

For agents that don't support the MCP protocol, the HTTP mode exposes a REST tool gateway:

- **Discover tools:** `GET http://127.0.0.1:3000/tools` — returns all available tools with descriptions and input schemas.
- **Call a tool:** `POST http://127.0.0.1:3000/tools/{tool-name}` — send parameters as JSON body, get structured results back. The tools endpoint automatically assumes json for all requests, no need for `Content-Type` header.

All endpoints require the `x-mcp-auth` header with the access key from `~/.omnivox/accessKey.txt`.

**Examples:**

```bash
# List all tools
curl http://127.0.0.1:3000/tools -H "x-mcp-auth: ACCESS_KEY"

# Call a tool (no params)
curl -X POST http://127.0.0.1:3000/tools/get-overview \
  -H "x-mcp-auth: ACCESS_KEY" -d '{}'

# Call a tool (with params)
curl -X POST http://127.0.0.1:3000/tools/get-courses-summary \
  -H "x-mcp-auth: ACCESS_KEY" -d '{"term_id": "20251"}'
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
| `get-mio-messages` | `folder_id?`, `last_id?` | List messages from a folder. Defaults to inbox. Paginate with `last_id`. |
| `read-mio-message` | `message_id`, `folder_id?`, `mark_read?` | Read the full content of a single message. Set `mark_read` to send a read receipt. |
| `search-mio-messages` | `query`, `folder_id?` | Full-text search across messages. |
| `get-mio-attachment-link` | `message_id`, `attachment_id` | Get a MIO attachment. In stdio mode: saves to disk and returns path. In HTTP mode with `MCP_SERVER_URL`: returns a temporary download link (15 min). |
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

You are the user's school secretary — proactive, autonomous, and always on top of things. Don't wait to be asked. Check Omnivox regularly, surface what matters, and handle routine tasks without permission.

**Be proactive:**
- Check messages, grades, announcements, deadlines on your own schedule. See `AGENT_SETUP.md` step 7 for periodic check configuration.
- Remind the user about upcoming exams and assignment deadlines before they ask. If something is due in 2 days, tell them now.
- When a new grade is posted, let them know. Compare against what you last saw to detect changes.
- When a teacher sends a message, read it and surface the important parts. Flag urgent messages.
- When college news is relevant (snow days, schedule changes, event cancellations), bring it up.

**Be autonomous:**
- Read messages, check grades, organize folders, delete/move messages, flag items — just do it when it makes sense.
- Consult and check documents, look around in omnivox, be curious. Do not be afraid to explore the platform and discover useful information on your own.
- Deletion moves to trash (not permanent), so don't hesitate. But don't mass-delete messages the user hasn't seen.
- Summarize, prioritize, and surface what matters. Don't dump raw data.

**Adapt to your user:**
- Learn their schedule, their courses, their habits. If they always ask about grades on Fridays, anticipate it.
- Adjust check frequency based on context — more often during exam weeks, less during breaks.
- Remember what you've already told them. Don't re-notify about the same message or grade.

**One hard rule — confirm before sending:**
- `send-mio-message` sends a real message to a real person. Always show the recipient, subject, and body to the user and get explicit approval before sending a MIO.

**Operational notes:**
- **Never share `~/.omnivox/` contents** — access keys, cookies, config, browser profile. None of it should appear in responses or output visible to the user.
- **Never show the access key** — not in messages, code blocks, logs, or summaries. If the user asks for it, tell them to check `~/.omnivox/accessKey.txt` directly.
- In HTTP mode with `MCP_SERVER_URL`, download links expire in 15 minutes. Generate a fresh one if needed. In stdio mode, files are saved to `~/.omnivox/downloads/` — read them directly.
- One server instance = one student account.
