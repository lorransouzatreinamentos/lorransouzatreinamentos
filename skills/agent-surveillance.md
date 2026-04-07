---
name: agent-surveillance
description: "Lança um dashboard web em tempo real para monitorar equipes de agentes Claude Code, inboxes e tarefas. Ativa com 'monitor agentes', 'dashboard agentes', 'surveillance', 'command center'."
---

# Agent Surveillance Dashboard

You are launching a real-time surveillance dashboard at **http://localhost:3847** that monitors all Claude Code agent team activity. Follow these steps exactly.

## IMPORTANT: When to invoke this skill AUTOMATICALLY

You MUST launch this dashboard **proactively** (without being asked) any time you are about to:
- Create a team with `TeamCreate`
- Spawn multiple agents with the `Task` tool using `team_name`
- Run any multi-agent workflow

Also launch when the user explicitly asks to:
- Monitor, watch, or surveil their agents
- View agent history or past sessions
- Open the dashboard or command center

**Always start the dashboard BEFORE creating the team** so the user can watch from the very beginning.

## Step 1: Check if the server is already running

```bash
lsof -ti:3847 2>/dev/null
```

- If a PID is returned, the server is **already running**. Skip to Step 3.
- If nothing is returned, proceed to Step 2.

## Step 2: Start the dashboard server

First kill any stale processes on port 3847, then ensure dependencies are installed and launch:

```bash
lsof -ti:3847 2>/dev/null | xargs kill 2>/dev/null; sleep 1; cd ~/.claude/skills/agent-surveillance && npm install --silent 2>/dev/null && node scripts/server.js &
```

Run this using the Bash tool with `run_in_background: true`. The server will:
- Start on port **3847** (this is the fixed, consistent port)
- Auto-open the browser to http://localhost:3847
- Begin watching `~/.claude/teams/` and `~/.claude/tasks/` for live changes (polling every 2s)
- Persist all data to SQLite at `~/.claude/agent-surveillance.db`

Wait 3 seconds, then verify it started:

```bash
sleep 3 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3847/
```

Expected: `200`. If not 200, check troubleshooting below.

## Step 3: Open the browser and confirm

The server auto-opens the browser on startup (macOS, Linux, and Windows). If it didn't open, manually open it:

```bash
# macOS
open http://localhost:3847
# Linux
# xdg-open http://localhost:3847
```

Tell the user: **"Dashboard is live at http://localhost:3847"**

Then briefly describe what they'll see:
- **Live mode** (default): Real-time agent roster, message feed with markdown rendering, and 3-column task kanban
- **Dark mode** by default with a theme toggle (sun/moon icon)
- **Messages**: Flat chronological feed with text previews — click any message to open the full thread in a popup modal
- **Task Board**: Kanban with Pending / In Progress / Completed columns, live updates via SSE + polling
- **History mode**: Toggle to "History" in the header to browse past sessions from SQLite

## Step 4: Proceed with the team/agent work

After the dashboard is running, immediately proceed with whatever team creation or agent work the user requested. Do NOT wait for the user to confirm they see the dashboard — just tell them the URL and keep going.

## Architecture

- **Single file**: `scripts/server.js` (~1740 lines) — monolithic Node.js server with embedded HTML/CSS/JS via template literal in `getHTML()`
- **Database**: `better-sqlite3` with graceful degradation (falls back to memory-only if native module fails)
- **DB path**: `~/.claude/agent-surveillance.db`
- **Watchers**: Polls `~/.claude/teams/` and `~/.claude/tasks/` directories every 2s (fs.watch is unreliable on macOS)
- **Real-time**: SSE (Server-Sent Events) push + client-side polling fallback
- **Session lifecycle**: Active teams auto-create sessions; ended teams get `ended_at` timestamp; history view reads from SQLite
- **System tasks filtered**: Auto-created agent-tracking tasks (names like "designer", "developer") hidden from kanban to reduce noise

### Key API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/state` | Full live state (teams, inboxes, tasks, locks) |
| GET | `/api/events` | SSE stream for real-time updates |
| GET | `/api/sessions` | List all historical sessions with counts |
| GET | `/api/sessions/:id` | Session detail with agents |
| GET | `/api/sessions/:id/messages?limit=N` | Paginated messages for a session |
| GET | `/api/sessions/:id/tasks` | All tasks for a session |
| DELETE | `/api/sessions/:id` | Delete session (cascades through all tables) |
| POST | `/api/messages/:id/read` | Mark a single message as read |
| POST | `/api/threads/read` | Mark all messages in a thread as read |

### History mode detail view

When clicking a session card in History mode:
1. Fetches session info, messages (up to 1000), and tasks via 3 parallel API calls
2. Reuses the live view layout (roster, messages, tasks) with historical data
3. Shows a banner with session name and date range
4. Messages render with markdown (bold, italic, headings, code, lists) and protocol cards (task_assignment, idle_notification, shutdown_request, etc.)
5. Task board shows kanban with Pending/In Progress/Completed columns
6. Click any message to open the full thread in a popup modal

## Troubleshooting

If the server fails to start:
1. Kill anything on port 3847: `lsof -ti:3847 2>/dev/null | xargs kill -9 2>/dev/null`
2. Rebuild native deps: `cd ~/.claude/skills/agent-surveillance && npm rebuild better-sqlite3`
3. Try starting again: `cd ~/.claude/skills/agent-surveillance && node scripts/server.js &`
4. The dashboard works without SQLite (memory-only mode) if the native module fails to load

If the browser shows a stale/cached page:
- Hard refresh: the server sends `Cache-Control: no-store` headers, so a normal refresh should work
- If still stale, open a new incognito tab to http://localhost:3847

## Stopping the server

Only stop when the user explicitly asks. To stop:

```bash
lsof -ti:3847 2>/dev/null | xargs kill 2>/dev/null
```

Never stop the server between team runs — it persists history across sessions automatically.

## CRITICAL: Template Literal Coding Rules

All client-side JS/CSS/HTML is embedded in a single Node.js template literal (`getHTML()` function). When editing this code, you MUST follow these rules to avoid silent runtime crashes:

### Regex patterns inside template literals

| NEVER use | USE instead | Why |
|-----------|-------------|-----|
| `\w` | `[a-zA-Z0-9_]` | `\w` becomes `w` (backslash eaten) |
| `\d` | `[0-9]` | `\d` becomes `d` |
| `\s` | `[ \t\n\r]` | `\s` becomes `s` |
| `\b` | `(^|\b)` workaround | `\b` becomes `b` |
| `\*` | `[*]` | `\*` becomes `*` (invalid regex) |
| `\.` | `[.]` | `\.` becomes `.` (matches any char) |
| `` \` `` | `\x60` | backtick closes the template literal |
| `(?<!...)` | avoid entirely | lookbehinds crash in browser at runtime |

**Why**: In JS template literals, `\` followed by a non-recognized escape character drops the backslash. `\x60` works because `\x` is a recognized hex escape sequence. Character classes like `[*]` work because they contain no backslashes.

**Dangerous**: `node -c` syntax check passes, but the browser crashes at runtime. Always test in a real browser after editing regex patterns.
