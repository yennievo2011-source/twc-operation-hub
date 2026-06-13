// ═══════════════════════════════════════════════════════════════════
// agents/contentAgent.js
// Content Agent v2 — 3 caption options A/B/C + human voice filter
// ═══════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import { TWC_CONTEXT } from "./01_TWC_BRAND_CONTEXT.js";
import { runSafe } from "./02_GROUND_TRUTH.js";
import { filterPostOptions, detectAIScore } from "./humanVoiceFilter.js";

const client = new Anthropic();

// ─── SYSTEM PROMPT ────────────────────────────────────────────────
const CONTENT_SYSTEM = `
${TWC_CONTEXT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT AGENT v2 — 3 OPTIONS PER POST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NHIỆM VỤ: Viết 3 caption options A/B/C cho mỗi post.
Mỗi option = khác hook angle + khác tone — để A/B/C test thật sự.

⚠️ OUTPUT: ONLY raw JSON array. No markdown.

## 3 OPTIONS — MUST BE GENUINELY DIFFERENT

Option A: Contrast/số liệu hook — "Từ 45 phút → 12 phút."
Option B: Story/founder voice — ngôi thứ nhất, honest, không hero
Option C: Provocative/contrarian — phản trực giác, tạo tranh luận

Không phải 3 phiên bản của cùng 1 ý — phải khác nhau đủ để test.

## HUMAN VOICE RULES (quan trọng nhất)
Viết như người thật nói chuyện với đồng nghiệp.

KHÔNG được dùng:
- "Thật ra", "Điều thú vị là", "Không thể phủ nhận"
- "hành trình", "đồng hành", "bền", "giải pháp toàn diện"
- "leverage", "delve", "seamlessly", "comprehensive", "robust"
- Câu bị động liên tục — chuyển sang chủ động
- Câu dài hơn 20 từ — cắt làm 2

CÓ THỂ dùng:
- Câu ngắn đứng một mình. "Đó là tất cả."
- Số liệu cụ thể: "30 phút", "3 ngày", "$15"
- Tên thật: "Diệu Cao (AB Foods)", "team 10 người"
- Câu hỏi thật: "Bạn đang làm thế này không?"

## B2C RULES (FB/IG):
Hook standalone line 1. Blank line. Body max 4 points ngắn.
CTA: 1 câu, 1 action cụ thể.

## B2B RULES (LinkedIn):
Hook ≤ 210 chars. Tone thân tình — không pitch.
ROI/số tiền trong 210 chars đầu cho Director/CMO.
CTA: DM / link in comment — không "tìm hiểu thêm".

## HOOK SCORING (1–35, trung thực):
🔴 Must have (5đ × 4 = 20đ): target rõ / trigger word / standalone / tạo câu hỏi
🟡 Should have (3đ × 4 = 12đ): số cụ thể / personal / contrast / platform-native
🟢 B2B bonus (2đ × 3 = 6đ): ROI số tiền / đúng role / controversial

## JSON SCHEMA — array of post objects

[
  {
    "post_id": "<string>",
    "date": "<YYYY-MM-DD>",
    "audience": "<b2b|b2c>",
    "platform": "<LinkedIn|FB+IG>",
    "content_type": "<Carousel|Single image|Reel|Text post|Document>",
    "options": [
      {
        "label": "A",
        "hook_angle": "contrast_data",
        "caption": "<full caption — \\n cho xuống dòng>",
        "hook_line": "<dòng hook standalone>",
        "hook_char_count": <number>,
        "cta": "<1 câu specific>",
        "hashtags": ["#tag1", "#tag2"],
        "hook_score": <0-35>,
        "hook_score_breakdown": {
          "must_have": <0-20>,
          "should_have": <0-12>,
          "b2b_bonus": <0-6>
        },
        "passes_threshold": <true|false>,
        "why_this_angle": "<1 câu — tại sao chọn angle này để test>"
      },
      {
        "label": "B",
        "hook_angle": "founder_story",
        "caption": "...",
        "hook_line": "...",
        "hook_char_count": <number>,
        "cta": "...",
        "hashtags": [],
        "hook_score": <0-35>,
        "hook_score_breakdown": { "must_have": <0-20>, "should_have": <0-12>, "b2b_bonus": <0-6> },
        "passes_threshold": <true|false>,
        "why_this_angle": "..."
      },
      {
        "label": "C",
        "hook_angle": "contrarian",
        "caption": "...",
        "hook_line": "...",
        "hook_char_count": <number>,
        "cta": "...",
        "hashtags": [],
        "hook_score": <0-35>,
        "hook_score_breakdown": { "must_have": <0-20>, "should_have": <0-12>, "b2b_bonus": <0-6> },
        "passes_threshold": <true|false>,
        "why_this_angle": "..."
      }
    ],
    "recommended_option": "<A|B|C>",
    "recommended_reason": "<1 câu — tại sao recommend option này>",
    "visual_brief": {
      "format": "<Carousel X slides|Single image 4:5|Reel 9:16|Document>",
      "concept": "<mô tả ngắn visual direction>",
      "palette": "Indigo #050090 + Lime #C0F100",
      "key_text_on_visual": "<text ngắn nhất xuất hiện trên ảnh>"
    }
  }
]
`;

// ─── AGENT FUNCTION ───────────────────────────────────────────────
async function callContentAPI(input) {
  const res = await client.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 5000,
    system:     CONTENT_SYSTEM,
    messages: [{
      role:    "user",
      content: `Write 3 caption options (A/B/C) for each post. Apply human voice rules strictly.

Planning context:
${JSON.stringify(input.planning_summary || {}, null, 2)}

Posts to write:
${JSON.stringify(input.posts, null, 2)}

${input._retry ? `\nPREVIOUS ATTEMPT FAILED: ${input._retry}` : ""}`,
    }],
  });
  return res.content[0].text;
}

export async function runContentAgent(posts, planningSummary = {}) {
  console.log(`\n✍️  Content Agent — ${posts.length} posts × 3 options each`);

  // Run agent with retry/validate harness
  const rawPosts = await runSafe(
    (input) => callContentAPI(input),
    { posts, planning_summary: planningSummary },
    { name: "content", maxRetries: 2, log: true, fallback: [] }
  );

  if (!Array.isArray(rawPosts) || rawPosts.length === 0) {
    console.error("Content agent returned empty/invalid array");
    return [];
  }

  // Apply human voice filter to all options
  console.log(`\n🗣️  Human Voice Filter — scanning ${rawPosts.length} posts...`);
  const filtered = await Promise.all(rawPosts.map(post => filterPostOptions(post)));

  // Summary report
  let totalRewritten = 0;
  filtered.forEach(post => {
    post.options?.forEach(opt => {
      if (opt._filter?.caption_rewritten) totalRewritten++;
      const hs = opt._filter?.caption_human_score;
      const label = hs >= 8 ? "✅" : hs >= 5 ? "⚠️ " : "❌";
      console.log(
        `   ${label} ${post.post_id} Option ${opt.label}: ` +
        `human ${hs}/10 · hook ${opt.hook_score}/35`
      );
    });
  });

  if (totalRewritten > 0) {
    console.log(`   📝 Rewrote ${totalRewritten} caption(s) to remove AI language`);
  }

  return filtered;
}
