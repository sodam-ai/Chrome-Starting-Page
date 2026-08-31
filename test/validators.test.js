// Regression coverage for M1 (bookmark URL scheme allowlist) and M5 (backup interval
// clamp against negative/non-numeric config values). Run with: node --test
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isValidBookmarkUrl, isValidBookmarksData, sanitizeBookmarksForImport, clampBackupHours } = require('../lib/validators.js');

// --- M1: bookmark URL scheme validation ---
test('isValidBookmarkUrl accepts the everyday schemes', () => {
    for (const url of ['https://example.com', 'http://example.com', 'ftp://example.com', 'mailto:a@b.com']) {
        assert.equal(isValidBookmarkUrl(url), true, url);
    }
});

test('isValidBookmarkUrl rejects script-execution schemes (the exact M1 scenario)', () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox(1)', 'file:///etc/passwd']) {
        assert.equal(isValidBookmarkUrl(url), false, url);
    }
});

test('isValidBookmarkUrl rejects malformed/non-string input', () => {
    assert.equal(isValidBookmarkUrl(''), false);
    assert.equal(isValidBookmarkUrl('not a url'), false);
    assert.equal(isValidBookmarkUrl(null), false);
    assert.equal(isValidBookmarkUrl(undefined), false);
});

test('isValidBookmarksData rejects a payload containing one javascript: bookmark', () => {
    assert.equal(isValidBookmarksData({ Google: [{ name: 'x', url: 'javascript:alert(1)' }] }), false);
});

test('isValidBookmarksData accepts a well-formed multi-category payload', () => {
    assert.equal(isValidBookmarksData({ Google: [{ name: 'Gmail', url: 'https://mail.google.com/' }], Social: [] }), true);
});

test('sanitizeBookmarksForImport drops only the bad entries, keeps the good ones', () => {
    const { data, droppedCount } = sanitizeBookmarksForImport({
        Google: [{ name: 'Gmail', url: 'https://mail.google.com/' }, { name: 'bad', url: 'javascript:alert(1)' }],
    });
    assert.equal(droppedCount, 1);
    assert.equal(data.Google.length, 1);
    assert.equal(data.Google[0].name, 'Gmail');
});

// --- M5: backup interval clamp ---
test('clampBackupHours passes a normal value through unchanged', () => {
    assert.equal(clampBackupHours(24), 24);
});

test('clampBackupHours falls back to 24h for negative values (the exact M5 bug: -1 caused a runaway backup loop)', () => {
    assert.equal(clampBackupHours(-1), 24);
});

test('clampBackupHours falls back to 24h for non-numeric strings (the exact M5 bug: "abc")', () => {
    assert.equal(clampBackupHours('abc'), 24);
});

test('clampBackupHours caps values above the 168h (7-day) UI maximum', () => {
    assert.equal(clampBackupHours(9999), 168);
});

test('clampBackupHours falls back to 24h for zero, undefined, and NaN', () => {
    assert.equal(clampBackupHours(0), 24);
    assert.equal(clampBackupHours(undefined), 24);
    assert.equal(clampBackupHours(NaN), 24);
});
