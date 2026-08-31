// Regression coverage for the M2 XSS fix (2026-08-20): the backup-import path lets
// attacker-controlled strings reach esc() at both text and HTML-attribute positions,
// so quotes must be escaped too, not just &<>. Run with: node --test
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { esc } = require('../lib/esc.js');

test('esc() passes through safe plain text unchanged', () => {
    assert.equal(esc('지메일'), '지메일');
});

test('esc() escapes all five HTML-significant characters (M2)', () => {
    assert.equal(esc(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
});

test('esc() neutralizes an attribute-breakout payload (the exact M2 scenario)', () => {
    // Before M2, a double-quote in a value like `data-cat="${esc(x)}"` could close the
    // attribute early and let the rest of the string become a live HTML attribute.
    const payload = `x" onmouseover="alert(1)`;
    const escaped = esc(payload);
    assert.ok(!escaped.includes('"'), 'no raw double-quote must survive escaping');
    assert.equal(escaped, 'x&quot; onmouseover=&quot;alert(1)');
});

test('esc() neutralizes a script/img-tag injection (the M9/dueDate scenario)', () => {
    const payload = `<img src=x onerror=alert(1)>`;
    const escaped = esc(payload);
    assert.ok(!escaped.includes('<') && !escaped.includes('>'), 'no raw angle bracket must survive escaping');
});

test('esc() treats null/undefined as empty string, not "null"/"undefined"', () => {
    assert.equal(esc(null), '');
    assert.equal(esc(undefined), '');
});

test('esc() stringifies non-string input (numbers, etc.)', () => {
    assert.equal(esc(42), '42');
});
