// ═══════════════════════════════════════════════════════════════════
// harness/humanVoiceFilter.js
// Anti-AI language layer — runs on ALL text output before dashboard
//
// 2 modes:
// 1. ruleFilter(text)     → regex replace, instant, no API call
// 2. aiRewrite(text, ctx) → Claude rewrites flagged sentences,
//                           preserves meaning, kills AI-isms
// ═══════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// ─── 1. PATTERN LIBRARY ──────────────────────────────────────────
// Tiếng Việt + tiếng Anh AI-isms
// Format: { pattern, replacement, reason }

export const AI_PATTERNS_VI = [
  // Từ cấm tuyệt đối (TWC brand rules)
  { p: /\bbền\b/gi,                   r: "",         note: "TWC banned word" },
  { p: /ngày dài/gi,                  r: "",         note: "TWC banned word" },
  { p: /hành trình/gi,                r: "quá trình",note: "generic journey cliché" },
  { p: /đồng hành/gi,                 r: "",         note: "TWC banned word" },
  { p: /giải pháp toàn diện/gi,       r: "cách làm", note: "TWC banned word" },
  { p: /tìm hiểu thêm/gi,             r: "",         note: "TWC banned CTA" },

  // AI opener patterns
  { p: /^Thật ra[,.]?\s*/gim,         r: "",         note: "AI opener" },
  { p: /^Thực ra[,.]?\s*/gim,         r: "",         note: "AI opener" },
  { p: /^Điều thú vị là[,.]?\s*/gim,  r: "",         note: "AI opener" },
  { p: /^Không thể phủ nhận[,.]?\s*/gim, r: "",      note: "AI opener" },
  { p: /^Trong bối cảnh[,.]?\s*/gim,  r: "",         note: "vague context opener" },
  { p: /^Với sự phát triển[,.]?\s*/gim, r: "",       note: "AI tech opener" },

  // Filler phrases
  { p: /một cách hiệu quả/gi,         r: "",         note: "filler adverb" },
  { p: /một cách toàn diện/gi,        r: "",         note: "filler adverb" },
  { p: /đáng kể/gi,                   r: "",         note: "vague intensifier" },
  { p: /vô cùng quan trọng/gi,        r: "quan trọng", note: "redundant intensifier" },
  { p: /mang lại giá trị/gi,          r: "",         note: "empty value claim" },
  { p: /tối ưu hóa quy trình/gi,      r: "tiết kiệm thời gian", note: "AI buzzword" },
  { p: /nâng cao hiệu quả/gi,         r: "làm nhanh hơn",       note: "AI buzzword" },
  { p: /chuyển đổi số/gi,             r: "dùng AI",             note: "buzzword" },
  { p: /kỷ nguyên số/gi,              r: "2026",                note: "buzzword" },
  { p: /tương lai của/gi,             r: "",                    note: "vague future talk" },

  // Motivational poster language
  { p: /thành công bắt đầu từ/gi,     r: "",         note: "poster quote" },
  { p: /bứt phá/gi,                   r: "",         note: "startup cliché" },
  { p: /dấu ấn/gi,                    r: "",         note: "vague achievement" },
  { p: /chinh phục/gi,                r: "",         note: "dramatic overstatement" },
];

