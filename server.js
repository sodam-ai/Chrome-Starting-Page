const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const VERSION = '7.3';

// Port priority: command line arg > port.conf file > default 1111
const PREFERRED_PORT = (() => {
    // 1) node server.js 9999
    const arg = parseInt(process.argv[2]);
    if (arg > 0 && arg < 65536) return arg;
    // 2) port.conf file
    try { const p = parseInt(fs.readFileSync(path.join(__dirname, 'port.conf'), 'utf8').trim()); if (p > 0 && p < 65536) return p; } catch {}
    // 3) default
    return 1111;
})();
let PORT = PREFERRED_PORT;
const MAX_PORT_ATTEMPTS = 10; // Try up to 10 consecutive ports
const HOST = '127.0.0.1'; // Security: localhost only
const DIR = __dirname;
const MAX_BODY = 10 * 1024 * 1024;
const MAX_ERROR_LOG = 10 * 1024 * 1024; // 10MB error log limit
const DATA = path.join(DIR, 'data');
const PID_FILE = path.join(DIR, '.server.pid');

// === Static File Cache (raw + pre-compressed gzip) ===
const _fileCache = new Map();
const CACHE_MAX_AGE = 300 * 1000; // 5 min cache
const crypto = require('crypto');
function getCachedFile(fp, wantGzip) {
    const cached = _fileCache.get(fp);
    if (cached && Date.now() - cached.time < CACHE_MAX_AGE) {
        return wantGzip && cached.gzip ? { data: cached.gzip, etag: cached.etag, gzipped: true } : { data: cached.data, etag: cached.etag, gzipped: false };
    }
    try {
        const data = fs.readFileSync(fp);
        const etag = '"' + crypto.createHash('sha256').update(data).digest('hex').slice(0, 16) + '"';
        const entry = { data, etag, time: Date.now(), gzip: null };
        // Pre-compress text files
        const ext = path.extname(fp).toLowerCase();
        if (['.html','.css','.js','.json','.svg','.webmanifest'].includes(ext)) {
            try { entry.gzip = zlib.gzipSync(data, { level: 6 }); } catch {}
        }
        _fileCache.set(fp, entry);
        return wantGzip && entry.gzip ? { data: entry.gzip, etag, gzipped: true } : { data, etag, gzipped: false };
    } catch { return null; }
}
function clearFileCache() { _fileCache.clear(); }
// Pre-load critical files on startup
function preloadCache() {
    ['index.html','style.css','script.js','manifest.webmanifest','sw.js'].forEach(f => {
        try { getCachedFile(path.join(DIR, f), true); } catch {}
    });
}

const MIME = {
    '.html':'text/html','.css':'text/css','.js':'text/javascript',
    '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
    '.gif':'image/gif','.svg':'image/svg+xml','.json':'application/json',
    '.ico':'image/x-icon','.webp':'image/webp','.woff2':'font/woff2',
    '.woff':'font/woff','.webmanifest':'application/manifest+json'
};

// === Write Lock: prevent race conditions on concurrent JSON writes ===
const _writeLocks = new Map();
async function acquireWriteLock(file) {
    const LOCK_TIMEOUT = 5000;
    while (_writeLocks.has(file)) {
        const existing = _writeLocks.get(file);
        const timeout = new Promise(r => setTimeout(() => { console.warn('[WriteLock] Timeout waiting for', file); r(); }, LOCK_TIMEOUT));
        await Promise.race([existing, timeout]);
        // Force-release stale lock after timeout
        if (_writeLocks.has(file) && _writeLocks.get(file) === existing) {
            _writeLocks.delete(file);
        }
    }
    let resolve;
    const p = new Promise(r => { resolve = r; });
    p._resolve = resolve;
    _writeLocks.set(file, p);
}
function releaseWriteLock(file) {
    const p = _writeLocks.get(file);
    _writeLocks.delete(file);
    if (p && p._resolve) p._resolve();
}

