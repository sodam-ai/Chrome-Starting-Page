#!/usr/bin/env node
// Advisory (non-blocking) scanner: flags `.innerHTML =` / `+=` lines whose template
// literal contains a ${...} expression that doesn't call esc(...). It exists because
// M2 (2026-08-20) fixed the esc() function itself but had no mechanism to check that
// every render site actually calls it — a later dueDate field still slipped through
// unescaped and reached production (see CHECKPOINT M12/M2-followup, 2026-08-31).
//
// This is a heuristic, not a real parser (zero dependencies — no AST library), so it
// WILL flag some safe lines (numbers, loop indices, style widths, etc). Treat the
// output as a manual-review checklist, not a hard pass/fail gate. Run: node tools/check-unescaped-html.js
const fs = require('fs');
const path = require('path');

const TARGET_FILES = ['script.js'];

// Expressions that are safe by construction — no free-form user text can reach them.
const SAFE_EXPR = [
    /^\d+$/,                      // bare numeric literal
    /^[ijk]$/,                    // loop indices
    /^(idx|index)(\s*[+-]\s*\d+)?$/i,
    /^Math\./,                    // Math.round(...), Math.max(...), etc. — numeric
    /\.length$/,                  // array/string length — numeric
    /^\d+\s*[-+*/]\s*\d+$/,       // simple numeric arithmetic
];

function isSafeExpr(expr) {
    const e = expr.trim();
    if (e.includes('esc(')) return true;
    return SAFE_EXPR.some(re => re.test(e));
}

// Extract ${...} groups from a line with naive brace balancing (handles one level of
// nested {..} inside the expression, e.g. ternaries or object literals — not perfect,
// but good enough for a heuristic advisory pass over this codebase's actual style).
function extractInterpolations(line) {
    const out = [];
    let i = 0;
    while (i < line.length) {
        const start = line.indexOf('${', i);
        if (start === -1) break;
        let depth = 1, j = start + 2;
        while (j < line.length && depth > 0) {
            if (line[j] === '{') depth++;
            else if (line[j] === '}') depth--;
            j++;
        }
        out.push(line.slice(start + 2, j - 1));
        i = j;
    }
    return out;
}

let flaggedTotal = 0;
for (const file of TARGET_FILES) {
    const fp = path.join(__dirname, '..', file);
    if (!fs.existsSync(fp)) continue;
    const lines = fs.readFileSync(fp, 'utf8').split('\n');
    const flagged = [];
    lines.forEach((line, i) => {
        if (!/\.innerHTML\s*[+]?=/.test(line)) return;
        if (!line.includes('`')) return; // only template-literal assignments carry ${...}
        const exprs = extractInterpolations(line);
        const unsafe = exprs.filter(e => !isSafeExpr(e));
        if (unsafe.length) flagged.push({ lineNo: i + 1, unsafe, text: line.trim().slice(0, 160) });
    });
    if (flagged.length) {
        console.log(`\n${file}: ${flagged.length}개 검토 필요 (esc() 없이 innerHTML에 들어가는 표현식)`);
        flagged.forEach(f => {
            console.log(`  L${f.lineNo}: [${f.unsafe.join(', ')}]`);
            console.log(`    ${f.text}`);
        });
        flaggedTotal += flagged.length;
    } else {
        console.log(`${file}: 검토 필요 항목 없음`);
    }
}

console.log(`\n총 ${flaggedTotal}건 — 이 목록은 자동 판정이 아니라 수동 검토 체크리스트입니다.`);
console.log('실제 사용자 입력이 닿을 수 있는 필드(이름/라벨/텍스트/날짜 등)라면 esc()로 감싸세요.');
