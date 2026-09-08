#!/usr/bin/env node
// README.md / README.en.md -> README.html / README.en.html
//
// The two formats used to be kept in sync by hand, which is exactly the kind of thing
// that drifts: someone fixes a sentence in the Markdown and the HTML quietly keeps the
// old one. Generating the HTML from the Markdown makes "identical content" a property of
// the build instead of a promise in a checklist.
//
// Deliberately dependency-free (Node built-ins only), like the rest of this project, so
// it keeps working with no `npm install` step. It supports exactly the Markdown this
// project's READMEs use — headings, paragraphs, tables, fenced code, lists, blockquotes,
// horizontal rules, inline code/links/images/bold, and raw <details>/<div> passthrough.
//
// Usage:  node tools/build-readme-html.mjs [--check]
//   (no flag) writes the .html files
//   --check   verifies the .html files match what would be generated (exit 1 if not)

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const DOCS = [
    { md: 'README.md', html: 'README.html', lang: 'ko', title: 'Chrome 시작 페이지 대시보드 — README' },
    { md: 'README.en.md', html: 'README.en.html', lang: 'en', title: 'Chrome Starting Page Dashboard — README' },
];

const CSS = `:root{
  --bg:#fbfbfa; --surface:#ffffff; --text:#1c1e21; --text-soft:#5a5f66; --line:#e4e6e9;
  --accent:#2a6ef0; --accent-soft:#eaf1ff; --code-bg:#f2f3f5; --quote-bg:#f7f9fb;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --bg:#15171a; --surface:#1b1e22; --text:#e8eaed; --text-soft:#a2a8b0; --line:#2c3036;
    --accent:#7aa7ff; --accent-soft:#1d2a44; --code-bg:#22262c; --quote-bg:#1e2226;
  }
}
:root[data-theme="dark"]{
  --bg:#15171a; --surface:#1b1e22; --text:#e8eaed; --text-soft:#a2a8b0; --line:#2c3036;
  --accent:#7aa7ff; --accent-soft:#1d2a44; --code-bg:#22262c; --quote-bg:#1e2226;
}
*{box-sizing:border-box}
body{
  background:var(--bg); color:var(--text); margin:0; padding:0 20px 80px;
  font-family:-apple-system,"Segoe UI","Malgun Gothic","Apple SD Gothic Neo",sans-serif;
  line-height:1.7; font-size:16px;
}
.wrap{max-width:820px; margin:0 auto; padding-top:40px}
h1{font-size:1.9rem; text-align:center; margin:.6em 0}
h2{font-size:1.4rem; border-bottom:1px solid var(--line); padding-bottom:.35em; margin-top:2.2em}
h3{font-size:1.12rem; margin-top:1.6em; color:var(--text)}
p{margin:.85em 0}
a{color:var(--accent); text-decoration:none}
a:hover{text-decoration:underline}
img{max-width:100%}
code{background:var(--code-bg); padding:.15em .4em; border-radius:4px; font-size:.9em}
pre{background:var(--code-bg); padding:14px 16px; border-radius:8px; overflow-x:auto}
pre code{background:none; padding:0}
blockquote{
  background:var(--quote-bg); border-left:3px solid var(--accent); margin:1em 0;
  padding:.6em 1em; border-radius:0 6px 6px 0; color:var(--text-soft);
}
blockquote p{margin:.4em 0}
hr{border:none; border-top:1px solid var(--line); margin:2.2em 0}
.table-wrap{overflow-x:auto; margin:1em 0}
table{border-collapse:collapse; width:100%; font-size:.94em}
th,td{border:1px solid var(--line); padding:8px 12px; text-align:left; vertical-align:top}
th{background:var(--accent-soft)}
ul,ol{padding-left:1.5em}
li{margin:.3em 0}
details{
  background:var(--surface); border:1px solid var(--line); border-radius:8px;
  padding:.7em 1em; margin:.7em 0;
}
details > summary{cursor:pointer; font-weight:600}
details[open] > summary{margin-bottom:.6em}
details h2, details h3{margin-top:.4em; border:none; padding:0}
p[align="center"], p[align=center]{text-align:center}`;

const escHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// GitHub-compatible heading anchor: lowercase, drop punctuation, spaces -> hyphens.
// Korean letters are kept as-is, which is what GitHub does too.
function slug(text) {
    return text
        .replace(/`/g, '')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\*\*/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/\s+/g, '-');
}

// Inline: code spans first (their contents must not be re-parsed), then images, links,
// bold. Everything that is not a code span or an explicit HTML tag gets escaped.
//
// Finished HTML fragments are parked in `held` behind a NUL-delimited index, because NUL
// cannot occur in the Markdown source — so the escaping pass below can never mangle a
// fragment that has already been converted. The delimiter is written as an escape so this
// file stays plain text (a literal NUL byte would make git treat it as binary).
const MARK = '\u0000';

function inline(src) {
    const held = [];
    const hold = html => `${MARK}${held.push(html) - 1}${MARK}`;

    let s = src.replace(/`([^`]+)`/g, (_, code) => hold(`<code>${escHtml(code)}</code>`));

    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, url) =>
        hold(`<img src="${escHtml(url)}" alt="${escHtml(alt)}" />`));

    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) =>
        hold(`<a href="${escHtml(url)}">${inline(text)}</a>`));

    // Raw inline HTML the source intentionally uses (e.g. <b> inside <summary>).
    s = s.replace(/<\/?(b|i|em|strong|br|code|kbd)\s*\/?>/gi, m => hold(m));

    s = escHtml(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => held[Number(i)]);
}

