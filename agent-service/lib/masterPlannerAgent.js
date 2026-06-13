// ═══════════════════════════════════════════════════════════════════
// agents/masterPlannerAgent.js
// Master Planner v3 — 1 dashboard, Yên approves 1 lần duy nhất
//
// OUTPUT: JSON dashboard với 3 sections:
//   1. Ad spending summary (what worked / didn't / next)
//   2. 3 options A/B/C (caption + visual + ad copy per option)
//   3. Decisions + actions (tất cả trên 1 màn hình)
// ═══════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import { TWC_CONTEXT } from "./01_TWC_BRAND_CONTEXT.js";
import { runSafe, GT, applyAdRule } from "./02_GROUND_TRUTH.js";
import { detectAIScore } from "./humanVoiceFilter.js";

const client = new Anthropic();

// ─── SYSTEM PROMPT ────────────────────────────────────────────────
const MASTER_SYSTEM = `
${TWC_CONTEXT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MASTER PLANNER v3 — 1 DASHBOARD, 1 DECISION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NGƯỜI ĐỌC: Yên — founder, đọc sáng sớm, 5 phút max.
FORMAT: Dashboard JSON → render thành UI. Không phải email report.

NHIỆM VỤ: Tổng hợp tất cả agent outputs → 1 dashboard object.
Yên nhìn vào 1 chỗ, pick 1 option, approve — xong.

⚠️ OUTPUT: ONLY raw JSON. No markdown. No preamble.

## DASHBOARD LOGIC

### Section 1 — AD PERFORMANCE (what worked / didn't):
- Tổng hợp ER data thực tế nếu có, hoặc project từ phase + benchmarks
- WORKED = ER > 5% FB/IG hoặc > 3% LinkedIn
- FAILED = ER < 3% FB/IG hoặc < 2% LinkedIn
- NEXT STEP phải là action cụ thể, không phải "consider optimizing"
- Budget: exact numbers — không làm tròn

### Section 2 — 3 OPTIONS (pick 1):
- Mỗi option = caption (từ Content Agent) + visual spec (từ Design Agent) + ad copy
- Gắn human_score vào mỗi option — Yên biết cái nào nghe human nhất
- Highlight recommended option với lý do 1 câu
- Đưa ra hook score — cái nào cao nhất → test trước

### Section 3 — TODAY'S ACTIONS:
- Max 5 items, ordered by priority
- Mỗi item: cụ thể, có deadline, có "auto" flag nếu không cần Yên làm
- Ad decisions: rule engine đã tính → chỉ hiển thị kết quả, không hỏi lại

## WHAT WORKED / DIDN'T — FRAMEWORK:
WORKED signals: ER cao, save rate cao, comment chất lượng, DM từ B2B
FAILED signals: ER thấp, reach thấp, generic comments, no B2B signal
NEXT: Pivot angle, double budget winner, kill loser, rewrite hook < 25/35

## HUMAN VOICE IN BRIEFING TEXT:
- briefing_text viết như Zalo message từ đồng nghiệp thân thiết
- Không formal, không AI opener ("Thật ra...", "Điều thú vị...")
- Câu ngắn. Thẳng vào vấn đề.
- Bad news trước. Good news sau.
- Kết bằng 1 việc duy nhất cần làm hôm nay.

## JSON SCHEMA

{
  "agent": "master_planner_v3",
  "report_date": "<YYYY-MM-DD>",
  "report_time": "<HH:MM>",
  "phase": "<ph1|ph2|ph3|ph4>",
  "phase_label": "<W1 Pre-Launch etc>",

  "health": {
    "overall": "<on_track|watch|at_risk>",
    "b2b": { "status": "<on_track|watch|at_risk>", "reason": "<1 câu ngắn>" },
    "b2c": { "status": "<on_track|watch|at_risk>", "reason": "<1 câu ngắn>" }
  },

  "ad_performance": {
    "budget": {
      "total": 1300,
      "spent": <number>,
      "committed": <number>,
      "remaining": <number>,
      "linkedin_pct": "<XX%>",
      "on_track": <true|false>
    },
    "posts_live": <number>,
    "posts_killed": <number>,
    "worked": [
      {
        "post_id": "<A1>",
        "platform": "<FB+IG|LinkedIn>",
        "er": <number>,
        "why_worked": "<1 câu — hook type, angle, format>",
        "action": "<BOOST +$50|maintain|scale>"
      }
    ],
    "failed": [
      {
        "post_id": "<A2>",
        "platform": "<>",
        "er": <number>,
        "why_failed": "<1 câu — specific reason>",
        "action": "KILL",
        "learning": "<đừng làm gì lần sau>"
      }
    ],
    "next_improvements": [
      "<action cụ thể — ví dụ: 'Pivot W3 sang data-first hooks — contrast số liệu ER cao hơn story 2.4×'>"
    ]
  },

  "options_to_review": [
    {
      "post_id": "<P1>",
      "date": "<YYYY-MM-DD>",
      "platform": "<FB+IG|LinkedIn>",
      "recommended": "<A|B|C>",
      "recommended_reason": "<1 câu>",
      "options": [
        {
          "label": "A",
          "hook_angle": "<contrast_data|founder_story|contrarian>",
          "hook_line": "<standalone hook text>",
          "hook_score": <0-35>,
          "human_score": <0-10>,
          "caption_preview": "<first 100 chars của caption>",
          "visual_concept": "<1 câu mô tả visual>",
          "visual_template": "<DAHLmd0XPi0 p.1|DAHLmA_lOs4 p.2|custom>",
          "higgsfield_model": "<ms_image|nano_banana_pro|marketing_studio_video>",
          "ad_headline": "<≤40 chars>",
          "ad_budget": "<$15 test|$50 always-on|none>",
          "strengths": ["<strength 1>"],
          "watch_out": "<1 potential issue>"
        },
        { "label": "B" },
        { "label": "C" }
      ]
    }
  ],

  "today_actions": [
    {
      "priority": 1,
      "track": "<b2b|b2c|both>",
      "task": "<việc cụ thể>",
      "deadline": "<HH:MM|EOD|auto>",
      "auto": <true|false>,
      "note": "<1 câu context nếu cần>"
    }
  ],

  "linkedin_today": {
    "post": "<post_id hoặc null>",
    "connections_target": 20,
    "outreach_step": "<bước 1-5>",
    "inmail_action": "<null|string>"
  },

  "briefing_text": "<Zalo message cho Yên — ngắn, thẳng, human. \\n cho xuống dòng. Bắt đầu ngay bằng vấn đề quan trọng nhất. Kết bằng 1 việc duy nhất cần làm hôm nay.>"
}
`;

