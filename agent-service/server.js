// ═══════════════════════════════════════════════════════════════════
// server.js — HTTP wrapper quanh các agent trong lib/ (files.zip)
// n8n gọi 3 endpoint: /generate, /er-decision, /digest  (+ /health)
// Chạy: npm start   (PORT mặc định 8787)
// ═══════════════════════════════════════════════════════════════════

import express from "express";
import { applyAdRule } from "./lib/02_GROUND_TRUTH.js";
import { runContentAgent, runAdsAgent, runMasterPlanner } from "./lib/05_RUN.js";

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

// ─── /generate — Content Agent + Ads Agent (copy mode) ─────────────
app.post("/generate", async (req, res) => {
  const post = req.body?.post;
  if (!post || !post.post_id) {
    return res.status(400).json({ error: "post (kèm post_id) là bắt buộc" });
  }
  const feedback = req.body?.revise_feedback || null;
  try {
    const planContext = { post, ...(feedback && { revise_feedback: feedback }) };
    const content = await runContentAgent(planContext, [post]);
    const posts = Array.isArray(content) ? content : [content];
    const first = posts[0] || null;

    const hasBudget = post.ad_budget && post.ad_budget !== "none";
    const ads = hasBudget && first ? await runAdsAgent(posts) : { ad_copies: [] };

    res.json({
      post_id: post.post_id,
      content: first,
      ads: ads.ad_copies?.[0] || null,
    });
  } catch (e) {
    // Trả 200 với cờ _failed để n8n không retry mù (idempotency)
    res.status(200).json({ _failed: true, error: String(e), content: null, ads: null });
  }
});

// ─── /digest — Master Planner → briefing text cho email 9AM ────────
app.post("/digest", async (req, res) => {
  const { posts, date } = req.body || {};
  if (!Array.isArray(posts)) {
    return res.status(400).json({ error: "posts (array) là bắt buộc" });
  }
  try {
    const out = await runMasterPlanner({ date: date || null }, posts, {});
    res.json({ briefing_text: out.briefing_text || "", raw: out });
  } catch (e) {
    res.status(200).json({ _failed: true, briefing_text: "Digest failed: " + String(e) });
  }
});

// ─── Boot (skip khi chạy test) ─────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  const port = process.env.PORT || 8787;
  app.listen(port, () => console.log(`🃏 agent-service đang chạy: http://localhost:${port}`));
}
