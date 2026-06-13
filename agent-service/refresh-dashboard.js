// ═══════════════════════════════════════════════════════════════════
// refresh-dashboard.js — đọc Notion → dựng dashboard → render → đẩy Pages
// Dùng: node refresh-dashboard.js
// Env cần: NOTION_TOKEN (integration secret), GH_REPO, GITHUB_TOKEN
// Bấm 1 lần là dashboard cập nhật số spend/ER/decision mới nhất từ Notion.
// ═══════════════════════════════════════════════════════════════════

import fs from "fs";
import { buildDashboardHtml } from "./lib/renderDashboard.js";
import { putFileToGitHub } from "./lib/publishToGitHub.js";

const DB = "47b1e8e3dbf94ce5bfc2ff6a23519af9";
const NOTION = process.env.NOTION_TOKEN;
if (!NOTION) { console.error("❌ Thiếu NOTION_TOKEN"); process.exit(1); }

const H = { Authorization: `Bearer ${NOTION}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" };
const txt = (rt) => (rt && rt[0] && rt[0].plain_text) || "";
const num = (n) => (n && typeof n.number === "number" ? n.number : null);

const res = await fetch(`https://api.notion.com/v1/databases/${DB}/query`, { method: "POST", headers: H, body: "{}" });
const data = await res.json();
const rows = data.results || [];

const posts = rows.map((r) => {
  const p = r.properties;
  return {
    post_id: txt(p.post_id?.title),
    platform: (p.platforms?.multi_select || []).map((o) => o.name).join("+"),
    status: p.pipeline_status?.select?.name,
    recommended: p.recommended_option?.select?.name || p.chosen_option?.select?.name,
    hook_line: txt(p.hook_line?.rich_text),
    hook_score: num(p.hook_score),
    human_score: num(p.human_score),
    spend: num(p.spend) || 0,
    er: num(p.er_fb) ?? num(p.er_ig) ?? num(p.er_li),
    decision: p.decision?.select?.name,
    visual_url: p.visual_url?.url || null,
    design_url: p.design_url?.url || null,
  };
});

const totalSpent = posts.reduce((s, x) => s + (x.spend || 0), 0);
const worked = posts.filter((x) => x.decision === "Boost").map((x) => ({ post_id: x.post_id, platform: x.platform, er: x.er, why_worked: "ER vượt ngưỡng", action: "BOOST" }));
const failed = posts.filter((x) => ["Kill", "Stop"].includes(x.decision)).map((x) => ({ post_id: x.post_id, platform: x.platform, er: x.er, why_failed: "ER dưới ngưỡng", action: x.decision }));

const review = posts.filter((x) => x.status === "Pending Review").map((x) => ({
  post_id: x.post_id, platform: x.platform, status: x.status, recommended: x.recommended,
  recommended_reason: "đề xuất bởi agent",
  visual_url: x.visual_url, design_url: x.design_url,
  options: [{ label: x.recommended || "A", hook_angle: "recommended", hook_line: x.hook_line, hook_score: x.hook_score, human_score: x.human_score }],
}));

const dashboard = {
  report_date: new Date().toISOString().slice(0, 10),
  phase_label: "TWC Campaign",
  health: { overall: "on_track", b2b: { status: "on_track" }, b2c: { status: "on_track" } },
  ad_performance: {
    budget: { total: 1300, spent: totalSpent, remaining: 1300 - totalSpent, linkedin_pct: "—" },
    posts_live: posts.filter((x) => x.status === "Published").length,
    worked, failed,
    next_improvements: review.length ? [`${review.length} bài chờ bạn pick option trong Notion`] : [],
  },
  options_to_review: review,
  today_actions: posts.filter((x) => x.status === "Pending Review").map((x, i) => ({ priority: i + 1, task: `Pick + đăng ${x.post_id}`, deadline: "EOD", auto: false })),
  briefing_text: `Tổng spend: $${totalSpent}/$1300. ${worked.length} boost · ${failed.length} kill · ${review.length} chờ duyệt.`,
};

fs.writeFileSync("./output/latest-dashboard.json", JSON.stringify({ dashboard }, null, 2));
const html = buildDashboardHtml(dashboard);

if (process.env.GH_REPO && process.env.GITHUB_TOKEN) {
  const url = await putFileToGitHub({ repo: process.env.GH_REPO, token: process.env.GITHUB_TOKEN, filePath: "dashboard/index.html", content: html, message: "chore: refresh dashboard from Notion", branch: "main" });
  console.log("✅ Đẩy Pages:", url);
  console.log("Live: https://yennievo2011-source.github.io/twc-operation-hub/dashboard/");
} else {
  fs.writeFileSync("../dashboard/index.html", html);
  console.log("✅ Ghi dashboard/index.html (chưa set GH_REPO/GITHUB_TOKEN để auto-push)");
}
