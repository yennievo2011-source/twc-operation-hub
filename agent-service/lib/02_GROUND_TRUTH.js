// ═══════════════════════════════════════════════════════════════════
// 02_GROUND_TRUTH.js
// Anti-hallucination harness — 3 lớp bảo vệ:
// 1. GROUND_TRUTH: constants để validator cross-check
// 2. validateOutput(): chạy sau mỗi agent call
// 3. applyAdRule(): rule engine deterministic — không qua LLM
// ═══════════════════════════════════════════════════════════════════

// ─── 1. GROUND TRUTH CONSTANTS ───────────────────────────────────
export const GT = {

  pricing: {
    session_1_early:    1599000,   // VND
    session_1_standard: 1999000,   // VND
    session_2:          2199000,
    session_3:          2199000,
    full_series:        8999000,
    full_series_saving: 1798000,
    full_series_pct:    17,
    corporate_half_day_min: 2000,  // USD
    corporate_half_day_max: 3000,
    corporate_full_day_min: 3500,
    corporate_full_day_max: 5000,
    c1_min: 350,   c1_max: 450,
    c2_min: 700,   c2_max: 1000,
  },

  budget: {
    total:                  1300,  // USD
    linkedin_sponsored:      260,
    linkedin_inmail:         190,
    linkedin_total:          450,
    fb_ig_testing:           210,
    fb_ig_boost:             210,
    retargeting:             200,
    email_tools:             100,
    always_on:               130,
    per_post_test_fb:         15,
    per_post_test_li:         10,
    boost_increment:          50,
    scale_pct:                20,  // +20% mỗi 48h
    always_on_s1:             80,
    always_on_corp:           50,
  },

  weekly_spend: {
    w1: { min: 90,  max: 150 },
    w2: { min: 200, max: 300 },
    w3: { min: 260, max: 360 },
    w4: { min: 210, max: 310 },
  },

  // ⚠️ CRITICAL: v5 LinkedIn rules KHÁC v4 (v4 dùng CTR > 1.5%)
  ad_rules: {
    fb_ig: {
      boost:  5,   // ER > 5% → BOOST +$50
      hold_min: 3, // ER 3–5% → HOLD
      kill:   3,   // ER < 3% → KILL
      check_h: 48,
    },
    linkedin: {
      boost_big:   5,  // ER > 5% → BOOST $50 + InMail
      boost:       3,  // ER > 3% → BOOST $30
      hold_min:    2,  // ER 2–3% → HOLD
      stop:        2,  // ER < 2% → STOP + rewrite
    },
    hook_min:  25,
    hook_max:  35,
    // Ad objectives by phase:
    // W1: Engagement (CPE) · W2: Traffic (CPC) · W3-W4: Leads/Conversions
  },

  kpis: {
    reach:          222222,
    website_clicks:   3333,
    ctr_pct:           1.5,
    warm_leads:         500,
    warm_lead_rate_pct: 15,
    conversions_min:    10,
    convert_rate_pct:    2,
    b2b_calls_mo:    "4-5",
    b2b_closes_mo:   "1-2",
    b2b_cpl:            65,  // USD
  },

  email: {
    open_rate_pct:   42.35,
    ctr_pct:         6,
    reply_rate_pct:  15,
    demos_mo:        "2-3",
    sequence_count:  5,
    frequency_days:  "3-4",
  },

  linkedin_algo: {
    carousel_er_pct:  24.42,
    document_er_pct:   6.6,
    personal_multiplier: 8,  // personal > company page
    hook_char_max:     210,
    posts_per_week:    "2-3",
  },

  dates: {
    start:        "2026-06-15",
    soft_launch:  "2026-06-20",
    full_launch:  "2026-06-27",
    end:          "2026-07-09",
    w1_end:       "2026-06-19",
    w2_end:       "2026-06-26",
    w3_end:       "2026-06-30",
    w4_end:       "2026-07-09",
  },

  forbidden: [
    "bền", "ngày dài", "hành trình", "đồng hành",
    "giải pháp toàn diện", "tìm hiểu thêm",
  ],

  proof_points: [
    { text: "30 phút tiết kiệm mỗi ngày", source: "Diệu Cao, ABM, AB Foods" },
    { text: "Smarter and more sophisticated", source: "Mai Nguyễn, Brand Marketing Specialist, Be Group" },
  ],
};

