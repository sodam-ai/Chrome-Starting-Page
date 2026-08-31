<p align="center">
  <img src="assets/icon-512.svg" width="80" alt="Dashboard icon">
</p>

<h1 align="center">Chrome Starting Page Dashboard</h1>

<p align="center">
  <strong>Your personal homepage that lives on your computer -- beautiful, private, and truly yours.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-7.4-blue?style=flat-square" alt="Version 7.4">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20Mac%20%7C%20Linux-lightgrey?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/dependencies-zero-brightgreen?style=flat-square" alt="Zero Dependencies">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/data-100%25%20local-orange?style=flat-square" alt="100% Local Data">
  <img src="https://img.shields.io/badge/coding-not%20required-purple?style=flat-square" alt="No Coding Required">
</p>

<p align="center">
  <a href="README.md">한국어 버전 (Korean)</a>
</p>

---

## Table of Contents

- [What Is This?](#what-is-this)
- [Quick Start (3 Steps)](#quick-start-3-steps)
- [Preview](#preview)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [How to Use](#how-to-use)
- [Workflow (How You'll Actually Use It Day to Day)](#workflow-how-youll-actually-use-it-day-to-day)
- [Settings & Customization](#settings--customization)
- [Data Safety](#data-safety)
- [Updating to a New Version](#updating-to-a-new-version)
- [Command Reference](#command-reference)
- [Uninstalling (Clean Removal)](#uninstalling-clean-removal)
- [Troubleshooting](#troubleshooting)
- [Frequently Asked Questions (FAQ)](#frequently-asked-questions-faq)
- [File Structure](#file-structure)
- [Technical Details](#technical-details-for-the-curious)
- [License & Legal Notice](#license--legal-notice)
- [Original Project & Acknowledgments](#original-project--acknowledgments)
- [Changelog Summary](#changelog-summary)

---

## What Is This?

Every time you open your web browser (a program like Google Chrome that lets you visit websites), it shows a **start page** (the first page you see when the browser opens). Usually, that is just Google's search page or something the browser chose for you.

**This project replaces that page with your own custom dashboard** -- a beautiful, personal homepage where you can organize your bookmarks (favorite websites), write notes, manage to-do lists, track habits, and more.

The dashboard runs as a tiny **server** (a small program running quietly in the background on your computer, like a helpful assistant waiting for requests). It uses something called **Node.js** (explained later in the Requirements section) as its engine. Your data stays private -- nothing is ever sent to any company or server on the internet. You do not need to know how to code. You do not need to install complicated software. Just run one setup file, and you are done.

> **Three key points:**
> - **No coding knowledge required** -- double-click one file and the installation is done (this includes people who only use natural language or "vibe coding" to build software)
> - **Your data stays on your computer only** -- nothing is ever sent to any external server
> - **No extra software to install** -- it downloads what it needs and runs independently

---

## Quick Start (3 Steps)

> For people who just want to get it running fast, without reading every detail. Curious
> what each step actually does? The [Installation](#installation) section below walks
> through it step by step.

1. **Download** -- save this whole project folder anywhere on your computer.
2. **Run the setup script** -- double-click `setup_windows.bat` (Windows) or run
   `setup_mac.sh` (Mac) inside the folder. Wait until you see "Setup Complete!"
3. **Open it in Chrome** -- type `http://localhost:1111` into Chrome's address bar and
   press Enter.

That's it. From now on, the server starts automatically every time you turn on your
computer -- you never need to reinstall. Just open that address in Chrome.

---

## Preview

> Replace these placeholders with actual screenshots of your dashboard.

| Dark Theme | Light Theme |
|:----------:|:-----------:|
| ![Dark theme screenshot](https://via.placeholder.com/600x380?text=Dark+Theme+Screenshot) | ![Light theme screenshot](https://via.placeholder.com/600x380?text=Light+Theme+Screenshot) |

| Bookmarks & Cards | Settings Panel |
|:------------------:|:--------------:|
| ![Bookmarks screenshot](https://via.placeholder.com/600x380?text=Bookmarks+and+Cards) | ![Settings screenshot](https://via.placeholder.com/600x380?text=Settings+Panel) |

---

## Features

### :bookmark_tabs: Bookmarks & Organization

- **Bookmark cards** -- group your favorite websites into neat categories (Work, Social, Shopping, etc.)
- **Multiple pages** -- split bookmarks across separate tabs when one page is not enough (e.g., "Work", "Personal", "Study")
- **Unified search** -- search your bookmarks, notes, to-dos, and events all at once with one keystroke
- **Smart paste** -- copy a website address (URL) and press Ctrl+V anywhere on the page; a category picker appears automatically
- **Drag and drop** -- drag links from Chrome's address bar directly onto a card
- **Dead link detection** -- automatically finds bookmarks that no longer work
- **Multi-select** -- hold Ctrl and click to select several bookmarks at once, then move or delete them together
- **Pin to top** -- pin your most important bookmarks so they always appear at the top of their card

### :mag: Search

- **Web search** -- type in the search bar at the top and press Enter to search the web
- **Multi-search engine** -- switch between Google, YouTube, Naver, and others with one click
- **Unified search (Spotlight)** -- press `F` to search bookmarks, to-dos, notes, and calendar events all at once
- **Korean initial consonant search** -- type just the first consonants (e.g., "ㄴㅇㅂ") and matching bookmarks like "네이버" appear
- **Keyword shortcuts** -- type `yt cats` to search YouTube for "cats" directly
- **Command mode** -- in unified search, type `>settings`, `>theme`, `>timer`, etc. to run commands instantly

### :white_check_mark: Productivity Tools

- **To-do list** -- tasks with priority levels (high / medium / low), tags, due dates, and recurring schedules; drag to reorder; completed items automatically move to the bottom
- **Notes** -- create as many note cards as you need for simple text notes (multiple cards supported)
- **Calendar** -- monthly or weekly view with event creation and browser notifications
- **Pomodoro timer** -- a 25-minute focus timer with optional automatic 5-minute breaks (auto-session continues cycles)
- **Habit tracker** -- daily checklist that resets every midnight

### :art: Appearance & Customization

- **Dark / Light theme** -- switch with one click (with a smooth circle transition animation), or automatically follow your computer's setting
- **6 accent colors** -- blue, purple, rose, emerald, amber, cyan
- **Custom backgrounds** -- upload your own images; with 1 image it stays fixed, with 2 or more they become a slideshow (ON/OFF toggle, adjustable interval, manual previous/next buttons)
- **Glass-morphism UI** -- adjustable card transparency (blur slider) and opacity (opacity slider) for a modern frosted-glass look
- **Layout presets** -- 4 types: Default, Compact, Wide, or Magazine
- **Custom CSS** -- for advanced users who want to write their own styling rules

### :cloud: Weather & Clock

- **Weather widget** -- shows current weather for your city using [OpenWeatherMap](https://openweathermap.org/api) (requires a free API key -- explained below)
- **World clock** -- display multiple time zones at the top of the dashboard (e.g., New York, London, Tokyo)

### :calendar: D-Day Countdown

- Track important dates with "D-7", "D-3", "D-Day", "D+1" style countdowns
- Displayed at the top of the dashboard for quick reference
- Past dates show how many days have passed

### :keyboard: Keyboard Shortcuts

| Key | What it does |
|-----|-------------|
| `/` | Move cursor to the search bar |
| `F` | Open unified search (bookmarks + to-dos + notes + events) |
| `S` | Open settings |
| `E` | Toggle edit mode (shows card management buttons) |
| `1` through `9` | Jump to the 1st, 2nd, ... 9th card |
| `Esc` | Close any open popup or modal |
| `Ctrl+Z` | Undo the last action (delete, move, etc.) |

### :shield: Safety & Privacy

- **100% local** -- your data never leaves your computer; no accounts, no cloud, no tracking
- **Automatic backups** -- the server creates backups on a smart retention schedule, keeping up to 50 files
- **Full export / import** -- download everything (bookmarks, notes, settings, icons, backgrounds) as one JSON, Markdown, or HTML file
- **Trash with undo** -- accidentally deleted something? Press Ctrl+Z to bring it back (10-level undo stack -- you can undo up to 10 actions in a row)
- **Localhost only** -- the server only listens on `127.0.0.1` (your computer); nobody else on your network can access it
- **Zero dependencies** -- the server uses only built-in features of Node.js; nothing extra to download or update
- **Offline support** -- the dashboard works even without an internet connection (except weather)
- **Profiles** -- save and switch between different dashboard setups
- **Backup list and restore UI** -- browse all your backups with dates and sizes, and restore any one with a single click
- **Import preview** -- before applying an import, see a summary of exactly how many bookmarks, notes, and other items will be imported
- **Tab sync** -- if you have the dashboard open in multiple browser tabs, changes sync instantly between them (uses BroadcastChannel API)

---

## Requirements

> "Requirements" means the things you need before you can start.

| What | Why | How to get it |
|------|-----|---------------|
| **A computer** | Windows 10/11, macOS, or Linux | You probably already have this |
| **Google Chrome** (or any browser) | To view the dashboard | [Download Chrome](https://www.google.com/chrome/) |
| **Internet connection** | Only needed for the first-time setup | After setup, the dashboard works offline |
| **Node.js** | A small program that runs the dashboard in the background | **Windows:** the setup file downloads it for you automatically. **Mac/Linux:** install from [nodejs.org](https://nodejs.org) |

> **What is Node.js?** Think of it as a tiny engine that powers the dashboard behind the scenes. If the dashboard is a "car", Node.js is the "engine" that makes it go. It runs quietly in the background and uses very little memory (about 15 MB -- less than a single browser tab). On Windows, the setup file (`setup_windows.bat`) downloads a portable copy of Node.js automatically, so you do not need to install anything yourself. If Node.js is already installed on your system, it will use that; if not, it downloads a private copy just for this project.

> **Do I need any environment variables?** No, this project uses none at all. Every
> personal setting -- including API keys like the weather widget's -- is stored through
> the dashboard's own Settings screen or in `data/config.json`, never in a `.env` file, so
> there is no environment-variable step before running the server.

> **How do I "deploy" this?** This isn't a cloud web service -- it's a program you **install
> and run on your own computer only**. There is no separate deployment step; running the
> setup script in the [Installation](#installation) section below *is* the deployment.
> There is no `npm publish`, no server upload, no domain to configure.

---

## Installation

### :computer: Windows (Easiest -- No Coding Needed)

> **Time needed:** About 2-5 minutes.

**Step 1: Download the project**

Download this project folder and place it anywhere you like.

Example: `C:\Users\YourName\Dashboard`

> Your Desktop, Documents folder, or any location is fine. Just avoid system folders like `C:\Windows` or `C:\Program Files`. Remember: if you delete this folder later, the dashboard goes with it, so put it somewhere safe.

**Step 2: Run the setup**

Open the folder and find the file called **`setup_windows.bat`**. It has a gear-like icon and looks like a small script file. **Double-click** it.

A black window (called "Command Prompt" -- a text-based way to give instructions to your computer) will appear with progress messages:
1. It checks if Node.js (the engine) is already on your computer
2. If not, it automatically downloads a portable copy (~30 MB -- this only happens once)
3. If Node.js is already installed system-wide, it uses that instead
4. The dashboard server starts in the background (no visible window)
5. Auto-start is registered so it launches every time you turn on your computer

Wait until you see **"Setup Complete!"** -- then the black window is safe to close.

**Step 3: Open it in Chrome**

Open Chrome and type this address in the **address bar** (the long text box at the very top of the browser window where you normally see website addresses):

```
http://localhost:1111
```

Then press **Enter**.

> **What does `localhost:1111` mean?** "localhost" means "this computer" -- you are telling Chrome to look at your own computer instead of the internet. "1111" is the **port** number (think of it as a door number -- explained more in the Settings section).

**You are done!** From now on, the dashboard starts automatically every time you turn on your computer -- no popups, no extra windows.

<details>
<summary>What does setup_windows.bat actually do? (click to read)</summary>

1. Checks if you already have data and creates a safety backup first (`safety-before-setup.json`)
2. Downloads a portable copy of Node.js into the `node/` folder (if not already there and no system Node.js is found)
3. Stops any previously running dashboard server
4. Registers auto-start so the dashboard launches when you log in (no admin rights needed) --
   using **two methods at once**: a Windows Registry entry and a Startup-folder shortcut. Some
   antivirus tools mistakenly flag "something that quietly launches every login" and remove
   one of the two, so registering both means one always survives (since v7.4). On top of that,
   the server checks every time it starts whether this registration is still intact and
   silently re-registers it if not (self-healing) -- since you likely open the dashboard many
   times a day, most breaks fix themselves the next time it starts.
5. Starts the server silently in the background (no visible window)

It does NOT install anything system-wide. It does NOT modify your Windows settings beyond a single auto-start entry. Everything stays inside the project folder.

</details>

---

### :apple: Mac

> **Time needed:** About 3 minutes. You will need to type a few commands.

**Step 1: Install Node.js**

Go to [nodejs.org](https://nodejs.org) and click the big green button on the website. Follow the instructions to install it.

**Step 2: Open Terminal**

You need to open an app called **Terminal** (a text-based window where you type commands to control your computer -- think of it as talking to your computer by typing instead of clicking):

- Press `Cmd + Space` on your keyboard (this opens Spotlight search)
- Type `Terminal` and press Enter
- A window with a text prompt will appear -- this is where you type commands

**Step 3: Navigate to the project folder**

Type the following command and press Enter. This tells Terminal to "go to" the folder where you put the project:

```bash
cd ~/Dashboard
```

> Replace `~/Dashboard` with the actual path to where you put the project folder. The `cd` command means "change directory" (go to a folder). The `~` symbol means your home folder.

**Step 4: Give the setup file permission to run**

```bash
chmod +x setup_mac.sh
```

> The `chmod` command gives the setup file permission to run. Mac requires this step for security.

**Step 5: Run the setup**

```bash
./setup_mac.sh
```

> The `./` prefix means "run this file in the current folder".

**Step 6: Open it in Chrome**

Open Chrome and go to:

```
http://localhost:1111
```

**Step 7: Done!**

The dashboard will auto-start every time you log in. You can close Terminal now.

---

### :penguin: Linux

1. Install Node.js from [nodejs.org](https://nodejs.org) or your package manager (e.g., `sudo apt install nodejs`)
2. Open a **terminal** (a text window for typing commands -- most Linux systems open it with `Ctrl+Alt+T`)
3. Navigate to the project folder and run the server:
   ```bash
   cd ~/Dashboard
   node server.js
   ```
4. Open Chrome and go to `http://localhost:1111`

<details>
<summary>Set up auto-start with systemd (click to read)</summary>

**systemd** is a tool built into most Linux systems that can automatically start programs when your computer boots. Create a systemd "service" so the dashboard starts automatically:

```bash
sudo tee /etc/systemd/system/dashboard.service << EOF
[Unit]
Description=Chrome Starting Page Dashboard
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME/Dashboard
ExecStart=$(which node) server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable dashboard
sudo systemctl start dashboard
```

> Replace `$HOME/Dashboard` with the actual path to your project folder if different.

</details>

---

## How to Use

### Setting It as Your Chrome Start Page

This makes the dashboard appear every time you open Chrome:

1. Open Chrome
2. Type `chrome://settings/onStartup` in the address bar and press **Enter**
3. Select **"Open a specific page or set of pages"**
4. Click **"Add a new page"**
5. Type `http://localhost:1111` and click **Add**

> Now every time you open Chrome, your dashboard will greet you.

### Setting It as Your New Tab Page (Optional)

If you also want to see the dashboard when you open a **new tab** (not just when Chrome starts):

1. Install the free Chrome extension [New Tab Redirect](https://chromewebstore.google.com/detail/new-tab-redirect/icpgjfneehieebagbmdbhnlpiopdcmna)
2. Set the redirect URL to `http://localhost:1111`

---

### Basic Usage Guide

| What you want to do | How to do it |
|----------------------|--------------|
| **Add a bookmark** | Type or paste a URL in the input box at the bottom of any card, press Enter |
| **Add by dragging** | Drag a URL from Chrome's address bar and drop it on a card |
| **Add by pasting** | Copy a URL, then press Ctrl+V anywhere on the page -- a category picker appears |
| **Rename a bookmark** | Double-click on a bookmark's name |
| **Edit a bookmark** | Right-click on a bookmark > "Edit" |
| **Delete a bookmark** | Hover over a bookmark and click the X button (you can undo with Ctrl+Z) |
| **Reorder bookmarks** | Drag a bookmark up or down within a card |
| **Move to another card** | Drag a bookmark from one card to another |
| **Move to another page** | Right-click on a bookmark > "Move to another page" |
| **Pin a bookmark to top** | Right-click on a bookmark > "Pin to top" |
| **Select multiple** | Hold Ctrl and click several bookmarks, then use the action bar |
| **Add a new card** | Click the **"+ Add Card"** button at the bottom of the page |
| **Open settings** | Press the `S` key or click the settings icon |

### Pages

If you have many bookmarks, split them across multiple **pages** (like having separate tabs for "Work", "Personal", "Study"):

- **Add a page:** Settings > Widgets > Page Management > "+ Add Page"
- **Switch pages:** Click the tabs at the top of the dashboard
- **Move a category to another page:** In edit mode (press `E`), click the page button on a card's title bar
- **Move a bookmark to another page:** Right-click on a bookmark > "Move to another page"

### Cards

Your dashboard is made of **cards**. Each card serves a different purpose. Think of them like different sections on your desk -- one for links, one for notes, one for tasks, and so on.

| Card | What it does |
|------|-------------|
| **Bookmarks** | A collection of links organized by category |
| **Notes** | Simple text notes -- create as many note cards as you need |
| **To-do** | Task list with priority levels, tags, due dates, recurring tasks, and drag-to-sort |
| **Calendar** | Monthly or weekly calendar view with event creation |
| **Pomodoro** | A 25-minute focus timer with auto-session (press play to start) |
| **Habits** | Daily habit checklist that resets every midnight |

To add a new card, click the **"+ Add Card"** button at the bottom of the page. In edit mode (press `E`), you can also change a card's width by clicking the size button on the card.

### Search Features

| What you want to do | How to do it |
|----------------------|--------------|
| **Search the web** | Type in the search bar at the top and press Enter |
| **Change search engine** | Click the icon to the left of the search bar (Google, YouTube, Naver, etc.) |
| **Search everything at once** | Press the `F` key -- searches bookmarks, to-dos, notes, and events together |
| **Korean initial consonant search** | Type just the first consonants (e.g., "ㄴㅇㅂ") and matching bookmarks appear |
| **Keyword shortcuts** | Type `yt cats` to search YouTube for "cats" directly |
| **Run commands** | In unified search, type `>settings`, `>theme`, `>timer`, etc. |

---

## Workflow (How You'll Actually Use It Day to Day)

> "Workflow" just means the loop you'll repeat every day you use this dashboard. You don't
> need to memorize it -- it's here to give you a sense of what's happening behind the scenes.

```
1. You open Chrome
        |
        v
2. The dashboard appears automatically as your start page (no login, no loading screen)
        |
        v
3. You use it however you like: click bookmarks, check off to-dos, write notes, start a timer
        |
        v
4. Anything you change is sent to the local server instantly and saved into a file in data/
   (most items save automatically -- no "Save" button to click; the save indicator in the
   bottom-right corner shows "Saved" so you know it worked)
        |
        v
5. On a schedule (every 24 hours by default), the server automatically creates a full backup
        |
        v
6. If something goes wrong (accidental deletion, corrupted file), open Settings > Data,
   browse the backup list, and restore whichever point in time you need
```

**When you restart your computer**: the server is already registered to start automatically
(this was set up during installation), so you don't need to run anything manually -- just
open Chrome and it's there.

**When your internet goes down**: everything except the weather widget keeps working. This
dashboard only talks to your own computer, so it was never dependent on the internet to
begin with.

---

## Settings & Customization

### Changing the Port Number

> **What is a "port"?** Think of it like a door number on a building. Your computer has thousands of these "doors", and each program uses a different one. The dashboard uses door number 1111 by default. If another program is already using that door, you need to pick a different number.

The dashboard runs on port `1111` by default. To change it:

| Method | How |
|--------|-----|
| **From the dashboard** (easiest) | Settings > Data > Server Management > enter new port > click "Change" |
| **Double-click a file** | Run `set-port.bat`, type a number (e.g., `8080`), press Enter |
| **Edit a text file** | Create or edit `port.conf` in the project folder, write just the number inside |
| **Command line** | Run `node server.js 8080` |

> After changing the port, update your Chrome start page address too (e.g., `http://localhost:8080`).

### Themes and Appearance

| Setting | How to change it |
|---------|-----------------|
| **Dark / Light theme** | Click the moon/sun icon at the top of the dashboard (smooth circle transition) |
| **Follow your OS theme** | Settings > General > Theme Mode > "Follow OS" |
| **Accent color** | Settings > General > Accent Color (6 choices: blue, purple, rose, emerald, amber, cyan) |
| **Glass effect** | Settings > Appearance > adjust card blur (blur slider) and opacity (opacity slider) |
| **Layout** | Settings > Appearance > Layout (Default / Compact / Wide / Magazine) |
| **Custom CSS** | Settings > Appearance > Custom CSS (for advanced users) |

### Background Images

| What you set | What happens |
|-------------|-------------|
| **1 image** | The image stays fixed as your background |
| **2 or more images** | Slideshow mode becomes available with ON/OFF toggle, adjustable interval (1 minute to 24 hours), and manual previous/next buttons |

How to set backgrounds:

1. Go to **Settings > Appearance > Background Images**
2. Click **"Add Images"** to upload pictures from your computer
3. If you uploaded 2 or more images, a slideshow toggle appears -- turn it ON or OFF as you like
4. When slideshow is ON, choose a rotation interval (1 minute to 24 hours) and use the manual previous/next buttons anytime
5. Click **"Reset All"** to go back to the default background

### Weather Widget

1. Go to **Settings > General > Weather**
2. Get a free API key from [OpenWeatherMap](https://openweathermap.org/api) (sign up for a free account -- it takes 1 minute)
3. Paste the API key and type your city name (e.g., "Seoul", "New York")
4. Choose Celsius or Fahrenheit

### World Clock

1. Go to **Settings > General > World Clock**
2. Click **"+ Add Clock"**
3. Enter a label (e.g., "New York") and select the timezone

### D-Day Countdown

- Go to **Settings > Widgets > D-Day** to add important dates
- Shows "D-7", "D-3", "D-Day", "D+1", etc. at the top of the dashboard
- Past dates show how many days have passed

---

## Data Safety

### Where is my data stored?

All your data lives in the `data/` folder inside the project. This folder is **never deleted** by setup, restart, or update scripts. Nothing is ever sent to any external server.

Think of it like keeping a diary in your desk drawer -- it stays in your folder on your computer, and only you can see it.

### Automatic Backups

The server automatically creates backups on a smart retention schedule. You do not need to do anything.

| Time range | How many backups are kept |
|-----------|--------------------------|
| Last 7 days | Every backup is kept |
| Days 8 through 30 | One backup per day |
| Older than 30 days | Automatically removed |
| Maximum total | 50 backup files |

Backups are stored in `data/backups/`.

### Backup List and Restore

You can browse and restore any backup directly from the dashboard:

1. Go to **Settings > Data**
2. You will see a **list of all backups** with their dates and file sizes
3. Click **"Restore"** next to any backup to restore your dashboard to that exact point in time

This is useful if you accidentally deleted something or changed your settings and want to go back.

### Manual Export and Import

| Action | Steps |
|--------|-------|
| **Export as JSON** (save everything to one file) | Press `S` > Data tab > click "Export" > a file downloads containing all your bookmarks, notes, settings, icons, backgrounds, and profiles |
| **Export as Markdown** | Press `S` > Data tab > choose Markdown format |
| **Export as HTML** | Press `S` > Data tab > choose HTML format |
| **Import** (restore from a file) | Press `S` > Data tab > click "Import" > select your backup file > see a **preview** showing exactly how many bookmarks, notes, to-dos, and other items will be imported > confirm to apply |
| **Quick restore (drag and drop)** | Drag and drop any backup JSON file directly onto the dashboard page |

> **Import preview:** Before any import is applied, you will see a summary screen showing the count of each type of item (e.g., "42 bookmarks, 5 notes, 12 to-dos"). This lets you verify the file is correct before overwriting your current data.

> Save your export file to a USB drive or cloud storage (like Google Drive) for extra safety.

### Moving to Another Computer

1. On the old computer: **Export** your data (Settings > Data > Export)
2. Copy the downloaded file to the new computer (USB, email, cloud drive -- anything works)
3. On the new computer: set up the dashboard, then **Import** the file (Settings > Data > Import)
4. Done -- your dashboard looks exactly the same

> **Alternative method:** Copy the entire `data/` folder from the old computer and paste it into the same location inside the project folder on the new computer.

### What Happens on Reinstall?

Running `setup_windows.bat` again will:

1. **Create a safety backup** of your current data first (saved as `safety-before-setup.json` in the backups folder)
2. **Keep all your existing data untouched** -- nothing is deleted
3. **Re-register auto-start** so the dashboard launches on boot
4. **Restart the server** with the latest files

Your bookmarks, notes, to-dos, and settings will still be there. Nothing is lost.

---

## Updating to a New Version

When a new version is released:

1. **Export your data first** (Settings > Data > Export) -- just to be extra safe
2. **Replace the project files** with the new version (overwrite the old files with the new ones)
   - Your `data/` folder will not be overwritten because it contains your personal data -- **do not touch or delete it**
3. **Run `setup_windows.bat`** (or `setup_mac.sh` on Mac) again, or double-click `restart.bat`
4. Your data is preserved automatically

<details>
<summary>If the page looks broken after updating (click to fix)</summary>

This is caused by your browser remembering old files (called "cache" -- a temporary storage area where the browser keeps copies of pages it has visited before). To fix it:

1. Press `Ctrl+Shift+Delete` in Chrome
2. Check "Cached images and files" and set the time range to "Last hour"
3. Click "Clear data"
4. Reload the page (`Ctrl+R` or `F5`)

</details>

---

## Uninstalling (Clean Removal)

### Windows (Recommended)

1. Double-click **`uninstall.bat`**
2. It will automatically:
   - Stop the server
   - Remove auto-start from Windows Registry and Startup folder
   - Ask if you want to keep or delete your data (you choose)
   - Clean up log files and temporary files
3. After that, you can safely delete the entire project folder
4. In Chrome, go to `chrome://settings/onStartup` and remove the localhost entry

No traces left on your system. No other programs are affected. This program does not modify system files, so deleting the folder is all it takes for a clean removal.

### Mac

The easiest way: open Terminal, navigate to the project folder, and run the uninstall script:

```bash
cd ~/Dashboard
chmod +x uninstall_mac.sh
./uninstall_mac.sh
```

The script will stop the server, remove auto-start, and ask if you want to keep or delete your data.

<details>
<summary>Manual uninstall (if you prefer)</summary>

Open Terminal and run these commands:

```bash
launchctl unload ~/Library/LaunchAgents/com.dashboard.startpage.plist
rm ~/Library/LaunchAgents/com.dashboard.startpage.plist
```

Then delete the project folder.

</details>

### Linux

Open a terminal and run these commands:

```bash
sudo systemctl stop dashboard
sudo systemctl disable dashboard
sudo rm /etc/systemd/system/dashboard.service
sudo systemctl daemon-reload
```

Then delete the project folder.

> After uninstalling on any platform, go to `chrome://settings/onStartup` in Chrome and remove the localhost entry.

---

## Troubleshooting

<details>
<summary><strong>The page will not open ("This site can't be reached")</strong></summary>

1. Double-click `restart.bat` to restart the server
2. Make sure the address is `http://localhost:1111` -- not "https" (no "s"), just "http"
3. If you changed the port, use the correct number (e.g., `http://localhost:8080`)
4. Check if Node.js is working: open Command Prompt (press the Windows key, type `cmd`, press Enter), type `node -v`, and press Enter. You should see a version number like `v22.19.0`
   - If you see a version number, Node.js is fine -- try running `setup_windows.bat` again
   - If you see "not recognized as a command", run `setup_windows.bat` again to re-download Node.js

</details>

<details>
<summary><strong>"Port already in use" error</strong></summary>

Another program on your computer is already using that port number (door number).

How to fix:
1. Double-click `set-port.bat` and choose a different number (e.g., `2222`, `8080`, or `9999`)
2. Double-click `restart.bat` to restart the server
3. Update your Chrome start page address to match the new port (e.g., `http://localhost:8080`)

</details>

<details>
<summary><strong>Bookmark icons are not showing</strong></summary>

Icons are automatically downloaded from the internet. If they are missing:
- You need an internet connection for icons to load the first time
- Some websites do not provide icons -- you will see the first two letters of the site name instead
- The system tries 4 different sources automatically before giving up
- If your internet is connected but icons still do not appear, wait a while and they will be retried automatically

</details>

<details>
<summary><strong>Data is not saving ("Save failed" message)</strong></summary>

1. The server might have stopped -- double-click `restart.bat`
2. Check that the `data/` folder exists inside the project folder
3. If the folder does not exist, create an empty folder named `data`
4. Make sure the folder is not set to "read-only" (right-click the project folder > Properties > uncheck "Read-only")

</details>

<details>
<summary><strong>The page looks broken after an update</strong></summary>

Your browser is using old cached files. To fix:
1. Press `Ctrl+Shift+Delete` in Chrome
2. Check "Cached images and files" and set the time range to "Last hour"
3. Click "Clear data"
4. Reload the page (`Ctrl+R` or `F5`)

</details>

<details>
<summary><strong>The server does not auto-start after reboot</strong></summary>

Since v7.4, Windows registers auto-start in two places at once (Registry + Startup folder)
and the server self-checks and repairs this every time it starts, so this happens much less
often now. If it still happens:

- **Windows:** Run `setup_windows.bat` again to re-register auto-start (if antivirus removed
  both registration methods, re-running this restores them)
- **Mac:** Run `./setup_mac.sh` again
- **Linux:** Run `sudo systemctl enable dashboard`

</details>

<details>
<summary><strong>I want to restart the server</strong></summary>

Two ways:
- **From the dashboard:** Settings > Data > "Restart Server" button
- **From your files:** Double-click `restart.bat`

Both methods safely stop only the dashboard server. Other programs on your computer are never affected.

</details>

<details>
<summary><strong>A black window briefly appears on startup</strong></summary>

Normally, the server starts invisibly in the background and no window should appear. If you see a brief black window (Command Prompt) every time you start your computer:

1. Run `setup_windows.bat` again
2. This re-registers the auto-start correctly so the server runs in the background without any visible window

</details>

<details>
<summary><strong>I want to move data to another computer</strong></summary>

**Method 1 (recommended):**
1. On the old computer: Settings > Data > **Export** -- save the JSON file
2. On the new computer: install the dashboard, then Settings > Data > **Import** -- select the file

**Method 2 (manual copy):**
- Copy the entire `data/` folder from the old computer and paste it into the same location inside the project folder on the new computer

</details>

---

## Frequently Asked Questions (FAQ)

> If "Troubleshooting" is for when **something is broken**, this section is for
> **questions you have even when nothing is wrong.**

<details>
<summary><strong>Is this actually safe? Could my information leak out somewhere?</strong></summary>

Yes, it's safe. This dashboard only runs inside your own computer, and the server is built
to respond only on `127.0.0.1` (a special address that always means "this computer, and
only this computer") -- so there is structurally no way for it to reach the internet. The
one exception is the weather widget, which sends only a city name to an external service
(OpenWeatherMap) to fetch the forecast -- and even that never happens unless you turn the
weather widget on. Everything else (bookmarks, notes, to-dos, etc.) is stored only as files
on your own computer, in the `data/` folder.

</details>

<details>
<summary><strong>Does this cost money? Will it become paid later?</strong></summary>

No. This project is completely free and distributed under the MIT License (see
[License & Legal Notice](#license--legal-notice) for details). It cannot suddenly become
paid on you, and you're free to keep using it, or even modify the code yourself, forever.

</details>

<details>
<summary><strong>Can I use it without an internet connection?</strong></summary>

Yes -- everything except the weather widget works fully offline, because the server runs
entirely inside your own computer.

</details>

<details>
<summary><strong>Can other people on the same Wi-Fi (family, roommates, etc.) see my dashboard?</strong></summary>

No. The server is locked to respond only on `127.0.0.1` (an address that only ever means
"this exact computer"), so there is no way for another device on the same network to reach
it.

</details>

<details>
<summary><strong>Can I use it the same way on another computer or laptop?</strong></summary>

You need to install the project separately on each computer (see [Installation](#installation)
above). If you want to bring your data along, follow the
[Moving to Another Computer](#data-safety) instructions to export and import it. The two
computers will not stay synced in real time, though -- each is an independent copy.

</details>

<details>
<summary><strong>Who owns the content I create (my bookmark list, notes, background images, etc.)?</strong></summary>

You do, entirely. This project claims no rights whatsoever over any data you enter or
upload -- and that data is never even transmitted to the project's creator in the first
place. See [License & Legal Notice](#license--legal-notice) for the full explanation.

</details>

<details>
<summary><strong>Can I use this at my company for work? Can I redistribute or sell it?</strong></summary>

Yes, all of that is allowed. The MIT License explicitly permits use, copying, modification,
redistribution, and sale, including for commercial purposes. Please read
[License & Legal Notice](#license--legal-notice) yourself for the exact terms -- in
particular, the "no warranty" clause is something you should be aware of if you plan to use
it at a company.

</details>

<details>
<summary><strong>I accidentally deleted the whole project folder. Can I get my data back?</strong></summary>

If the `data/` folder itself was deleted, this project has no way to recover it on its own
(unless you have a Recycle Bin copy or some other backup). To protect against this, it's a
good habit to periodically use Settings > Data > **Export** to save a JSON backup somewhere
else entirely (a cloud drive, an external hard drive, etc.) -- this project's automatic
backups are always created inside that same folder, so if the whole folder disappears, the
automatic backups disappear with it.

</details>

---

## File Structure

> Here is what each file in the project does. You do not need to understand all of this -- it is here for reference.

```
Chrome_Starting-Page/
│
│  === Setup & Management Tools ===
├── setup_windows.bat ........... One-click setup for Windows (double-click this!)
├── setup_mac.sh ................ One-click setup for Mac
├── restart.bat ................. Restart the server if something is wrong
├── uninstall.bat ............... Clean removal tool (Windows)
├── uninstall_mac.sh ............ Clean removal tool (Mac)
├── set-port.bat ................ Change the port number
├── start_hidden.vbs ............ Helper that starts the server invisibly
├── run_server_background.bat ... Helper for running server in background
│
│  === The Dashboard Itself ===
├── server.js ................... The server (the engine that powers everything)
├── index.html .................. Page structure (the skeleton of the dashboard)
├── style.css ................... Visual design (colors, fonts, layout, animations)
├── script.js ................... Dashboard logic (what happens when you click)
├── sw.js ....................... Offline support (works without internet)
├── manifest.webmanifest ........ Browser app configuration
├── package.json ................ Project metadata (name, version)
│
│  === Auto-Generated (do not edit) ===
├── port.conf ................... Your custom port number
├── .server.pid ................. Server process info
│
│  === Your Files ===
├── assets/ ..................... Background images and app icons
│   ├── icon-192.svg              App icon (small)
│   ├── icon-512.svg              App icon (large)
│   └── background_custom.jpg     Your custom background
│
└── data/ ....................... YOUR DATA (the most important folder!)
    ├── bookmarks.json              Your bookmarks
    ├── config.json                 Your settings
    ├── notes.json                  Your notes
    ├── todos.json                  Your to-do items
    ├── events.json                 Your calendar events
    ├── ddays.json                  Your D-Day countdown dates
    ├── usage.json                  Usage statistics
    ├── trash.json                  Deleted items (recoverable)
    ├── icons/                      Cached bookmark icons
    ├── profiles/                   Saved profiles
    └── backups/                    Automatic backup files
        └── safety-before-setup.json    Pre-setup safety backup
```

> The `data/` folder contains all your personal data. Keep this folder safe and you can always restore your dashboard.

---

## Command Reference

> Every one of these is a file you **double-click to run** -- you never need to open a
> terminal or type a command yourself. On Windows, double-click the `.bat` files; on Mac,
> double-click (or right-click > Open) the `.sh` files.

| File | Platform | What it does | When to use it |
|------|----------|---------------|-----------------|
| `setup_windows.bat` | Windows | First-time install + registers auto-start | Once, when first installing |
| `setup_mac.sh` | Mac | First-time install + registers auto-start | Once, when first installing |
| `restart.bat` | Windows | Fully stops and restarts the server | When the dashboard looks wrong or won't load |
| `uninstall.bat` | Windows | Removes auto-start registration + stops the server (does not delete your data) | When you want to fully remove it |
| `uninstall_mac.sh` | Mac | Removes auto-start registration + stops the server (does not delete your data) | When you want to fully remove it |
| `set-port.bat` | Windows | Changes the port number (e.g. 1111) your browser connects to | When another program is already using that port |
| `run_server_background.bat` | Windows | Restarts just the server in the background (no window) | When the server is off but you don't want to reboot |
| `start_hidden.vbs` | Windows | Helper that runs `run_server_background.bat` without a visible black window | Usually called automatically by other scripts -- you'll rarely run this yourself |

**Two ways to use `set-port.bat`:**
- Just double-click it -- it shows your current port and asks you to type a new one.
- If you're comfortable with it, right-click the file, choose "Open in Terminal" /
  "Open command window here," and run `set-port.bat 8080` with your desired port number
  appended directly (optional -- not knowing this is completely fine).

> None of these files touch anything outside the project folder. The only exception is one
> "run at login" registration in Windows/Mac system settings -- nothing else on your
> computer is changed.

---

<details>
<summary><h2>Technical Details (for curious readers)</h2></summary>

If you are a developer or just curious about how this works under the hood:

### Architecture

```
Chrome Browser  <--HTTP-->  Local Node.js Server (port 1111)  <--Read/Write-->  JSON files on disk
                                  (server.js)                                     (data/*.json)
```

The server is a single-file HTTP server using only Node.js built-in modules. No npm packages are used. The frontend is a single-page application with no build tools or transpilation needed.

| Item | Detail |
|------|--------|
| **Server** | Node.js using only built-in modules (`http`, `fs`, `path`, `zlib`, `crypto`) -- no `npm install` required |
| **Frontend** | Plain HTML + CSS + JavaScript -- no frameworks, no build step, no transpilation |
| **Default port** | 1111 (configurable via `port.conf`, command-line argument, dashboard UI, or `set-port.bat`) |
| **Binding** | `127.0.0.1` only -- cannot be accessed from other computers on your network |
| **Data storage** | Local JSON files in the `data/` directory |

### Performance

| Item | Detail |
|------|--------|
| **Compression** | Gzip for HTML, CSS, JS, JSON, SVG, and webmanifest |
| **Caching** | SHA-256 ETag + in-memory file cache with 5-minute TTL |
| **Offline support** | Service Worker pre-caches critical files |
| **Memory usage** | ~15 MB at idle |
| **Max request body** | 10 MB |
| **Error log rotation** | Logs capped at 10 MB with automatic rotation |
| **Boot sequence** | 3-phase: instant render > deferred init > background checks after 30 seconds |

### Security

| Item | Detail |
|------|--------|
| **Path traversal prevention** | Server blocks access to files outside the project folder |
| **Filename sanitization** | Malicious filenames are filtered out |
| **Write locks** | Timeout-based write locks ensure data integrity |
| **Localhost-only binding** | `127.0.0.1` only -- even other computers on the same network cannot access it |
| **Process management** | PID file (`.server.pid`) for safe restart without affecting other programs |
| **Portable mode** | Windows setup downloads Node.js into local `node/` folder for full independence from system Node.js |
| **Custom CSS XSS filter** | User-provided custom CSS is sanitized to prevent cross-site scripting attacks |
| **Bookmark URL scheme validation** | Blocks code-executing addresses like `javascript:` at save time, both in the browser and on the server (only `http/https/ftp/mailto` are accepted) |
| **Output escaping on render** | Every user-entered value shown on screen (category names, labels, dates, etc.) is HTML-escaped (`&<>"'`) before rendering, so a tampered value coming in through backup import cannot execute as code |
| **Safe bounds on the backup interval** | Even if the backup interval setting is somehow invalid (negative, non-numeric), the server always clamps it to a safe 1-168 hour range, preventing runaway repeated backups |
| **Origin validation — CSRF (cross-site request forgery) protection** (new in v7.4) | This server runs in the background at all times once your computer is on, so a malicious website you visit could try to secretly send data-changing requests through your browser. The server now checks the Origin of every data-changing request and blocks any that didn't come from this dashboard itself. |
| **Request size limit** | The amount of data a single request can send is capped at 10MB, preventing an abnormally large request from freezing the server (returns a proper "too large" error instead) |

### Dependencies

```
External libraries: none (0)
npm install: not required
node_modules: never created
```

This project uses only Node.js **built-in modules** (`http`, `fs`, `path`, `zlib`, `crypto`). Like a self-contained travel bag, it carries everything it needs -- no extra parts to find or install.

### Testing / Build

```
Build step: none (no transpiling or bundling -- files run as-is)
Tests: node --test  (= npm test)
Self-check scanner (advisory, not a pass/fail gate): npm run check:xss
```

`npm test` runs the regression tests in the `test/` folder (input validation, HTML
escaping, and other security-related logic). After changing code, running `npm test` is
recommended to confirm nothing existing broke. The frontend (`script.js`, `style.css`,
`index.html`) is read by the browser as-is with no build step needed.

</details>

---

## License & Legal Notice

> This section is not legal advice. If you're using this at an organization, or need
> absolute legal certainty about anything here, please read the original text yourself
> (the [LICENSE](LICENSE) file) or consult a legal professional. What follows is a
> plain-language explanation of that text, and **if this explanation and the
> [LICENSE](LICENSE) file ever appear to disagree, the original LICENSE file text always
> governs.**

### This Project's License

This project is distributed under the **[MIT License](LICENSE)**.
Copyright (c) 2026 SoDam AI Studio.

The MIT License is one of the simplest and most permissive open-source licenses that
exists. Below is exactly what its full text actually permits and requires, spelled out
plainly -- with no guessing or embellishment beyond what's written in the [LICENSE](LICENSE)
file itself.

**Explicitly permitted (all free, no permission request needed):**
- ✅ **Personal use** -- freely, at home, on your own computer
- ✅ **Use at a company or organization** -- you may use it as an internal work tool
- ✅ **Modify the code** -- change anything, add whatever features you want
- ✅ **Redistribute it** -- share the original or your modified version with others
- ✅ **Commercial use, including selling it** -- the license explicitly permits selling
  copies of the software, as-is or modified. The MIT License text's phrase "sell copies of
  the Software" means exactly this.
- ✅ **Include it in a private project** -- you may take this code and use it as part of
  another (even closed-source) project.

**The one and only condition:**
- ⚠️ If you redistribute the software (original or modified), you must **include the
  original copyright notice and the full license text** -- in other words, keep the
  [LICENSE](LICENSE) file included when you pass it along. (Note: this does not mean you
  need to contact or ask permission from this project's author -- it is purely a
  documentation requirement, satisfied simply by keeping one file intact.)

**No warranty (please be aware of this part):**
- This software is provided **"AS IS."** The author makes no guarantee that it is fit for
  any particular purpose, free of bugs, or will keep working indefinitely.
- The author (copyright holder) **is not legally liable** for any problem that arises from
  using this software (data loss, system issues, etc.). This is a standard clause found in
  the vast majority of free open-source software -- it is not a special restriction unique
  to this project.
- **In plain terms**: "It's given to you free, as-is. Use it well, but if something goes
  wrong, you cannot seek damages from the author." This is how most legitimate open-source
  projects are distributed (the Linux kernel, Node.js itself, and many of the libraries this
  project's ecosystem depends on all follow the same principle).

### Copyright Over the Content (Data) You Create

This project asserts **no rights whatsoever** over anything you type or upload (your
bookmark list, notes, to-dos, uploaded background images, etc.). That data is never even
transmitted off your computer to begin with (see [Security](#technical-details-for-the-curious)),
and it belongs 100% to you.

### About the Trademark (Brand Name)

"SoDam AI Studio" is the creator credit for this project and does not assert any registered
trademark claim. You are free to fork this project or redistribute it under a different name,
as long as you do not use the project name or this credit in a way that would make people
mistakenly believe SoDam AI Studio directly operates or endorses your version (and, per the
"one condition" above, you must still keep the original copyright notice intact).

### Third-Party (External) Services -- Separate From This Project's License

This project itself never sends your data to an external server, but **the following
features, only when you actively turn them on,** connect to their own respective external
services. These services are not owned or operated by this project, and **each has its own
separate terms of service and privacy policy** -- this project's MIT License has no bearing
on the terms of these external services.

| Feature | External service it connects to | Information sent | When it connects |
|---------|----------------------------------|-------------------|-------------------|
| Weather widget | [OpenWeatherMap](https://openweathermap.org/api) | The city name you entered | Only when the weather widget is turned on |
| Bookmark icon (favicon) display | Google (`s2/favicons`), DuckDuckGo (`icons.duckduckgo.com`), icon.horse, and the bookmarked site's own `favicon.ico` | The domain name of the bookmarked website | Every time a bookmark card is displayed (minimized after icons are cached) |

If you would rather not agree to these external services' terms of service and privacy
policies, you can simply not use the weather widget (it can be turned off in Settings) and
use the dashboard without bookmark icons.

---

## 🙏 Original Project & Acknowledgments

This project began from the idea in **[kinkos1234](https://github.com/kinkos1234)**'s
original project, **[kinkos1234/chrome-starting-page](https://github.com/kinkos1234/chrome-starting-page)**.
Our sincere thanks go to the original author, kinkos1234, for creating and publishing this
project in the first place.

> **A note on licensing (not legal advice):** As of this writing (September 2026), the
> original repository has no open-source license registered on GitHub (`license: null`).
> As a general rule, a repository with no declared license cannot be freely copied,
> modified, or redistributed without separate permission. This project proceeds with
> **direct, personal permission obtained from the original author, kinkos1234,** to use,
> modify, and distribute the work. However, this is an informal personal agreement, not a
> license reflected in GitHub's public license field -- so if you intend to reuse this
> project further (especially for commercial purposes), we recommend you also check
> directly with the original author (kinkos1234), separately from the MIT License applied
> to this repository. If you need legal certainty, please consult a legal professional.

---

## Changelog Summary

> The complete, item-by-item version history lives in [CHANGELOG.md](CHANGELOG.md). Below is
> a condensed summary per version -- click any entry to expand it.

<details>
<summary><strong>v7.4</strong> (current version) -- Real CSRF vulnerability found & fixed, dual auto-start registration + self-healing</summary>

- **[Security] Blocked forged-origin requests**: Found and fixed, via an actual reproduced
  attack, a vulnerability where another website could use your browser to secretly send
  data-changing requests to this dashboard. Requests that don't originate from the
  dashboard itself are now blocked.
- **[Security] More accurate error responses**: The server now distinguishes a
  syntactically-broken request from a validly-formed-but-invalid one (previously both
  returned the same generic message).
- **[Security] More stable handling of oversized requests**: Fixed a defect where sending
  very large data made the server hang with no response -- it now correctly replies with a
  "too large" error.
- **[Security] Fixed 4 missing output-escaping spots**: Found and fixed places (task due
  dates, D-Day dates) where a tampered value could have executed as code on screen.
- **[Stability] Dual auto-start registration + self-healing**: On Windows, sign-in
  auto-start is now registered in two places at once (Registry + Startup folder), and the
  server checks and repairs this itself every time it starts (addresses antivirus false
  positives that were removing the auto-start entry).

</details>

<details>
<summary><strong>v7.3</strong> -- Background slideshow overhaul, pin bookmarks, automatic data integrity checks, stronger security</summary>

- Complete overhaul of the background image slideshow system (on/off toggle, adjustable interval, manual switching)
- "Pin to top" for bookmarks, drag bookmarks onto page tabs to move them
- On startup, the server automatically validates all 9 data files and auto-recovers corrupted ones from the latest backup
- Backup list/restore UI, import preview, undo stack expanded to 10 levels
- Automatic port fallback, duplicate-server prevention, automatic offline reconnect
- Accessibility improvements (keyboard focus indicators, ARIA labels), mobile-responsive layout
- Security hardening: path traversal prevention, XSS filtering for custom CSS

</details>

<details>
<summary><strong>v7.2</strong> -- Multiple to-do cards</summary>

- To-do lists can now be split into several independent cards instead of just one

</details>

<details>
<summary><strong>v7.1</strong> -- Notes expanded to multiple cards, widget show/hide</summary>

- Notes reorganized from a single list into multiple independent cards (each with its own title and line count)
- Markdown preview inside notes (bold, code, links)
- To-do/Calendar/Habit cards can be shown or hidden (recoverable via undo)

</details>

<details>
<summary><strong>v7.0</strong> -- Habit tracker, layout presets, search shortcuts</summary>

- Habit tracker added, resetting daily at midnight
- 4 layout presets (Default/Compact/Wide/Magazine)
- Pomodoro auto-session (25 min focus -> 5 min break)
- Search keyword shortcuts like `yt cats`
- Browser notification 10 minutes before calendar events

</details>

<details>
<summary><strong>v6.0</strong> -- Calendar, Pomodoro, profiles, unified search (Spotlight)</summary>

- Calendar card (monthly/weekly view) and Pomodoro timer introduced for the first time
- Profiles feature to save/switch between multiple dashboard setups
- Ctrl+click multi-select, unified search (`F` key), Korean initial-consonant search
- Drag links from the browser address bar onto a card; drag a JSON backup file to import it

</details>

<details>
<summary><strong>v5.0</strong> -- Multiple pages, D-Day, weather, first automatic server backups</summary>

- Bookmarks can be split across multiple pages (tabs)
- D-Day countdown, world clock, weather widget (OpenWeatherMap) added
- Automatic dark/light switching, 6 accent colors, custom CSS
- The server's atomic file writes (temp file + swap) and smart-retention automatic backups were introduced for the first time in this version

</details>

<details>
<summary><strong>v4.0</strong> -- Category drag-to-reorder, right-click menu, trash</summary>

- Drag category cards to reorder them, collapse/expand cards
- Right-click menu on bookmarks (edit, open in new tab, move, delete)
- Deleted bookmarks move to trash and are recoverable for 30 days, with a Ctrl+Z undo toast

</details>

<details>
<summary><strong>v3.0</strong> -- To-do list, recurring events, notes cards introduced</summary>

- To-do list with priority, due dates, and tags
- Daily/weekly/biweekly/monthly recurring events, subtasks
- Simple text note cards (with automatic link detection)

</details>

<details>
<summary><strong>v2.0</strong> -- Dark/Light theme, glass-morphism UI</summary>

- Dark/Light theme switch with a circular transition animation
- Glass-morphism UI with adjustable card transparency and blur
- Customizable keyboard shortcuts, multiple search engine switching

</details>

<details>
<summary><strong>v1.0</strong> -- Initial release</summary>

- A pure server using only Node.js built-in modules (zero external dependencies)
- Category-based bookmark cards with drag-to-reorder
- Offline support (Service Worker), Windows/Mac auto-start
- Automatic portable Node.js download for Windows

</details>

---

<p align="center">
  <strong>If you like this project, please give it a star!</strong><br>
  <em>You do not need to know how to code to have your own beautiful dashboard.</em>
</p>