// ─── BUILD AD PERFORMANCE SECTION ────────────────────────────────
// Rule engine xử lý decisions — không qua LLM
function buildAdPerformance(adsOutput, erData = []) {
  const decisions = erData.map(d =>
    applyAdRule(d.post_id, d.current_er, d.platform, d.current_budget || 15)
  );

  const worked  = decisions.filter(d => d.decision === "BOOST");
  const failed  = decisions.filter(d => ["KILL", "STOP"].includes(d.decision));
  const holding = decisions.filter(d => d.decision === "HOLD");

  const spent = adsOutput?.weekly_summary?.spent || "$0";
  const spentNum = parseFloat(String(spent).replace(/[$,]/g, "")) || 0;

  return {
    rule_decisions: decisions,
    worked_count:   worked.length,
    failed_count:   failed.length,
    holding_count:  holding.length,
    spent_num:      spentNum,
    remaining:      GT.budget.total - spentNum,
    // Pass to LLM for narrative
    decisions_summary: decisions.map(d => ({
      post_id:   d.post_id,
      decision:  d.decision,
      reason:    d.reason,
      budget_action: d.boost_amount
        ? `+$${d.boost_amount}`
        : d.decision === "KILL" ? `-$${d.new_budget || 15}` : "no change",
    })),
  };
}

