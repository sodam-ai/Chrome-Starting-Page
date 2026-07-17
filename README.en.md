# Chrome Starting Page Dashboard

**A private Chrome new-tab / start-page dashboard that runs entirely on your own computer**

- Version: `v7.3.0` (as of 2026-07-17)
- License: MIT (commercial use allowed)
- Runs on: Windows 10/11, macOS
- Required software: Node.js `>= 18.0.0` (zero other external libraries)
- Repository: <https://github.com/sodam-ai/chrome-starting-page>

> This document is the **standard reference document**, aimed at readers who are already reasonably comfortable with computers. If you are completely new to computers/terminals and want a hand-holding, step-by-step walkthrough, read [`GUIDE.en.md`](./GUIDE.en.md) first. Both documents cover the same content — only the level of hand-holding differs. 한국어 사용자는 [`README.md`](./README.md)를 확인하세요.

---

## <a id="toc"></a>Table of Contents

1. [Project Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Required Software](#requirements)
4. [How to Download](#download)
5. [How to Install](#install)
6. [Quick Start](#quickstart)
7. [How to Run](#run)
8. [How to Use](#usage)
9. [How It Works](#howitworks)
10. [Command Reference](#commands)
11. [Update / Changelog Summary](#changelog)
12. [File / Document Locations](#files)
13. [Workflow](#workflow)
14. [Architecture](#architecture)
15. [Security / Data Flow](#security)
16. [Troubleshooting](#troubleshooting)
17. [FAQ](#faq)
18. [Legal / Copyright / License / Commercial Use](#license)

---

## <a id="overview"></a>1. Project Overview

Chrome Starting Page Dashboard replaces your Chrome "New Tab" / start page with a **personal dashboard** that brings together:

- Category-organized bookmark cards — drag-to-reorder, automatic favicon lookup, dead-link detection
- Notes — multiple independent note cards with lightweight Markdown (bold/links/code)
- To-do lists — priorities, due dates, recurring tasks, tags, a kanban board
- Calendar — month/week views, recurring events, reminders
- Pomodoro timer — automatic 25-minute focus / 5-minute break cycles
- Habit tracker — daily check-off with streak tracking
- Spotlight universal search (press `F`) — search bookmarks, todos, and notes at once, plus a `>command` palette

**The three things that matter most**

1. **100% local-first.** This project is a tiny web server (`server.js`) that runs only on your own machine, serving a single page (`index.html`). Every piece of data — bookmarks, notes, todos, and so on — is stored purely as JSON files inside this project's own `data/` folder. There is no cloud backend, no account, no login.
2. **Zero external dependencies.** `package.json` has no `dependencies` field at all. The server is built entirely on Node.js's built-in modules — no `npm install` step is required.
3. **MIT License — commercial use is allowed.** This software may be used, modified, redistributed, and even sold, personally or commercially, for free. See [18. Legal / Copyright / License / Commercial Use](#license) for the exact terms.

---

## <a id="prerequisites"></a>2. Prerequisites

Check the following before you start installing.

| Item | Required? | Notes |
|---|---|---|
| Windows 10/11 or macOS | Required | There's no official installer script for Linux, but if Node.js is available you can still run it manually with `node server.js` |
| Free disk space | ~100MB minimum | Slightly more if Windows needs to download the portable Node.js runtime (~30MB) |
| Google Chrome | Recommended | The page itself opens fine in any browser (Edge, Whale, etc.) — the "set as Chrome's new tab" instructions specifically assume Chrome |
| Comfort with a terminal / command prompt | Helpful, not required | On Windows, installation is a simple double-click of a `.bat` file — no terminal knowledge needed. On macOS you will type one command in Terminal |
| Internet connection | Only needed once, and only sometimes | If Node.js isn't already installed on Windows, the installer downloads it automatically. After setup, day-to-day use works mostly offline (fonts/favicons/weather being the exceptions — see [Section 15](#security)) |
| (Optional) OpenWeatherMap account | Optional | Only needed if you want the weather widget. Every other feature works fully without it |

> **Environment variables**: This project uses no `.env` file and no environment variables at all. The port is configured via `port.conf`, and the weather API key is managed directly in Settings (⚙ Settings → General). There is no separate environment-variable setup step.

---

## <a id="requirements"></a>3. Required Software

| Software | Minimum version | Windows | macOS |
|---|---|---|---|
| Node.js | `>= 18.0.0` | If missing, `setup_windows.bat` **automatically downloads** a portable copy (`v22.19.0`, win-x64) from `https://nodejs.org` into a local `node\` folder. If Node.js is already on your system, that copy is used instead | **Not installed automatically.** `setup_mac.sh` only checks whether `node` is on your `PATH` — if not, it prints an error and stops. Install Node.js yourself first using one of the methods below |
| Git (optional) | Any | Only needed if you plan to `git clone` from GitHub. Not needed if you just download the ZIP | Same as Windows |

**Installing Node.js on macOS (pick one)**

- Official installer: <https://nodejs.org> → download the "LTS" version → run the installer
- Homebrew: run `brew install node` in Terminal (see <https://brew.sh> if you don't have Homebrew yet)

Once installed, typing `node -v` in Terminal should print `v18.0.0` or higher — that confirms you're ready.

---

## <a id="download"></a>4. How to Download

Pick whichever of the two scenarios applies to you.

### A. Getting it from the GitHub repository

- Repository: **<https://github.com/sodam-ai/chrome-starting-page>**

**Option 1 — Download as ZIP (no Git knowledge needed, recommended for beginners)**
1. Visit the URL above
2. Click the green **"Code"** button → **"Download ZIP"**
3. Extract the downloaded `chrome-starting-page-main.zip`
4. Move the extracted folder wherever you'd like to keep it

**Option 2 — Clone with Git**
```bash
git clone https://github.com/sodam-ai/chrome-starting-page.git
cd chrome-starting-page
```

### B. If you received the folder / a ZIP file directly

1. If it's a `.zip`, extract it with your OS's built-in archive tool (Windows' built-in extractor, macOS Finder, etc.)
2. Move the extracted folder to wherever you want it to live
3. If you see `index.html`, `server.js`, and `package.json` inside, you have it correctly — continue to [5. How to Install](#install)

---

## <a id="install"></a>5. How to Install

### 🪟 Windows

1. Open the downloaded folder.
2. **Double-click** `setup_windows.bat`. (No administrator rights needed, and no system files are touched.)
3. A black console window opens and runs through these steps automatically:

| Step | What the script does |
|---|---|
| 1 | If you already have data (`data\bookmarks.json`, etc.), it's safely backed up first (`data\backups\safety-before-setup.json`). On a fresh install, it creates `data\`, `data\backups\`, `data\icons\`, `data\profiles\`, and `assets\` |
| 2 | Checks for Node.js: portable copy (`node\node.exe`) first, then a system install; if neither exists, it automatically downloads a portable copy (v22.19.0) from nodejs.org |
| 3 | Safely stops any previously running instance of the server, if one exists |
| 4 | Registers the app to start automatically at login (adds one entry under the Windows registry key `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`; falls back to a Startup-folder shortcut if that fails) |
| 5 | Starts the server hidden, with no visible window |

4. The final message shows the real address to open (default `http://localhost:1111` — it may automatically shift to 1112, 1113, etc. if that port is already busy).
5. You can close this window — the server keeps running in the background.

> **Note:** Aside from adding one login auto-start entry, this installer does not touch any system files, and it never touches Chrome's own policies or registry. Pointing Chrome at this page is something you do yourself — see step 4 of [Quick Start](#quickstart).

### 🍎 macOS

1. If Node.js isn't installed, install it first following [Section 3](#requirements).
2. Open **Terminal**.
3. Navigate to the project folder:
   ```bash
   cd ~/Downloads/chrome-starting-page   # adjust to wherever you put the folder
   ```
4. Run the setup script:
   ```bash
   bash setup_mac.sh
   ```
5. What this does: it generates a LaunchAgent file (`com.dashboard.startpage.plist`), installs it into `~/Library/LaunchAgents/`, loads it (`launchctl load`), and starts the server right away. This means the app **starts automatically on login** and **restarts itself automatically if it ever crashes** (`KeepAlive` — a feature Windows's setup does not have).
6. The final message will show you the address to open (e.g. `http://localhost:1111`).

---

## <a id="quickstart"></a>6. Quick Start

For readers who already know all of the above, here's the condensed version.

```text
1) Download  → GitHub ZIP, git clone, or a folder someone handed you directly
2) Install   → Windows: double-click setup_windows.bat / macOS: bash setup_mac.sh
3) Open it   → type http://localhost:1111 into your browser's address bar
4) (Optional) Set it as Chrome's start page
   Chrome menu (⋮) → Settings → "On startup" → "Open a specific page"
   → add http://localhost:1111
   (Fully replacing Chrome's actual "New Tab" page requires a browser
    extension — this project never modifies Chrome's settings for you.)
```

---

## <a id="run"></a>7. How to Run

Once you've run the installer, the server starts **automatically every time you log in**, so you'll rarely need to run these manually. They're here for when you want to control things by hand.

| Situation | Windows | macOS |
|---|---|---|
| Run once, manually | `npm start` or `node server.js` in the project folder | `npm start` or `node server.js` in Terminal |
| Run on a different port | `node server.js 8080` | `node server.js 8080` |
| Run hidden in the background | Double-click `run_server_background.bat` | (already handled by the LaunchAgent) |
| Restart (stop then start) | Double-click `restart.bat` | `launchctl unload`, then `launchctl load ~/Library/LaunchAgents/com.dashboard.startpage.plist` |
| Fully stop | Run `uninstall.bat`, or end `node.exe` in Task Manager | Run `uninstall_mac.sh` |

You can also change the port or restart the server with a single click from Settings → Data tab.

---

## <a id="usage"></a>8. How to Use

### 8.1 Search & Spotlight
- Type in the top search bar and press Enter to search with your default engine (Google/Naver/YouTube, configurable in Settings).
- Prefix your query with a keyword to jump straight to a specific engine: `yt cats` → YouTube search, `nv weather` → Naver search, `gh react` → GitHub search (default keywords: `yt`, `nv`, `gh`, `g`, `tw`, `map`; customizable).
- Press `F` to open **Spotlight**, a universal search across bookmarks, todos, notes, and D-Days — including Korean chosung (initial-consonant) search.
- Inside Spotlight you can type `>` commands: `>todo`, `>timer 15`, `>focus Work`, `>add Name URL`, `>habit`, `>today`, `>kanban`, `>layout`, `>settings`, `>theme`, `>export`.

### 8.2 Bookmarks
- Add/edit/delete bookmarks inside category cards, drag to reorder, and drag between categories or pages.
- Right-click for a context menu: pin to top, edit, open in a new tab, open the whole category, move to another page, delete.
- Drag a URL straight out of the browser's address bar onto a card to add it instantly.
- Copy a link and paste it (`Ctrl+V`) anywhere on the page to get a quick "add to which category?" popup.
- Items added in the last 7 days get a "NEW" badge; frequently/recently used bookmarks can auto-sort to the top (toggle in Settings).
- Dead links are detected automatically (after 3 consecutive failed checks) and flagged visually.
- Deleted items go to Trash for 30 days and can be restored.

### 8.3 Notes
- Independent note cards, create as many as you like, rename by double-clicking.
- Auto-linkifies URLs, and supports a small Markdown subset for preview (`**bold**`, `` `code` ``, `[text](url)`).

### 8.4 To-do
- Multiple independent to-do cards, 4 priority levels, due dates, tags, subtasks.
- Recurring todos (daily / weekdays / weekly / monthly).
- Switch between a kanban board view and a full filterable list view.
- Hitting 100% completion triggers a confetti celebration; completion streaks are tracked.

### 8.5 Calendar
- Toggle between month and week views.
- Click a date to add an event; prefix with `!` to add a to-do instead of an event.
- Recurring events (weekly / biweekly / monthly); if you grant notification permission, you'll get a browser reminder 10 minutes before an event starts.

### 8.6 Pomodoro & Habit Tracker
- Optional auto-cycling: 25 minutes focus → 5 minutes break (a longer 15-minute break every 4th session). Can be started directly from a specific to-do item.
- A 7-day focus-time chart.
- Habit tracker: list your habits (one per line) in Settings, then check them off daily; streaks are tracked automatically.

### 8.7 Personalizing the Look (⚙ Settings → Visual)
- Manual dark/light theme toggle, or "follow system settings."
- 6 accent colors (blue/purple/rose/emerald/amber/cyan).
- Upload background images (multi-image slideshow, interval configurable from 1 minute to 24 hours), 3 glass-effect presets, adjustable blur/opacity.
- 4 layout presets (default/compact/wide/magazine), and custom CSS injection (sanitized before it's applied — see [Section 15](#security)).

### 8.8 Settings Screen (5 tabs)
| Tab | Contents |
|---|---|
| General | World clocks, search engines, usage-based sorting, theme mode, accent color, keyboard shortcut manager, weather API key |
| Visual | Background images/slideshow, overlay darkness, blur/glass effect, card opacity, custom CSS, reduced motion |
| Widgets | D-Day list, page manager, card size/color, calendar options, Pomodoro auto-cycle, habit list, layout, search keyword shortcuts |
| Data | Export/import (JSON/Markdown/HTML), auto-backup interval, browse/restore backups, duplicate-bookmark finder, profile manager, trash, port change & server restart |
| Stats | To-do completion streak, 90-day usage heatmap, Pomodoro chart, top-10 most-clicked bookmarks, per-category click donut chart |

### 8.9 Keyboard Shortcuts

| Key | Action | Customizable? |
|---|---|---|
| `/` | Focus the search bar | Yes, in Settings |
| `E` | Toggle edit mode | Yes, in Settings |
| `S` | Open Settings | Yes, in Settings |
| `F` | Open Spotlight universal search | Yes, in Settings |
| `?` | Show the shortcut cheat sheet | Yes, in Settings |
| `1`–`9` | Jump to that category card | Fixed |
| `Ctrl/Cmd + Z` | Undo the last change | Fixed |
| `Esc` | Close whatever's open (modal, search, etc.) | Fixed |
| `Tab` / `Shift+Tab` | Move focus between bookmark tiles, `Enter` opens the focused one | Fixed |

---

## <a id="howitworks"></a>9. How It Works

In one sentence: **the browser (the page you see) asks a small server running on your own machine to "save this" or "load that," and the server writes/reads it directly as JSON files under `data/`.**

1. **When you open it**: your browser requests `http://localhost:<port>/` → the server serves `index.html`, `style.css`, and `script.js` → the page immediately requests its own data from itself via `/api/bookmarks`, `/api/notes`, `/api/config`, and so on, to fill the screen.
2. **When you change something** (add a bookmark, check off a to-do): the page waits roughly 0.3–1 second (to batch up several rapid changes into one save) before sending a save request to the server. The server writes to a temporary file first and then renames it into place (an "atomic write"), so a file can never end up half-written or corrupted.
3. **If the connection drops**: an "offline mode" banner appears, and any changes are kept temporarily in the browser's `localStorage` until the connection returns — at which point they're saved to the server automatically. Nothing is lost.
4. **With multiple tabs open**: saving in one tab broadcasts a "please refresh" signal to any other open tabs via `BroadcastChannel`, so they never drift out of sync with each other.
5. **Why the page still loads offline**: a service worker (`sw.js`) pre-caches the four static files (`index.html`, `style.css`, `script.js`, and the manifest). Requests to `/api/...` — anything involving your actual data — are never cached and always go straight to the live server.
6. **What the server manages on its own**: it checks every data file's integrity on boot and auto-recovers from a backup if something's corrupted; it takes an automatic backup once a day (by default); it deletes backups older than 30 days (keeping at most 50); and if its preferred port is busy, it automatically retries the next one (1112, 1113, …).

---

## <a id="commands"></a>10. Command Reference

| Command / File | Where to run it | What it does |
|---|---|---|
| `npm start` | Project folder | Same as `node server.js`. Starts on the default port (1111, or whatever `port.conf` holds) |
| `node server.js` | Project folder | Runs the server with a visible console |
| `node server.js <port>` | Project folder | Runs on a specific port (e.g. `node server.js 8080`) |
| `setup_windows.bat` | Windows, double-click | First-time setup: checks/installs Node, registers auto-start, starts the server |
| `bash setup_mac.sh` | macOS Terminal | First-time setup: registers the LaunchAgent, starts the server |
| `run_server_background.bat` | Windows, double-click | Restarts just the server, hidden (doesn't touch the auto-start registration) |
| `restart.bat` | Windows, double-click | Safely stops and restarts the running server |
| `set-port.bat` | Windows, double-click | Interactively prompts for a new port number |
| `set-port.bat 8080` | Windows, Command Prompt | Sets the port to 8080 directly (restart to apply) |
| `uninstall.bat` | Windows, double-click | Stops the server, removes the auto-start entry, optionally deletes your data (Y/N), cleans up log files |
| `uninstall_mac.sh` | macOS Terminal (`bash uninstall_mac.sh`) | Stops the server, unloads the LaunchAgent, optionally deletes your data, cleans up log files |

> `start_hidden.vbs` is not meant to be run by hand — it's used internally by the Windows auto-start registration.

---

## <a id="changelog"></a>11. Update / Changelog Summary

Major changes per version — click any entry to expand it. (Source: `CHANGELOG.md`, newest first.)

<details>
<summary><strong>v7.3 (2025-03-19) — Background slideshow, data-safety net, security hardening</strong></summary>

- Multi-image background slideshow (1 minute–24 hour interval, manual prev/next, fade transitions)
- Pin bookmarks to top; drag a card onto a page tab to move it there
- Drag-to-sort to-do cards
- Data safety: startup integrity check across 9 JSON files with automatic backup recovery, backup list/restore UI, import preview, export-complete toast, 10-level undo
- Server stability: automatic port fallback (1111 → 1112 … 1120), auto-stops any previous instance on start, cleans up stale PID files, fixed a double-start bug, fixed `.bat`/`.vbs` line-ending (CRLF) encoding issues
- Networking: reconnect interval shortened from 15s to 5s with a toast, offline banner, multi-tab sync (with echo-loop protection), service worker checks for updates every 30 minutes
- Accessibility/UX: keyboard focus styles, 8 new aria-labels, print stylesheet, mobile-responsive layout (768px)
- Security: blocked `..`/`~` path-traversal in import paths, blocked a Windows case-insensitivity bypass, custom CSS now blocks `expression()`/`javascript:`/external `@import`/`behavior:` and similar risky patterns
- Docs/meta: README/CHANGELOG/package.json/manifest were reorganized (note: the README files were later lost from this repository and have now been rewritten from scratch as this document set)

</details>

<details>
<summary><strong>v7.2 — Multiple to-do cards</strong></summary>

- Support for several independent to-do cards, each with its own title/rename/delete, and drag-to-move between cards

</details>

<details>
<summary><strong>v7.1 — Card-based notes, widget visibility toggles</strong></summary>

- Notes became independent cards (title/line count/drag-to-reorder), with bold/code/link Markdown preview
- To-do/Calendar/Habit cards can be shown or hidden, restorable via undo

</details>

<details>
<summary><strong>v7.0 — Habit tracker, layout presets, Pomodoro auto-cycle</strong></summary>

- Habit tracker (daily checklist, resets at midnight)
- 4 layout presets (default/compact/wide/magazine)
- Pomodoro auto-cycle (25 min focus → 5 min break), search keyword shortcuts (`yt cats`, `nv weather`, `gh react`)
- Event reminders 10 minutes ahead, per-category accent colors
- 3 glass-effect presets, 0–40px blur slider, time-of-day background tinting

</details>

<details>
<summary><strong>v6.0 — Calendar, Pomodoro, profiles, universal search</strong></summary>

- Calendar card (month/week views), Pomodoro timer, save/load multiple settings as profiles
- Multi-select (Ctrl+click) for bulk move/delete, double-click rename, focus mode
- Smart paste (`Ctrl+V` → pick a category), drag a URL from the address bar, drag-and-drop JSON import
- Unified Spotlight search (`F` key), Korean chosung search, a `>command` mode
- To-do completion streaks, dead-link detection (after 3 failures), a weekly report, an offline write queue

</details>

<details>
<summary><strong>v5.0 — Multiple pages, D-Day, world clock, weather</strong></summary>

- Multiple tabbed pages (e.g. Work/Personal/Study), D-Day countdown, world clock, weather widget (OpenWeatherMap)
- Auto theme that follows OS settings, 6 accent colors, custom CSS injection
- Server: atomic writes, retention-policy backups, port/restart APIs, a health-check API, 10MB error-log rotation

</details>

<details>
<summary><strong>v4.0 — Category reorder, trash, undo</strong></summary>

- Drag-to-reorder and collapse/expand categories, resizable cards, right-click menu, a 7-day "NEW" badge
- Trash with 30-day recovery, a 5-second `Ctrl+Z` undo toast
- Server: a hand-built multipart upload parser, bookmark-icon/background uploads, write-locking to prevent concurrent-save conflicts

</details>

<details>
<summary><strong>v3.0 — To-do priorities/recurrence, notes</strong></summary>

- To-do priority levels (high/med/low), due dates, tags, recurrence (daily/weekly/biweekly/monthly), subtasks
- Notes/memo cards with auto-link detection
- Server: a trash API (30-day cleanup), a usage-tracking API, a Pomodoro-stats API

</details>

<details>
<summary><strong>v2.0 — Dark/light theme, search engine switching</strong></summary>

- Dark/light theme toggle with a circular transition animation, glass-morphism UI, customizable shortcuts
- Multiple search engines (Google/Naver/YouTube), usage-based bookmark sorting
- Server: gzip compression, ETag caching, an in-memory file cache, graceful shutdown (with a final backup)

</details>

<details>
<summary><strong>v1.0 — Initial release</strong></summary>

- A Node.js HTTP server built entirely on built-in modules (zero dependencies)
- Category-organized bookmark cards with drag-to-reorder
- Configurable port (`port.conf` / CLI argument / dashboard UI), bound only to `127.0.0.1`
- Offline support via a service worker; Windows auto-start (registry + hidden VBS); macOS auto-start (LaunchAgent)
- An optional portable Node.js download for Windows (no system install required)
- PID-based process management (safe restarts that never touch other running programs)
- JSON file-based storage under `data/`

</details>

---

## <a id="files"></a>12. File / Document Locations

Relative to the project's top-level folder (e.g. `D:\Test_Dev\test9\Chrome_Starting-Page\`, or wherever you moved it).

```text
chrome-starting-page/
├── README.md            ← Korean reference document
├── README.en.md         ← This document (English reference)
├── GUIDE.md              ← Korean absolute-beginner guide
├── GUIDE.en.md           ← English absolute-beginner guide
├── README.html / README.en.html / GUIDE.html / GUIDE.en.html  ← browser-friendly versions of the 4 docs above (same content)
├── CHANGELOG.md          ← the original version history
├── LICENSE               ← the full MIT license text
├── package.json          ← project metadata, run scripts, minimum Node.js version
├── manifest.webmanifest  ← PWA ("install as app") configuration
├── index.html            ← page structure
├── script.js              ← frontend logic
├── style.css               ← styling/themes
├── sw.js                    ← service worker (offline caching)
├── server.js               ← the local backend server (Node.js)
├── port.conf                ← the currently configured port (default 1111)
├── .server.pid               ← records the running server's PID/port (auto-created/removed)
├── setup_windows.bat / setup_mac.sh   ← installer scripts
├── restart.bat / run_server_background.bat / set-port.bat / start_hidden.vbs  ← Windows operational scripts
├── uninstall.bat / uninstall_mac.sh   ← uninstaller scripts
├── data/                      ← ★ where ALL of your user data lives
│   ├── bookmarks.json / notes.json / config.json / todos.json
│   ├── ddays.json / events.json / usage.json / trash.json / pomo-stats.json
│   ├── backups/                ← automatic/manual backups
│   ├── icons/                    ← uploaded bookmark icons
│   └── profiles/                  ← saved settings profiles
└── assets/                       ← icons (icon-192.svg, etc.), uploaded background images
```

---

## <a id="workflow"></a>13. Workflow

From a user's perspective, here's the day-to-day (and one-time setup) flow.

```text
[One time]
  Download → run the installer → auto-start registration is done
       ↓
[Every day after that]
  Turn on your computer
       ↓ (Windows: registry Run key / macOS: LaunchAgent starts the server automatically)
  The server waits quietly in the background (no visible window)
       ↓
  Open a new Chrome tab, or visit http://localhost:1111
       ↓
  The dashboard appears → use bookmarks/todos/notes/calendar as normal
       ↓ (changes are auto-saved after a short 0.3–1s debounce)
  The server writes to data/*.json (atomic writes + automatic backups)
       ↓
[Shutting down]
  The server process shuts down too (a final backup runs on a clean exit)
```

If something goes wrong and you need to roll back:

```text
Data looks wrong
   → Settings → Data tab → pick a point in time from the backup list → Restore
   (or) since the server checks data integrity automatically on every boot,
   simply restarting often self-heals a corrupted file
```

---

## <a id="architecture"></a>14. Architecture

```text
┌───────────────────────────┐        HTTP (127.0.0.1:port)         ┌──────────────────────────────┐
│   Browser (Chrome, etc.)   │ ───────────────────────────────▶  │  Local server (server.js, Node) │
│                            │                                    │                                │
│  index.html                │ ◀─────────────────────────────── │  Node built-in http module only  │
│  script.js  (page logic)    │      static files + /api/* replies  │  zero npm dependencies             │
│  style.css                  │                                    │  bound to 127.0.0.1 only (no LAN)  │
│  sw.js (service worker cache)│                                    │  port: port.conf → CLI arg → 1111  │
│  localStorage (offline cache) │                                    └───────────────┬────────────────┘
└───────────────────────────┘                                                     │
                                                                                    ▼
                                                                     ┌───────────────────────────┐
                                                                     │   data/*.json (file storage) │
                                                                     │   atomic writes + write locks │
                                                                     │   automatic backups (backups/)│
                                                                     └───────────────────────────┘
```

- **Frontend**: plain HTML/CSS/JavaScript, no framework. All state is read and written through the server's `/api/*` endpoints, falling back to `localStorage` only when the server can't be reached.
- **Backend**: a single Node.js process built on the built-in `http` module. There is no database — every piece of data is a JSON file.
- **Auto-start layer**: a Windows registry Run key or a macOS LaunchAgent makes "turn on the computer, server turns on too" happen. This layer is purely an OS-level "auto-launch a program" mechanism — it never touches Chrome itself.
- **Offline layer**: the service worker (`sw.js`) caches only the 4 static files; all `/api/*` traffic is always network-first, talking to the live server directly.

---

## <a id="security"></a>15. Security / Data Flow

### 15.1 Every external destination this app talks to

| Destination | When it's called | Why it's needed |
|---|---|---|
| `fonts.googleapis.com`, `fonts.gstatic.com` (Google Fonts) | Every time the page loads | Displays the UI fonts (IBM Plex Sans KR, JetBrains Mono) |
| `google.com/s2/favicons`, `icons.duckduckgo.com`, `icon.horse`, and the bookmarked site's own `/favicon.ico` | When a bookmark card scrolls into view | A 4-step fallback chain for fetching bookmark icons |
| `api.openweathermap.org` | **Only if you've entered a weather API key in Settings** | Powers the weather widget; if you never add a key, this request is never made |
| The actual URLs of your own bookmarks | 30 seconds after load, then periodically (dead-link check, can be disabled in Settings) | Checks whether a bookmarked site is still reachable (sends only a `HEAD` request) |
| Google/Naver/YouTube/etc. | Only when you actually perform a search | Normal browser search behavior |

**That list is exhaustive.** A full review of the code found no ads, analytics, tracking, or "phone-home" telemetry that runs without your knowledge. The only automatic internet access anywhere is the Windows installer's one-time download of an official Node.js build from `nodejs.org`, and only when Node.js isn't already present.

### 15.2 Security properties of the server (`server.js`) itself

- **It only accepts connections on `127.0.0.1` (localhost).** No other device on your network — another computer, a phone — can ever reach this server.
- **The server itself never makes outbound calls to the wider internet.** The only "network activity" it performs is a loopback call to a previous instance of itself (again on `127.0.0.1`) telling it to shut down during a restart.
- **There is no authentication (no login).** This is by design, since it's a single-user local tool. That does mean any other program running on the same machine could reach this server's port and read/write its data — worth keeping in mind if you run untrusted software on the same computer.
- Path-traversal attempts (`../`-style access to parent folders) are blocked on every file upload/import/export path.
- Custom CSS is filtered to strip dangerous patterns — `expression()`, `javascript:` URLs, external `@import`, `behavior:` — before it's ever applied.
- Upload requests are capped at 10MB, so abnormally large requests are rejected automatically.

### 15.3 Where exactly is my data?

Entirely inside this project's own `data/` folder, as plain-text JSON files. Nothing is uploaded to the cloud, and nothing auto-syncs to another computer. Copy the whole folder and you can move everything to a new machine; delete the folder and the data is gone too (which is exactly why the automatic backup feature exists).

---

## <a id="troubleshooting"></a>16. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Server error" or "Server disconnected" shown in the top-left corner | The server process died, or is still starting up | Wait a moment (it auto-rechecks every 15 seconds) → if it doesn't recover, run `restart.bat` on Windows, or on macOS run `launchctl load ~/Library/LaunchAgents/com.dashboard.startpage.plist` |
| The page won't load at all ("This site can't be reached") | The server is off, or you're using the wrong port | Check `port.conf`, or look at the `port` field inside `.server.pid`, then visit `http://localhost:<that port>` |
| `setup_windows.bat` hangs or fails while downloading Node.js | No internet connection, or a firewall/antivirus is blocking the download | Check your connection and re-run. If it keeps failing, install Node.js yourself from <https://nodejs.org> and re-run the script (it will detect and use your system's Node.js) |
| macOS shows "Node.js is not installed" when running `setup_mac.sh` | Unlike Windows, macOS setup never installs Node.js automatically | Install Node.js first, per [Section 3](#requirements), then re-run the script |
| You updated the code/files but the page still shows the old version | The service worker (`sw.js`) has cached the old static files | A hard refresh (`Ctrl+Shift+R` on Windows, `Cmd+Shift+R` on macOS) usually fixes it. If not, open DevTools → Application (storage) tab → clear the cache/storage, then reload |
| A message says the port is already in use / the actual port isn't 1111 | Another program is already using port 1111, so the server auto-shifted to 1112, 1113, etc. | Check the actual port from the setup completion message or `.server.pid`, and use that address. To pin a specific port, use `set-port.bat` |
| Changed the port in Settings but nothing happened | A port change only takes effect after a restart | Run `restart.bat`, or use the "Restart server" button in Settings |
| "⚠ Save failed" appears | The connection to the server briefly dropped | No action needed — your change is held in the browser and will auto-save once the connection returns |
| Data looks wrong, or something's missing | File corruption, or an accidental deletion | Settings → Data tab → restore from a backup at the point in time you want. Recently deleted items can also be recovered from Trash (30-day retention) |
| You want to remove it completely | – | Windows: run `uninstall.bat` → choose whether to delete your data (Y/N, asked twice for safety). macOS: run `bash uninstall_mac.sh` → same choice |

---

## <a id="faq"></a>17. FAQ

**Q. Can I use this commercially (at a company, or bundled into a paid product)?**
A. Yes. It's MIT-licensed, so use, modification, redistribution, and even selling it are all permitted. You must, however, keep the original copyright notice intact. See [Section 18](#license) for details. (This is a plain-language summary — the exact legal terms are the `LICENSE` file itself.)

**Q. Does it work without an internet connection?**
A. Yes. The server, data storage, bookmarks/todos/notes/calendar/Pomodoro/habits all work fully offline. A few things that fetch external content — fonts (Google Fonts), bookmark icons, and (if configured) the weather widget — need internet to display correctly.

**Q. Is any of my bookmark/schedule data sent anywhere?**
A. No. Everything lives only in this computer's `data/` folder. [Section 15](#security) lists every single external address this app ever contacts.

**Q. Does this actually replace Chrome's real "New Tab" page?**
A. Not automatically. The installer only starts the server and registers auto-start — it never changes Chrome's own settings. You need to add this page's address yourself under `chrome://settings/onStartup` ("On startup"). Fully replacing Chrome's actual New Tab page requires a separate browser extension.

**Q. Can I access it from another device (my phone, another PC)?**
A. No — and that's intentional. The server only accepts connections on `127.0.0.1` (this machine, talking to itself), so other devices on the same Wi-Fi can't reach it. This is a deliberate security design choice.

**Q. How do I move my data to another computer?**
A. Settings → Data tab → "Export (JSON)" to get a backup file, then on the new computer, after installing, use "Import" in the same screen. Alternatively, just copy the whole `data/` folder over.

**Q. Do I need to know what Node.js is?**
A. Not on Windows — the installer downloads it for you if needed. On macOS you'll need to install it once yourself (see [Section 3](#requirements)); after that, you never need to think about it again.

**Q. Can I recover something I accidentally deleted?**
A. Yes. Right after deleting, `Ctrl+Z` undoes it. If some time has passed, check Trash under Settings → Data (30-day retention).

**Q. How do updates work?**
A. There is no automatic update-check feature. To update, download the newer version and keep (or copy over) your existing `data/` folder — the installer also makes a safety backup automatically before it runs.

---

## <a id="license"></a>18. Legal / Copyright / License / Commercial Use

> The following is a plain-language summary to aid understanding. **The `LICENSE` file included with this project is the legally authoritative text.** Please review it directly before making any significant commercial decision.

### 18.1 License text (MIT License, quoted verbatim)

```text
MIT License

Copyright (c) 2026 소담 AI 스튜디오

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

*(Copyright holder "소담 AI 스튜디오" romanizes to "Sodam AI Studio.")*

### 18.2 Plain-language breakdown

| Item | Detail |
|---|---|
| License type | MIT License (one of the most permissive open-source licenses) |
| Copyright holder | Sodam AI Studio (소담 AI 스튜디오), 2026 |
| **Commercial use** | ✅ **Allowed.** You may use this software, as-is or modified, in a business or personal venture, bundle it into a paid product or service, or resell it |
| **Modification** | ✅ Allowed. Freely change the code however you like |
| **Redistribution** | ✅ Allowed. Redistribute the original or a modified version to others |
| **Obligations** | ⚠️ Any copy — or substantial portion — you distribute must **include** the copyright notice above ("Copyright (c) 2026 소담 AI 스튜디오") together with the full license text |
| **Warranty** | ❌ **None.** Provided "AS IS," with no guarantee of fitness for any particular purpose or freedom from bugs |
| **Liability** | ❌ The copyright holder bears no legal liability for any claim or damages arising from using this software |
| **Trademarks** | This license covers the code only. "Chrome" is a trademark of Google LLC — this is an unofficial, independent project with no affiliation to Google |

### 18.3 One-line summary

**"Keep the copyright notice, and anyone — individual or company — may use, modify, and even sell this freely; but if something goes wrong, the author isn't liable."** That's the essence of the MIT License.
