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

const visualBlock = (p) => {
  if (!p.visual_url && !p.design_url) return "";
  return `<div class="visual">
    ${p.visual_url ? `<img src="${esc(p.visual_url)}" alt="visual ${esc(p.post_id)}" loading="lazy"/>` : `<div class="noimg">chưa có ảnh</div>`}
    ${p.design_url ? `<a class="btn" href="${esc(p.design_url)}" target="_blank">🎨 Mở Canva (chuẩn brand)</a>` : ""}
  </div>`;
};

const postBlock = (p) => `
  <div class="card post">
    <div class="h2">${esc(p.post_id)} · ${esc(p.platform)} ${p.date ? "· " + esc(p.date) : ""} ${p.status ? `<span class="pill">${esc(p.status)}</span>` : ""}</div>
    <div class="muted">Recommended: Option ${esc(p.recommended)} — ${esc(p.recommended_reason)}</div>
    <div class="postgrid">
      ${visualBlock(p)}
      <div>${(p.options || []).map((o) => optionCard(o, p.recommended)).join("")}</div>
    </div>
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
.postgrid{display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap}.postgrid>div{flex:1;min-width:240px}
.visual{width:200px;flex:0 0 200px}.visual img{width:100%;border-radius:10px;border:1px solid #e5e7eb}
.visual .btn{display:block;text-align:center;margin-top:6px;background:var(--ind);color:#fff;padding:6px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:700}
.noimg{width:100%;aspect-ratio:4/5;background:#eee;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#999;font-size:12px}
.hdsd{background:#0a0060;color:#fff;border-radius:12px;padding:18px;margin-top:18px}.hdsd h2{color:var(--lime);margin:0 0 8px}.hdsd ol{margin:6px 0;padding-left:20px;line-height:1.7}.hdsd code{background:rgba(255,255,255,.15);padding:1px 5px;border-radius:4px}
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

<div class="hdsd">
  <h2>📖 HDSD — Quy trình chuẩn 1 bài post (cho team)</h2>
  <ol>
    <li><b>Lên lịch:</b> thêm row vào Notion "TWC Content Pipeline", set <code>pipeline_status = Draft</code> (hoặc chạy <code>node plan-week.js</code> đầu tuần).</li>
    <li><b>AI viết:</b> hệ thống tự sinh <b>3 caption options A/B/C</b> + hook score + human score, đổi status → <code>Pending Review</code>, gửi email duyệt.</li>
    <li><b>Pick nội dung:</b> mở row → đọc 3 options → set <code>chosen_option = A/B/C</code> (theo recommended hoặc tự chọn). Muốn sửa: <code>review_decision = Revise</code> + ghi <code>revise_feedback</code>.</li>
    <li><b>Visual chuẩn brand:</b> mở link <code>design_url</code> (Canva brand template — đúng logo/font/màu) → gõ hook đã pick → Download PNG. KHÔNG dùng AI gen tự do (lệch brand).</li>
    <li><b>Đăng:</b> đăng FB/IG/LinkedIn → dán link vào <code>url_fb/url_ig/url_li</code> → status <code>Published</code> → <code>er_check_due</code> tự +48h.</li>
    <li><b>Burn ads (nếu có budget):</b> Meta Ads Manager → mục tiêu Engagement → $15/post → dùng existing post. Cặp A/B chạy 2 bài, sau 48h so ER.</li>
    <li><b>Track 48h:</b> nhập <code>spend</code> + <code>er_fb/ig/li</code> vào Notion. Rule engine: ER&gt;5% → BOOST +$50 · 3–5% → HOLD · &lt;3% → KILL (LinkedIn: &gt;5% boost+InMail · &gt;3% boost$30 · &lt;2% stop).</li>
    <li><b>Refresh dashboard:</b> chạy <code>node refresh-dashboard.js</code> (hoặc tự động 9AM) → trang này cập nhật spend/ER/quyết định + visual mới nhất.</li>
  </ol>
  <div style="font-size:12px;opacity:.8">Brand: Indigo #050090 + Lime #C0F100 · Caption: câu ngắn, số liệu cụ thể, không jargon · Hook phải ≥25/35 mới chạy ads.</div>
</div>

<div class="muted">Cập nhật tự động · pick option trong Notion · ${esc(new Date().toISOString())}</div>
</body></html>`;
}
