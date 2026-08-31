// Pure, side-effect-free validators shared by server.js and the Node regression
// tests (test/validators.test.js). Extracted (2026-08-31) so the exact logic
// behind M1 (bookmark URL scheme allowlist) and M5 (backup interval clamp) can
// be required directly in tests without requiring server.js itself — server.js
// calls server.listen() and touches data/*.json as soon as it's loaded, so
// require()-ing it from a test would start a second real server and risk the
// live data files. This file has neither side effect.

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

// 2026-08-21 수정(경계값 테스트로 발견, M5): backupIntervalHours가 음수·비숫자 문자열이면
// hours*3600*1000이 음수·NaN이 되고, setInterval이 그런 값을 최소 지연(사실상 0ms)으로
// 취급해 doBackup()이 초당 수십 번씩 폭주하던 결함. 클라이언트 입력 UI(min=1/max=168)는
// API 직접 호출이나 config.json 손상으로 우회되므로, 서버가 실제로 쓰는 시점에 안전한
// 범위로 강제한다(조용히 clamp — 사용자가 직접 편집할 일이 거의 없는 내부 설정값이라
// 에러보다 안전한 기본값 폴백이 낫다고 판단).
function clampBackupHours(rawValue) {
    const rawHours = Number(rawValue);
    return Number.isFinite(rawHours) && rawHours >= 1 ? Math.min(rawHours, 168) : 24;
}

module.exports = { BOOKMARK_URL_ALLOWED_PROTOCOLS, isValidBookmarkUrl, isValidBookmarksData, sanitizeBookmarksForImport, clampBackupHours };
