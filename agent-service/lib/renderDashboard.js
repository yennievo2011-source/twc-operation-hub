// ═══════════════════════════════════════════════════════════════════
// lib/renderDashboard.js — dashboard JSON → HTML string (dùng chung)
// Dùng bởi render-dashboard.js (CLI ghi file) và server /publish-dashboard.
// ═══════════════════════════════════════════════════════════════════

const esc = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

const optionCard = (o, rec) => `
  <div class="card opt ${o.label === rec ? "rec" : ""}">
    <div class="row"><b>[${esc(o.label)}]</b> ${esc(o.hook_angle)}
      <span class="pill">hook ${esc(o.hook_score)}/35</span>
      <span class="pill">human ${esc(o.human_score)}/10</span>
      ${o.label === rec ? '<span class="pill lime">★ recommended</span>' : ""}</div>
    <div class="hook">"${esc(o.hook_line)}"</div>
    <div class="muted">${esc(o.visual_concept || o.visual?.note || "")}</div>
  </div>`;

const postBlock = (p) => `
  <div class="card post">
    <div class="h2">${esc(p.post_id)} · ${esc(p.platform)} ${p.date ? "· " + esc(p.date) : ""}</div>
    <div class="muted">Recommended: Option ${esc(p.recommended)} — ${esc(p.recommended_reason)}</div>
    ${(p.options || []).map((o) => optionCard(o, p.recommended)).join("")}
  </div>`;

const adRow = (a) => `<li><b>${esc(a.post_id)}</b> (${esc(a.platform)}) ER ${esc(a.er)}% — ${esc(a.why_worked || a.why_failed || "")} <i>${esc(a.action || "")}</i></li>`;

export function buildDashboardHtml(d) {
  const ap = d.ad_performance || {};
  return `<!doctype html><html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TWC Dashboard ${esc(d.report_date || "")}</title>
<style>
:root{--ind:#050090;--lime:#c0f100;--ink:#1b1b23}
*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f7;color:var(--ink);margin:0 auto;padding:20px;max-width:880px}
h1{color:var(--ind);font-size:20px}.h2{color:var(--ind);font-weight:800;margin-bottom:4px}
.card{background:#fff;border-radius:12px;padding:14px 16px;margin:10px 0;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.opt{margin:8px 0;background:#fafaff}.rec{border:2px solid var(--lime)}
.pill{display:inline-block;background:#eef;border-radius:10px;padding:1px 8px;font-size:11px;margin-left:6px;color:var(--ind)}
.pill.lime{background:var(--lime);color:var(--ink)}
.hook{font-style:italic;margin:6px 0}.muted{color:#6b7280;font-size:12px}
.row{font-size:13px}pre{white-space:pre-wrap;font-family:inherit;margin:0}
.status{display:inline-block;padding:2px 10px;border-radius:20px;font-weight:700;font-size:12px}
.ok{background:#dcfce7;color:#166534}.watch{background:#fef9c3;color:#92400e}.risk{background:#fee2e2;color:#991b1b}
ul{margin:6px 0;padding-left:18px;font-size:13px}
</style></head><body>
<h1>🃏 TWC Dashboard — ${esc(d.report_date || "")} <span class="muted">${esc(d.phase_label || d.phase || "")}</span></h1>
<div class="card">Campaign:
  <span class="status ${d.health?.overall === "on_track" ? "ok" : d.health?.overall === "watch" ? "watch" : "risk"}">${esc(d.health?.overall || "?")}</span>
  &nbsp; B2B: ${esc(d.health?.b2b?.status || "-")} · B2C: ${esc(d.health?.b2c?.status || "-")}
</div>
${ap.budget ? `<div class="card"><b>💰 Budget</b> — spent $${esc(ap.budget.spent || 0)} / remaining $${esc(ap.budget.remaining ?? "?")} · LinkedIn ${esc(ap.budget.linkedin_pct || "-")}</div>` : ""}
${(ap.worked?.length || ap.failed?.length) ? `<div class="card">
  ${ap.worked?.length ? `<b>✅ Worked</b><ul>${ap.worked.map(adRow).join("")}</ul>` : ""}
  ${ap.failed?.length ? `<b>❌ Failed</b><ul>${ap.failed.map(adRow).join("")}</ul>` : ""}
  ${ap.next_improvements?.length ? `<b>🎯 Next</b><ul>${ap.next_improvements.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
</div>` : ""}
${(d.options_to_review || []).map(postBlock).join("")}
${d.today_actions?.length ? `<div class="card"><b>📌 Today</b><ul>${d.today_actions.map((a) => `<li>${esc(a.task)} ${a.auto ? "[AUTO]" : ""} — ${esc(a.deadline)}</li>`).join("")}</ul></div>` : ""}
${d.briefing_text ? `<div class="card"><b>💬 Briefing</b><pre>${esc(d.briefing_text)}</pre></div>` : ""}
<div class="muted">Cập nhật tự động · pick option trong Notion · ${esc(new Date().toISOString())}</div>
</body></html>`;
}
