// ═══════════════════════════════════════════════════════════════════
// 05_RUN.js — Entry point
// Chạy: node 05_RUN.js
// Output: /output/ folder với JSON từ từng agent
// ═══════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import { PLANNING_PROMPT, CONTENT_PROMPT, ADS_PROMPT, MASTER_PROMPT } from "./03_AGENT_PROMPTS.js";
import { runSafe, applyAdRule, GT } from "./02_GROUND_TRUTH.js";
import { FIRST_5_POSTS, W1_BRIEF } from "./04_FIRST_5_POSTS.js";
import fs from "fs";

const client = new Anthropic();

// ─── AGENT FACTORY ────────────────────────────────────────────────
function makeAgent(systemPrompt, agentName) {
  return async function(input) {
    console.log(`  📡 Calling Claude API for ${agentName}...`);
    const res = await client.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 4000,
      system:     systemPrompt,
      messages:   [{ role: "user", content: typeof input === "string" ? input : JSON.stringify(input, null, 2) }],
    });
    return res.content[0].text;
  };
}

// ─── INDIVIDUAL AGENTS ────────────────────────────────────────────
export async function runPlanningAgent(brief) {
  return runSafe(makeAgent(PLANNING_PROMPT, "planning"), brief, {
    name: "planning", maxRetries: 2, log: true,
    fallback: { _failed: true, content_plan: [] },
  });
}

export async function runContentAgent(planOutput, postsInput) {
  const input = {
    planning_output: planOutput,
    posts_to_write: postsInput,
    instruction: "Write full captions and visual briefs for each post in posts_to_write. Follow all B2B/B2C rules from your system prompt.",
  };
  return runSafe(makeAgent(CONTENT_PROMPT, "content"), input, {
    name: "content", maxRetries: 2, log: true,
    fallback: [],
  });
}

export async function runAdsAgent(contentOutput, erData = null) {
  const input = {
    mode: erData ? "both" : "copy",
    content_output: contentOutput,
    ...(erData && { er_data: erData }),
    instruction: erData
      ? "Run both DECISION mode (for er_data posts) and COPY mode (for new posts)"
      : "Run COPY mode — create A/B ad copy variations for each post",
  };
  return runSafe(makeAgent(ADS_PROMPT, "ads"), input, {
    name: "ads", maxRetries: 2, log: true,
    fallback: { decisions: [], ad_copies: [] },
  });
}

export async function runMasterPlanner(planOutput, contentOutput, adsOutput) {
  const input = {
    planning: planOutput,
    content:  contentOutput,
    ads:      adsOutput,
    today:    new Date().toISOString().split("T")[0],
    instruction: "Synthesize all agent outputs into a daily briefing for Yên.",
  };
  return runSafe(makeAgent(MASTER_PROMPT, "master"), input, {
    name: "master", maxRetries: 2, log: true,
    fallback: { _failed: true, briefing_text: "Master planner failed — check output/ logs." },
  });
}

