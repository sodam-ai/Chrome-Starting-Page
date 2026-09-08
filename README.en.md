# Chrome Starting Page — A Personal Chrome New-Tab Dashboard

![Version](https://img.shields.io/badge/version-7.5.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen) ![Dependencies](https://img.shields.io/badge/dependencies-0-orange)

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
  to include background/icon images. If you run on a port other than the
  default 1111, **that port setting is included too** (since v7.5.0).
- **Import**: restores from a previously exported JSON file. Before applying,
  it shows a summary like "42 bookmarks, 15 to-dos, 3 notes." A port setting
  in the backup is restored as well; if it differs from the port you are on,
  a notice explains that the address will change after a restart. Backup files
  are accepted up to 100MB (background photos make full backups large).
- **Automatic backups**: the server backs up all your data by itself on a
  configurable interval (default 24 hours, adjustable 1–168 hours). Pick any
  point in the backup list to restore everything to that moment in one click.
- **Profiles**: save your entire bookmark/notes/to-do/D-Day/settings setup
  under a name, and switch between different profiles (e.g. "Work" vs.
  "Personal").

### Moving the folder, or reinstalling somewhere new (important)

**This program works regardless of the folder's name or location.** Every path
inside it is resolved relative to the folder the files sit in, so you can move
it to `D:\MyDashboard`, rename it, or put it on a USB stick and it still runs.

**What differs is *what you copied*.** This is where nearly all confusion comes
from, so please read the distinction carefully.

| How you moved it | Do bookmarks/settings come along? | Why |
|---|---|---|
| Copying the whole folder (File Explorer, USB, backup tool) | **Yes** | The `data` folder is copied along with everything else. This is the most reliable method. |
| `Download ZIP` or `git clone` from GitHub | **No** | The repository contains **program code only**. Your bookmarks and settings are personal data and are deliberately excluded from it (`.gitignore`), so a freshly downloaded folder starts as a brand-new installation. |

**So the safe way to move is:**

1. **Before moving**, open the dashboard in the *old* folder and click
   Settings > Data > **Export**. Save the backup file
   (`dashboard-backup-<date>.json`).
2. Install and run the program in the new folder (it is normal for it to look
   empty at first).
3. In the new dashboard, click Settings > Data > **Import** and upload the file
   from step 1. Bookmarks, notes, to-dos, settings, icons, background photos and
   the port setting all come back.

> **Why does the new folder look empty at first?** Nothing is broken — you are
> in the second row of the table above (code only was copied). The `data` folder
> in your old location is still there, so nothing has been lost; just follow the
> three steps.

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
npm run docs              # Regenerate the HTML READMEs from the Markdown sources
npm run docs:check        # Only verify the HTML matches the Markdown (fails if stale)
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
- **Outbound internet traffic**: the app makes three kinds of requests to the
  outside world, and nothing else — no ads, tracking scripts, or analytics of
  any kind. All three are sent **by your browser**; this project's own server
  never sends anything out.

  ① **Fonts**: the IBM Plex Sans KR and JetBrains Mono fonts used in the design
  are loaded from Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) —
  offline, the browser simply falls back to your system's default font, with no
  loss of function.

  ② **Bookmark icons (favicons)**: to show a site's icon on its bookmark card,
  the page requests it from these three services in order (falling through to
  the next one if a request fails):

  - `https://www.google.com/s2/favicons?sz=64&domain=<domain>` (Google)
  - `https://icons.duckduckgo.com/ip3/<domain>.ico` (DuckDuckGo)
  - `https://icon.horse/icon/<domain>` (icon.horse)

  **This means the domain name of each bookmark (e.g. `mail.naver.com`) is sent
  to those providers.** The full URL (path, query string), the bookmark's title,
  and your note contents are not — only the domain. If you would rather avoid
  this, upload your own icons instead (`data/icons/`), or block those domains
  with an extension or firewall: only the icons change to a default shape, and
  everything else keeps working.

  ③ **Weather widget** (optional): only if you have entered your own API key in
  Settings, it sends a city name and that key to OpenWeatherMap
  (`api.openweathermap.org`). Without a key the widget is hidden and no request
  is made at all.

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
| An oversized request hanging or crashing the server | Request bodies are capped at 10MB, and exceeding it returns a proper error response (413) instead of hanging. Backup import (`/api/import`) is the single exception at 100MB — a full backup containing background photos easily exceeds 10MB, which previously meant **the app could not read a backup it had produced itself** (fixed in v7.5.0). |
| Reading your data by typing a file path into the browser's address bar | Files under `data/` ending in `.json` (bookmarks, settings, backups) and any file beginning with a dot are refused (403). Only the icons and background images the page genuinely needs are served. Before v7.5.0, a URL such as `http://localhost:1111/data/config.json` returned the entire settings file, including the weather API key. |
| Settings and bookmarks drifting apart, leaving the screen looking empty | Categories that no page lists are recovered onto the first page, and the dashboard reports how many were restored (v7.5.0). This prevents the situation where the data is perfectly intact but nothing renders, which looks exactly like total data loss. |
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
│   ├── check-unescaped-html.js   Advisory scanner for missing output-escaping
│   └── build-readme-html.mjs     README.md → README.html generator (keeps both in sync)
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

