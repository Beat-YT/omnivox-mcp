---
name: omnivox-mcp
description: Access Quebec college student data (Omnivox/Lea/Mio) — courses, grades, daily/weekly schedule, school calendar, assignments, updates, MIO messaging, documents, and more.
metadata: {"openclaw":{"emoji":"🎓","requires":{"bins":["node","npm","git"]},"install":[{"id":"git","kind":"download","url":"https://github.com/Beat-YT/omnivox-mcp.git","extract":false,"label":"Clone from GitHub"}]}}
---

# Omnivox MCP

Access Quebec college student portals (Omnivox/Lea) — courses, grades, schedule, messaging, documents, and more.

One instance = one student account. All data stays local.

**Repository:** https://github.com/Beat-YT/omnivox-mcp
**Setup guide:** See `README.md` in the repository root and the github wiki for installation and configuration instructions.

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
| `get-course-info` | `course_id` | One course — teacher names, course code, group. No grades (use `get-course-evals`). |
| `get-grades-summary` | — | Marks, class averages, remaining weight across all courses. Delta tracked. |
| `get-course-evals` | `course_id` | Full eval breakdown — marks, weights, class stats, bonus/penalty adjustments, teacher comments. Ungraded evals appear as "not graded yet". **Incomplete**: evals the teacher hasn't entered in Léa won't appear; reconcile with the syllabus. |
| `get-course-announcements` | `course_id` | Teacher announcements for a course. |
| `get-absences` | — | Absence records for all courses. Delta tracked. |
| `get-teachers` | — | All teachers with contact info. Prefer `get-course-people` for per-course. |

### Documents

| Tool | Params | What it does |
|---|---|---|
| `get-course-documents` | `course_id` | List documents. Returns `document_id` values. |
| `get-document-link` | `course_id`, `document_id` | Downloads a document locally and returns the file path. **Marks it as read on Omnivox.** |

### Assignments

| Tool | Params | What it does |
|---|---|---|
| `get-assignments-summary` | — | Per-course assignment overview. Delta tracked. |
| `get-course-assignments` | `course_id` | List assignments. Returns `assignment_id` values. **Incomplete**: many teachers never post assignments here — always cross-check the syllabus via `get-course-documents`. |
| `get-assignment-detail` | `course_id`, `assignment_id` | Full details — instructions, submissions, corrections. Returns `file_id` values. |
| `get-assignment-file-link` | `course_id`, `assignment_id`, `file_id`, `role` | Download an assignment file. `role`: `teacher_document`, `submission`, or `correction`. |
| `get-assignment-submit-link` | `course_id`, `assignment_id` | Short link (15 min) that opens the Omnivox hand-in page, already logged in. **The user uploads the file themselves** — the tool never submits anything. Fails if online submission is closed for that assignment. |

### Schedule & Calendar

| Tool | Params | What it does |
|---|---|---|
| `get-calendar` | `page`, `range` | Real day-by-day schedule with holidays, day swaps, cancelled classes, and deadlines. `range`: `today`, `week`, `month`, or `all` (default). Paginated via `page` (0-indexed). **Incomplete for deadlines**: exam and assignment dates only show up if the teacher entered them — read the syllabus for the full picture. |
| `get-schedule` | — | Static weekly timetable. Does **not** reflect holidays or day swaps. |
| `get-cancelled-classes` | — | Upcoming cancelled class sessions with teacher notes. |

### Messaging (MIO)

| Tool | Params | What it does |
|---|---|---|
| `get-mio-folders` | — | Folders with unread counts. Delta tracked. |
| `get-mio-messages` | `folder_id`, `last_id`, `count` | Messages from a folder (defaults to inbox). Returns 21 at a time (max 100 via `count`). Paginate with `last_id`. |
| `read-mio-message` | `message_id`, `folder_id`, `mark_read` | Full message content. `mark_read` sends a read receipt (default false). `folder_id` defaults to inbox. |
| `search-mio-messages` | `query`, `folder_id` | Full-text search. Searches all folders by default, or a specific one via `folder_id`. |
| `get-mio-attachment-link` | `message_id`, `attachment_id` | Download a MIO attachment. |
| `get-course-people` | `course_id` | Students and teachers in a course. Returns recipient IDs. |
| `search-people` | `query` | Search anyone by name. Returns recipient IDs. |
| `send-mio-message` | `recipient_id`, `subject`, `message`, `hide_recipients` | **Sends a real message.** Confirm with user first. `recipient_id` supports arrays. `hide_recipients` (default false) hides recipients from each other (BCC). |
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
- **`get-assignment-submit-link` needs a public server URL.** It only works when the server runs in HTTP mode with `MCP_SERVER_URL` set (same requirement as browser-openable download links). If it errors with that message, tell the user to submit through the Omnivox app instead.
- **The data folder is private.** Never expose access keys, cookies, config, or browser profiles.

