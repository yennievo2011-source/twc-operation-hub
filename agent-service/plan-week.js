// ═══════════════════════════════════════════════════════════════════
// plan-week.js — Batch tool chạy tay 1 lần/tuần
// Sinh weekly content plan (~6 posts) để seed vào Notion Calendar.
//
// Dùng:
//   node plan-week.js "W2 Jun 20-26 Soft Launch"
//   node plan-week.js                      (mặc định W1)
//
// Output: in JSON content_plan ra console + ghi output/week-plan.json
// Yên review rồi copy rows vào Notion (pipeline_status = Draft).
// ═══════════════════════════════════════════════════════════════════

import { runPlanningAgent } from "./lib/adsPlanning.js";
import fs from "fs";

const brief = process.argv[2] || "W1 Jun 15-19 2026 — Pre-Launch A/B Test";

console.log(`\n📋 Planning Agent — brief: "${brief}"\n`);

const plan = await runPlanningAgent(brief);

if (plan._failed) {
  console.error("❌ Planning thất bại — kiểm tra ANTHROPIC_API_KEY trong .env");
  process.exit(1);
}

const rows = plan.content_plan || [];
console.log(`✅ ${rows.length} posts trong plan:\n`);

rows.forEach((p) => {
  console.log(`  ${p.date || "?"}  [${(p.audience || "?").toUpperCase()}] ${p.post_id || "?"} — ${p.title || ""}`);
  console.log(`     ${p.platform || ""} · ${p.content_type || ""} · ad: ${p.ad_budget || "none"}`);
});

if (!fs.existsSync("./output")) fs.mkdirSync("./output", { recursive: true });
fs.writeFileSync("./output/week-plan.json", JSON.stringify(plan, null, 2));
console.log(`\n💾 Đã lưu: output/week-plan.json`);
console.log(`👉 Copy các rows này vào Notion "Content Pipeline" với pipeline_status = Draft\n`);
