// ═══════════════════════════════════════════════════════════════════
// lib/adsPlanning.js — helpers v3: Planning + Ads (3 variations A/B/C)
// Tách từ update 05_RUN.js để server.js dùng mà không kéo cả CLI.
// ═══════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import { PLANNING_PROMPT, ADS_PROMPT } from "./03_AGENT_PROMPTS.js";
import { runSafe } from "./02_GROUND_TRUTH.js";

const client = new Anthropic();

export async function runPlanningAgent(brief) {
  return runSafe(
    async (input) => {
      const res = await client.messages.create({
        model: "claude-sonnet-4-6", max_tokens: 3000,
        system: PLANNING_PROMPT,
        messages: [{ role: "user", content: JSON.stringify(input) }],
      });
      return res.content[0].text;
    },
    brief,
    { name: "planning", maxRetries: 2, log: true, fallback: { content_plan: [] } }
  );
}

export async function runAdsAgent(contentOutput) {
  return runSafe(
    async (input) => {
      const res = await client.messages.create({
        model: "claude-sonnet-4-6", max_tokens: 3000,
        system: ADS_PROMPT,
        messages: [{ role: "user", content: `Generate ad copy (COPY MODE — 3 variations A/B/C) for:\n${JSON.stringify(input)}` }],
      });
      return res.content[0].text;
    },
    contentOutput,
    { name: "ads", maxRetries: 2, log: true, fallback: { ad_copies: [] } }
  );
}