function safePath(url) {
    let d;
    try { d = decodeURIComponent(url.split('?')[0]); } catch { return null; } // malformed % encoding must not hang the request
    const r = path.resolve(DIR, '.' + d);
    // Case-insensitive comparison on Windows to prevent path traversal bypass
    const dirNorm = DIR.toLowerCase();
    const rNorm = r.toLowerCase();
    return rNorm.startsWith(dirNorm) ? r : null;
}
// Sanitize uploaded filenames: strip path separators and dangerous chars
function sanitizeFilename(name) {
    return name.replace(/[\/\\:*?"<>|]/g, '_').replace(/\.\./g, '_').slice(0, 100);
}
function readBody(req, cb) {
    const chunks = []; let s = 0;
    req.on('data', c => { s += c.length; if (s > MAX_BODY) { req.destroy(); return cb(new Error('Too large')); } chunks.push(c); });
    req.on('end', () => cb(null, Buffer.concat(chunks).toString('utf8')));
    req.on('error', cb);
}
function json(res, code, data) {
    if (res.writableEnded) return; // Guard: prevent write after end
    res.writeHead(code, { 'Content-Type':'application/json', 'Cache-Control':'no-cache' });
    res.end(JSON.stringify(data));
}
function rJson(file, fb) {
    try {
        const raw = fs.readFileSync(file, 'utf8');
        if (!raw || !raw.trim()) return fb; // Guard: empty file
        const parsed = JSON.parse(raw);
        return parsed !== null && parsed !== undefined ? parsed : fb;
    } catch { return fb; }
}
function wJson(file, data) {
    try {
        const json = JSON.stringify(data, null, 2);
        // Validate JSON can be re-parsed before writing (safety check)
        JSON.parse(json);
        // Atomic write: write to temp then rename (prevents corruption on crash)
        const tmp = file + '.tmp';
        fs.writeFileSync(tmp, json, 'utf8');
        fs.renameSync(tmp, file);
    } catch (e) {
        // Fallback: direct write if rename fails
        try { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }
        catch (e2) { console.error('[Write Error]', file, e2.message); }
        // Clean up orphaned tmp file
        try { if (fs.existsSync(file + '.tmp')) fs.unlinkSync(file + '.tmp'); } catch {}
    }
}
function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

// Bookmark URL scheme allowlist. Blocks javascript:/data:/vbscript: etc. — those aren't
// real bookmarks, they're script-execution payloads that would run when the card is
// clicked (createBookmarkEl sets link.href = item.url directly). http(s)/ftp(s)/mailto
// covers every legitimate bookmark use case, so this doesn't restrict real usage.
const BOOKMARK_URL_ALLOWED_PROTOCOLS = ['http:', 'https:', 'ftp:', 'ftps:', 'mailto:'];
function isValidBookmarkUrl(url) {
    if (typeof url !== 'string' || url.length === 0) return false;
    try { return BOOKMARK_URL_ALLOWED_PROTOCOLS.includes(new URL(url).protocol); }
    catch { return false; }
}
// Strict validator for /api/bookmarks (routine saves from the running UI) — rejects the
// whole payload if any entry is invalid, matching every other endpoint's v() convention.
// In normal use this only ever receives data the client already validated in saveBM(),
// so a rejection here means either direct API misuse or a bug — fail loudly, don't guess.
function isValidBookmarksData(d) {
    if (typeof d !== 'object' || d === null || Array.isArray(d)) return false;
    for (const cat of Object.keys(d)) {
        const items = d[cat];
        if (!Array.isArray(items)) return false;
        for (const item of items) {
            if (!item || typeof item !== 'object') return false;
            if (typeof item.name !== 'string' || item.name.length === 0) return false;
            if (!isValidBookmarkUrl(item.url)) return false;
        }
    }
    return true;
}
// Lenient filter for /api/import (bulk restore from a backup file) — a backup made before
// this validation existed could plausibly contain one stale/malformed URL among hundreds
// of good ones. Failing the whole import over one old entry would work against the point
// of import (restore everything that's still good) — so this drops only the bad entries
// and reports how many, instead of rejecting the entire restore.
function sanitizeBookmarksForImport(d) {
    if (typeof d !== 'object' || d === null || Array.isArray(d)) return { data: {}, droppedCount: 0 };
    const out = {}; let droppedCount = 0;
    for (const cat of Object.keys(d)) {
        const items = d[cat];
        if (!Array.isArray(items)) continue;
        out[cat] = items.filter(item => {
            const ok = item && typeof item === 'object' && typeof item.name === 'string' && item.name.length > 0 && isValidBookmarkUrl(item.url);
            if (!ok) droppedCount++;
            return ok;
        });
    }
    return { data: out, droppedCount };
}

// Canonical list of data files — used by backup, export, import, and integrity check
const DATA_FILES = [
    { key: 'bookmarks', f: 'bookmarks.json', fb: {} },
    { key: 'notes', f: 'notes.json', fb: { notes: [] } },
    { key: 'config', f: 'config.json', fb: {} },
    { key: 'todos', f: 'todos.json', fb: { items: [] } },
    { key: 'ddays', f: 'ddays.json', fb: { items: [] } },
    { key: 'usage', f: 'usage.json', fb: {} },
    { key: 'trash', f: 'trash.json', fb: { items: [] } },
    { key: 'events', f: 'events.json', fb: { items: [] } },
    { key: 'pomo-stats', f: 'pomo-stats.json', fb: { sessions: [] } }
];

// --- Data Integrity Check: validate all JSON files on startup, auto-recover from backup ---
function checkDataIntegrity() {
    let corrupted = [];
    // Phase 1: Check which files are corrupted
    DATA_FILES.forEach(({ f, fb }) => {
        const fp = path.join(DATA, f);
        if (!fs.existsSync(fp)) return; // Missing files are OK (defaults used)
        try {
            const raw = fs.readFileSync(fp, 'utf8');
            if (!raw || !raw.trim()) throw new Error('Empty file');
            JSON.parse(raw);
        } catch (e) {
            corrupted.push({ f, fb, error: e.message });
        }
    });
    if (!corrupted.length) { console.log('[Integrity] All data files OK'); return; }
    console.warn(`[Integrity] ${corrupted.length} corrupted file(s): ${corrupted.map(c => c.f).join(', ')}`);
    // Phase 2: Try to recover from latest backup
    const backupDir = path.join(DATA, 'backups');
    let backupData = null;
    try {
        if (fs.existsSync(backupDir)) {
            const backups = fs.readdirSync(backupDir)
                .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
                .sort().reverse();
            for (const bf of backups) {
                try {
                    const raw = fs.readFileSync(path.join(backupDir, bf), 'utf8');
                    backupData = JSON.parse(raw);
                    console.log(`[Integrity] Found valid backup: ${bf}`);
                    break;
                } catch { continue; }
            }
        }
    } catch {}
    // Phase 3: Restore corrupted files
    corrupted.forEach(({ f, fb }) => {
        const fp = path.join(DATA, f);
        const key = f.replace('.json', '');
        if (backupData && backupData[key] !== undefined) {
            try {
                wJson(fp, backupData[key]);
                console.log(`[Integrity] Restored ${f} from backup`);
                appendErrorLog(`INTEGRITY: Restored ${f} from backup`);
                return;
            } catch {}
        }
        // Fallback: write default value
        try {
            wJson(fp, fb);
            console.warn(`[Integrity] Reset ${f} to default (no backup available)`);
            appendErrorLog(`INTEGRITY: Reset ${f} to default — no backup found`);
        } catch {}
    });
}

// --- Auto Backup ---
let backupTimer = null;
let backupBootTimeout = null;
// 2026-08-20 수정: startAutoBackup()은 서버 시작 시 1번 + /api/config 저장마다 매번
// 호출된다(371행). 기존 코드는 setInterval 핸들(backupTimer)만 clearInterval하고,
// 60초 뒤로 미뤄둔 setTimeout 자체는 아무도 취소하지 않았다 — 그래서 사용자가 설정을
// 60초 안에 여러 번 저장하면(설정 조정 중 흔함), 이전 setTimeout들이 각자 독립적으로
// 살아남아 doBackup()을 각자 실행하고, 각자 새 setInterval까지 만든다(가장 마지막
// setTimeout이 만든 것만 backupTimer 변수에 남고 이전 것들은 참조를 잃어 절대 못 지움 —
// 고아 타이머 누적). 실측: data/backups/에 51개 파일이 쌓여있던 원인이 이것으로 추정됨
// (7일 이내 전부 보관·8~30일 하루1개·30일+삭제라는 보관정책 자체는 정상인데, 짧은 시간에
// 여러 겹의 타이머가 각자 자동백업을 만들어내 정책이 감당 못 할 속도로 쌓인 것). 이제
// setTimeout 핸들도 함께 저장해뒀다가 다음 호출 시 반드시 먼저 취소한다.
function startAutoBackup() {
    if (backupBootTimeout) clearTimeout(backupBootTimeout);
    if (backupTimer) clearInterval(backupTimer);
    const cfg = rJson(path.join(DATA, 'config.json'), {});
    // 2026-08-21 수정(경계값 테스트로 발견): /api/config 검증 함수(v:d=>typeof
    // d==='object'&&d!==null)는 backupIntervalHours 값 자체는 전혀 검증하지 않는다 —
    // 이 값이 음수·비숫자 문자열이면 `hours*3600*1000`이 음수·NaN이 되고, setInterval은
    // 그런 값을 그대로 최소 지연(사실상 0ms)으로 취급해 doBackup()이 초당 수십 번씩
    // 폭주하며 디스크를 계속 두드리는 결함을 격리 시뮬레이션으로 확인했다(음수 -1: 200ms
    // 동안 14회 발화, "abc": 13회 발화 — 정상값 24는 0회). 클라이언트 입력 UI(min=1/
    // max=168)는 API를 직접 호출하거나 config.json이 손상되면 우회되므로, 서버가 실제로
    // 쓰는 시점에 안전한 범위로 강제한다(false-positive 안내 없이 조용히 clamp — 이 필드는
    // 사용자가 직접 편집할 일이 거의 없는 내부 설정값이라 에러보다 안전한 기본값 폴백이
    // 낫다고 판단, 다른 API 필드들의 "Invalid" 전체 거부와는 다른 관용적 처리).
    const rawHours = Number(cfg.backupIntervalHours);
    const hours = Number.isFinite(rawHours) && rawHours >= 1 ? Math.min(rawHours, 168) : 24;
    // Defer first backup 60s to avoid blocking initial requests
    backupBootTimeout = setTimeout(() => { doBackup(); backupTimer = setInterval(doBackup, hours * 3600 * 1000); }, 60000);
}
function doBackup() {
    try {
        ensureDir(path.join(DATA, 'backups'));
        const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupData = { _backup_version: VERSION, _backup_date: new Date().toISOString() };
        DATA_FILES.forEach(({ key, f, fb }) => { backupData[key] = rJson(path.join(DATA, f), fb); });
        wJson(path.join(DATA, 'backups', `backup-${ts}.json`), backupData);
        // Smart retention: 7 days all, 8-30 days keep 1/day, 30+ days delete
        const now = Date.now();
        const DAY = 86400000;
        const backups = fs.readdirSync(path.join(DATA, 'backups'))
            .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
            .sort();
        const toDelete = [];
        const dayBuckets = {};
        backups.forEach(f => {
            const m = f.match(/backup-(\d{4})-(\d{2})-(\d{2})/);
            if (!m) return;
            const fileDate = new Date(`${m[1]}-${m[2]}-${m[3]}`);
            const age = (now - fileDate.getTime()) / DAY;
            if (age > 30) { toDelete.push(f); }
            else if (age > 7) {
                const dayKey = `${m[1]}-${m[2]}-${m[3]}`;
                if (!dayBuckets[dayKey]) dayBuckets[dayKey] = [];
                dayBuckets[dayKey].push(f);
            }
        });
        // For 8-30 day range: keep only newest per day
        Object.values(dayBuckets).forEach(files => {
            files.sort();
            files.slice(0, -1).forEach(f => toDelete.push(f));
        });
        toDelete.forEach(f => {
            try { fs.unlinkSync(path.join(DATA, 'backups', f)); } catch(e) {}
        });
        // Hard cap at 50 total as safety net
        const remaining = fs.readdirSync(path.join(DATA, 'backups')).filter(f => f.startsWith('backup-')).sort();
        while (remaining.length > 50) {
            try { fs.unlinkSync(path.join(DATA, 'backups', remaining.shift())); } catch(e) {}
        }
    } catch (e) { console.error('[Backup]', e.message); }
}

// --- Multipart Parser (Buffer-safe) ---
function parseMultipart(raw, boundary) {
    const parts = [];
    const boundaryBuf = Buffer.from('--' + boundary);
    let start = 0;
    while (true) {
        const bStart = raw.indexOf(boundaryBuf, start);
        if (bStart === -1) break;
        const bEnd = bStart + boundaryBuf.length;
        // Check for closing boundary (--)
        if (raw[bEnd] === 0x2D && raw[bEnd + 1] === 0x2D) break;
        // Find next boundary
        const nextB = raw.indexOf(boundaryBuf, bEnd);
        if (nextB === -1) break;
        const segment = raw.slice(bEnd, nextB);
        // Find header end (\r\n\r\n)
        const hEnd = segment.indexOf('\r\n\r\n');
        if (hEnd === -1) { start = nextB; continue; }
        const header = segment.slice(0, hEnd).toString('utf8');
        const fn = header.match(/filename="(.+?)"/);
        if (!fn) { start = nextB; continue; }
        // Body: skip \r\n\r\n (4 bytes), trim trailing \r\n
        let body = segment.slice(hEnd + 4);
        if (body.length >= 2 && body[body.length - 2] === 0x0D && body[body.length - 1] === 0x0A) {
            body = body.slice(0, body.length - 2);
        }
        parts.push({ filename: fn[1], data: body });
        start = nextB;
    }
    return parts;
}

// --- Server ---
const server = http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    const m = req.method;
    const query = new URL(req.url, `http://localhost:${PORT}`).searchParams;

    // === JSON CRUD APIs ===
    const apis = {
        '/api/bookmarks': { f:'bookmarks.json', fb:{}, v:isValidBookmarksData },
        '/api/notes': { f:'notes.json', fb:{notes:[]}, v:d=>d&&(Array.isArray(d.notes)||typeof d.notes==='object') },
        '/api/config': { f:'config.json', fb:{}, v:d=>typeof d==='object'&&d!==null },
        '/api/todos': { f:'todos.json', fb:{items:[]}, v:d=>d&&Array.isArray(d.items) },
        '/api/ddays': { f:'ddays.json', fb:{items:[]}, v:d=>d&&Array.isArray(d.items) },
        '/api/usage': { f:'usage.json', fb:{}, v:d=>typeof d==='object'&&d!==null },
        '/api/events': { f:'events.json', fb:{items:[]}, v:d=>d&&Array.isArray(d.items) },
        // Note: /api/trash is handled separately below (with 30-day auto-cleanup on POST)
        '/api/pomo-stats': { f:'pomo-stats.json', fb:{sessions:[]}, v:d=>d&&Array.isArray(d.sessions) },
    };

    const api = apis[url];
    if (api) {
        const fp = path.join(DATA, api.f);
        if (m === 'GET') return json(res, 200, rJson(fp, api.fb));
        if (m === 'POST') {
            readBody(req, async (err, body) => {
                if (err) return json(res, 413, { error:'Too large' });
                try {
                    const p = JSON.parse(body);
                    if (!api.v(p)) throw new Error('Invalid');
                    await acquireWriteLock(fp);
                    try { wJson(fp, p); } finally { releaseWriteLock(fp); }
                    if (url === '/api/config') startAutoBackup();
                    json(res, 200, { success:true });
                } catch(e) { json(res, 400, { error:'Invalid JSON' }); }
            });
            return;
        }
    }

    // === Usage Track ===
    if (url === '/api/usage/track' && m === 'POST') {
        readBody(req, async (err, body) => {
            if (err) return json(res, 413, { error:'Too large' });
            try {
                const { key } = JSON.parse(body);
                if (!key || typeof key !== 'string' || key.length > 500) throw new Error('No key');
                const fp = path.join(DATA, 'usage.json');
                await acquireWriteLock(fp);
                try {
                    const usage = rJson(fp, {});
                    if (!usage[key]) usage[key] = { count: 0, lastUsed: null, hourly: {}, history: [] };
                    usage[key].count++;
                    const now = new Date();
                    usage[key].lastUsed = now.toISOString();
                    // Hourly tracking for time-based sorting
                    const h = now.getHours().toString();
                    if (!usage[key].hourly) usage[key].hourly = {};
                    usage[key].hourly[h] = (usage[key].hourly[h] || 0) + 1;
                    // History for heatmap (keep last 90 days)
                    if (!usage[key].history) usage[key].history = [];
                    usage[key].history.push(now.toISOString());
                    if (usage[key].history.length > 500) usage[key].history = usage[key].history.slice(-500);
                    wJson(fp, usage);
                } finally { releaseWriteLock(fp); }
                json(res, 200, { success: true });
            } catch { json(res, 400, { error:'Invalid' }); }
        });
        return;
    }

    // === Export (Full — JSON data + images as Base64) ===
    if (url === '/api/export' && m === 'GET') {
        const full = query.get('full') !== 'false'; // default: full export
        const data = { _export_version: VERSION, _export_date: new Date().toISOString(), _export_type: full ? 'full' : 'data-only' };
        DATA_FILES.forEach(({ key, f, fb }) => { data[key] = rJson(path.join(DATA, f), fb); });
        // Include profiles
        try {
            const profileDir = path.join(DATA, 'profiles');
            if (fs.existsSync(profileDir)) {
                data._profiles = {};
                fs.readdirSync(profileDir).filter(f => f.endsWith('.json')).forEach(f => {
                    try { data._profiles[f] = JSON.parse(fs.readFileSync(path.join(profileDir, f), 'utf8')); } catch {}
                });
            }
        } catch {}
        // Include images as Base64 (full export only)
        if (full) {
            data._files = {};
            // Custom icons
            try {
                const iconDir = path.join(DATA, 'icons');
                if (fs.existsSync(iconDir)) {
                    fs.readdirSync(iconDir).forEach(f => {
                        try {
                            const ext = path.extname(f).toLowerCase();
                            if (['.png','.jpg','.jpeg','.webp','.gif','.svg','.ico'].includes(ext)) {
                                data._files['data/icons/' + f] = fs.readFileSync(path.join(iconDir, f)).toString('base64');
                            }
                        } catch {}
                    });
                }
            } catch {}
            // Custom backgrounds and slideshow
            try {
                const assetDir = path.join(DIR, 'assets');
                if (fs.existsSync(assetDir)) {
                    fs.readdirSync(assetDir).forEach(f => {
                        try {
                            const ext = path.extname(f).toLowerCase();
                            if ((f.startsWith('background_custom') || f.startsWith('slide_')) && ['.png','.jpg','.jpeg','.webp','.gif'].includes(ext)) {
                                data._files['assets/' + f] = fs.readFileSync(path.join(assetDir, f)).toString('base64');
                            }
                        } catch {}
                    });
                }
            } catch {}
        }
        res.writeHead(200, { 'Content-Type':'application/json',
            'Content-Disposition':`attachment; filename="dashboard-backup-${new Date().toISOString().slice(0,10)}.json"` });
        res.end(JSON.stringify(data, null, 2));
        return;
    }

    // === Import (Full — restores JSON data + images from Base64) ===
    if (url === '/api/import' && m === 'POST') {
        readBody(req, async (err, body) => {
            if (err) return json(res, 413, { error:'Too large' });
            try {
                const d = JSON.parse(body);
                if (!d._export_version && !d._backup_version) throw new Error('Not valid');
                // Create safety backup before import
                try { doBackup(); } catch {}
                // Restore JSON data. bookmarks gets filtered (not rejected outright) —
                // a backup made before URL validation existed could plausibly carry one
                // stale/bad entry among hundreds of good ones (see sanitizeBookmarksForImport).
                let bookmarksDroppedCount = 0;
                DATA_FILES.forEach(({ key, f }) => {
                    if (!d[key]) return;
                    if (key === 'bookmarks') {
                        const sanitized = sanitizeBookmarksForImport(d[key]);
                        bookmarksDroppedCount = sanitized.droppedCount;
                        wJson(path.join(DATA, f), sanitized.data);
                    } else {
                        wJson(path.join(DATA, f), d[key]);
                    }
                });
                // Restore profiles
                if (d._profiles) {
                    ensureDir(path.join(DATA, 'profiles'));
                    Object.entries(d._profiles).forEach(([filename, content]) => {
                        try {
                            const safeName = sanitizeFilename(filename);
                            if (safeName.endsWith('.json')) {
                                wJson(path.join(DATA, 'profiles', safeName), content);
                            }
                        } catch {}
                    });
                }
                // Restore images from Base64
                if (d._files) {
                    const allowedDirs = [
                        path.join(DATA, 'icons'),
                        path.join(DIR, 'assets')
                    ];
                    const allowedExts = ['.png','.jpg','.jpeg','.webp','.gif','.svg','.ico'];
                    Object.entries(d._files).forEach(([filePath, base64Data]) => {
                        try {
                            // Security: reject paths with traversal patterns before resolving
                            if (filePath.includes('..') || filePath.includes('~')) return;
                            // Only allow known safe path prefixes
                            if (!filePath.startsWith('data/icons/') && !filePath.startsWith('assets/')) return;
                            const fullPath = path.resolve(DIR, filePath);
                            // Verify resolved path is strictly within allowed directories (case-insensitive on Windows)
                            const fullNorm = fullPath.toLowerCase();
                            const inAllowed = allowedDirs.some(d => fullNorm.startsWith(d.toLowerCase()));
                            if (!inAllowed) return;
                            // Only allow image file extensions
                            const ext = path.extname(fullPath).toLowerCase();
                            if (!allowedExts.includes(ext)) return;
                            ensureDir(path.dirname(fullPath));
                            fs.writeFileSync(fullPath, Buffer.from(base64Data, 'base64'));
                        } catch {}
                    });
                }
                // Clear file cache so restored images are served immediately
                clearFileCache();
                json(res, 200, { success:true, bookmarksDroppedCount });
            } catch (e) { json(res, 400, { error:e.message }); }
        });
        return;
    }

    // === Upload Background ===
    if (url === '/api/upload-background' && m === 'POST') {
        const chunks = []; let sz = 0; let destroyed = false;
        req.on('data', c => { sz += c.length; if (sz > MAX_BODY) { destroyed = true; req.destroy(); return; } chunks.push(c); });
        req.on('error', () => { destroyed = true; });
        req.on('end', () => {
            if (destroyed) return json(res, 413, { error: 'File too large' });
            try {
                const raw = Buffer.concat(chunks);
                const bm = (req.headers['content-type']||'').match(/boundary=(.+)/);
                if (!bm) return json(res, 400, { error:'No boundary' });
                const parts = parseMultipart(raw, bm[1]);
                if (!parts.length) return json(res, 400, { error:'No file' });
                const p = parts[0]; const ext = path.extname(sanitizeFilename(p.filename)).toLowerCase();
                if (!['.png','.jpg','.jpeg','.webp','.gif'].includes(ext)) return json(res, 400, { error:'Bad type' });
                ensureDir(path.join(DIR, 'assets'));
                const isSlide = query.get('slideshow') === 'true';
                const dest = isSlide ? 'slide_' + Date.now() + ext : 'background_custom' + ext;
                const destPath = path.join(DIR, 'assets', dest);
                // Verify dest is still within assets dir (case-insensitive on Windows)
                if (!destPath.toLowerCase().startsWith(path.join(DIR, 'assets').toLowerCase())) return json(res, 400, { error:'Bad path' });
                fs.writeFileSync(destPath, p.data);
                if (!isSlide) {
                    const cfg = rJson(path.join(DATA,'config.json'), {});
                    cfg.backgroundImage = 'assets/' + dest;
                    wJson(path.join(DATA,'config.json'), cfg);
                }
                json(res, 200, { success:true, path:'assets/' + dest });
            } catch (e) { console.error('[Upload BG]', e.message); json(res, 500, { error:'Upload failed' }); }
        });
        return;
    }

    // === Upload Bookmark Icon ===
    if (url === '/api/upload-icon' && m === 'POST') {
        const chunks = []; let sz = 0; let destroyed = false;
        req.on('data', c => { sz += c.length; if (sz > MAX_BODY) { destroyed = true; req.destroy(); return; } chunks.push(c); });
        req.on('error', () => { destroyed = true; });
        req.on('end', () => {
            if (destroyed) return json(res, 413, { error: 'File too large' });
            try {
                const raw = Buffer.concat(chunks);
                const bm = (req.headers['content-type']||'').match(/boundary=(.+)/);
                if (!bm) return json(res, 400, { error:'No boundary' });
                const parts = parseMultipart(raw, bm[1]);
                if (!parts.length) return json(res, 400, { error:'No file' });
                const p = parts[0]; const ext = path.extname(sanitizeFilename(p.filename)).toLowerCase();
                if (!['.png','.jpg','.jpeg','.webp','.gif','.svg','.ico'].includes(ext)) return json(res, 400, { error:'Bad type' });
                ensureDir(path.join(DATA, 'icons'));
                const dest = 'icon_' + Date.now() + ext;
                const destPath = path.join(DATA, 'icons', dest);
                if (!destPath.toLowerCase().startsWith(path.join(DATA, 'icons').toLowerCase())) return json(res, 400, { error:'Bad path' });
                fs.writeFileSync(destPath, p.data);
                json(res, 200, { success:true, path:'data/icons/' + dest });
            } catch (e) { console.error('[Upload Icon]', e.message); json(res, 500, { error:'Upload failed' }); }
        });
        return;
    }

    // === Profiles ===
    if (url === '/api/profiles' && m === 'GET') {
        ensureDir(path.join(DATA, 'profiles'));
        const profiles = fs.readdirSync(path.join(DATA, 'profiles')).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
        profiles.unshift('default');
        return json(res, 200, { profiles, active: rJson(path.join(DATA,'config.json'),{}).activeProfile || 'default' });
    }
    if (url === '/api/profiles/save' && m === 'POST') {
        readBody(req, (err, body) => {
            if (err) return json(res, 413, { error:'Too large' });
            try {
                const { name } = JSON.parse(body);
                if (!name || name === 'default') throw new Error('Invalid name');
                ensureDir(path.join(DATA, 'profiles'));
                const pd = { bookmarks: rJson(path.join(DATA,'bookmarks.json'),{}), notes: rJson(path.join(DATA,'notes.json'),{notes:[]}),
                    config: rJson(path.join(DATA,'config.json'),{}), todos: rJson(path.join(DATA,'todos.json'),{items:[]}), ddays: rJson(path.join(DATA,'ddays.json'),{items:[]}) };
                wJson(path.join(DATA, 'profiles', name + '.json'), pd);
                json(res, 200, { success:true });
            } catch (e) { json(res, 400, { error:e.message }); }
        });
        return;
    }
    if (url === '/api/profiles/load' && m === 'POST') {
        readBody(req, (err, body) => {
            if (err) return json(res, 413, { error:'Too large' });
            try {
                const { name } = JSON.parse(body);
                if (!name) throw new Error('No name');
                if (name === 'default') { const cfg = rJson(path.join(DATA,'config.json'),{}); cfg.activeProfile='default'; wJson(path.join(DATA,'config.json'),cfg); return json(res,200,{success:true}); }
                const pf = path.join(DATA, 'profiles', name + '.json');
                if (!fs.existsSync(pf)) throw new Error('Not found');
                const d = rJson(pf, null); if (!d) throw new Error('Invalid');
                if (d.bookmarks) wJson(path.join(DATA,'bookmarks.json'), d.bookmarks);
                if (d.notes) wJson(path.join(DATA,'notes.json'), d.notes);
                if (d.todos) wJson(path.join(DATA,'todos.json'), d.todos);
                if (d.ddays) wJson(path.join(DATA,'ddays.json'), d.ddays);
                if (d.config) { d.config.activeProfile=name; wJson(path.join(DATA,'config.json'), d.config); }
                json(res, 200, { success:true });
            } catch (e) { json(res, 400, { error:e.message }); }
        });
        return;
    }
    if (url === '/api/profiles/delete' && m === 'POST') {
        readBody(req, (err, body) => {
            if (err) return json(res, 413, { error:'Too large' });
            try {
                const { name } = JSON.parse(body); if (!name || name === 'default') throw new Error('Cannot');
                const pf = path.join(DATA, 'profiles', name + '.json');
                if (fs.existsSync(pf)) fs.unlinkSync(pf);
                json(res, 200, { success:true });
            } catch (e) { json(res, 400, { error:e.message }); }
        });
        return;
    }

    // === Health / Backups ===
    if (url === '/api/health' && m === 'GET') return json(res, 200, { status:'ok', version:VERSION, uptime: process.uptime(), timestamp: Date.now(), port: PORT, memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB' });
    if (url === '/api/backups' && m === 'GET') {
        ensureDir(path.join(DATA, 'backups'));
        const backups = fs.readdirSync(path.join(DATA, 'backups'))
            .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
            .sort().reverse()
            .map(f => {
                try {
                    const stat = fs.statSync(path.join(DATA, 'backups', f));
                    return { name: f, size: stat.size, date: stat.mtime.toISOString() };
                } catch { return { name: f, size: 0, date: '' }; }
            });
        return json(res, 200, { backups });
    }
    // Restore from a specific backup file
    if (url === '/api/backups/restore' && m === 'POST') {
        readBody(req, (err, body) => {
            if (err) return json(res, 413, { error: 'Too large' });
            try {
                const { name } = JSON.parse(body);
                if (!name || !name.startsWith('backup-') || !name.endsWith('.json')) throw new Error('Invalid backup name');
                const safeName = sanitizeFilename(name);
                const bp = path.join(DATA, 'backups', safeName);
                if (!fs.existsSync(bp)) throw new Error('Backup not found');
                const d = JSON.parse(fs.readFileSync(bp, 'utf8'));
                // Create safety backup before restore
                try { doBackup(); } catch {}
                // Restore each data file (bookmarks filtered, not rejected — see
                // sanitizeBookmarksForImport; same reasoning as /api/import)
                let bookmarksDroppedCount = 0;
                DATA_FILES.forEach(({ key, f }) => {
                    if (!d[key]) return;
                    if (key === 'bookmarks') {
                        const sanitized = sanitizeBookmarksForImport(d[key]);
                        bookmarksDroppedCount = sanitized.droppedCount;
                        wJson(path.join(DATA, f), sanitized.data);
                    } else {
                        wJson(path.join(DATA, f), d[key]);
                    }
                });
                clearFileCache();
                json(res, 200, { success: true, message: 'Restored from ' + safeName, bookmarksDroppedCount });
            } catch (e) { json(res, 400, { error: e.message }); }
        });
        return;
    }

    // === Port Change ===
    if (url === '/api/port' && m === 'GET') {
        const portConf = path.join(DIR, 'port.conf');
        let configuredPort = 1111;
        try { const p = parseInt(fs.readFileSync(portConf, 'utf8').trim()); if (p > 0 && p < 65536) configuredPort = p; } catch {}
        return json(res, 200, { currentPort: PORT, configuredPort });
    }
    if (url === '/api/port' && m === 'POST') {
        readBody(req, (err, body) => {
            if (err) return json(res, 413, { error:'Too large' });
            try {
                const { port } = JSON.parse(body);
                const p = parseInt(port);
                if (!p || p < 1024 || p > 65535) throw new Error('Port must be between 1024 and 65535');
                // Save to port.conf
                fs.writeFileSync(path.join(DIR, 'port.conf'), String(p), 'utf8');
                json(res, 200, { success: true, port: p, message: 'Port saved. Restart server to apply.' });
            } catch (e) { json(res, 400, { error: e.message }); }
        });
        return;
    }

    // === Server Shutdown (clean exit, no respawn) ===
    if (url === '/api/shutdown' && m === 'POST') {
        json(res, 200, { success: true, message: 'Server shutting down...' });
        setTimeout(() => { gracefulShutdown('API_SHUTDOWN'); }, 300);
        return;
    }

    // === Server Restart (self-restart: save backup, then spawn new process and exit) ===
    if (url === '/api/restart' && m === 'POST') {
        json(res, 200, { success: true, message: 'Server restarting...' });
        setTimeout(() => {
            try { doBackup(); } catch {}
            // Determine node executable path
            const localNode = path.join(DIR, 'node', 'node.exe');
            const nodeExe = fs.existsSync(localNode) ? localNode : 'node';
            // Spawn new server process (detached, independent)
            const child = require('child_process').spawn(nodeExe, ['server.js'], {
                cwd: DIR, detached: true, stdio: 'ignore'
            });
            child.unref();
            // Clean up PID file and exit current process
            try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE); } catch {}
            process.exit(0);
        }, 500);
        return;
    }

    // === Trash ===
    const trashFile = path.join(DATA, 'trash.json');
    if (url === '/api/trash' && m === 'GET') return json(res, 200, rJson(trashFile, { items: [] }));
    if (url === '/api/trash' && m === 'POST') {
        readBody(req, async (err, body) => {
            if (err) return json(res, 413, { error:'Too large' });
            try {
                const p = JSON.parse(body);
                if (!p || !Array.isArray(p.items)) throw new Error('Invalid');
                // Auto-clean items older than 30 days
                const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
                p.items = p.items.filter(i => i && i.deletedAt && new Date(i.deletedAt).getTime() > cutoff);
                await acquireWriteLock(trashFile);
                try { wJson(trashFile, p); } finally { releaseWriteLock(trashFile); }
                json(res, 200, { success: true });
            } catch { json(res, 400, { error:'Invalid' }); }
        });
        return;
    }

    // === Static Files (cached + pre-gzip + ETag) ===
    const fp = safePath(url === '/' ? '/index.html' : url);
    if (!fp) { res.writeHead(403); res.end('Forbidden'); return; }
    const ct = MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream';
    const ae = req.headers['accept-encoding'] || '';
    const wantGzip = ae.includes('gzip');
    const result = getCachedFile(fp, wantGzip);
    if (!result) { res.writeHead(404); res.end('404'); return; }
    // ETag: skip sending body if browser already has it
    if (req.headers['if-none-match'] === result.etag) {
        res.writeHead(304, { 'ETag': result.etag, 'Connection': 'keep-alive' });
        res.end();
        return;
    }
    const headers = {
        'Content-Type': ct,
        'ETag': result.etag,
        'X-Content-Type-Options': 'nosniff',
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=30'
    };
    if (ct.startsWith('image/') || ct.startsWith('font/')) {
        headers['Cache-Control'] = 'public, max-age=86400';
    } else {
        headers['Cache-Control'] = 'public, max-age=10, must-revalidate';
    }
    if (result.gzipped) headers['Content-Encoding'] = 'gzip';
    headers['Content-Length'] = result.data.length;
    res.writeHead(200, headers);
    res.end(result.data);
});

