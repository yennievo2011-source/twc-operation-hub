// ═══════════════════════════════════════════════════════════════════
// agents/designAgent.js — Visual SPEC generator (KHÔNG render)
// Sinh spec cho mỗi option: Canva template + Higgsfield model + prompt.
// Rule-based, deterministic, không gọi LLM (rẻ + ổn định).
// Output schema khớp masterPlannerAgent.mergeOptions().
// ═══════════════════════════════════════════════════════════════════

const MODEL_BY_ANGLE = {
  contrast_data: "ms_image",
  founder_story: "nano_banana_pro",
  contrarian:    "ms_image",
};

const TEMPLATE_BY_TYPE = {
  "Carousel":     "DAHLmd0XPi0",
  "Single image": "DAHLmA_lOs4",
  "Reel":         "marketing_studio_video",
  "Text post":    "none",
  "Document":     "DAHLmd0XPi0",
};

const MIN_BY_TYPE = { "Carousel": 25, "Single image": 10, "Reel": 30, "Text post": 3, "Document": 20 };

export function buildDesignSpec(post) {
  const type = post.content_type || "Single image";
  const tmpl = TEMPLATE_BY_TYPE[type] || "DAHLmA_lOs4";
  const options = {};

  (post.options || []).forEach((opt) => {
    const model = MODEL_BY_ANGLE[opt.hook_angle] || "ms_image";
    const keyText = opt.key_text_on_visual || opt.hook_line?.slice(0, 24) || "";
    options[opt.label] = {
      canva_spec: {
        source_template: { design_id: tmpl },
        slides: [
          { designer_note: `[${opt.hook_angle}] Headline: "${keyText}". Palette Indigo #050090 + Lime #C0F100. Format ${type}.` },
        ],
      },
      higgsfield: {
        model,
        prompt: `${opt.hook_angle} visual cho TWC. Text chính: "${keyText}". Tông Indigo/Lime, sạch, marketing-grade, không cảm giác stock-photo.`,
      },
      key_text: keyText,
    };
  });

  return {
    post_id: post.post_id,
    _failed: false,
    time_estimate: { total_min: MIN_BY_TYPE[type] || 10 },
    options,
  };
}

export async function runDesignAgentBatch(contentPosts) {
  if (!Array.isArray(contentPosts)) return [];
  return contentPosts.map(buildDesignSpec);
}