function convert(md) {
    const lines = md.split(/\r?\n/);
    const out = [];
    let i = 0;

    const isTableSep = l => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(l) && l.includes('-');
    const cells = l => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim());

    while (i < lines.length) {
        const line = lines[i];

        if (!line.trim()) { i++; continue; }

        // Raw HTML block: <details>, <div>, <summary>, </...> — passed through verbatim so
        // the collapsible update-history sections keep working in both formats.
        if (/^\s*<\/?(details|div|summary|p|br)\b/i.test(line)) {
            out.push(line.trim());
            i++;
            continue;
        }

        if (/^---+\s*$/.test(line)) { out.push('<hr />'); i++; continue; }

        const h = line.match(/^(#{1,6})\s+(.*)$/);
        if (h) {
            const level = h[1].length;
            out.push(`<h${level} id="${slug(h[2])}">${inline(h[2])}</h${level}>`);
            i++;
            continue;
        }

        if (/^```/.test(line)) {
            const lang = line.slice(3).trim();
            const buf = [];
            i++;
            while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
            i++; // closing fence
            const cls = lang ? ` class="language-${escHtml(lang)}"` : '';
            out.push(`<pre><code${cls}>${escHtml(buf.join('\n'))}</code></pre>`);
            continue;
        }

        if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
            const head = cells(line);
            i += 2;
            const body = [];
            while (i < lines.length && lines[i].includes('|') && lines[i].trim()) body.push(cells(lines[i++]));
            out.push('<div class="table-wrap">');
            out.push('<table>');
            out.push(`<thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead>`);
            out.push('<tbody>');
            for (const row of body) out.push(`<tr>${row.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`);
            out.push('</tbody>');
            out.push('</table>');
            out.push('</div>');
            continue;
        }

        if (/^>\s?/.test(line)) {
            const buf = [];
            while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
            out.push(`<blockquote>${paragraphs(buf.join('\n'))}</blockquote>`);
            continue;
        }

        const li = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
        if (li) {
            const ordered = /\d/.test(li[2]);
            const { html, next } = list(lines, i, ordered);
            out.push(html);
            i = next;
            continue;
        }

        // Paragraph: collect until a blank line or the start of another block.
        const buf = [line];
        i++;
        while (i < lines.length && lines[i].trim()
            && !/^(#{1,6}\s|```|---+\s*$|>\s?|\s*<\/?(details|div|summary)\b)/.test(lines[i])
            && !/^(\s*)([-*]|\d+\.)\s+/.test(lines[i])
            && !(lines[i].includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1]))) {
            buf.push(lines[i++]);
        }
        out.push(`<p>${inline(buf.join('\n'))}</p>`);
    }

    return out.join('\n');
}

// Nested lists: indentation of 2+ spaces starts a sub-list. Continuation lines (a wrapped
// sentence under a bullet) are appended to the current item rather than starting a new one.
function list(lines, start, ordered) {
    const baseIndent = lines[start].match(/^(\s*)/)[1].length;
    const items = [];
    let i = start;

    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) break;
        const m = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
        if (m) {
            const indent = m[1].length;
            if (indent < baseIndent) break;
            if (indent > baseIndent) {
                const sub = list(lines, i, /\d/.test(m[2]));
                items[items.length - 1].sub = sub.html;
                i = sub.next;
                continue;
            }
            items.push({ text: m[3], sub: '' });
            i++;
            continue;
        }
        const indent = line.match(/^(\s*)/)[1].length;
        if (indent > baseIndent && items.length) { items[items.length - 1].text += '\n' + line.trim(); i++; continue; }
        break;
    }

    const tag = ordered ? 'ol' : 'ul';
    const html = `<${tag}>\n` + items.map(it => `<li>${inline(it.text)}${it.sub ? '\n' + it.sub : ''}</li>`).join('\n') + `\n</${tag}>`;
    return { html, next: i };
}

function paragraphs(text) {
    return text.split(/\n{2,}/).filter(b => b.trim()).map(b => `<p>${inline(b)}</p>`).join('\n');
}

function page({ lang, title }, body) {
    return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(title)}</title>
<style>
${CSS}
</style>
</head>
<body>
<div class="wrap">

${body}

</div>
</body>
</html>
`;
}

const check = process.argv.includes('--check');
let failed = 0;

for (const doc of DOCS) {
    const mdPath = join(ROOT, doc.md);
    const htmlPath = join(ROOT, doc.html);
    const generated = page(doc, convert(readFileSync(mdPath, 'utf8')));

    if (check) {
        let current = '';
        try { current = readFileSync(htmlPath, 'utf8'); } catch {}
        if (current === generated) {
            console.log(`OK    ${doc.html} matches ${doc.md}`);
        } else {
            console.error(`STALE ${doc.html} does not match ${doc.md} — run: node tools/build-readme-html.mjs`);
            failed++;
        }
    } else {
        writeFileSync(htmlPath, generated);
        console.log(`wrote ${doc.html}  (${generated.length.toLocaleString()} chars, from ${doc.md})`);
    }
}

process.exit(failed ? 1 : 0);