server.keepAliveTimeout = 30000;
server.headersTimeout = 35000;

// === Start Server with auto port fallback ===
// Pre-check port availability using a temporary socket before calling server.listen()
// This avoids the Node.js bug where re-calling listen() on the same server causes double callbacks
const net = require('net');
function findAvailablePort(startPort, maxAttempts) {
    return new Promise((resolve, reject) => {
        let attempt = 0;
        function tryPort(port) {
            if (attempt >= maxAttempts || port > 65535) {
                return reject(new Error(`All ports ${startPort}-${port - 1} are in use`));
            }
            const tester = net.createServer();
            tester.once('error', () => {
                attempt++;
                console.warn(`[Server] Port ${port} in use, trying ${port + 1}...`);
                tryPort(port + 1);
            });
            tester.once('listening', () => {
                tester.close(() => resolve(port));
            });
            tester.listen(port, HOST);
        }
        tryPort(startPort);
    });
}

// Try to stop any existing dashboard on our preferred port before starting
function stopExistingDashboard() {
    return new Promise(resolve => {
        const req = http.request({ hostname: HOST, port: PREFERRED_PORT, path: '/api/health', method: 'GET', timeout: 2000 }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const j = JSON.parse(data);
                    if (j.version === VERSION || j.status === 'ok') {
                        console.log(`[Server] Existing dashboard found on port ${PREFERRED_PORT}, stopping it...`);
                        // Send shutdown (clean exit, no respawn)
                        const killReq = http.request({ hostname: HOST, port: PREFERRED_PORT, path: '/api/shutdown', method: 'POST', timeout: 2000 }, () => {});
                        killReq.on('error', () => {});
                        killReq.end();
                        // Wait for it to actually stop
                        setTimeout(resolve, 2000);
                        return;
                    }
                } catch {}
                resolve();
            });
        });
        req.on('error', () => resolve()); // No server running — good
        req.on('timeout', () => { req.destroy(); resolve(); });
        req.end();
    });
}