// ─── MERGE OPTIONS — combine content + design + ads per option ────
function mergeOptions(contentPost, designOutput, adsOutput) {
  if (!contentPost?.options) return [];

  return contentPost.options.map(opt => {
    // Find matching ad copy option
    const adCopy = adsOutput?.ad_copies?.find(ac => ac.post_id === contentPost.post_id);
    const adVariant = adCopy?.[`variation_${opt.label.toLowerCase()}`] || adCopy?.variation_a;

    // Find visual spec for this option
    const designSpec = designOutput?.options?.[opt.label] || designOutput;

    return {
      label:         opt.label,
      hook_angle:    opt.hook_angle,
      hook_line:     opt.hook_line,
      hook_score:    opt.hook_score,
      human_score:   opt._filter?.caption_human_score || 7,
      caption_preview: opt.caption?.slice(0, 100) + (opt.caption?.length > 100 ? "..." : ""),
      cta:           opt.cta,
      visual_concept: designSpec?.canva_spec?.slides?.[0]?.designer_note
        || opt.why_this_angle || "Visual spec — see design agent output",
      visual_template: designSpec?.canva_spec?.source_template?.design_id || "DAHLmd0XPi0",
      higgsfield_model: opt.hook_angle === "contrast_data"
        ? "ms_image" : opt.hook_angle === "founder_story"
        ? "nano_banana_pro" : "ms_image",
      ad_headline:   adVariant?.headline || "",
      ad_budget:     contentPost.ad_budget || "test $15",
      passes_threshold: opt.passes_threshold,
      why_this_angle: opt.why_this_angle,
      strengths:     [opt.recommended ? "Recommended by Content Agent" : "Alternative angle"],
      watch_out:     opt.passes_threshold ? null : `Hook score ${opt.hook_score}/35 below threshold`,
    };
  });
}

// ─── MAIN AGENT FUNCTION ──────────────────────────────────────────
export async function runMasterPlanner({
  planOutput,
  contentOutput,
  designOutput,
  adsOutput,
  erData = [],
}) {
  console.log("\n🃏 Master Planner — building dashboard...");

  // Step 1: Rule engine processes ad decisions (no LLM)
  const adPerf = buildAdPerformance(adsOutput, erData);
  console.log(`   ⚡ Rule engine: ${adPerf.worked_count} boost / ${adPerf.failed_count} kill / ${adPerf.holding_count} hold`);

  // Step 2: Merge content + design + ads into options
  const optionsByPost = (contentOutput || []).map(contentPost => {
    const postDesign = Array.isArray(designOutput)
      ? designOutput.find(d => d.post_id === contentPost.post_id)
      : designOutput;

    return {
      post_id:     contentPost.post_id,
      date:        contentPost.date,
      platform:    contentPost.platform,
      audience:    contentPost.audience,
      recommended: contentPost.recommended_option,
      recommended_reason: contentPost.recommended_reason,
      options:     mergeOptions(contentPost, postDesign, adsOutput),
      ad_budget:   contentPost.ad_budget,
    };
  });

  // Step 3: LLM builds narrative dashboard
  const dashboardInput = {
    plan:           planOutput,
    ad_performance: adPerf,
    options:        optionsByPost,
    ads_summary:    adsOutput?.weekly_summary,
    date:           new Date().toISOString().split("T")[0],
    phase:          planOutput?.campaign_phase || "ph1",
  };

  const dashboard = await runSafe(
    async (input) => {
      const res = await client.messages.create({
        model:      "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system:     MASTER_SYSTEM,
        messages: [{
          role:    "user",
          content: `Build the Master Dashboard from this data. 
Write briefing_text in casual Vietnamese (Zalo style).
Apply human voice rules — no AI openers, short sentences, active voice.

DATA:
${JSON.stringify(input, null, 2)}`,
        }],
      });
      return res.content[0].text;
    },
    dashboardInput,
    { name: "master_planner", maxRetries: 2, log: true }
  );

  // Step 4: Check briefing_text for AI language
  if (dashboard?.briefing_text) {
    const score = detectAIScore(dashboard.briefing_text);
    if (!score.pass) {
      console.warn(`   ⚠️  briefing_text AI score ${score.score} — triggers: ${score.triggers.slice(0, 3).join(", ")}`);
    } else {
      console.log(`   ✅ briefing_text human score: ${score.human_score}/10`);
    }
  }

  // Step 5: Inject rule engine decisions into dashboard
  // Override any LLM ad decisions with rule engine truth
  if (dashboard?.ad_performance && adPerf.rule_decisions.length > 0) {
    dashboard.ad_performance._rule_engine_decisions = adPerf.rule_decisions;
    dashboard.ad_performance.budget = dashboard.ad_performance.budget || {};
    dashboard.ad_performance.budget.remaining = adPerf.remaining;
  }

  console.log(`\n✅ Master Planner dashboard ready`);
  console.log(`   Posts to review: ${optionsByPost.length}`);
  console.log(`   Today actions: ${dashboard?.today_actions?.length || 0}`);

  return dashboard;
}