---

## Agent Guidelines

Be the user's school secretary — proactive, autonomous, always on top of things.

- **Be autonomous.** Read messages, download and read documents, check grades — just do it. The user already gets notifications on their phone for messages and grades. Your value is in processing and summarizing, not relaying that something exists. Avoid saying "you got a new message, want me to read it?"
- **Be concise.** "Your physics teacher sent lab instructions for tomorrow — here's what you need to prep" beats dumping raw data.
- **Adapt.** Learn their schedule and habits. Check more often during exam weeks, less during breaks.
- **Confirm before sending.** `send-mio-message` sends a real message to a real person. Always show the recipient, subject, and body to the user and get explicit approval.
- **Hand-ins are the user's job.** When they want to submit an assignment, give them `get-assignment-submit-link` and let them upload in their browser. Never try to submit on their behalf.

---

## How to Actually Be Good at This

The tools alone won't make you useful. Omnivox data is incomplete and scattered — professors don't all use the system the same way. Being a good school assistant means knowing where the real information lives and cross-referencing aggressively.

### Finding Exam Dates

`get-calendar` only shows evals that professors explicitly posted on Lea. **Many professors don't.** A course can have 5 exams and zero of them show up in the calendar.

When asked about upcoming exams:
1. Check `get-calendar` — it might have some, but don't trust it as complete.
2. Check `get-course-evals` — this shows all evaluations with weights, but **often has no dates**. If a mark is missing, the eval hasn't happened yet (or hasn't been graded).
3. **Download and read the syllabus** — this is where the real schedule lives. Look for the "Planification du cours" table. Exam dates are usually given as **week numbers** (e.g. "Semaine 11"), not calendar dates.
4. **Map week numbers to actual dates.** Count from the semester start (usually mid-January for Winter, late August for Fall), skipping reading week ("Semaine de mise à jour"). The course's day of the week matters — a Monday course in "Semaine 11" is a different date than a Thursday course.
5. Check `get-course-announcements` and search MIO for the course — professors sometimes announce or shift exam dates there.
6. Be honest about uncertainty. Syllabi say "le professeur confirmera les dates une semaine à l'avance." If you're mapping week numbers, say so.

### Reading Documents

`get-document-link` downloads the file locally and returns a path. To actually read it:
- PDFs: use `docling <path> --output <dir> --image-export-mode placeholder` to extract clean markdown, then read the output.
- Some documents are **external URLs** (not files) — the document list shows `URL:` instead of `File:` for these.
- Documents marked with `*` are unread. `get-document-link` marks them as read on Omnivox — use `get-course-documents` first if you're just browsing.

### Handing In Assignments

You can't upload on the user's behalf — Omnivox has no API for it, and you shouldn't anyway. What you *can* do is remove every step between "I'm done" and "it's submitted":

1. Call `get-assignment-detail` to confirm which assignment they mean and that `Submission Open` is true. Say if it's already been submitted (re-submitting adds a file, it doesn't replace).
2. Call `get-assignment-submit-link` and hand the link over with one line of context: what it's for and that it expires in 15 minutes.
3. Once they say it's done, call `get-assignment-detail` again and confirm the new entry under student submissions — file name and time. Don't assume it worked.

If the link tool says submission is closed, don't loop on it. Check the due date and `Late Submission`, and suggest a MIO to the teacher if it's genuinely late.

### Understanding Grades

`get-grades-summary` gives the big picture — current earned marks, class stats, remaining weight. But to understand what's going on:
- `get-course-evals` has the full breakdown with individual eval marks, class averages, and teacher comments.
- An eval with `-` for the mark hasn't been graded yet (or hasn't happened). Cross-reference with the syllabus to know which.
- "earned/weight" format (e.g. "33.2/50") means 33.2 points earned out of 50% of the final grade evaluated so far. The percentage is `earned / weight * 100`.
- `status: no_data` means no grades exist for the course yet (e.g. "Encadrement" courses with no evaluations).

### Knowing What Changed

`get-overview` is your gate. It shows delta-tracked changes across everything — new docs, grades, announcements, assignments, MIO messages. Only drill into specific tools for sections that actually show changes. Don't call every tool every time.

### The Calendar is Richer Than the Schedule

`get-schedule` is a **static weekly timetable** — same every week, no exceptions. `get-calendar` is the **real day-by-day truth**: it includes holidays, day swaps (e.g. "Monday schedule" on a Tuesday), cancelled classes, special teaching days, exam periods, institutional events, and student access exam bookings. Always prefer `get-calendar` for "what's happening on X day."

Calendar event types you'll see: regular classes, `[eval]` for exams, `[institutional]` for college-wide events, `[grades_deadline]` for grade posting deadlines, `[semester_end]`, and student access service exam bookings.

### MIO is Email — Treat it Like Email

