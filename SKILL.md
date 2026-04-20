---
name: omnivox-mcp
description: Access Quebec college student data (Omnivox/Lea/Mio) — courses, grades, daily/weekly schedule, school calendar, assignments, updates, MIO messaging, documents, and more.
metadata: {"openclaw":{"emoji":"🎓","requires":{"bins":["node","npm","git"]},"install":[{"id":"git","kind":"download","url":"https://github.com/Beat-YT/omnivox-mcp.git","extract":false,"label":"Clone from GitHub"}]}}
---

# Omnivox MCP

Access Quebec college student portals (Omnivox/Lea) — courses, grades, schedule, messaging, documents, and more.

One instance = one student account. All data stays local.

**Repository:** https://github.com/Beat-YT/omnivox-mcp
**Setup guide:** See `AGENT_SETUP.md` in the repository root.
**Heartbeat guide:** See `HEARTBEAT.md` for periodic check behavior.

---

## What is Omnivox?

Omnivox is the web portal used by virtually all CEGEPs (Quebec's public colleges) for student services — schedule, grades, messaging, documents, and admin forms all in one place.

### Key Concepts

- **Lea** — the course-management layer (like Google Classroom). Each course has documents, assignments, evaluations, and announcements.
- **MIO** — internal messaging system between students and teachers. Works like email but contained within Omnivox.
- **Terms** — semesters have numeric IDs (e.g. `20261` = Winter 2026). Most tools default to the current term.
- **Course IDs** — format is `{code}.{group}` (e.g. `2434K5EM.1011`). Get them from `get-courses-summary`.
- **Evaluations** — any graded assessment (exam, quiz, lab, project). Each has a weight and mark.

---

## Tools

All `term_id` parameters are optional and default to the current academic term.

### Tool Discovery (for the cli)
| Tool | Params | What it does |
|---|---|---|
| `tools` | `names` (optional, comma-separated) | Discover available tools. Without `names`, returns all tools. With `names`, returns only matching tools by name. Includes each tool's description and input schema. |

### Dashboard

| Tool | Params | What it does |
|---|---|---|
| `get-overview` | — | **Start here.** Dashboard of what's actionable right now: today's schedule, per-course new items (docs, announcements, assignments, grades) with delta tracking, new MIO messages, upcoming evals, notifications, and featured college news. |
| `get-terms` | — | List available terms with the current default. |

### Courses & Grades

| Tool | Params | What it does |
|---|---|---|
| `get-courses-summary` | — | All courses with counts and totals. Returns `course_id` values. Delta tracked. |
| `get-course-info` | `course_id` | One course — teacher names, grade summary. |
| `get-grades-summary` | — | Marks, class averages, remaining weight across all courses. Delta tracked. |
| `get-course-evals` | `course_id` | Full eval breakdown — marks, weights, class stats, grade evolution. **Incomplete**: unposted exams won't appear here; reconcile with the syllabus. |
| `get-course-announcements` | `course_id` | Teacher announcements for a course. |
| `get-absences` | — | Absence records for all courses. Delta tracked. |
| `get-teachers` | — | All teachers with contact info. Prefer `get-course-people` for per-course. |

### Documents

| Tool | Params | What it does |
|---|---|---|
| `get-course-documents` | `course_id` | List documents. Returns `document_id` values. |
| `get-document-link` | `course_id`, `document_id` | Download a document. Marks it as read on Omnivox. |

### Assignments

| Tool | Params | What it does |
|---|---|---|
| `get-assignments-summary` | — | Per-course assignment overview. Delta tracked. |
| `get-course-assignments` | `course_id` | List assignments. Returns `assignment_id` values. **Incomplete**: many teachers never post assignments here — always cross-check the syllabus via `get-course-documents`. |
| `get-assignment-detail` | `course_id`, `assignment_id` | Full details — instructions, submissions, corrections. Returns `file_id` values. |
| `get-assignment-file-link` | `course_id`, `assignment_id`, `file_id`, `role` | Download an assignment file. `role`: `teacher_document`, `submission`, or `correction`. |

### Schedule & Calendar

| Tool | Params | What it does |
|---|---|---|
| `get-calendar` | `page`, `range` | Real day-by-day schedule with holidays, day swaps, cancelled classes, and deadlines. range: `today`, `week`, `month`, or `all` (default). Paginated via optinal `page`. **Incomplete for deadlines**: exam and assignment dates only show up if the teacher entered them — read the syllabus for the full picture. |
| `get-schedule` | — | Static weekly timetable. Does **not** reflect holidays or day swaps. |
| `get-cancelled-classes` | — | Upcoming cancelled class sessions with teacher notes. |

### Messaging (MIO)

| Tool | Params | What it does |
|---|---|---|
| `get-mio-folders` | — | Folders with unread counts. Delta tracked. |
| `get-mio-messages` | — | Messages from a folder (defaults to inbox). Paginate with `last_id`. |
| `read-mio-message` | `message_id` | Full message content. Optional `mark_read` sends a read receipt. |
| `search-mio-messages` | `query` | Full-text search across messages. |
| `get-mio-attachment-link` | `message_id`, `attachment_id` | Download a MIO attachment. |
| `get-course-people` | `course_id` | Students and teachers in a course. Returns recipient IDs. |
| `search-people` | `query` | Search anyone by name. Returns recipient IDs. |
| `send-mio-message` | `recipient_id`, `subject`, `message` | **Sends a real message.** Confirm with user first. Supports arrays. |
| `flag-mio-message` | `message_id`, `important`, `mark_unread` | Flag or mark as unread. |
| `move-mio-message` | `message_id`, `folder_id` | Move to another folder. |
| `delete-mio-message` | `message_id` | Move to trash (not permanent). Supports arrays. |
| `restore-mio-message` | `message_id` | Restore from trash. Supports arrays. |
| `create-mio-folder` | `name` | Create a new folder. |

### College

| Tool | Params | What it does |
|---|---|---|
| `get-college-news` | — | College news and announcements. |
| `get-college-list` | — | Get the user's college name. |

---

## Delta Tracking

Many tools track changes between calls. If nothing changed, the response says `[No changes since last call]`. Use `get-overview` as your gate — only drill into specific tools for sections that show changes.

---

## Syllabi Are the Source of Truth

**Omnivox is not a complete record of coursework.** Many teachers never enter assignments, evaluations, or exam dates into Lea at all — they announce them in class, hand out paper, or bury them in the syllabus. Treat the structured tools as *incomplete by default*:

- `get-course-assignments` returning nothing does **not** mean there is no homework.
- `get-calendar` and `get-course-evals` missing an exam does **not** mean the exam isn't scheduled.
- An empty `get-assignments-summary` does **not** mean the student is caught up.

**To get the real picture, you must read the course syllabus.** For any question about what's due, upcoming exams, project milestones, grading breakdown, or course policies:

1. Call `get-course-documents` for the course.
2. Find the syllabus (usually called *plan de cours*, *course outline*, *syllabus*, or similar — often posted at the start of term).
3. Call `get-document-link` and actually read it. Cross-reference its dates and weights against what Lea shows.
4. If no syllabus is posted on Lea, say so explicitly — don't pretend Lea's data is the full answer.

Only after reading the syllabus can you confidently tell the user what's coming up or what's graded.

## Gotchas

- **Lea data is incomplete.** See "Syllabi Are the Source of Truth" above — always reconcile assignments, evals, and deadlines against the course syllabus from `get-course-documents`.
- **`get-document-link` marks documents as read** on Omnivox. Use `get-course-documents` first if you're just browsing.
- **Not all professors upload syllabi to Lea.** Some distribute them in class or via MIO. If a syllabus isn't on Lea, check MIO attachments and tell the user it's missing from the portal.
- **MIO message IDs are UUIDs**, not numbers.
- **MIO folder IDs** are string constants like `SEARCH_FOLDER_MioRecu`. Use `get-mio-folders` to discover them.
- **`course_id` is always required** on document/assignment downloads, even though the document ID seems sufficient.
- **`~/.omnivox/` is private.** Never expose access keys, cookies, config, or browser profiles.

---

## Agent Guidelines

Be the user's school secretary — proactive, autonomous, always on top of things.

- **Be autonomous.** Read messages, download and read documents, check grades — just do it. The user already gets notifications on their phone for messages and grades. Your value is in processing and summarizing, not relaying that something exists. Avoid saying "you got a new message, want me to read it?"
- **Be concise.** "Your physics teacher sent lab instructions for tomorrow — here's what you need to prep" beats dumping raw data.
- **Adapt.** Learn their schedule and habits. Check more often during exam weeks, less during breaks.
- **Confirm before sending.** `send-mio-message` sends a real message to a real person. Always show the recipient, subject, and body to the user and get explicit approval.