// ─── PIPELINE: FIRST 5 POSTS ──────────────────────────────────────
async function runFirst5Posts() {
  console.log("\n" + "═".repeat(60));
  console.log("🃏 TWC AGENT PIPELINE — W1 Pre-Launch (Jun 15–19)");
  console.log("   5 posts · B2B 50% + B2C 50% · Anti-hallucination active");
  console.log("═".repeat(60));

  // Step 1: Planning
  console.log("\n📋 STEP 1 — Planning Agent");
  const plan = await runPlanningAgent(W1_BRIEF);
  if (plan._failed) { console.error("Planning failed — stopping pipeline"); process.exit(1); }
  console.log(`   ✅ Content plan: ${plan.content_plan?.length || 0} posts`);

  // Step 2: Content
  console.log("\n✍️  STEP 2 — Content Agent");
  const content = await runContentAgent(plan, FIRST_5_POSTS);
  const posts = Array.isArray(content) ? content : [];
  console.log(`   ✅ Captions written: ${posts.length} posts`);

  // Check hook scores
  const failHooks = posts.filter(p => !p.passes_threshold);
  if (failHooks.length > 0) {
    console.warn(`\n   ⚠️  ${failHooks.length} post(s) below hook threshold (< 25/35):`);
    failHooks.forEach(p => console.warn(`      ${p.post_id}: score ${p.hook_score}/35 — needs rewrite before ads`));
  }

  // Step 3: Ads (copy mode only for W1 — no ER data yet)
  console.log("\n💰 STEP 3 — Ads Agent (copy mode)");
  // Only generate ad copies for posts with ad budget
  const adPosts = posts.filter(p => {
    const original = FIRST_5_POSTS.find(o => o.post_id === p.post_id);
    return original?.ad_budget && original.ad_budget !== "none";
  });
  const ads = adPosts.length > 0 ? await runAdsAgent(adPosts) : { ad_copies: [] };
  console.log(`   ✅ Ad copies: ${ads.ad_copies?.length || 0} posts`);

  // Apply rule engine to any existing ER data (W1 = none yet)
  console.log("\n   ℹ️  No ER data yet (W1 day 1) — rule engine will apply after 48h");

  // Step 4: Master Planner
  console.log("\n🃏 STEP 4 — Master Planner");
  const briefing = await runMasterPlanner(plan, posts, ads);
  console.log(`   ✅ Daily briefing ready`);

  // ── PRINT FINAL OUTPUT ──
  console.log("\n" + "═".repeat(60));
  console.log("📱 MORNING BRIEFING FOR YÊN:");
  console.log("─".repeat(60));
  console.log(briefing.briefing_text || "(briefing_text not found)");
  console.log("─".repeat(60));

  // ── PRINT POST SUMMARY ──
  console.log("\n📅 5 POSTS READY:");
  posts.forEach(p => {
    const status = p.passes_threshold ? "✅" : "⚠️ ";
    console.log(`   ${status} ${p.post_id} [${p.date}] ${p.platform} — hook ${p.hook_score}/35`);
    console.log(`      Hook: "${p.caption?.hook_line?.slice(0, 80)}..."`);
  });

  // ── PRINT AD COPIES NEEDING REVIEW ──
  if (ads.ad_copies?.length > 0) {
    console.log("\n💰 AD COPIES TO REVIEW:");
    ads.ad_copies.forEach(ac => {
      console.log(`   ${ac.post_id} — Run ${ac.run_a_first ? "A" : "B"} first`);
      console.log(`   A: "${ac.variation_a?.headline}" (score: ${ac.variation_a?.hook_score})`);
      console.log(`   B: "${ac.variation_b?.headline}" (score: ${ac.variation_b?.hook_score})`);
    });
  }

  // ── SAVE COMBINED OUTPUT ──
  const combined = {
    run_at: new Date().toISOString(),
    campaign: "TWC Master Plan v5",
    week: "W1 Jun 15–19 2026",
    plan, content: posts, ads, briefing,
    rule_engine_demo: [
      applyAdRule("DEMO-FB", 6.5, "FB+IG", 15),    // should BOOST
      applyAdRule("DEMO-LI", 1.5, "LinkedIn", 10),  // should STOP
      applyAdRule("DEMO-FB2", 2.1, "FB+IG", 15),   // should KILL
    ],
  };

  if (!fs.existsSync("./output")) fs.mkdirSync("./output");
  const outFile = `./output/w1_complete_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  fs.writeFileSync(outFile, JSON.stringify(combined, null, 2));
  console.log(`\n💾 Full output saved: ${outFile}`);
  console.log("═".repeat(60));

  return combined;
}

// ─── ER CHECK MODE (chạy sau 48h) ────────────────────────────────
export async function runERCheck(erData) {
  // erData format: [{ post_id, platform, current_er, current_budget }]
  console.log("\n💰 ER CHECK — Applying rule engine...");

  const decisions = erData.map(d =>
    applyAdRule(d.post_id, d.current_er, d.platform, d.current_budget || 15)
  );

  console.log("\nAD DECISIONS:");
  decisions.forEach(d => {
    const emoji = d.decision === "BOOST" ? "🚀" : d.decision === "KILL" || d.decision === "STOP" ? "🛑" : "⏸️";
    console.log(`  ${emoji} ${d.post_id}: ${d.decision} — ${d.reason}`);
    if (d.follow_up) console.log(`     → ${d.follow_up}`);
    if (d.action) console.log(`     → ${d.action}`);
  });

  // Get Ads Agent to write reasoning + InMail copy if needed
  const adsOutput = await runAdsAgent([], erData);

  return { rule_engine_decisions: decisions, agent_analysis: adsOutput };
}

// ─── MAIN ─────────────────────────────────────────────────────────
// Only run the CLI pipeline when invoked directly (node lib/05_RUN.js),
// NOT when imported by server.js / plan-week.js.
import { fileURLToPath } from "url";
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

const mode = process.argv[2];

if (isDirectRun && mode === "--er-check") {
  // Usage: node 05_RUN.js --er-check
  // Demo ER check với fake data
  const demoER = [
    { post_id: "A1-B2C",    platform: "FB+IG",    current_er: 6.8, current_budget: 15 },
    { post_id: "A1-B2C-V2", platform: "FB+IG",    current_er: 2.1, current_budget: 15 },
    { post_id: "A2-B2B",    platform: "LinkedIn",  current_er: 3.8, current_budget: 10 },
  ];
  runERCheck(demoER).catch(console.error);
} else if (isDirectRun) {
  // Default: run full pipeline for first 5 posts
  runFirst5Posts().catch(console.error);
}