export const AI_PATTERNS_EN = [
  // Classic AI tells
  { p: /\bdelve\b/gi,                 r: "look into",     note: "AI tell" },
  { p: /\bleverage\b/gi,              r: "use",           note: "corporate AI" },
  { p: /\bsynergy\b/gi,               r: "",              note: "buzzword" },
  { p: /\bseamlessly\b/gi,            r: "",              note: "AI filler adverb" },
  { p: /\butilize\b/gi,               r: "use",           note: "AI formality" },
  { p: /\bcomprehensive\b/gi,         r: "",              note: "AI intensifier" },
  { p: /\brobust\b/gi,                r: "",              note: "AI adjective" },
  { p: /\btailored\b/gi,              r: "custom",        note: "AI adjective" },
  { p: /\bempowering\b/gi,            r: "",              note: "buzzword" },
  { p: /\btransformative\b/gi,        r: "",              note: "buzzword" },
  { p: /\bholistic\b/gi,              r: "",              note: "buzzword" },
  { p: /\blandscape\b/gi,             r: "space",         note: "AI metaphor" },
  { p: /\becosystem\b/gi,             r: "system",        note: "AI metaphor" },
  { p: /\bjourney\b/gi,               r: "process",       note: "journey cliché" },
  { p: /\bnavigate\b/gi,              r: "handle",        note: "AI metaphor" },
  { p: /\bunlock\b/gi,                r: "get",           note: "AI metaphor" },
  { p: /\bfoster\b/gi,                r: "build",         note: "formal AI" },
  { p: /\bfacilitate\b/gi,            r: "help",          note: "formal AI" },
  { p: /\bencompass\b/gi,             r: "include",       note: "formal AI" },

  // AI opener phrases
  { p: /^Certainly[,!.]?\s*/gim,      r: "",             note: "AI opener" },
  { p: /^Absolutely[,!.]?\s*/gim,     r: "",             note: "AI opener" },
  { p: /^Of course[,!.]?\s*/gim,      r: "",             note: "AI opener" },
  { p: /^Great question[!.]?\s*/gim,  r: "",             note: "AI opener" },
  { p: /^In today's (fast-paced|digital|modern)/gim, r: "", note: "AI opener" },
  { p: /^It's worth noting that/gim,  r: "",             note: "AI hedge opener" },
  { p: /^It is important to (note|mention)/gim, r: "",   note: "AI hedge" },
  { p: /^As (an AI|a language model)/gim, r: "",         note: "self-reference" },

  // Passive voice patterns → flag for rewrite
  { p: /\bis being\b/gi,              r: "IS_PASSIVE",   note: "passive voice" },
  { p: /\bwas being\b/gi,             r: "WAS_PASSIVE",  note: "passive voice" },
];

// ─── 2. RULE-BASED FILTER (instant, no API) ──────────────────────
export function ruleFilter(text, lang = "auto") {
  if (!text || typeof text !== "string") return text;

  let result = text;
  const flags = [];

  const patterns = lang === "en"
    ? AI_PATTERNS_EN
    : lang === "vi"
    ? AI_PATTERNS_VI
    : [...AI_PATTERNS_VI, ...AI_PATTERNS_EN];

  for (const { p, r, note } of patterns) {
    const before = result;
    result = result.replace(p, r);
    if (result !== before) {
      flags.push(note);
    }
  }

  // Clean up double spaces, leading/trailing spaces per line
  result = result
    .split("\n")
    .map(line => line.replace(/\s{2,}/g, " ").trim())
    .filter(line => line.length > 0 || line === "")
    .join("\n");

  return { text: result, flags };
}

// ─── 3. DETECTION — score how AI-sounding a text is ──────────────
export function detectAIScore(text) {
  if (!text) return { score: 0, triggers: [] };
  const triggers = [];
  const allPatterns = [...AI_PATTERNS_VI, ...AI_PATTERNS_EN];

  for (const { p, note } of allPatterns) {
    if (p.test(text)) {
      triggers.push(note);
      p.lastIndex = 0; // reset regex
    }
  }

  // Extra checks
  const sentences = text.split(/[.!?।\n]/);
  const passiveSentences = sentences.filter(s =>
    /\b(được|bị|is|are|was|were)\s+\w+ed\b/i.test(s)
  );
  if (passiveSentences.length > sentences.length * 0.4) {
    triggers.push("too many passive voice sentences");
  }

  const avgWordsPerSentence = text.split(/\s+/).length / Math.max(sentences.length, 1);
  if (avgWordsPerSentence > 25) {
    triggers.push("sentences too long (avg > 25 words)");
  }

  return {
    score: triggers.length,
    human_score: Math.max(0, 10 - triggers.length), // 10 = fully human
    triggers,
    pass: triggers.length <= 2, // ≤2 triggers = acceptable
  };
}

// ─── 4. AI-POWERED REWRITE (when rule filter isn't enough) ────────
const HUMAN_VOICE_SYSTEM = `
Bạn là editor cho The Wild Card — Gen AI Training & Advisory, Vietnam.

NHIỆM VỤ: Rewrite text để nghe như người thật viết — không phải AI.

BRAND VOICE: Sharp, practical, ngắn gọn. Câu ngắn. Động từ mạnh.
Nói như marketer giỏi nói chuyện với đồng nghiệp.

RULES TUYỆT ĐỐI:
- Câu ngắn hơn — nếu câu > 20 từ, cắt làm 2
- Chủ động, không bị động: "AI giúp bạn" không phải "bạn được giúp bởi AI"
- Số liệu cụ thể > lời hứa mơ hồ: "30 phút" không phải "tiết kiệm thời gian"
- Không bắt đầu câu bằng: "Thật ra", "Điều thú vị", "Không thể phủ nhận"
- Không dùng: hành trình, đồng hành, bền, giải pháp toàn diện, leverage, delve, seamlessly
- Không emoji spam (max 2–3 functional)
- Không dấu chấm than liên tiếp

Trả về ONLY text đã rewrite — không có explanation, không có preamble.
Giữ nguyên tone B2C (FB/IG) hoặc B2B (LinkedIn) từ input.
Giữ nguyên số liệu, tên người, brand names.
`;

export async function aiRewrite(text, context = {}) {
  if (!text) return text;

  const { audience = "b2c", post_id = "", reason = "" } = context;

  const prompt = `Rewrite this ${audience.toUpperCase()} caption to sound fully human.
Context: ${reason || "Remove all AI-sounding language"}
Post: ${post_id}

TEXT TO REWRITE:
${text}`;

  try {
    const res = await client.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 1000,
      system:     HUMAN_VOICE_SYSTEM,
      messages:   [{ role: "user", content: prompt }],
    });
    return res.content[0].text.trim();
  } catch (err) {
    console.error(`humanVoiceFilter.aiRewrite error: ${err.message}`);
    return text; // fallback: return original
  }
}

