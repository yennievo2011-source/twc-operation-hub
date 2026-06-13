import { test } from "node:test";
import assert from "node:assert";
import { buildDesignSpec, runDesignAgentBatch } from "../lib/designAgent.js";

test("design spec maps angle -> higgsfield model", () => {
  const post = {
    post_id: "A1", content_type: "Carousel", platform: "FB+IG",
    options: [
      { label: "A", hook_angle: "contrast_data", hook_line: "Từ 45→12 phút", key_text_on_visual: "45→12" },
      { label: "B", hook_angle: "founder_story", hook_line: "Mình từng..." },
      { label: "C", hook_angle: "contrarian", hook_line: "Đừng mua ChatGPT" },
    ],
  };
  const spec = buildDesignSpec(post);
  assert.equal(spec.post_id, "A1");
  assert.equal(spec._failed, false);
  assert.equal(spec.options.A.higgsfield.model, "ms_image");
  assert.equal(spec.options.B.higgsfield.model, "nano_banana_pro");
  assert.equal(spec.options.C.higgsfield.model, "ms_image");
  assert.ok(spec.options.A.canva_spec.source_template.design_id);
  assert.ok(spec.options.A.canva_spec.slides[0].designer_note.includes("45→12"));
  assert.ok(spec.time_estimate.total_min > 0);
});

test("batch returns array keyed by post_id", async () => {
  const out = await runDesignAgentBatch([
    { post_id: "X", content_type: "Reel", options: [{ label: "A", hook_angle: "contrarian" }] },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].post_id, "X");
  assert.equal(out[0].time_estimate.total_min, 30);
});