stopExistingDashboard().then(() => {
    // Also clean stale PID file
    try {
        if (fs.existsSync(PID_FILE)) {
            const pidData = JSON.parse(fs.readFileSync(PID_FILE, 'utf8'));
            // Check if the PID is still alive
            try { process.kill(pidData.pid, 0); } catch {
                // Process doesn't exist — clean up stale PID file
                fs.unlinkSync(PID_FILE);
            }
        }
    } catch { try { fs.unlinkSync(PID_FILE); } catch {} }

    return findAvailablePort(PREFERRED_PORT, MAX_PORT_ATTEMPTS);
}).then(availablePort => {
    PORT = availablePort;
    server.listen(PORT, HOST, () => {
        // Write PID file for safe process management
        try { fs.writeFileSync(PID_FILE, JSON.stringify({ pid: process.pid, port: PORT, started: new Date().toISOString() })); } catch {}
        if (PORT !== PREFERRED_PORT) {
            console.log(`[Server] Port ${PREFERRED_PORT} was in use — using port ${PORT} instead`);
        }
        console.log(`[Dashboard v${VERSION}] http://${HOST}:${PORT}/`);
        checkDataIntegrity();
        preloadCache();
        startAutoBackup();
    });
}).catch(err => {
    console.error(`[Server] ${err.message}`);
    console.error(`[Server] Set a custom port: echo 8080 > port.conf`);
    process.exit(1);
});

