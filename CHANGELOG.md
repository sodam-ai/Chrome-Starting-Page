# Changelog

All notable changes to this project will be documented in this file.

---

## [v7.4.1] - 2026-09-01

### Security
- **6 internal-path-disclosure sites fixed** — `/api/profiles/save`, `/api/profiles/load`, `/api/profiles/delete`, `/api/backups/restore`, `/api/import`, and `/api/port` previously returned the raw exception message (`e.message`) to the client on failure, which could include a fragment of an absolute server filesystem path if the underlying file write/unlink call failed. All six now return a generic, safe error message to the client; the real error is logged server-side via `console.error` only. `/api/port` keeps its existing safe, specific validation message (`"Port must be between 1024 and 65535"`) since that string never contains path info — only the subsequent file write is now isolated in its own try/catch. Verified with an isolated smoke-test server (generic message to client, real cause in server console). This was a previously-disclosed, low-severity gap noted in the v7.4 README.

### Docs
- README/README.en updated to reflect the fix above (previously described as a known, unfixed gap)

---

## [v7.4] - 2026-09-01

### Security
- **CSRF / Origin validation** — reproduced a real vulnerability where a third-party website could use the victim's browser to send unauthorized state-changing (POST) requests to the local server while it runs in the background; the server now rejects any POST whose `Origin` header, when present, does not match the server's own address
- **Error response accuracy** — a syntactically invalid JSON body and a validly-formed-but-schema-invalid body now return distinct error messages (`Invalid JSON` vs `Invalid data`) instead of being conflated
- **Oversized request handling fixed** — `req.destroy()` was closing the socket before the intended 413 response could be sent, so oversized requests previously hung instead of erroring; the socket is now kept open until the 413 response is flushed (applies to the generic JSON body reader and both file upload endpoints)
- **4 missing output-escaping sites fixed** in `script.js` (todo due dates rendered in the Kanban card and weekly report popup, D-Day date rendered in the top bar) — all confirmed exploitable with a reproduced payload and confirmed fixed
- Extracted `esc()` and the bookmark/URL/backup-interval validators out of `script.js`/`server.js` into `lib/esc.js` and `lib/validators.js`, with `node --test` regression coverage (`test/esc.test.js`, `test/validators.test.js`) so these fixes can never silently regress
- Added `tools/check-unescaped-html.js`, a zero-dependency advisory scanner that flags `innerHTML` assignments missing `esc()` calls

### Reliability
- **Dual auto-start registration on Windows** — `setup_windows.bat` now registers login auto-start via both the Registry Run key and a Startup-folder shortcut simultaneously (previously only one, whichever succeeded first); some antivirus products flag/remove the single-method registration as a false positive
- **Auto-start self-healing** — `server.js` now checks on every startup whether its own auto-start registration (for the specific folder it was installed from) is still intact, and silently repairs whichever piece is missing
- Fixed a batch-script conditional-chaining bug (`if A if B (...) else if...`) that caused `setup_windows.bat`'s auto-start result message to never print under any outcome

---

## [v7.3] - 2025-03-19

### Background System
- Unified background system: single `backgrounds[]` array replaces old `backgroundImage` + `slideshow.images` split
- Auto-migration from old format to unified format on first boot
- 1 image = fixed background, 2+ images = slideshow available
- **Slideshow ON/OFF toggle** — choose whether to auto-rotate or stay fixed
- Slideshow interval configurable from 1 minute to 24 hours
- **Manual previous/next buttons** — switch backgrounds anytime without auto-rotation
- Smooth fade transition between slideshow images

### Bookmark Enhancements
- **Pin to top** — right-click bookmark > "Pin to top" keeps it at the card's top position
- Pinned bookmarks show accent left-border + 📌 badge
- **Drag bookmarks to page tabs** — drop a bookmark on another page's tab to move it there
- **Drag category cards to page tabs** — drop an entire card on a tab to move it to that page
- **Improved move popup** — page headers show "(current)", current category disabled with "← current position"

### Todo Improvements
- **Drag-to-sort** — reorder todo items by dragging up/down (accent-colored insertion line indicator)

