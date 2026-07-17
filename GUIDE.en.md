# Absolute-Beginner Guide — Chrome Starting Page Dashboard

**A hand-holding, step-by-step guide written for people who are genuinely new to computers, apps, and the internet.**

This document skips no steps — from "what is this thing" all the way to "when the screen looks like this, click here." If you're already comfortable with computers, the more concise [`README.en.md`](./README.en.md) (reference document) will be faster to read. Both cover exactly the same content — this one is just far more thorough and gentle. 한국어 사용자는 [`GUIDE.md`](./GUIDE.md)를 확인하세요.

> 💡 In this guide, **bold terms** are explained in plain language, in parentheses, the first time they appear.

---

## <a id="toc"></a>Table of Contents

1. [What Is This? (Project Overview)](#overview)
2. [Before You Start (Prerequisites)](#prerequisites)
3. [Software You'll Need](#requirements)
4. [How to Download (Step by Step)](#download)
5. [How to Install (Step by Step)](#install)
6. [Quick Start Summary](#quickstart)
7. [How to Run (Starting/Stopping Day to Day)](#run)
8. [How to Use (Every Feature, One by One)](#usage)
9. [How It Works (Why Things Happen the Way They Do)](#howitworks)
10. [Command Reference (Table)](#commands)
11. [Update / Changelog Summary](#changelog)
12. [File / Document Location Map](#files)
13. [Workflow (A Day in the Life of This App)](#workflow)
14. [Architecture (Understanding the Structure)](#architecture)
15. [Security / Data Flow (Is My Info Safe?)](#security)
16. [Troubleshooting (Follow-Along Fixes)](#troubleshooting)
17. [FAQ](#faq)
18. [Legal / Copyright / License / Commercial Use](#license)

---

## <a id="overview"></a>1. What Is This? (Project Overview)

**Chrome** is Google's web browser (the program you use to view websites). The very first screen you see when you open Chrome, or click the "+" to open a new tab, is called the **"New Tab page"** or **"start page."**

This project, **Chrome Starting Page Dashboard**, turns that first screen into your own personal assistant screen. From this one page you can:

- Keep frequently visited website addresses (bookmarks) organized by category
- Jot down quick notes
- Manage a to-do list (today's tasks, important items)
- View a calendar with your schedule
- Use a Pomodoro timer (a time-management technique: 25 minutes of focus, then a break)
- Check off daily habits (exercise, reading, etc.)

**Three things worth knowing right away**

1. **It runs entirely on your own computer.** This isn't a company server somewhere out on the internet — it's a tiny program (called a **"server,"** meaning "a program that answers requests") that runs only **on this computer, right now.** Everything you type — bookmarks, to-dos — is stored purely as files on this computer. There's no sign-up, no login.
2. **Nothing extra needs to be installed.** Most programs need you to download a bunch of other pieces (libraries) before they'll run. This one has none of that — as long as Node.js (explained in Section 3) is present, it just runs.
3. **You can use it commercially, or even resell a modified version, with no legal issue.** It's distributed under a very permissive set of terms called the "MIT License." Details are in [Section 18](#license).

---

## <a id="prerequisites"></a>2. Before You Start (Prerequisites)

Go through this checklist. If a term is unfamiliar, the explanation is right there next to it.

- [ ] **Is your operating system (OS — the base program that runs your computer) Windows 10/11 or macOS?** — Not sure which you have? Windows has a Start menu (a window-shaped icon in the bottom-left). Macs have an Apple logo at the top of the screen.
- [ ] **Do you have at least 100MB of free disk space?** — Almost any computer already has this (about the size of a few dozen photos).
- [ ] **Is Google Chrome installed?** — If not, get it first at <https://www.google.com/chrome/>. (The page itself opens fine in any browser — the "set as Chrome's new tab" instructions specifically assume Chrome.)
- [ ] **Have you never used a terminal (a black screen where you type text commands) before?** — That's fine. On Windows, installing is just a double-click of one file — no terminal knowledge required. On macOS you'll type exactly one line, and this guide spells it out precisely.
- [ ] **Are you connected to the internet right now?** — You might need it once during setup (if Node.js isn't already on your computer, Windows will download it automatically). After that, day-to-day use works mostly offline.
- [ ] **(Optional) Do you want the weather widget too?** — If so, you'll later add a free weather API key (from the OpenWeatherMap website) — but this is entirely optional. Everything else works fully without it.

---

## <a id="requirements"></a>3. Software You'll Need

### What is Node.js?

**Node.js** is a program that runs JavaScript code outside of a browser — think of it as the engine that actually runs this dashboard's "server" (the small background program described in Section 1). This app needs Node.js version 18 or newer.

### Windows users → **Just skip ahead!**

You don't need to do anything on Windows. The `setup_windows.bat` file you'll run in [Section 5](#install) checks whether Node.js is missing, and if so, **automatically downloads it from the official site (nodejs.org)** for you. There's nothing to install yourself.

### macOS users → **Install it once, first**

macOS doesn't install Node.js for you, so pick one of these two methods and do it **just once**.

**Option A — Official website (recommended for beginners)**
1. Go to <https://nodejs.org>
2. Download the big button labeled **"LTS"**
3. Double-click the downloaded installer (`.pkg`) and follow the prompts: "Continue" → "Agree" → "Install"

**Option B — If you already use Homebrew**
```bash
brew install node
```

**How to confirm it worked**: open Terminal and type:
```bash
node -v
```
If it prints `v18.0.0` or higher (e.g. `v22.1.0`), you're set. If you see something like `command not found`, the install didn't take — retry the steps above.

---

## <a id="download"></a>4. How to Download (Step by Step)

**Already have the project folder?** (Someone handed you a ZIP or folder directly?) → Skip straight to "B" below.

### A. Getting it from GitHub for the first time

**GitHub** is a website where program code is hosted so other people can download it.

1. In your browser, go to: **<https://github.com/sodam-ai/chrome-starting-page>**
2. Near the top-right, find the **green "Code" button** and click it.
3. In the menu that appears, near the bottom, you'll see **"Download ZIP."** Click it.
4. A file like `chrome-starting-page-main.zip` downloads.
5. Right-click it and choose **"Extract All"** (Windows), or double-click it (macOS usually extracts automatically).
6. Move the extracted folder wherever you'd like to keep it (e.g. your Documents folder or Desktop).

(If you happen to know Git, you can also run `git clone https://github.com/sodam-ai/chrome-starting-page.git`. If you don't know what that means, don't worry — the ZIP download above is all you need.)

### B. If someone gave you the folder / a ZIP file directly

1. If it's a `.zip` file, right-click and choose **"Extract All"** to unpack it.
2. Move the extracted folder (or the folder you were given) to wherever you want it to live.
3. If you open it and see `index.html`, `server.js`, and `package.json` inside, you got it correctly — continue to [Section 5](#install).

---

## <a id="install"></a>5. How to Install (Step by Step)

### 🪟 Installing on Windows

1. Open the folder you prepared in Section 4.
2. Find the file named **`setup_windows.bat`** inside it. (Its icon might look like a gear or a console window.)
3. **Double-click** it.
   > If a blue "Windows protected your PC" warning appears, that's just Windows's standard message when running a file downloaded from the internet. Click **"More info"**, then click **"Run anyway."**
4. A black console window opens and several lines of text scroll by automatically. Don't click anything — just wait. Behind the scenes, this is happening:
   - If you already had data from before, it's safely backed up first
   - It checks whether Node.js is present, and downloads it automatically if not (the one moment that needs internet — this can take about a minute)
   - It registers the app to launch automatically every time you turn on your computer
   - It starts the server hidden, with no visible window
5. At the end, a message shows an address like `http://localhost:1111`. Make a note of it (write it down or take a screenshot).
6. You can press any key or just close this window — **the server keeps running in the background even after you close it.**

**If something goes wrong**
- If the window flashes and disappears with nothing happening → some files may be missing because the folder wasn't moved correctly. Re-check Section 4.
- If it gets stuck downloading Node.js → check your internet connection and double-click the file again.

### 🍎 Installing on macOS

1. Confirm you already installed Node.js from Section 3 (`node -v` to check).
2. Click the magnifying-glass icon (Spotlight) in the top-right, or press `Cmd + Space`, type `terminal`, and press Enter — **Terminal** opens (a window where you type text commands).
3. Navigate to the project folder. Type `cd ` (that's "c," "d," then a space), then drag the folder itself onto the Terminal window — its path fills in automatically. For example:
   ```bash
   cd /Users/yourname/Downloads/chrome-starting-page
   ```
   Press Enter.
4. Type the following and press Enter:
   ```bash
   bash setup_mac.sh
   ```
5. Several lines of text scroll by while it registers auto-start and launches the server.
6. At the end, an address like `http://localhost:1111` appears — that means it worked.

**If something goes wrong**
- If you see "Node.js is not installed" → go back to Section 3, install Node.js, then re-run step 4.
- If you get a "Permission denied" error → type `chmod +x setup_mac.sh` first, then run `bash setup_mac.sh` again.

> **Note:** This installation only adds one setting — "launch automatically at login" — and doesn't touch any other system file or Chrome's own settings. Pointing Chrome at this page is a separate, manual step you do yourself (see step 4 of [Quick Start](#quickstart)).

---

## <a id="quickstart"></a>6. Quick Start Summary

Here's the whole process condensed onto one page.

```text
1) Download   Get the ZIP and extract it (or use a folder you already have)
2) Install    Windows: double-click setup_windows.bat
              macOS: run "bash setup_mac.sh" in Terminal
3) Open it    Type http://localhost:1111 into your browser's address bar, press Enter
4) (Optional) Set it as Chrome's start page
   ① Click the 3-dot menu (⋮) in Chrome's top-right corner
   ② Click "Settings"
   ③ Find "On startup" in the left-hand menu
   ④ Choose "Open a specific page or set of pages"
   ⑤ Click "Add a new page" → type http://localhost:1111 → Add
   (Note: this changes what appears when Chrome first launches.
    To also replace what you see every time you click "+" for a
    brand-new tab, you'd need a separate Chrome extension —
    this project doesn't do that automatically.)
```

---

## <a id="run"></a>7. How to Run (Starting/Stopping Day to Day)

**Good news**: once you finish the install in Section 5, **the app launches automatically every time you turn on your computer.** You won't normally need any of this. The table below is for when you want to control things manually.

| What you want to do | On Windows | On macOS |
|---|---|---|
| Run it once, by hand | Type `npm start` or `node server.js` inside the folder | Type `npm start` or `node server.js` in Terminal |
| Run on a different port number | `node server.js 8080` (use whatever port you want) | Same |
| Run quietly, with no window | Double-click `run_server_background.bat` | (already set up this way during install) |
| Stop and restart it | Double-click `restart.bat` | In Terminal: `launchctl unload`, then `launchctl load ~/Library/LaunchAgents/com.dashboard.startpage.plist` |
| Stop it completely | Run `uninstall.bat`, or end `node.exe` in Task Manager | Run `bash uninstall_mac.sh` |

**What's a "port"?** Think of it as a numbered label that lets several programs on your computer send and receive internet-style signals at the same time without getting mixed up. This app uses number 1111 by default.

You can also change the port or restart the server with just a couple of clicks, right from Settings → Data tab.

---

## <a id="usage"></a>8. How to Use (Every Feature, One by One)

### 8.1 Search & Universal Search
- Type anything into the top search bar and press Enter to search with your default engine (Google, etc. — changeable in Settings).
- Add a short prefix to jump to a different site: typing `yt cats` searches YouTube for "cats," `nv weather` searches Naver, `gh react` searches GitHub (defaults: `yt`, `nv`, `gh`, `g`, `tw`, `map`).
- Press `F` on your keyboard to open **Spotlight** ("universal search"), which searches bookmarks, to-dos, and notes all at once. Korean initial-consonant typing also works if you use Korean.
- Inside Spotlight, typing something starting with `>` acts like a command: `>todo` (opens to-dos), `>timer 15` (starts a 15-minute timer), `>settings` (opens Settings), etc.

### 8.2 Bookmarks
- Use the **"+" button, or edit mode** (press `E`) to add, edit, or delete bookmarks.
- Press and hold the mouse button on a bookmark and drag it to reorder, or to move it to a different category.
- Right-click for a menu: pin to top, edit, open in a new tab, open the whole category, move to another page, delete.
- Drag a web address straight out of Chrome's address bar and drop it onto a card to add it as a bookmark instantly.
- Copy a link anywhere, then paste (`Ctrl+V`) anywhere on the page — it'll ask which category to file it under.
- Items added within the last 7 days get a "NEW" label.
- Links that no longer open are flagged automatically (after 3 consecutive failed checks).
- Deleted bookmarks stay in Trash for 30 days and can be restored.

### 8.3 Notes
- Create as many separate note cards as you like; double-click a title to rename it.
- Any web address you type becomes a clickable link automatically.
- Writing `**like this**`, `` `like this` ``, or `[text](url)` renders nicely formatted.

### 8.4 To-do
- Create multiple independent to-do cards.
- Each item can have a priority (4 levels), a due date, tags, and sub-tasks.
- Recurring to-dos are supported: daily, weekdays only, weekly, or monthly.
- Switch between a kanban board (organized by stage) and a full list view using the button at the top.
- Hitting 100% completion triggers a confetti celebration animation.

### 8.5 Calendar
- Switch between month view and week view.
- Click a date to add an event; put a `!` at the very front to add it as a to-do instead.
- Recurring events are supported (weekly / biweekly / monthly).
- If you allow notification permission when your browser asks, you'll get a reminder 10 minutes before an event starts.

### 8.6 Pomodoro & Habit Tracker
- **Pomodoro** is a time-management method: 25 minutes of focused work, then a 5-minute break. This app can cycle that automatically, and you can start a timer directly from a specific to-do item.
- **Habit tracker**: list the habits you want to build (e.g. "drink 2L of water," "read 10 pages") one per line in Settings, and they turn into a daily checklist on the dashboard, with your streak (consecutive days) tracked automatically.

### 8.7 Personalizing the Look (⚙ Settings → Visual)
- Choose a dark screen (dark mode) or light screen (light mode), or "follow my computer's settings."
- Pick from 6 accent colors.
- Upload background photos to run as an automatic slideshow.
- Adjust blur effects, transparency, and choose from 4 layout styles.

### 8.8 Settings Screen (5 Tabs)
| Tab | What you can do here |
|---|---|
| General | World clocks, choose search engines, sort by usage, theme mode, accent color, remap shortcuts, add a weather API key |
| Visual | Background photos, slideshow, darkness level, blur effect, layout, custom CSS (advanced design code) |
| Widgets | D-Day (a countdown to a specific date) list, manage multiple pages, card size/color, calendar options, Pomodoro, habit list, search keyword shortcuts |
| Data | Save your data to a file (export) / load it back (import), auto-backup interval, browse and restore old backups, find duplicate bookmarks, trash, change port / restart server |
| Stats | Your to-do completion streak, last 90 days of usage, Pomodoro history, most-clicked bookmarks |

### 8.9 Keyboard Shortcuts

| Key | What it does | Customizable? |
|---|---|---|
| `/` | Puts your cursor in the search bar | Yes, in Settings |
| `E` | Toggles edit mode | Yes, in Settings |
| `S` | Opens Settings | Yes, in Settings |
| `F` | Opens Spotlight (universal search) | Yes, in Settings |
| `?` | Shows the shortcut list | Yes, in Settings |
| `1`–`9` | Jumps to that numbered category | No, fixed |
| `Ctrl` (or `Cmd` on Mac) `+ Z` | Undoes your last action | No, fixed |
| `Esc` | Closes whatever window is open | No, fixed |

---

## <a id="howitworks"></a>9. How It Works (Why Things Happen the Way They Do)

The simplest possible explanation: **the screen you see (your browser) says "please save this" to a tiny server quietly running on your own computer, and that server writes it to a file.**

A bit more detail:

1. Opening `http://localhost:1111` in Chrome makes the server send you the screen (HTML/CSS/JS files).
2. As soon as the screen appears, it automatically asks the server "give me my bookmarks," "give me my to-dos," and fills itself in.
3. When you change something (add a bookmark, check off a to-do), the page waits a brief moment (under a second) and then tells the server "here's what changed, please save it." It batches things up this way so it isn't saving constantly, which would be slow.
4. The server writes that content into text files (JSON files) inside a folder called `data`. To make sure a file never gets corrupted mid-save, it writes to a temporary file first, then safely renames it into place.
5. If the connection to the server briefly drops, an "offline mode" notice appears. Your changes are held temporarily inside the browser itself (`localStorage`) and automatically sent to the server once the connection comes back. **Nothing gets lost.**
6. The page still loads even with no internet at all, because a feature called a "service worker" has already saved copies of the screen's files in advance. However, anything involving your actual data (bookmarks, to-dos) still needs the local server connection to work.
7. The server also manages itself: every time your computer turns on, it double-checks that its data files aren't corrupted (and auto-repairs from a backup if they are), and it creates an automatic backup once a day.

---

## <a id="commands"></a>10. Command Reference (Table)

Here's what happens when you run each file in the project folder. You'll rarely need any of this day to day (it's all automatic) — this is just for when you want to do something manually.

| Running this (double-click on Windows, type in Terminal on macOS) | Does this |
|---|---|
| `setup_windows.bat` | First-time setup (checks/installs Node.js, registers auto-start, starts the server) |
| `bash setup_mac.sh` | First-time setup (registers auto-start, starts the server) |
| `run_server_background.bat` | Quietly restarts just the server |
| `restart.bat` | Safely stops and restarts the server |
| `set-port.bat` | Asks for a new port number and saves it |
| `uninstall.bat` | Stops the server, cancels auto-start, and (after asking) optionally deletes your data |
| `bash uninstall_mac.sh` | Same, on macOS |
| `npm start` or `node server.js` | Runs the server with a visible window, once |

---

## <a id="changelog"></a>11. Update / Changelog Summary

Here's how this app has evolved, version by version. Click a title to expand the details. (Newest version at the top.)

<details>
<summary><strong>v7.3 (2025-03-19) — Latest: background slideshow, safer data, stronger security</strong></summary>

- Added a slideshow feature that automatically cycles through multiple background photos
- Added pinning bookmarks to the top, and dragging cards to move them onto another page
- To prevent data corruption: automatic file checks every time the computer starts, with auto-recovery if something's wrong; a backup list you can pick from and restore; up to 10 levels of undo
- Made the server more stable: if a port is already busy, it automatically tries the next number; any previously running server is cleaned up automatically
- Faster detection when the internet connection drops and comes back (15 seconds → 5 seconds); multiple open tabs now stay in sync with each other
- Added descriptions to screen elements to improve usability for screen readers (software that reads the screen aloud for visually impaired users)
- Security: strengthened filtering of dangerous patterns in file imports and custom design code

</details>

<details>
<summary><strong>v7.2 — Multiple to-do cards became possible</strong></summary>

- To-do lists can now be split across several independent cards

</details>

<details>
<summary><strong>v7.1 — Notes became cards; widgets can be hidden</strong></summary>

- Notes are now managed as multiple independent cards, with simple formatting (bold/code/links)
- To-do/Calendar/Habit cards can be hidden and shown again

</details>

<details>
<summary><strong>v7.0 — Habit tracker, 4 layouts, Pomodoro auto-cycle</strong></summary>

- Added a daily habit-checklist tracker
- Added 4 selectable layout styles
- Pomodoro auto-cycling, search keyword shortcuts (`yt`, `nv`, `gh`, etc.)

</details>

<details>
<summary><strong>v6.0 — Calendar, Pomodoro, universal search, saved profiles</strong></summary>

- Calendar feature and Pomodoro timer added for the first time
- A "profile" feature to save your entire settings and load them again later
- Universal search (Spotlight, `F` key), Korean initial-consonant search

</details>

<details>
<summary><strong>v5.0 — Multiple pages, D-Day, world clock, weather</strong></summary>

- Split the screen across multiple pages/tabs (e.g. Work / Personal)
- Added D-Day countdown, world clock, and a weather widget

</details>

<details>
<summary><strong>v4.0 — Category reordering, trash, undo</strong></summary>

- Drag to reorder or collapse categories; Trash (recoverable for 30 days after deletion)
- `Ctrl+Z` to undo your last action

</details>

<details>
<summary><strong>v3.0 — Priority/recurrence for to-dos, notes feature</strong></summary>

- Added priority, due dates, tags, and recurrence settings to to-dos
- Added the notes (memo) card for the first time

</details>

<details>
<summary><strong>v2.0 — Dark/light theme, switchable search engines</strong></summary>

- Added dark mode / light mode switching
- You can now switch between Google/Naver/YouTube and other search engines

</details>

<details>
<summary><strong>v1.0 — First release</strong></summary>

- The very first version, built around category-organized bookmark cards
- The page still works without internet; Windows/macOS auto-start
- All data stored as files on your own computer, from day one

</details>

---

## <a id="files"></a>12. File / Document Location Map

Opening the project folder, you'll find these files and folders. You'll rarely need to touch any of them directly, but here's a reference for when you're curious.

```text
chrome-starting-page/                (the project folder)
├── README.md, README.en.md           (reference docs, Korean/English)
├── GUIDE.md                          (Korean beginner guide)  GUIDE.en.md ← you are here
├── README.html / GUIDE.html etc.      (browser-friendly versions of the docs above, same content)
├── LICENSE                            (the copyright/license text)
├── setup_windows.bat, setup_mac.sh    (installer files — see Section 5)
├── restart.bat, uninstall.bat, etc.    (everyday management files — see Section 10)
├── data/  ← ★ where ALL of your information is stored
│    ├── bookmarks.json (bookmarks)   notes.json (notes)   todos.json (to-dos)
│    ├── events.json (events)   ddays.json (D-Days)   config.json (settings)
│    └── backups/ (automatic backup files)
└── assets/  (icons, uploaded background photos)
```

Files inside `data/` are plain, human-readable text (a format called JSON) if you open them in something like Notepad. We don't recommend editing them directly — always make changes through the app's own screen (the Settings menu).

---

## <a id="workflow"></a>13. Workflow (A Day in the Life of This App)

```text
[Just once]
  Download → run the installer → auto-start is registered → done!
       ↓
[Every day after that]
  Turn on your computer
       ↓  (the server starts quietly by itself — you don't have to do anything)
  Open Chrome → click a new tab, or type http://localhost:1111
       ↓
  Use your bookmarks/to-dos/notes/calendar as usual
       ↓  (any change is saved automatically and quietly)
  Turn off your computer → the server shuts down safely too (with one final backup)
```

---

## <a id="architecture"></a>14. Architecture (Understanding the Structure)

It looks complicated, but it's really just 3 pieces.

```text
① The browser screen (index.html, script.js, style.css)
        ↕  (signals that only travel inside your own computer, port 1111)
② The small server program (server.js) — runs only on this computer, no direct link to the outside internet
        ↕
③ Files inside the data folder (JSON) — where your actual data lives
```

- **① (the screen)** is what you see and click on. It's built without any framework (no complex third-party toolkit) — plain HTML/CSS/JavaScript.
- **② (the server)** acts as the bridge that takes the screen's requests ("save this," "load that") and turns them into changes to ③. It's not some company's server out on the internet — it only ever runs on your own computer.
- **③ (the data files)** is where the actual content lives. Copy this whole folder and you can move everything to a new computer.

---

## <a id="security"></a>15. Security / Data Flow (Is My Info Safe?)

**Short answer: yes.** Here's why.

- This server only ever talks **to your own computer, and nothing else** (the technical term is `127.0.0.1`, or "localhost"). Another computer or phone on the same Wi-Fi can never reach it.
- Bookmarks, to-dos, notes, and everything else you type are **never sent anywhere** — they're only stored in this computer's `data` folder.
- It does connect to the internet in a few specific cases, purely to make the screen look nice. Here's the **complete list**.

| What it connects to the internet for | When | Is any of my info sent? |
|---|---|---|
| Loading fonts (nice-looking text) | Every time the page loads | No — it only receives font files for design purposes |
| Loading bookmark icons (small images) | When a bookmark appears on screen | No — it only receives that site's icon image |
| Weather info | Only if you've entered a weather API key yourself | If you never add a key, this never happens at all |
| Checking if a bookmark is still alive | Occasionally, automatically | Only sends a check to the sites you yourself saved — no personal info is sent |

A full review of this app's code found **no ads, no user tracking, and nothing that secretly sends your information anywhere.** The one automatic exception is during Windows setup: if Node.js isn't already installed, it downloads the official installer from nodejs.org exactly once.

---

## <a id="troubleshooting"></a>16. Troubleshooting (Follow-Along Fixes)

**Symptom: the top-left corner says "Server disconnected."**
→ Wait a few seconds (it keeps auto-retrying). If it doesn't recover, double-click `restart.bat` on Windows, or on macOS run `launchctl load ~/Library/LaunchAgents/com.dashboard.startpage.plist` in Terminal.

**Symptom: the browser says "This site can't be reached."**
→ The server might be off, or you might be using the wrong port. Open `port.conf` in the project folder with Notepad/TextEdit to check the number, then visit `http://localhost:<that number>`.

**Symptom: you got a new version but the screen still looks like the old one.**
→ Your browser has cached (remembered) the old screen. Try a hard refresh: `Ctrl+Shift+R` on Windows, `Cmd+Shift+R` on macOS.

**Symptom: you changed the port in Settings but nothing changed.**
→ A port change only takes effect after a restart. Run `restart.bat`, or use the "Restart server" button in Settings.

**Symptom: something looks wrong with your data, or it's missing.**
→ Don't panic. Go to Settings → Data tab → pick a point in time from the backup list → click "Restore." Recently deleted items may also be recoverable from Trash (30-day retention).

**Symptom: you want to remove it completely.**
→ On Windows, run `uninstall.bat` — it will ask (twice, to be safe) whether to keep or delete your data. On macOS, run `bash uninstall_mac.sh` for the same choice.

---

## <a id="faq"></a>17. FAQ

**Q. Can I use this at a company, or sell it?**
A. Yes. Thanks to the MIT License, anyone — individual or company — can freely use, modify, and even sell it. You do need to keep the original copyright notice intact, though. See [Section 18](#license) for details. (This is a plain-language summary — the exact terms are the `LICENSE` file itself.)

**Q. Does it need internet to work?**
A. Mostly no. Bookmarks, to-dos, notes, calendar, Pomodoro, and habits all work fully without internet. Only a few cosmetic things — fonts, icons, weather — need it.

**Q. Is my information leaking out anywhere?**
A. No. [Section 15](#security) lists every single case where this app connects to the internet. The actual content of your bookmarks and to-dos is never sent anywhere.

**Q. Does this really replace Chrome's actual new-tab screen?**
A. Not automatically — you need to register it yourself in Chrome's settings, as shown in [Quick Start, step 4](#quickstart).

**Q. Can I see it on my phone or another computer?**
A. No — and that's on purpose (for security). This server can only be reached from this one computer.

**Q. Do I need to understand what Node.js is?**
A. Not on Windows (it's installed for you automatically). On macOS, you install it once, and then you never have to think about it again.

**Q. Can I get back something I deleted by mistake?**
A. Yes. Right after deleting, `Ctrl+Z` undoes it. If some time has passed, check Trash under Settings → Data (30-day retention).

---

## <a id="license"></a>18. Legal / Copyright / License / Commercial Use

> The following is a plain-language explanation to help you understand. **The `LICENSE` file inside the project folder is the legally authoritative text** — please review it directly before making any important decision, especially around commercial use.

### 18.1 License text (MIT License)

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

*(The copyright holder, "소담 AI 스튜디오," romanizes to "Sodam AI Studio.")*

### 18.2 The really simple version

- **"MIT License"** is one of the most **freely permissive** licenses in the open-source world (open-source = code anyone can view).
- ✅ **Anyone — a person or a company — can use it however they like.** Sell it, bundle it into another product, whatever.
- ✅ **You can freely modify the code.**
- ✅ **You can pass it along to others.**
- ⚠️ **The one thing you must do**: whenever you hand this program (or a significant part of it) to someone else, you have to include the copyright notice above ("Copyright (c) 2026 소담 AI 스튜디오") together with the full license text.
- ❌ **There's no warranty.** It's provided "as is" — there's no promise that it works perfectly or is bug-free.
- ❌ **No liability, either.** If using this software causes some kind of loss or damage, the author (copyright holder) is not legally responsible for it.

**One-line summary**: *"Keep the copyright notice, and anyone can freely use, modify, and even sell this — but if something goes wrong, it's not the author's responsibility."*
