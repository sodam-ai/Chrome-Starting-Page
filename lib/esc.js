// Shared HTML-escape utility. Single source of truth for both the live app
// (loaded as a plain <script> before script.js — see index.html) and the
// Node regression tests (test/esc.test.js). Kept in this separate file so a
// future security fix here can never silently diverge between what runs in
// the browser and what the tests actually check (see CHECKPOINT M2 — the
// original XSS fix lived only inline in script.js and had no test coverage).
const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
// 2026-08-20 수정: 기존 DOM textContent 방식은 &<> 만 이스케이프하고 큰따옴표(")는
// 안 건드림 — esc()가 텍스트 위치뿐 아니라 속성값 위치(value="${esc(x)}" 등, 카테고리명/
// D-Day 라벨/단축키/프로필 이름 등 최소 15곳)에도 쓰이고 있어서, 그런 자리에서는
// "가 그대로 통과해 속성을 탈출시키는 XSS가 가능했다(백업 가져오기로 조작된 값이 들어올
// 수 있는 경로). 5개 특수문자(&<>"')를 전부 이스케이프하도록 바꿔 텍스트/속성 양쪽 다
// 안전하게 만든다 — 텍스트 위치에서는 "가 그대로 렌더링되던 것과 동일하게 보이므로
// 기존 화면 표시는 그대로다(HTML 파싱 시 엔티티가 다시 문자로 풀림).
function esc(s) { if (s === null || s === undefined) return ''; return String(s).replace(/[&<>"']/g, c => ESC_MAP[c]); }

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { esc, ESC_MAP };
}