### Data Safety
- **Server data integrity check** — on startup, validates all 9 JSON files; corrupted files auto-recovered from latest backup
- **Backup list and restore UI** — Settings > Data shows all backups with dates and sizes; one-click restore
- **Backup status display** — "Last backup: 2 hours ago / Total: 12" shown in settings
- **Import preview** — before applying, shows summary: "42 bookmarks, 15 todos, 3 notes" with file info
- **Export completion toast** — shows file size after JSON/Markdown/HTML export
- **10-level undo stack** — Ctrl+Z can undo up to 10 consecutive actions (previously only 1)
- **`/api/shutdown` endpoint** — clean server exit without respawn (prevents zombie instances)
- **`/api/backups/restore` endpoint** — restore from a specific backup file via API
- `DATA_FILES` constant — single source of truth for all data file definitions (backup, export, import, integrity check)

### Server Stability
- **Port auto-fallback** — if port 1111 is in use, automatically tries 1112→1120 using `net.createServer` pre-check
- **Auto-stop existing dashboard** — new server startup sends `/api/shutdown` to existing instance before starting
- **Stale PID file cleanup** — detects and removes PID files from dead processes
- Fixed **server double-start bug** — replaced `server.listen()` re-call with `findAvailablePort()` pre-check
- Fixed **`/api/trash` duplicate route** — removed from `apis` object so 30-day auto-cleanup handler is reached
- Fixed **bat file CRLF encoding** — all `.bat` and `.vbs` files now use CR+LF line endings
- Added **`.gitattributes`** — forces `*.bat`/`*.vbs` to CRLF, `*.sh` to LF on all platforms
- `setup_windows.bat` **Node.js 3-step detection** — portable node → system node → download portable
- `restart.bat` **API-based stop fallback** — sends `/api/shutdown` if PID file is missing
- `setup_windows.bat` **fixed if-else block parsing** — replaced nested parentheses with `goto` labels

### Network & Sync
- **Auto-reconnect on disconnect** — 15s normal → 5s fast retry on disconnect → auto-recover with toast notification
- **Offline banner** — top yellow bar "Offline mode — changes will sync when connected" appears on disconnect
- **Tab sync (BroadcastChannel)** — changes in one tab auto-refresh other tabs; echo loop prevention with `_tabSyncPaused`
- **Service Worker auto-update** — 30-minute update check + tab focus check + `postMessage` notification on new version

### Accessibility & UX
- **Keyboard focus visibility** — `:focus-visible` global styles for buttons, inputs, links (Tab key navigation)
- **ARIA labels** — 8 aria-label attributes added to icon buttons, search input, spotlight, profile selector
- **Modal close animation** — `@keyframes modalOut` (reverse scale+blur) matches open animation
- **Notification permission UX** — 10-second delay + toast explanation before browser permission request
- **Print stylesheet** — `@media print` hides UI chrome, shows bookmark list with URLs
- **Mobile responsive (768px)** — full-screen modals, scrollable settings tabs, compact layout
- **Icon fade-in** — bookmark icons transition `opacity 0→1` on load (300ms)
- **Icon lazy loading** — Intersection Observer defers favicon requests until visible (200px rootMargin)

### Settings
- **Live preview for layout preset** — changes apply immediately without clicking "Save"
- **Live preview for theme mode** — auto/manual theme toggle applies immediately
- **Settings save debounce** — `persistConfig()` increased from 300ms to 500ms to reduce API calls

### Security
- **Import API path hardening** — `..` and `~` rejection, `allowedDirs` whitelist, image extension filter
- **`safePath()` case-insensitive** — Windows path traversal bypass prevention via `toLowerCase()` comparison
- **Upload path checks case-insensitive** — background and icon upload paths verified with `toLowerCase()`
- **Custom CSS XSS filter** — blocks `expression()`, `url(javascript:)`, `@import url(http)`, `behavior:`, `-moz-binding:`

### Documentation & Meta
- **README.md** (English) — complete rewrite, 833 lines, 17 sections, beginner-friendly with technical term explanations
- **README.ko.md** (Korean) — perfectly synchronized, 833 lines, identical structure with Korean metaphors
- **CHANGELOG.md** — full version history from v1.0 to v7.3
- **package.json** — added keywords, author, license, repository, engines fields
- **manifest.webmanifest** — added description, categories, lang, shortcuts (Spotlight search, Settings)
- **`.gitignore`** — added `pomo-stats.json`, wildcard background extensions, `*.plist`
- **`.gitkeep` files** — created for data/, data/backups/, data/icons/, data/profiles/, assets/
- **`uninstall_mac.sh`** — new Mac uninstall script (matches Windows uninstall.bat structure)
- **sw.js** — added `manifest.webmanifest` to precache list
- Removed **duplicate font loading** — CSS `@import` for JetBrains Mono removed (HTML `<link>` retained)
- **index.html** — added meta description, OG tags, favicon, apple-touch-icon, ARIA landmarks

