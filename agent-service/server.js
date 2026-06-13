// ═══════════════════════════════════════════════════════════════════
// server.js — HTTP wrapper quanh các agent trong lib/ (files.zip)
// n8n gọi 3 endpoint: /generate, /er-decision, /digest  (+ /health)
// Chạy: npm start   (PORT mặc định 8787)
// ═══════════════════════════════════════════════════════════════════

import express from "express";
import { applyAdRule } from "./lib/02_GROUND_TRUTH.js";
import { runContentAgent } from "./lib/contentAgent.js";
import { runDesignAgentBatch } from "./lib/designAgent.js";
import { runMasterPlanner } from "./lib/masterPlannerAgent.js";
import { runAdsAgent } from "./lib/adsPlanning.js";

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
    res.json({ dashboard, briefing_text: dashboard?.briefing_text || "" });
  } catch (e) {
    res.status(200).json({ _failed: true, briefing_text: "Digest failed: " + String(e) });
  }
});

// ─── Boot (skip khi chạy test) ─────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  const port = process.env.PORT || 8787;
  app.listen(port, () => console.log(`🃏 agent-service đang chạy: http://localhost:${port}`));
}