server.on('error', (err) => {
    console.error('[Server] Fatal error:', err.message);
    appendErrorLog(`SERVER ERROR: ${err.message}`);
    process.exit(1);
});

// === Graceful Shutdown ===
function gracefulShutdown(signal) {
    console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
    if (backupTimer) clearInterval(backupTimer);
    try { doBackup(); console.log('[Server] Final backup saved.'); } catch (e) { console.error('[Server] Backup failed:', e.message); }
    // Clean up PID file
    try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE); } catch {}
    server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
    });
    // Force exit after 5 seconds if server.close() hangs
    setTimeout(() => { console.error('[Server] Forced exit after timeout.'); process.exit(1); }, 5000);
}
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// === Uncaught Error Handlers ===
function appendErrorLog(msg) {
    try {
        const logFile = path.join(DIR, 'server.error.log');
        // Rotate log if too large
        try { const stat = fs.statSync(logFile); if (stat.size > MAX_ERROR_LOG) fs.renameSync(logFile, logFile + '.old'); } catch {}
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
    } catch {}
}
process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught exception:', err.message);
    appendErrorLog(`UNCAUGHT: ${err.stack}`);
});
process.on('unhandledRejection', (reason) => {
    console.error('[WARN] Unhandled rejection:', reason);
    appendErrorLog(`REJECTION: ${reason}`);
});