### Bug Fixes
- Fixed font double-loading (CSS `@import` removed, HTML `<link>` retained)
- Fixed `.gitignore` not covering `.png`, `.webp`, `.gif` background extensions
- Fixed `setup_mac.sh` incorrect "auto-detect port" message
- Fixed README.ko.md typo "스스로" → "알아서"
- Fixed server double-start on port retry (replaced `server.listen()` re-call)
- Fixed `/api/trash` shadowed by `apis` object (30-day cleanup unreachable)
- Fixed bat files using LF line endings (converted to CRLF)
- Fixed `setup_windows.bat` always using portable node path even when not installed
- Fixed `setup_windows.bat` if-else blocks showing both branches
- Fixed `setup_windows.bat` errorlevel check for registry auto-start

---

## [v7.2] - 2025-03

### Multiple Todo Cards
- Support for multiple todo card instances with independent task lists
- Each todo card has its own title, rename, and delete
- Drag-and-drop reorder between todo cards
- Existing todos auto-migrated with `cardId` field

---

## [v7.1] - 2025-03

### Card-Based Memo System
- Memos migrated from flat array to card-based model (`memoCards[]`)
- Each memo card has independent title, line count, and drag-reorder
- Add/remove memo lines dynamically
- Inline rename for memo card titles
- Markdown preview in memos (bold, code, links)

### Widget Card Visibility
- Show/hide toggle for Todo, Calendar, and Habit tracker cards
- Cards can be removed and restored via undo toast

---

## [v7.0] - 2025-02

### New Features
- **Habit tracker**: daily checklist that resets every midnight
- **Layout presets**: Default, Compact, Wide, Magazine
- **Pomodoro auto-session**: automatic 25min work → 5min break cycle
- **Search keyword shortcuts**: `yt cats`, `nv weather`, `gh react` etc.
- **Event notifications**: browser alert 10 minutes before calendar events
- **Category card colors**: customizable left-border color per category

### Improvements
- Card opacity and clock bar opacity now independently adjustable
- Glass effect presets: Clear, Normal (default), Frosted
- Blur intensity slider (0-40px)
- Time-based overlay effect (dawn/morning/afternoon/sunset/night colors)

---

## [v6.0] - 2025-02

### New Features
- **Calendar card**: monthly and weekly views with event creation
- **Pomodoro timer**: 25-minute focus timer with optional breaks
- **Profile management**: save/load/delete multiple dashboard setups
- **Multi-select**: Ctrl+click to select multiple bookmarks, batch move/delete
- **Inline edit**: double-click bookmark name to rename in-place
- **Focus mode**: temporarily hide non-bookmark widgets
- **Smart paste**: Ctrl+V anywhere shows category picker for URL
- **Drag URL from browser**: drag links from Chrome address bar onto cards
- **Import drag & drop**: drag JSON backup file onto dashboard to restore
- **Scroll position restore**: remembers scroll position on page reload

### Search Enhancements
- **Unified search (Spotlight)**: press `F` to search bookmarks + todos + notes + events
- **Korean initial consonant search**: type "ㄴㅇㅂ" to find "네이버"
- **Command mode**: type `>settings`, `>theme`, `>timer` in unified search
- **Search engine dropdown**: click icon to switch engines (replaces cycling)

### UI/UX
- **Category emoji support**: add emoji prefixes to category names
- **List view mode**: compact bookmark display as text-only list
- **Bookmark groups**: organize bookmarks within a category
- **Calendar weekly view**: toggle between monthly and weekly display
- **Reduce motion**: respect OS prefers-reduced-motion setting
- **Card gradients**: subtle accent-colored gradient on card borders
- **Ripple effect**: micro-interaction on bookmark click
- **Onboarding guide**: first-launch tutorial for new users