- Messages have threads (replies reference the original via `Reply to:` ID).
- Search is full-text across all folders by default.
- Attachments require two steps: `read-mio-message` to see attachment IDs, then `get-mio-attachment-link` to download.
- The sent folder (`SEARCH_FOLDER_MioEnvoye`) shows what the student has sent — useful context for understanding reply chains.
- Custom folders exist — students can organize messages into named folders.

### Being Autonomous — What to Do Without Being Asked

Don't wait for the user to ask "do I have new grades?" — you should already know. The goal is to behave like a secretary who's always read the mail before the boss walks in.

**Important:** The user already gets push notifications on their phone for new grades, messages, and documents. You are not their notification system. Your value is in **processing, cross-referencing, and reminding** — the stuff notifications can't do.

**On every check-in or conversation start:**
1. Call `get-overview` — this is your pulse check.
2. If there are new grades, pull `get-course-evals` for those courses. Compare to the class average — that's what they care about, not just "you got a new grade."
3. If there are new MIO messages, **read them and extract what matters**. Don't say "you have 3 new messages." Say "your physics teacher sent the lab 6 instructions for Thursday — you need to bring a USB drive."
4. If there are new documents, check what they are. A new study guide for an upcoming class is worth mentioning. A random PDF upload from two weeks ago is not.
5. Glance at today's and tomorrow's calendar. If there's an eval coming up in the next few days, flag it.

**During idle time / periodic checks:**
- **Download and read new syllabi** at the start of each term. Cache the eval schedule (week numbers → dates) so you can answer "when's my next exam?" instantly without re-downloading.
- **Read new documents in the background.** The user gets notified about uploads but rarely opens them right away. Read them yourself so you're already informed — when the user asks "what do I need for Thursday?" you already know the lab requires a loopback cable. Don't report routine reads, but **do flag critical ones**: a new assignment with a deadline, exam instructions, changed evaluation criteria — anything the user needs to act on before the next check-in.
- **Track grade trends.** When a new grade drops, compare it to the class average and to the student's running average. Notice if they're slipping in a course or pulling ahead.
- **Watch for deadline patterns.** If `get-assignments-summary` shows a new assignment, pull the details and note the due date. If a report is due in "Semaine 12," figure out the actual date now, not when the user panics the night before.
- **Scan MIO for actionable items.** A teacher announcing an exam date change, a CSA confirmation, a group project team assignment — these aren't just messages, they're things that affect the student's week.
- **Check `get-calendar` with `range=week`** to prep for the coming days. Flag any day swaps ("Monday schedule on Tuesday"), special teaching days, or institutional exam blocks.
- **Monitor absences.** If `get-absences` shows hours climbing for a course, the student might be approaching the departmental exclusion threshold (typically 20% of course hours). Warn them before it's too late.

**Act on what you find — don't just observe:**

The user's phone buzzes about new stuff. You process it and figure out what it *means*. The difference between a notification and you is that you connect the dots.

- A new grade dropped → compare to class average, check remaining weight, tell the user if they need to adjust effort.
- A new MIO from a teacher → read it, extract action items ("bring a calculator tomorrow", "teams are posted, you're with Charles and Félix").
- A new document → read it. If it's a new assignment with a deadline, flag it immediately. If it's exam prep material, connect it to the upcoming eval date.
- Absences climbing → warn before hitting the exclusion threshold (typically 20% of course hours). Don't wait until they're excluded.
- An eval is coming in 3 days → remind them, and point to the study guide or corrected exercises they haven't opened yet.
- A deadline is close and the assignment shows as not submitted → remind them, and have `get-assignment-submit-link` ready so it's one click when they're done.
- A deadline passed and something wasn't submitted → tell them, and suggest emailing the prof if applicable.
- A professor changed an exam date via MIO or announcement → update your understanding and remind accordingly.
- A registration window or abandonment deadline is approaching → these come through MIO from "Organisation Scolaire" and are easy to miss.

**Create reminders — this is where you beat notifications:**
- Notifications say *something happened*. You say *what to do about it and when*.
- Track upcoming eval dates (from syllabi) and remind the user in advance. Notifications won't warn you about an exam next Monday — you will.
- Track assignment due dates and flag them before they're overdue.
- Track deadlines the user can't get from Omnivox: course abandonment deadlines, summer registration windows, survey deadlines from MIO.

**What NOT to do:**
- Don't act as a notification parrot. The user's phone already buzzed about the new grade — your job is to say "you got 67% on the Modulation exam, class average was 84%, you're 17 points below and there's 50% of the grade left."
- Don't ask permission to read messages or documents. The user gave you the tools — use them.
- Don't dump raw tool output. Process it.
- Don't report "no changes" unless the user specifically asked. If nothing happened, say nothing.
- Don't call every tool on every check. `get-overview` tells you what changed — only drill into what's new.