**Do not hand-edit the HTML documents.** `README.html` and `README.en.html` are
generated from `README.md` / `README.en.md` (`npm run docs`). Edit the Markdown
and regenerate, and the two formats stay identical by construction.

**To inspect files in the `data` folder**, open them in your file manager rather
than the browser address bar — for security they are not served over HTTP (see
[Security & Data Flow](#security-data-flow)).

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
- **Documentation build**: `npm run docs` regenerates the HTML READMEs from
  `README.md` / `README.en.md`, and `npm run docs:check` fails if the committed
  HTML no longer matches — which catches the easy mistake of editing the
  Markdown and forgetting the HTML. The generator
  (`tools/build-readme-html.mjs`) has no external dependencies either.
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
<summary><b>v7.5.0 (2026-09-08) — Safe folder moves · blocked data exposure · recovered vanished bookmarks</b></summary>

**Security**
- Typing a path such as `/data/config.json` straight into the address bar used to
  return the settings file (including the weather API key), your bookmarks, and
  every automatic backup. Those are now refused (403), including case-variant and
  percent-encoded bypass attempts. Icons and background images the page actually
  needs are still served
- Dotfiles (`.server.pid`, `.gitignore`, and similar internal files) are no longer
  reachable by URL either

**Data preservation**
- **Bookmark categories that no page listed were invisible on screen** even though
  the data was perfectly intact — they are now recovered onto the first page, and
  the dashboard tells you how many were restored. This removes the situation that
  looks exactly like "everything is gone" when nothing was actually lost
- Backup import limit raised to 100MB — a full backup with background photos
  exceeds 10MB, which meant **the app could not read a backup it had made itself**
- A damaged backup with a malformed section used to overwrite that part with an
  empty value, destroying data. Imports are now **fully validated before anything
  is written**, and rejected outright if any section is malformed
- Import failures used to say only "import failed"; the actual reason (such as
  exceeding the size limit) is now shown

**Moving folders**
- Export/import now **carry the port setting**, so anyone running on a non-default
  port keeps the same address after moving to a new folder (applied on restart,
  with a notice that the address will change)
- New README section on [moving the folder or reinstalling](#moving-the-folder-or-reinstalling-somewhere-new-important),
  explaining why copying the whole folder brings your data but a GitHub download
  does not, and what to do about it

**Docs**
- `README.html` / `README.en.html` are now generated from the Markdown sources
  (`npm run docs`, verified by `npm run docs:check`), so the two formats cannot
  drift apart
- Corrected an inaccurate privacy statement: the README claimed only two kinds of
  outbound traffic, but bookmark favicons are fetched from three third-party
  services, which sends each bookmark's domain to them. This is now documented in
  full, along with how to avoid it

</details>

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
| I installed into a new folder and none of my bookmarks/settings came along | Nothing is broken. A folder downloaded from GitHub contains **program code only**, not your personal data. Your old folder still has everything, so follow the three steps (export → install → import) in [Moving the folder, or reinstalling somewhere new](#moving-the-folder-or-reinstalling-somewhere-new-important). |
| Unzipping produced two nested folders with the same name | GitHub ZIP files contain one extra folder level. Using "Extract here" gives you `name\name\files`. Look for the **inner** folder that actually contains `setup_windows.bat` and run the installer from there. |
| The screen shows no bookmarks at all, but they exist in my backup file | Since v7.5.0 these are recovered automatically with a "recovered N categories" notice. If they still don't appear, restore from Settings > Data > Backup list. |
| Uploading a file gives a "Bad type" error | Background/icon images only accept `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif` (icons also accept `.svg`, `.ico`). Convert the file with an image editor and try again. |
| "File too large" / a 413 error | Ordinary requests such as background/icon uploads are capped at 10MB; backup import is capped at 100MB. Exceeding a limit now shows the reason on screen — try a smaller file. |
| The weather widget isn't showing | It's optional. Enter your own OpenWeatherMap API key under Settings > Weather (free to obtain) to enable it. It's expected behavior for the widget to stay hidden until a key is entered. |
| The installer says "download failed" | Automatically downloading Node.js requires internet access. Check your connection and try again, or install Node.js manually from [nodejs.org](https://nodejs.org) and re-run the script. |
| Can't reach it from another computer or phone | That's expected. The server is designed, for security, to only ever open on the exact computer it's running on (see [How It Works (Architecture)](#how-it-works-architecture)). |
| The problem persists | Open `server.error.log` in the project folder — it records what actually went wrong. Paste that content into a new GitHub Issue and we can help from there. |

---

## FAQ

**Q. Is my bookmark or note data sent to the developer?**
A. **Nothing is ever sent to this project's developer.** There is no
developer-operated server at all, and your data lives only in the `data/`
folder on your own computer.

There are, however, **three kinds of traffic to third parties**, stated
precisely: ① Google Fonts for on-screen text, ② bookmark icons from Google,
DuckDuckGo and icon.horse — **this sends each bookmark's domain name** to them
(not the full URL, and not your notes), and ③ the weather widget, only if you
entered your own API key (it sends a city name). Note, to-do, and calendar
contents never leave your machine under any circumstance. See "Outbound internet
traffic" in [How It Works (Architecture)](#how-it-works-architecture) for details
and for how to avoid the favicon requests.

**Q. I want to see the same bookmarks on another computer.**
A. Export a backup under Settings > Data > Export, then Import it after
installing on the other computer. There is no real-time automatic sync
feature — that's a deliberate consequence of not using any cloud server.

**Q. Can I rename the folder or move it to another drive?**
A. Yes. The program is built to work regardless of folder name or location.
After moving, though, the auto-start registration still points at the old path,
so run `setup_windows.bat` once from the new location to re-register. For moving
your data along with it, see
[Moving the folder, or reinstalling somewhere new](#moving-the-folder-or-reinstalling-somewhere-new-important).

**Q. I downloaded a fresh copy from GitHub and none of my settings are there. Was my data deleted?**
A. No. The repository holds program code only; personal data is excluded from it
by design. Everything is still in the `data` folder of your old installation —
export from the old dashboard and import into the new one and it all comes back.

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

### Conditions you must meet for commercial use

The MIT License permitting commercial use **does not mean there are no
conditions.** These are the minimum requirements when redistributing, selling,
or deploying internally.

| What you want to do | Allowed? | What you must also do |
|---|---|---|
| Install and use it for company work | Yes | Nothing — internal use is not distribution, so no notice obligation applies |
| Modify the code and distribute it inside your company | Yes | Ship the `LICENSE` file (copyright notice + full license text) with the distribution |
| Bundle it into a product you sell | Yes | Ship the `LICENSE` file. Keep the original copyright notice in your product docs or settings screen |
| Rebrand it and redistribute as your own | **Conditionally** | The code itself may be rebranded, but **the copyright notice and license text cannot be removed.** Stripping them is a license violation |
| Imply that "SoDam AI Studio endorses/sponsors this" | **No** | MIT grants no trademark, warranty, or endorsement rights. Do not use the copyright holder's name in promotion beyond the required notice |
| Keep the software but drop the no-warranty clause | **No** | The warranty disclaimer (the all-caps paragraph) is part of the license text and must be kept intact |

### What this license does **not** cover

The MIT License applies **only to the code in this repository.** The following
are separate.

- **The data you create** (bookmarks, notes, to-dos, uploaded images): entirely
  yours, and unrelated to this license. The copyright holder claims no rights
  over it.
- **Background images and icons you upload**: if you use someone else's work
  (photos, logos), the copyright of that image is your responsibility —
  especially if you distribute a backup file containing it.
- **External services and fonts**: each is governed by its own terms, below.

| Component | Provider | Terms that apply |
|---|---|---|
| IBM Plex Sans KR, JetBrains Mono fonts | Served via Google Fonts | Both are open fonts under SIL Open Font License–family terms. Commercial use is permitted, but check the font's own license before redistributing the font files themselves |
| Bookmark icons (favicons) | Google, DuckDuckGo, icon.horse | Each provider's terms of service apply. High-volume automated calls or reuse inside a commercial service may breach those terms — verify each provider's terms before commercial distribution |
| Weather data | OpenWeatherMap | Each user obtains and enters **their own API key**. Free/paid tiers, call limits, and redistribution rules follow OpenWeatherMap's terms |
| Badge images (top of this document) | shields.io | Documentation display only; unrelated to program behavior |
| Chrome, Google, Windows, macOS, etc. | Respective trademark owners | Product names used here are trademarks of their respective companies, mentioned only for compatibility and explanation. There is no affiliation, sponsorship, or endorsement of any kind |

### Privacy and data handling

- This program **collects no personal data.** There are no accounts, no logins,
  and no transmission features; everything is stored in the `data/` folder on
  the computer it runs on.
- However, **an exported backup contains your bookmark URLs, notes, calendar
  entries, and the weather API key you entered.** Check the contents before
  sending that file to anyone or uploading it to a public repository or cloud
  storage — and if a key was exposed, reissue it with the provider.
- As documented under "Outbound internet traffic" above, **each bookmark's
  domain name is sent to third-party icon providers.** If that is unacceptable
  in your environment (corporate network, confidential URLs), upload your own
  icons or block those domains.
- If you plan to deploy this to many people in a company or institution, inform
  your privacy officer about the third-party traffic described above and obtain
  approval first.

> **Disclaimer**: this section is general information to aid understanding and
> **is not legal advice. No legal effect is guaranteed, and responsibility for
> actual use rests with you.** For decisions with legal consequences, such as
> commercial distribution, read the [full LICENSE text](./LICENSE) and each
> external service's terms directly, and consult a qualified professional such
> as a lawyer where appropriate.

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