// ─── 2. VALIDATOR ────────────────────────────────────────────────
export function validateOutput(output, agentName = "agent") {
  const violations = [];
  const flag = (msg) => violations.push(`[${agentName.toUpperCase()}] ⚠️ ${msg}`);
  const str  = JSON.stringify(output).toLowerCase();

  // Forbidden words
  GT.forbidden.forEach(w => {
    if (str.includes(w.toLowerCase())) flag(`Forbidden word: "${w}"`);
  });

  // Hook scores
  const scores = str.match(/"hook_score"\s*:\s*(\d+)/g) || [];
  scores.forEach(s => {
    const n = parseInt(s.match(/\d+/)[0]);
    if (n > GT.ad_rules.hook_max) flag(`Hook score ${n} > max ${GT.ad_rules.hook_max}`);
  });

  // Budget total
  if (output?.weekly_ad_summary?.total_spent) {
    const spent = parseFloat(String(output.weekly_ad_summary.total_spent).replace(/[$,]/g, ""));
    if (spent > GT.budget.total) flag(`Total spend $${spent} > campaign budget $${GT.budget.total}`);
  }

  // Ad decisions — check FB/IG rules
  (output?.decisions || []).forEach(d => {
    const er = d.current_er;
    const dec = d.decision?.toUpperCase();
    const plat = (d.platform || "").toLowerCase();

    if (plat.includes("fb") || plat.includes("ig")) {
      if (dec === "BOOST" && er <= GT.ad_rules.fb_ig.boost)
        flag(`FB/IG BOOST with ER ${er}% — needs > ${GT.ad_rules.fb_ig.boost}%`);
      if (dec === "KILL" && er >= GT.ad_rules.fb_ig.kill)
        flag(`FB/IG KILL with ER ${er}% — threshold is < ${GT.ad_rules.fb_ig.kill}%`);
    }
    if (plat.includes("linkedin")) {
      if (dec === "STOP" && er >= GT.ad_rules.linkedin.stop)
        flag(`LI STOP with ER ${er}% — threshold is < ${GT.ad_rules.linkedin.stop}%`);
      if (dec === "BOOST" && er <= GT.ad_rules.linkedin.boost)
        flag(`LI BOOST with ER ${er}% — needs > ${GT.ad_rules.linkedin.boost}%`);
    }
  });

  // Pricing check
  if (output?.pricing?.session_1 || output?.session_1_price) {
    const p = output?.pricing?.session_1 || output?.session_1_price;
    if (p && p !== GT.pricing.session_1_early && p !== GT.pricing.session_1_standard)
      flag(`Session 1 price ${p} không khớp (phải là ${GT.pricing.session_1_early} hoặc ${GT.pricing.session_1_standard})`);
  }

  return violations;
}

// ─── 3. AD RULE ENGINE (deterministic — không qua LLM) ────────────
export function applyAdRule(postId, er, platform, currentBudget = 0) {
  const r = GT.ad_rules;
  const isLI = platform?.toLowerCase().includes("linkedin");

  if (isLI) {
    if (er > r.linkedin.boost_big) return {
      post_id: postId, decision: "BOOST",
      boost_amount: 50, new_budget: currentBudget + 50,
      follow_up: "Launch InMail follow-up sequence",
      reason: `LinkedIn ER ${er}% > ${r.linkedin.boost_big}% → BOOST $50 + InMail`,
    };
    if (er > r.linkedin.boost) return {
      post_id: postId, decision: "BOOST",
      boost_amount: 30, new_budget: currentBudget + 30,
      reason: `LinkedIn ER ${er}% > ${r.linkedin.boost}% → BOOST $30`,
    };
    if (er < r.linkedin.stop) return {
      post_id: postId, decision: "STOP",
      boost_amount: 0, new_budget: 0,
      action: "Rewrite hook, score ≥ 25/35 trước khi retest",
      reason: `LinkedIn ER ${er}% < ${r.linkedin.stop}% → STOP`,
    };
    return {
      post_id: postId, decision: "HOLD",
      boost_amount: 0, new_budget: currentBudget,
      reason: `LinkedIn ER ${er}% in HOLD zone (${r.linkedin.stop}–${r.linkedin.boost}%)`,
    };
  }

  // FB / IG
  if (er > r.fb_ig.boost) return {
    post_id: postId, decision: "BOOST",
    boost_amount: 50, new_budget: currentBudget + 50,
    next_scale: `+${r.scale_pct}% mỗi 48h nếu tiếp tục perform`,
    reason: `FB/IG ER ${er}% > ${r.fb_ig.boost}% → BOOST +$50`,
  };
  if (er >= r.fb_ig.hold_min) return {
    post_id: postId, decision: "HOLD",
    boost_amount: 0, new_budget: currentBudget,
    next_check_h: 24,
    reason: `FB/IG ER ${er}% in HOLD zone (${r.fb_ig.hold_min}–${r.fb_ig.boost}%)`,
  };
  return {
    post_id: postId, decision: "KILL",
    boost_amount: 0, new_budget: 0,
    reason: `FB/IG ER ${er}% < ${r.fb_ig.kill}% → KILL`,
  };
}

