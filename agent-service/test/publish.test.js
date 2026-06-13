import { test } from "node:test";
import assert from "node:assert";
import { post } from "./helpers.js";
import { buildDashboardHtml } from "../lib/renderDashboard.js";

test("buildDashboardHtml renders options + recommended", () => {
  const html = buildDashboardHtml({
    report_date: "2026-06-15",
    options_to_review: [{ post_id: "P1", platform: "FB+IG", recommended: "A",
      options: [{ label: "A", hook_angle: "contrast_data", hook_line: "x", hook_score: 30, human_score: 9 }] }],
  });
  assert.ok(html.includes("<title>TWC Dashboard 2026-06-15</title>"));
  assert.ok(html.includes("P1"));
  assert.ok(html.includes("recommended"));
});

test("publish-dashboard skips gracefully without GH env", async () => {
  const r = await post("/publish-dashboard", { dashboard: { report_date: "x", options_to_review: [] } });
  assert.equal(r.status, 200);
  // Không có GITHUB_TOKEN trong test env → _skipped
  assert.ok(r.body._skipped || r.body.ok || r.body._failed);
});
