// ═══════════════════════════════════════════════════════════════════
// server.js — HTTP wrapper quanh các agent trong lib/ (files.zip)
// n8n gọi 3 endpoint: /generate, /er-decision, /digest  (+ /health)
// Chạy: npm start   (PORT mặc định 8787)
// ═══════════════════════════════════════════════════════════════════

import express from "express";
import fs from "fs";
import { applyAdRule } from "./lib/02_GROUND_TRUTH.js";
import { runContentAgent } from "./lib/contentAgent.js";
import { runDesignAgentBatch } from "./lib/designAgent.js";
import { runMasterPlanner } from "./lib/masterPlannerAgent.js";
import { runAdsAgent } from "./lib/adsPlanning.js";
import { buildDashboardHtml } from "./lib/renderDashboard.js";
import { putFileToGitHub } from "./lib/publishToGitHub.js";

export const app = express();
app.use(express.json({ limit: "1mb" }));

// ─── /health ──────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true }));

// ─── /er-decision — rule engine deterministic, KHÔNG qua LLM ───────
app.post("/er-decision", (req, res) => {
  const { post_id, platform, er, budget } = req.body || {};
  if (post_id == null || er == null || !platform) {
    return res.status(400).json({ error: "post_id, platform, er là bắt buộc" });
  }
  const result = applyAdRule(post_id, Number(er), platform, Number(budget) || 15);
  res.json(result);
});

// ─── /generate — Content (3 options) + Design spec + Ads (v3) ──────
app.post("/generate", async (req, res) => {
  const post = req.body?.post;
  if (!post || !post.post_id) {
    return res.status(400).json({ error: "post (kèm post_id) là bắt buộc" });
  }
  try {
    const content = await runContentAgent([post], req.body?.planning_summary || {});
    const cp = (content || [])[0];
    if (!cp) return res.status(200).json({ _failed: true, error: "content empty" });

    const designs = await runDesignAgentBatch(content);
    const design = designs.find((d) => d.post_id === cp.post_id);

    const hasBudget = post.ad_budget && post.ad_budget !== "none";
    const ads = hasBudget ? await runAdsAgent([cp]) : { ad_copies: [] };
    const adCopy = ads.ad_copies?.find((a) => a.post_id === cp.post_id);

    const options = (cp.options || []).map((opt) => {
      const dv = design?.options?.[opt.label];
      return {
        label: opt.label,
        hook_angle: opt.hook_angle,
        hook_line: opt.hook_line,
        caption: opt.caption,
        cta: opt.cta,
        hook_score: opt.hook_score,
        human_score: opt._filter?.caption_human_score ?? null,
        passes_threshold: opt.passes_threshold,
        visual: dv
          ? {
              template: dv.canva_spec.source_template.design_id,
              model: dv.higgsfield.model,
              key_text: dv.key_text,
              note: dv.canva_spec.slides?.[0]?.designer_note,
              prompt: dv.higgsfield.prompt,
            }
          : null,
        ad: adCopy?.[`variation_${opt.label.toLowerCase()}`] || null,
      };
    });

    res.json({
      post_id: cp.post_id,
      recommended: cp.recommended_option,
      recommended_reason: cp.recommended_reason,
      design_minutes: design?.time_estimate?.total_min || 0,
      options,
    });
  } catch (e) {
    // Trả 200 với cờ _failed để n8n không retry mù (idempotency)
    res.status(200).json({ _failed: true, error: String(e) });
  }
});

// ─── /digest — Master Planner v3 → dashboard JSON ──────────────────
app.post("/digest", async (req, res) => {
  const { posts, plan, designs, ads, erData } = req.body || {};
  if (!Array.isArray(posts)) {
    return res.status(400).json({ error: "posts (array) là bắt buộc" });
  }
  try {
    const dashboard = await runMasterPlanner({
      planOutput: plan || { campaign_phase: "ph1" },
      contentOutput: posts,
      designOutput: designs || [],
      adsOutput: ads || { ad_copies: [] },
      erData: erData || [],
    });
    // Ghi ra file để publish-dashboard.js render + push GitHub Pages
    try {
      if (!fs.existsSync("./output")) fs.mkdirSync("./output", { recursive: true });
      fs.writeFileSync("./output/latest-dashboard.json", JSON.stringify({ dashboard }, null, 2));
    } catch (e) { console.error("write dashboard file:", e); }
    res.json({ dashboard, briefing_text: dashboard?.briefing_text || "" });
  } catch (e) {
    res.status(200).json({ _failed: true, briefing_text: "Digest failed: " + String(e) });
  }
});

// ─── /publish-dashboard — render HTML + đẩy GitHub Pages (cloud-ready) ──
// Body: { dashboard } (hoặc bỏ trống → đọc output/latest-dashboard.json)
// Env: GITHUB_TOKEN, GH_REPO (vd "yennievo2011-source/twc-operation-hub")
app.post("/publish-dashboard", async (req, res) => {
  try {
    let dashboard = req.body?.dashboard;
    if (!dashboard) {
      const raw = JSON.parse(fs.readFileSync("./output/latest-dashboard.json", "utf8"));
      dashboard = raw.dashboard || raw;
    }
    const html = buildDashboardHtml(dashboard);
    const repo = process.env.GH_REPO;
    const token = process.env.GITHUB_TOKEN;
    if (!repo || !token) {
      return res.status(200).json({ _skipped: true, reason: "GH_REPO/GITHUB_TOKEN chưa set — bỏ qua push" });
    }
    const url = await putFileToGitHub({
      repo, token, filePath: "dashboard/index.html", content: html,
      message: "chore: update dashboard", branch: "main",
    });
    res.json({ ok: true, committed: url, live: `https://${repo.split("/")[0]}.github.io/${repo.split("/")[1]}/dashboard/` });
  } catch (e) {
    res.status(200).json({ _failed: true, error: String(e) });
  }
});

// ─── Boot (skip khi chạy test) ─────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  const port = process.env.PORT || 8787;
  app.listen(port, () => console.log(`🃏 agent-service đang chạy: http://localhost:${port}`));
}