// ─── 4. SAFE JSON PARSER ─────────────────────────────────────────
export function safeParse(raw, agentName = "agent") {
  if (!raw) throw new Error(`${agentName}: empty response`);

  const cleaned = raw
    .replace(/^```json\s*/i, "").replace(/^```\s*/, "")
    .replace(/\s*```$/, "").trim();

  // Try direct parse
  const direct = cleaned.match(/^(\{[\s\S]*\}|\[[\s\S]*\])$/);
  if (direct) {
    try { return JSON.parse(direct[1]); } catch {}
  }

  // Extract embedded JSON
  const embedded = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (embedded) {
    try {
      console.warn(`⚠️  ${agentName}: JSON extracted from text wrapper`);
      return JSON.parse(embedded[1]);
    } catch {}
  }

  throw new Error(`${agentName}: No valid JSON found\nFirst 300 chars: ${cleaned.slice(0, 300)}`);
}

// ─── 5. AGENT HARNESS (wrapper với retry + validate + log) ────────
import fs from "fs";
import path from "path";

export async function runSafe(agentFn, input, opts = {}) {
  const {
    name       = "agent",
    maxRetries = 2,
    strict     = false,   // true = halt on violations
    log        = true,
    fallback   = null,
  } = opts;

  let lastErr, lastRaw;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      console.log(`\n🔄 ${name} — attempt ${attempt}`);

      const raw = await agentFn(
        attempt > 1
          ? { ...input, _retry: `Attempt ${attempt - 1} failed: ${lastErr?.message}. Fix the issue and return ONLY valid JSON.` }
          : input
      );
      lastRaw = raw;

      const parsed    = safeParse(raw, name);
      const violations = validateOutput(parsed, name);

      // Log
      if (log) {
        const dir = "./output";
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        fs.writeFileSync(
          path.join(dir, `${name}_${ts}.json`),
          JSON.stringify({ agent: name, timestamp: new Date().toISOString(), violations, output: parsed }, null, 2)
        );
      }

      if (violations.length > 0) {
        violations.forEach(v => console.warn(`  ${v}`));
        if (strict && attempt <= maxRetries) throw new Error(`Violations:\n${violations.join("\n")}`);
        if (strict) {
          console.error(`❌ ${name}: violations persist after ${maxRetries} retries`);
          return fallback ?? { _error: "violations", _violations: violations, ...parsed };
        }
        console.warn(`⚠️  ${name}: returning with ${violations.length} violation(s)`);
      }

      console.log(`✅ ${name} done (attempt ${attempt})`);
      return parsed;

    } catch (err) {
      lastErr = err;
      console.warn(`  ❌ attempt ${attempt}: ${err.message.slice(0, 120)}`);
      if (attempt <= maxRetries) await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  console.error(`\n❌ ${name}: failed after all attempts. Last: ${lastErr?.message}`);
  if (lastRaw) console.error(`   Raw (200): ${lastRaw?.slice(0, 200)}`);
  return fallback ?? { _failed: true, _error: lastErr?.message };
}