// ─── 5. FULL PIPELINE — rule filter then AI if needed ────────────
export async function filterCaption(text, context = {}) {
  if (!text) return { text, ai_score: 0, rewritten: false };

  // Step 1: Rule filter
  const { text: ruleFiltered, flags } = ruleFilter(text, context.lang || "auto");

  // Step 2: Score
  const score = detectAIScore(ruleFiltered);

  // Step 3: If still AI-sounding → AI rewrite
  let finalText = ruleFiltered;
  let rewritten = false;

  if (!score.pass) {
    console.log(`  🔄 humanVoiceFilter: AI score ${score.score} on ${context.post_id} — rewriting...`);
    finalText = await aiRewrite(ruleFiltered, { ...context, reason: score.triggers.join(", ") });
    rewritten = true;

    // Final score check
    const finalScore = detectAIScore(finalText);
    console.log(`     After rewrite: AI score ${finalScore.score} → human score ${finalScore.human_score}/10`);
  }

  return {
    text:      finalText,
    original:  text,
    ai_score:  score.score,
    human_score: score.human_score,
    triggers:  score.triggers,
    rule_flags: flags,
    rewritten,
  };
}

// ─── 6. BATCH — filter all captions in a post's 3 options ────────
export async function filterPostOptions(post) {
  if (!post?.options) return post;

  const filtered = await Promise.all(
    post.options.map(async (opt, i) => {
      const label = ["A", "B", "C"][i] || String(i + 1);
      console.log(`  → Filtering option ${label} [${post.post_id}]`);

      const captionResult = opt.caption
        ? await filterCaption(opt.caption, { post_id: post.post_id, audience: post.audience, lang: "auto" })
        : null;

      const adCopyResult = opt.ad_copy?.primary_text
        ? await filterCaption(opt.ad_copy.primary_text, { post_id: post.post_id, audience: post.audience, lang: "auto" })
        : null;

      return {
        ...opt,
        caption:  captionResult?.text  || opt.caption,
        ad_copy:  adCopyResult ? { ...opt.ad_copy, primary_text: adCopyResult.text } : opt.ad_copy,
        _filter: {
          caption_human_score: captionResult?.human_score,
          caption_rewritten:   captionResult?.rewritten,
          ad_copy_human_score: adCopyResult?.human_score,
          triggers:            captionResult?.triggers || [],
        },
      };
    })
  );

  return { ...post, options: filtered };
}
