# Chrome Starting Page — A Personal Chrome New-Tab Dashboard

![Version](https://img.shields.io/badge/version-7.4.1-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen) ![Dependencies](https://img.shields.io/badge/dependencies-0-orange)

> A **personal start screen** that appears the moment you open a new tab in Chrome.
> Bookmarks, to-dos, notes, D-Day countdowns, a calendar, and a Pomodoro timer — all
> in one screen, and every piece of data stays **inside your own computer**. No sign-up,
> no cloud upload, no ads.

This document is written so that even someone using **AI tools, messaging apps,
computers, or mobile/electronic devices for the very first time** can install and
use this project just by following along. Any technical term is explained on the
spot.

---

## Table of Contents

1. [What Is This Program?](#what-is-this-program)
2. [Prerequisites](#prerequisites)
3. [How to Download](#how-to-download)
4. [Quick Start (3 Steps)](#quick-start-3-steps)
5. [Installation (Detailed)](#installation-detailed)
6. [Running · Stopping · Restarting](#running-stopping-restarting)
7. [How to Use](#how-to-use)
8. [Commands & Scripts Reference](#commands-scripts-reference)
9. [How It Works (Architecture)](#how-it-works-architecture)
10. [Security & Data Flow](#security-data-flow)
11. [File & Document Locations](#file-document-locations)
12. [Development Workflow (Tests · Code Structure)](#development-workflow-tests-code-structure)
13. [What's New — Changelog Summary](#whats-new-changelog-summary)
14. [Troubleshooting](#troubleshooting)
15. [FAQ](#faq)
16. [Legal · Copyright · License · Commercial Use](#legal-copyright-license-commercial-use)
17. [Original Project & Acknowledgments](#original-project-acknowledgments)

---

## What Is This Program?

This program **completely replaces the screen you see when you open a new tab in
Chrome, with a page you control.** Unlike a typical "new tab extension," this
project is a tiny server that runs directly on your own computer, and Chrome
simply displays what that server shows. Because of that, your data never leaves
your machine for some unfamiliar company's cloud — everything is stored inside
your own hard drive, in the `data` folder.

One screen holds all of the following:

- Category-based **bookmark cards** (drag to reorder, split across multiple pages)
- A **to-do list** — priority, due dates, recurring schedules, subtasks, and a
  list view ↔ **Kanban board** toggle
- A **calendar** and **D-Day countdowns**
- A **notes/memo** widget (with Markdown preview)
- A **Pomodoro timer** and a **habit tracker**
- A **weekly report** — a popup summarizing the past week's activity, shown
  automatically the first time you open the dashboard each day
- **World clocks**, an optional **weather widget**, and **unified search**
  (Spotlight, with Korean initial-consonant fuzzy matching)
- Dark/light themes, glass-morphism effects, custom backgrounds and slideshows

**You don't need to know how to code.** Just follow the steps below and click along.

---

## Prerequisites

| Item | Required? | Notes |
|---|---|---|
| Windows 10/11 or macOS | Required | The operating system this runs on. (Linux can run the server itself, but there is no auto-start script for it.) |
| Chrome (or another Chromium-based browser like Edge) | Required | The window this project uses as your new-tab page. |
| Node.js (v18 or newer) | **May not be needed** | If you already have it, the setup script uses it. If not, the Windows installer **downloads it automatically** for you (see below). |
| Internet connection | Required once during setup; optional after | Needed to auto-download Node.js. Once set up, core features work fully offline — the on-screen fonts are loaded from Google Fonts, so offline they simply fall back to your system's default font (no loss of function). The optional weather widget also needs internet. |
| Account sign-up / payment info | Not required | This program never asks you to create an account. |

> **What is "Node.js"?** It's a runtime that lets a programming language called
> JavaScript run directly on your computer, outside a browser. This entire
> project is a single server built on Node.js. You don't need to understand it
> to install or use this project.

---

## How to Download

1. Go to the GitHub repository page: **https://github.com/sodam-ai/Chrome-Starting-Page**
2. Click the green **`Code`** button.
3. Click **`Download ZIP`**. (If you're comfortable with Git, `git clone` works too.)
4. Extract the downloaded zip file wherever you like, e.g. `C:\Dashboard`.
   - **Note**: a folder path containing spaces or non-English characters can
     cause problems in some environments. A short, English-letters-and-numbers-only
     path is recommended.

---

## Quick Start (3 Steps)

**On Windows**

1. In the extracted folder, **double-click `setup_windows.bat`**.
2. A black console window opens and installs everything automatically. Wait for
   it to finish (usually a few seconds to a minute; up to 1–2 minutes if Node.js
   needs to be downloaded).
3. Open Chrome, go to `chrome://settings/onStartup`, choose "Open a specific
   page or set of pages," and add the address shown at the end of setup
   (default: `http://localhost:1111`).

**On macOS**

1. Open the Terminal app.
2. Navigate to the extracted folder and run, in order:
   ```bash
   chmod +x setup_mac.sh
   ./setup_mac.sh
   ```
3. In Chrome's settings, set your start page to `http://localhost:1111`.

From now on, this dashboard appears every time you open a new tab or launch Chrome.

---

## Installation (Detailed)

### Windows — What `setup_windows.bat` actually does

A single double-click runs these 5 steps in order:

1. **Protects your existing data**: if `data\bookmarks.json` already exists (a
   reinstall), it is left untouched, and an extra safety backup
   (`data\backups\safety-before-setup.json`) is created. On a fresh install, the
   required empty folders (`data`, `data\backups`, `data\icons`, `data\profiles`,
   `assets`) are created. **Re-running setup never deletes existing bookmarks or
   settings.**
2. **Checks for Node.js**: it looks for ① a portable Node.js already downloaded
   into this folder, then ② a system-wide Node.js install. If neither is found,
   it automatically downloads a portable version (~30MB) from the official
   nodejs.org distribution into this folder's own `node\` subfolder — this does
   not touch anything system-wide.
3. **Stops any existing server**: if a previous instance is running (reinstall
   or update scenario), it is shut down safely first.
4. **Registers auto-start**: so the dashboard launches automatically when you
   log in, **two** methods are registered at the same time — ① a Windows
   Registry login-startup entry, and ② a shortcut (`.lnk`) file in the Startup
   folder. Why both at once is explained in [Security & Data Flow](#security-data-flow).
5. **Starts the server**: launched in the background, with no visible window.

When setup finishes, it prints the address to use, which kind of Node.js was
used (system or portable), and confirms your data was preserved.

### macOS — What `setup_mac.sh` actually does

1. Locates the system's installed Node.js (if none is found, it prints a
   message and exits — macOS has no auto-download step, so you'll need to
   install Node.js from [nodejs.org](https://nodejs.org) first).
2. Generates a `com.dashboard.startpage.plist` file with paths matching your
   current folder, and copies it into `~/Library/LaunchAgents/`. This is
   macOS's way of registering "run automatically at login" (a LaunchAgent).
3. Runs `launchctl load` to start the server immediately.

### Do I need administrator privileges?

**No.** Both scripts only touch per-user areas (the Registry key is under
`HKCU`, meaning "current user only"; on macOS, `~/Library/LaunchAgents` is a
personal folder), so they run fine under a normal user account.

---

## Running · Stopping · Restarting

Once installed, the server starts automatically every time you turn your
computer on, so you normally never need any of this. It's here for when you
want to control things manually.

| I want to... | Windows | macOS |
|---|---|---|
| Restart right now | Double-click `restart.bat` | `launchctl kickstart -k gui/$(id -u)/com.dashboard.startpage` |
| Turn it off completely | Dashboard Settings (⚙️) > Server > Shutdown, or run `uninstall.bat` | `launchctl unload ~/Library/LaunchAgents/com.dashboard.startpage.plist` |
| Start quietly with no window | Double-click `run_server_background.bat` | Already runs in the background by default |
| Change the port (address) | Double-click `set-port.bat` and enter a new port number | Edit the `port.conf` file with a text editor and change the number |
| Remove it completely | Double-click `uninstall.bat` | Run `uninstall_mac.sh` |

After changing the port you must restart the server for it to take effect —
and remember to also update Chrome's start-page address to the new port.

---

## How to Use

### First screen

After installing, your first visit shows a short onboarding tutorial. You can
skip it — every feature can always be found later through Settings (the gear
icon ⚙️ in the top right).

### Adding bookmarks

- Paste a URL into the empty input at the bottom of any card and press Enter —
  the fastest way.
- Drag the site icon/lock icon from your browser's address bar and drop it
  onto a card.
- Press `Ctrl+V` anywhere on the page — it recognizes a URL on your clipboard
  and asks which category to file it under.
- Right-click a bookmark for edit, change-icon, move-to-another-page, and
  delete options.
- Hold `Ctrl` and click multiple bookmarks to move or delete several at once.

### Unified search (Spotlight)

Press **`F`** on your keyboard to open the search box. It searches bookmarks,
to-dos, notes, and events all at once, and understands Korean initial-consonant
input (e.g. typing "ㄴㅇㅂ" finds "네이버"). Typing a `>`-prefixed command like
`>settings`, `>theme`, or `>timer` jumps straight to that feature.

### To-dos / Calendar / D-Day / Notes / Pomodoro

Use the `+` button in the top-right corner of each widget card to add a new
item. To-dos support priority, due dates, tags, recurrence (daily/weekly/
biweekly/monthly), and subtasks. The Pomodoro timer automatically cycles
25 minutes of focus and 5 minutes of break, and every session is logged to
your stats.

Once your to-do list passes 10 items, a **"Kanban view"** button appears below
the card. Click it to switch to a **Kanban board** grouped by status (e.g.
To Do / In Progress / Done) — drag a card into another column to change its
status. Click "List view" at the top of the board to switch back.

The first time you open the dashboard each day, a **weekly report** popup
appears automatically, summarizing the past week's activity (such as how many
to-dos you completed). Once dismissed, it won't reappear until the next day.

### Customizing the look (Settings > Theme)

Choose dark, light, or automatic (follows your OS setting); 6 accent colors;
3 levels of glass effect (clear / normal / frosted) plus a blur-intensity
slider; 4 layout presets (Default / Compact / Wide / Magazine); and even
inject your own custom CSS. Backgrounds can be a single uploaded image
(Settings > Background) or a slideshow of multiple images, with a
configurable rotation interval from 1 minute to 24 hours.

### Exporting, importing, and restoring backups

Under Settings > Data:

- **Export**: downloads all your data as a JSON file. You can choose whether
  to include background/icon images.
- **Import**: restores from a previously exported JSON file. Before applying,
  it shows a summary like "42 bookmarks, 15 to-dos, 3 notes."
- **Automatic backups**: the server backs up all your data by itself on a
  configurable interval (default 24 hours, adjustable 1–168 hours). Pick any
  point in the backup list to restore everything to that moment in one click.
- **Profiles**: save your entire bookmark/notes/to-do/D-Day/settings setup
  under a name, and switch between different profiles (e.g. "Work" vs.
  "Personal").

---

## Commands & Scripts Reference

| File | Platform | What it does |
|---|---|---|
| `setup_windows.bat` | Windows | Installs, registers auto-start, and launches the server (first run, or reinstall) |
| `uninstall.bat` | Windows | Stops the server, removes auto-start, optionally deletes data |
| `restart.bat` | Windows | Restarts the server (prints status to a console window) |
| `run_server_background.bat` | Windows | Starts the server quietly, with no window |
| `set-port.bat` | Windows | Changes the port (saved to `port.conf`) |
| `start_hidden.vbs` | Windows | Used internally by auto-start — you never need to run this yourself |
| `setup_mac.sh` | macOS | Installs, registers a LaunchAgent for auto-start, and launches the server |
| `uninstall_mac.sh` | macOS | Stops the server, removes the LaunchAgent, optionally deletes data |

**For developers**, from a terminal/PowerShell in the project folder:

```bash
node server.js          # Run the server directly (default port 1111)
node server.js 8080     # Run on port 8080 instead
npm start                 # Same as above (package.json's start script)
npm test                  # Run the 17 automated tests (Node's built-in test runner)
npm run check:xss         # Run the advisory scanner for missing output-escaping
```

---

## How It Works (Architecture)

```
[Chrome, a new tab]
        │  http://127.0.0.1:1111
        ▼
[server.js] ── uses only Node.js's built-in http module (0 npm dependencies)
        │
        ├─ Serves static files: index.html, style.css, script.js
        │   (in-memory cache + gzip compression + ETag to minimize re-fetches)
        │
        ├─ Serves a JSON REST API: /api/bookmarks, /api/todos, /api/config, etc.
        │   GET  = read data
        │   POST = write data (only after verifying the request's origin)
        │
        └─ Reads and writes data/*.json files directly (no database server)
```

- **Server**: a single file, `server.js`. It uses only modules built into
  Node.js itself — `http`, `fs`, `path`, `zlib`, `crypto`, `net`,
  `child_process`. **Not one external library needs to be `npm install`ed.**
- **Client (what you see)**: just three files — `index.html`, `style.css`, and
  `script.js` (roughly 240,000 characters). There's no framework like React or
  Vue and no build step; the browser reads and runs these files as-is.
- **Storage**: instead of a database server (MySQL, MongoDB, etc.), data is
  read from and written directly to plain JSON text files inside the `data/`
  folder — one file per feature (bookmarks, to-dos, settings, and so on).
- **Reachability**: the server only accepts connections on `127.0.0.1` (aka
  "localhost," the special address meaning "this computer, talking to
  itself"). No other computer or phone on the same Wi-Fi network can reach
  this address — it only ever opens on this one machine.
- **Port**: 1111 by default. If something else is already using port 1111, it
  automatically tries 1112, 1113, and so on, up to 10 ports, until it finds a
  free one.
- **Offline support**: a service worker (`sw.js`) pre-caches the screen's own
  files, so the dashboard's interface keeps opening even without internet
  (saving data still requires the server to be running — but since the server
  runs on this computer, that has nothing to do with your internet connection).
- **Outbound internet traffic**: this app makes exactly two kinds of requests
  to the outside world. ① **Fonts**: the IBM Plex Sans KR and JetBrains Mono
  fonts used in the design are loaded from Google Fonts
  (`fonts.googleapis.com`, `fonts.gstatic.com`) — offline, the browser simply
  falls back to your system's default font, with no loss of function.
  ② **Weather widget** (optional): only if you've entered your own API key in
  Settings, it sends a city name to OpenWeatherMap to fetch weather data.
  Outside of these two, nothing — no ads, tracking scripts, or analytics of
  any kind — is ever sent to an external server.

---

## Security & Data Flow

Because this program is "a server on your own computer that's always running
in the background," it needed a different security posture than a typical
new-tab extension. Everything below is a protection that is **actually
implemented in the code — and has been reproduced and verified directly**, as
of v7.4.

| Threat | Mitigation |
|---|---|
| Someone on another computer viewing or tampering with your dashboard data | The server only accepts connections on `127.0.0.1` (localhost), so access from outside this machine is impossible by design. |
| A malicious website silently overwriting your bookmarks/to-dos through your own browser (CSRF) | Every request that changes state (POST) is checked against the `Origin` header your browser sends along with it (the address of the site that made the request). If it's present and doesn't match the server's own address, the request is rejected immediately (403). |
| A bookmark storing a dangerous address like `javascript:` that runs code when clicked | Bookmark URLs are checked against an allowlist of five schemes only — `http`, `https`, `ftp`, `ftps`, `mailto` — validated independently on both the client and the server. |
| Manipulated text (titles, notes, dates, etc.) executing as a script when rendered (XSS) | Every value rendered to the screen passes through an `esc()` function that replaces the five HTML-significant characters `& < > " '` with safe equivalents. This function lives in exactly one place, `lib/esc.js`, and is covered by automated regression tests. |
| A file upload planting a file outside the intended folder (path traversal) | Both upload and restore paths reject `..` and `~` patterns, re-verify that the final resolved path is strictly inside an allowed folder, and only accept image file extensions. |
| An oversized request hanging or crashing the server | Every request body is capped at 10MB, and exceeding it returns a proper error response (413) instead of hanging. |
| Data files getting corrupted from simultaneous writes across multiple windows | Per-file write locks plus atomic writes (write to a temp file, then rename) mean a mid-write crash can never leave a half-written, corrupted file. |
| A data file becoming corrupted for any reason | On every server start, all 9 data files are validated, and any corrupted file is automatically restored from the most recent valid backup (or a safe empty default if no backup exists). |

**Why register auto-start two different ways?** Some antivirus software
flags "a script silently launched at every login" as resembling a common
malware persistence technique, and removes the registration. To guard
against that, both the Registry entry and the Startup-folder shortcut are
registered at the same time, and every time the server starts, it checks
whether either one has gone missing and quietly re-registers it
(`ensureAutoStart()` in `server.js`). This self-healing only activates in a
folder that carries the marker file (`.autostart-installed`) left behind by
a real install, so a development copy of this project can never
accidentally hijack the real auto-start registration.

**One low-severity gap, now fixed**: six places in `server.js` (profile
save/load/delete, backup restore, import, and the port-change endpoint) used
to return a raw filesystem error message in their response if something went
wrong internally, which could include a fragment of an internal file path.
All six now return a generic, safe message to the client, and the real error
detail is only ever logged to the server's own console.

**Where your data actually lives**: see the [File & Document Locations](#file-document-locations)
table below. It's all on your own hard drive — nobody, including this
project's developers, can reach it over the internet.

---

## File & Document Locations

```
Chrome-Starting-Page/
├── index.html              Page skeleton (HTML)
├── style.css                 Visual design (CSS)
├── script.js                 All client-side behavior (JavaScript)
├── server.js                 The server itself (Node.js)
├── manifest.webmanifest      PWA ("install as an app") configuration
├── sw.js                     Service worker for offline support
├── lib/
│   ├── esc.js                 XSS-prevention escape function (shared by server + client)
│   └── validators.js          URL / backup-interval validation logic (shared by server + tests)
├── test/
│   ├── esc.test.js             Regression tests for esc()
│   └── validators.test.js      Regression tests for validation logic
├── tools/
│   └── check-unescaped-html.js   Advisory scanner for missing output-escaping
├── data/                     ← Where your actual data is stored
│   ├── bookmarks.json          Bookmarks
│   ├── notes.json              Notes
│   ├── config.json             All settings
│   ├── todos.json               To-dos
│   ├── ddays.json               D-Days
│   ├── events.json              Calendar events
│   ├── usage.json               Bookmark-usage statistics
│   ├── trash.json               Trash (auto-deleted after 30 days)
│   ├── pomo-stats.json          Pomodoro session history
│   ├── backups/                 Automatic backup files
│   ├── icons/                   Uploaded custom bookmark icons
│   └── profiles/                Saved profiles
├── assets/                   Background images, PWA icons
├── setup_windows.bat / uninstall.bat / restart.bat / set-port.bat  ← Windows scripts
├── setup_mac.sh / uninstall_mac.sh                                   ← macOS scripts
├── package.json                Project metadata (version, license, etc.)
├── CHANGELOG.md                 Full version history
├── LICENSE                      License text (MIT)
├── README.md                    Korean version of this document
└── README.en.md                 This document (English)
```

Files like `.autostart-installed`, `.server.pid`, `port.conf`, and
`server.log` are internal state the running server manages on its own — you
never need to edit them by hand.

---

## Development Workflow (Tests · Code Structure)

This section is for anyone who wants to read or modify the code. If you're
just using the app, feel free to skip it.

- **There's no build step.** No transpiler (Babel, etc.) and no bundler
  (Webpack, etc.) — edit a file, save it, and the change is live. Just
  refresh the browser (or restart the server).
- **Tests**: `npm test` runs Node's built-in test runner (`node --test`).
  There are currently 17 tests (`test/esc.test.js` has 6, `test/validators.test.js`
  has 11) locking down the key scenarios — normal values, edge cases, and
  malicious input — for the XSS-escaping function and the URL/backup-interval
  validation logic. No separate framework like Jest or Mocha needs to be
  installed.
- **Advisory tool**: `npm run check:xss` scans `script.js` for places that
  render a value to the screen without going through `esc()`, and lists them
  as candidates. It's a heuristic, not a perfect automatic verdict — treat
  its output as "a list a human should double-check," not a pass/fail gate.
- **Found a bug?** Please open it on the GitHub repository's Issues tab, with
  steps to reproduce it.

---

## What's New — Changelog Summary

Expand any version below to see its details. The full history lives in
[`CHANGELOG.md`](./CHANGELOG.md).

<details>
<summary><b>v7.4.1 (2026-09-01) — Fixed internal-path disclosure in error responses</b></summary>

- Removed a low-severity gap in 6 endpoints (profile save/load/delete, backup
  restore, import, port change) where an internal server path could leak into
  an error response — clients now always get a safe, generic message, and the
  real error is logged only to the server's own console

</details>

<details>
<summary><b>v7.4 (2026-09-01) — Security hardening · auto-start reliability</b></summary>

**Security**
- Reproduced and fixed, at the root cause, a CSRF vulnerability that let a
  malicious website silently overwrite your data through your own browser
  (added Origin-header validation)
- Distinguished between malformed JSON and validly-formed-but-invalid data in
  error responses
- Fixed a bug where oversized requests never got a proper error response at
  all (413 handling now works correctly)
- Found and fixed 4 places where a value was rendered to the screen without
  escaping (to-do due dates, D-Day dates)
- Extracted the escaping/validation logic into `lib/`, locked it down with
  automated tests, and added a scanner for future gaps

**Reliability**
- Windows auto-start is now registered two ways at once (Registry + Startup
  folder shortcut)
- The server now checks, on every startup, whether its own auto-start
  registration is still intact, and repairs it if not
- Fixed a conditional-logic bug in the installer that silenced its own
  success/failure message entirely

</details>

<details>
<summary><b>v7.3 (2025-03-19) — Unified background system · data safety</b></summary>

- Unified background/slideshow system with automatic migration
- Pin bookmarks to the top, drag them onto page tabs, drag-to-sort to-dos
- Server-side data integrity check (auto-recovers corrupted files from backup), backup list + restore UI
- Import preview, export-complete notifications, 10-level undo
- Automatic port fallback, auto-stopping a previous server instance, stale PID-file cleanup
- Auto-reconnect (15s → 5s), an offline banner, real-time sync across open tabs
- Keyboard focus visibility, ARIA labels, a print stylesheet, mobile responsiveness (768px)
- Complete README rewrite, added `.gitattributes` (consistent line endings)

</details>

<details>
<summary><b>v7.2 (2025-03) — Multiple to-do cards</b></summary>

- Create multiple independent to-do cards
- Rename/delete cards individually, drag to-dos between cards

</details>

<details>
<summary><b>v7.1 (2025-03) — Card-based notes system</b></summary>

- Notes are now managed as cards, each with its own title, line count, and order
- Markdown preview inside notes (bold, code, links)

</details>

<details>
<summary><b>v7.0 (2025-02) — Habit tracker · layout presets</b></summary>

- A habit checklist that resets every midnight
- 4 layout presets, automatic Pomodoro work/break cycling
- Search keyword shortcuts (`yt cats`, `nv weather`, etc.), 10-minute-before event notifications
- Per-category card colors, 3 glass-effect presets plus a blur slider

</details>

<details>
<summary><b>v6.0 (2025-02) — Calendar · Pomodoro · profiles</b></summary>

- Monthly/weekly calendar, 25-minute Pomodoro timer
- Save and switch between multiple dashboard setups as profiles
- Multi-select for bulk move/delete, double-click inline rename
- Unified search (Spotlight, `F` key), Korean initial-consonant search, command mode (`>settings`, etc.)
- Category emoji, list view mode, an onboarding tutorial

</details>

<details>
<summary><b>v5.0 (2025-02) — Multiple pages · weather · server stability</b></summary>

- Split bookmarks across multiple tabbed pages, D-Day countdowns, world clocks
- Weather widget (OpenWeatherMap, optional), automatic dark/light theme
- Atomic file writes, a smart backup-retention policy, server restart/port-change APIs

</details>

<details>
<summary><b>v4.0 (2025-02) — Advanced card management</b></summary>

- Drag-to-reorder and collapsible categories, resizable cards, a right-click context menu
- A 30-day-recoverable trash bin, a "NEW" badge on recently added items
- Custom background/icon uploads, a write lock preventing concurrent-save corruption

</details>

<details>
<summary><b>v3.0 and earlier (2025-02, initial versions)</b></summary>

- v3.0: to-do list (priority, recurrence, subtasks), card-based notes
- v2.0: dark/light theme, glass effects, gzip compression, ETag caching
- v1.0: initial release — a server built from nothing but Node's built-in
  modules, category-based bookmark cards, Windows/Mac auto-start, JSON-file
  storage

</details>

---

## Troubleshooting

| Symptom | Cause & fix |
|---|---|
| A new tab doesn't show the dashboard at all | The server may be off. Restart it with `restart.bat` (Windows) or `launchctl load ~/Library/LaunchAgents/com.dashboard.startpage.plist` (Mac). Also try typing `http://localhost:1111` directly into the address bar. |
| Auto-start stops working after a reboot | As of v7.4 the server tries to self-repair this automatically (see [Security & Data Flow](#security-data-flow) for how), but if it still happens, run `setup_windows.bat` again to re-register. If your antivirus keeps removing it, try adding this folder as an exception in your antivirus settings. |
| "Port already in use" error | The server automatically tries 1112, 1113, and so on, so this usually resolves itself. Check the actual port number shown when setup finished, and update Chrome's start-page address to match. |
| Bookmarks/settings suddenly disappeared | Don't panic — open Settings > Data > Backup list. The server keeps making periodic backups automatically, so picking a recent one and clicking "Restore" recovers most situations. |
| Uploading a file gives a "Bad type" error | Background/icon images only accept `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif` (icons also accept `.svg`, `.ico`). Convert the file with an image editor and try again. |
| "File too large" / a 413 error | Request bodies (including uploads) are capped at 10MB. Try a smaller file. |
| The weather widget isn't showing | It's optional. Enter your own OpenWeatherMap API key under Settings > Weather (free to obtain) to enable it. It's expected behavior for the widget to stay hidden until a key is entered. |
| The installer says "download failed" | Automatically downloading Node.js requires internet access. Check your connection and try again, or install Node.js manually from [nodejs.org](https://nodejs.org) and re-run the script. |
| Can't reach it from another computer or phone | That's expected. The server is designed, for security, to only ever open on the exact computer it's running on (see [How It Works (Architecture)](#how-it-works-architecture)). |
| The problem persists | Open `server.error.log` in the project folder — it records what actually went wrong. Paste that content into a new GitHub Issue and we can help from there. |

---

## FAQ

**Q. Is my bookmark or note data sent to the developer?**
A. No. There is no code anywhere in this project that sends your actual data —
bookmarks, notes, to-dos, and so on — anywhere else. The exceptions are the
Google Fonts used for on-screen text, and the optional weather widget (which
only sends a city name, and only if you've entered your own API key) — see
"Outbound internet traffic" in [How It Works (Architecture)](#how-it-works-architecture)
for details. All of your actual data is stored only inside your `data/` folder.

**Q. I want to see the same bookmarks on another computer.**
A. Export a backup under Settings > Data > Export, then Import it after
installing on the other computer. There is no real-time automatic sync
feature — that's a deliberate consequence of not using any cloud server.

**Q. Does this work in browsers other than Chrome (Edge, Whale, etc.)?**
A. Yes. Any Chromium-based browser lets you set a new-tab address the same
way, so it should work without issues. Firefox and Safari set their new-tab
page differently and haven't been officially tested.

**Q. If I uninstall, is my data deleted too?**
A. Running `uninstall.bat` / `uninstall_mac.sh` explicitly asks whether to
keep or delete your data. If you simply delete the whole folder yourself,
the files inside `data/` go with it — so it's a good idea to export a backup
first.

**Q. Will this slow down my computer?**
A. The server is a tiny Node.js program with zero npm dependencies, so its
memory footprint is small (typically tens of megabytes). The screen's static
files are served from an in-memory cache with gzip compression for fast
responses.

**Q. Can I use this commercially? Can I build and sell a product based on
this code?**
A. See [Legal · Copyright · License · Commercial Use](#legal-copyright-license-commercial-use) below.

**Q. I found a security vulnerability — where do I report it?**
A. Please open it on the GitHub repository's Issues tab. For something
sensitive, contacting the repository owner directly instead of a public
issue is also an option.

---

## Legal · Copyright · License · Commercial Use

This project is distributed under the **[MIT License](./LICENSE)**.
Copyright is held by **SoDam AI Studio** (© 2026).

The MIT License is a very permissive open-source license. In summary
(**the following is a general, plain-language explanation, not legal
advice** — always refer to the [full LICENSE text](./LICENSE) for your
exact rights and obligations):

- ✅ You may **use it freely** — personally or commercially.
- ✅ You may **modify it freely**.
- ✅ You may **redistribute it**, whether for free or for a price.
- ✅ You may use it **commercially** — the license itself permits building
  and selling a product based on this code.
- ⚠️ When redistributing, you must **include the original copyright notice
  and the full license text** (i.e. ship the `LICENSE` file alongside it).
- ⚠️ The software is provided **"AS IS," with no warranty of any kind**. The
  copyright holder is not liable for any issues that arise from using it.

**Privacy**: this program itself does not collect any personal data from
you — everything is stored locally only. However, bookmark URLs or note
content that you type in yourself may contain personal information, so
please review the contents yourself before sharing an exported backup file
with anyone else.

---

## Original Project & Acknowledgments

This project started from **kinkos1234**'s open-source repository,
**[chrome-starting-page](https://github.com/kinkos1234/chrome-starting-page)**.
Deep thanks to the original author for the core new-tab-dashboard idea and
the initial structure.

Since then, this repository has gone through substantial changes — security
hardening (CSRF protection, XSS-escaping hardening, URL scheme validation),
auto-start reliability improvements (dual registration plus self-healing),
data-integrity checks, an automated test suite, and a full documentation
rewrite — and is now maintained separately by **SoDam AI Studio** at
`sodam-ai/Chrome-Starting-Page`.

The original repository had no license file specified, and **personal,
direct permission from the original author was obtained** to continue,
publish, and modify this project. (This paragraph is a factual disclosure,
not legal advice. If you need a precise understanding of the copyright
relationship, please consult the original author or a legal professional
directly.)

---

<div align="center">

**[⬆ Back to Table of Contents](#table-of-contents)** · [한국어 버전](./README.md)

</div>