// ─── DASHBOARD RENDERER (terminal preview) ────────────────────────
export function printDashboard(dashboard) {
  if (!dashboard) return;

  console.log("\n" + "═".repeat(60));
  console.log("🃏 TWC MASTER DASHBOARD");
  console.log("═".repeat(60));

  // Health
  const h = dashboard.health;
  if (h) {
    const icon = h.overall === "on_track" ? "✅" : h.overall === "watch" ? "⚠️ " : "🔴";
    console.log(`\n${icon} Campaign: ${h.overall?.toUpperCase()}`);
    console.log(`   B2B: ${h.b2b?.status} — ${h.b2b?.reason}`);
    console.log(`   B2C: ${h.b2c?.status} — ${h.b2c?.reason}`);
  }

  // Ad performance
  const ap = dashboard.ad_performance;
  if (ap?.budget) {
    console.log(`\n💰 BUDGET: $${ap.budget.spent || 0} spent / $${ap.budget.remaining || 0} remaining`);
    console.log(`   LinkedIn: ${ap.budget.linkedin_pct} of spend`);
  }
  if (ap?.worked?.length > 0) {
    console.log("\n✅ WORKED:");
    ap.worked.forEach(w => console.log(`   ${w.post_id} ER ${w.er}% — ${w.why_worked}`));
  }
  if (ap?.failed?.length > 0) {
    console.log("\n❌ FAILED:");
    ap.failed.forEach(f => console.log(`   ${f.post_id} ER ${f.er}% — ${f.why_failed}`));
  }
  if (ap?.next_improvements?.length > 0) {
    console.log("\n🎯 NEXT:");
    ap.next_improvements.forEach(n => console.log(`   → ${n}`));
  }

  // Options to review
  if (dashboard.options_to_review?.length > 0) {
    console.log("\n📋 OPTIONS TO REVIEW:");
    dashboard.options_to_review.forEach(post => {
      console.log(`\n  ${post.post_id} [${post.date}] ${post.platform}`);
      console.log(`  Recommended: Option ${post.recommended} — ${post.recommended_reason}`);
      post.options?.forEach(opt => {
        const rec = opt.label === post.recommended ? " ← PICK THIS" : "";
        const scores = `hook ${opt.hook_score}/35 · human ${opt.human_score}/10`;
        console.log(`    [${opt.label}] ${opt.hook_angle} · ${scores}${rec}`);
        console.log(`         "${opt.hook_line?.slice(0, 70)}..."`);
      });
    });
  }

  // Actions
  if (dashboard.today_actions?.length > 0) {
    console.log("\n📌 TODAY:");
    dashboard.today_actions.forEach(a => {
      const auto = a.auto ? " [AUTO]" : "";
      console.log(`   ${a.priority}. ${a.task}${auto} — ${a.deadline}`);
    });
  }

  // Briefing
  if (dashboard.briefing_text) {
    console.log("\n💬 BRIEFING:");
    console.log("─".repeat(50));
    console.log(dashboard.briefing_text);
    console.log("─".repeat(50));
  }

  console.log("═".repeat(60));
}