### Data
- **Todo completion streak**: tracks daily completion dates for streak display
- **Dead link detection**: persistent fail counter (3 consecutive failures = flagged)
- **Weekly report**: periodic summary of dashboard usage
- **Offline queue**: changes made offline are synced when connection restores
- **Data integrity validation**: corrupted todos/events/bookmarks auto-cleaned on boot

---

## [v5.0] - 2025-02

### New Features
- **Multiple pages**: split bookmarks across tabbed pages (Work, Personal, Study)
- **D-Day countdown**: track important dates with D-7, D-Day, D+1 display
- **World clock**: display multiple timezones at dashboard top
- **Weather widget**: current weather via OpenWeatherMap API
- **Auto theme**: follow OS dark/light preference automatically
- **6 accent colors**: blue, purple, rose, emerald, amber, cyan
- **Custom CSS**: inject your own styling rules
- **Tab title with time**: browser tab shows current time

### Server
- **Atomic writes**: write to temp file then rename (prevents data corruption)
- **Auto backup**: smart retention policy (7d all / 8-30d daily / 30d+ delete / 50 cap)
- **Port change API**: change port from dashboard settings
- **Server restart API**: restart from dashboard without touching files
- **Health endpoint**: `/api/health` with uptime, memory, version info
- **Error log rotation**: logs capped at 10MB with automatic rotation

---

## [v4.0] - 2025-02

### New Features
- **Category drag reorder**: drag handle to reorder bookmark cards
- **Category collapse**: click card title to collapse/expand
- **Collapsed preview**: shows first 4 icons when category is collapsed
- **Card resize**: change card width (1-column or 2-column span)
- **Card move between pages**: move entire categories between pages
- **Context menu**: right-click bookmark for edit, open new tab, move, delete
- **Quick-add input**: type URL directly in card bottom input
- **NEW badge**: bookmarks added within 7 days show a NEW indicator
- **Trash with undo**: deleted bookmarks go to trash, recoverable for 30 days
- **Undo toast**: Ctrl+Z within 5 seconds restores deleted items

### Server
- **Multipart upload**: custom parser for background and icon uploads
- **Upload bookmark icon**: custom icons per bookmark
- **Upload background**: custom background images with slideshow support
- **Filename sanitization**: strips dangerous characters from uploads
- **Write locks**: prevent race conditions on concurrent JSON writes

---

## [v3.0] - 2025-02

### New Features
- **Todo list**: tasks with priority (high/medium/low), due dates, tags
- **Recurring todos**: daily, weekly, bi-weekly, monthly recurrence
- **Subtasks**: nested checklist items within a todo
- **Eisenhower sort**: priority x urgency automatic sorting
- **Tag system**: categorize todos with colored tags
- **Notes / Memo cards**: simple text notepads with auto-link detection

### Server
- **Trash API**: `/api/trash` with 30-day auto-cleanup
- **Usage tracking API**: `/api/usage/track` with hourly and history data
- **Pomo stats API**: `/api/pomo-stats` for timer session tracking

---

## [v2.0] - 2025-02

### New Features
- **Dark / Light theme**: one-click toggle with circle transition animation
- **Glass-morphism UI**: adjustable card transparency and backdrop blur
- **Keyboard shortcuts**: customizable key bindings
- **Multi-search engine**: Google, Naver, YouTube with engine switcher
- **Time-based usage boost**: bookmarks sorted by current-hour usage

### Server
- **Gzip compression**: pre-compressed HTML, CSS, JS, JSON, SVG
- **ETag caching**: SHA-256 hash-based conditional responses (304)
- **In-memory file cache**: 5-minute TTL with preloading on startup
- **Keep-alive connections**: 30-second timeout for persistent connections
- **Graceful shutdown**: SIGINT/SIGTERM handlers with final backup

---

## [v1.0] - 2025-02

### Initial Release
- Node.js HTTP server using only built-in modules (zero dependencies)
- Category-based bookmark cards with drag-and-drop reorder
- Configurable port (port.conf, CLI argument, dashboard UI)
- Localhost-only binding (127.0.0.1)
- Offline support via Service Worker
- Windows auto-start (Registry + VBS hidden launch)
- Mac auto-start (LaunchAgent plist)
- Portable Node.js download for Windows (no system install needed)
- PID-based process management (safe restart without killing other processes)
- JSON file-based data storage in `data/` directory
