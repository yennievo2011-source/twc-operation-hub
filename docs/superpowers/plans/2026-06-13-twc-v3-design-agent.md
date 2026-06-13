# TWC Pipeline v3 — Design Agent + 3 Options + Human Voice + Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans hoặc subagent-driven-development. Steps dùng checkbox.

**Goal:** Nâng pipeline lên v3: Content sinh 3 options A/B/C, Design Agent sinh visual spec/option, humanVoiceFilter chống văn phong AI, Master Planner xuất 1 dashboard; Yên pick 1/3 trong Notion; dashboard read-only đẩy lên GitHub Pages (free).

**Architecture:** Giữ n8n + agent-service + Notion (1 DB) đã build. Thêm 4 module v3 vào `agent-service/lib/`, viết mới `designAgent.js` (đang thiếu trong update), reconcile signatures, mở rộng Notion (3 options + `chosen_option`), thêm renderer HTML → GitHub Pages.

**Tech:** Node/Express, @anthropic-ai/sdk, Notion API, GitHub Pages (main, đã bật), n8n.

**Spec gốc:** `docs/superpowers/specs/2026-06-12-twc-agent-pipeline-design.md`
**Live dashboard:** https://yennievo2011-source.github.io/twc-operation-hub/dashboard/

---

## Bối cảnh đã có (đừng làm lại)
- `agent-service/` chạy, 9/9 test, endpoint `/health /er-decision /generate /digest`
- Notion DB `47b1e8e3dbf94ce5bfc2ff6a23519af9` + 5 post W1 seeded
- `n8n-workflows/wf-pipeline.json`, `wf-morning.json`
- GitHub Pages public, serve main root

## Quyết định đã chốt
- Design Agent = **sinh spec** (Canva template id + Higgsfield model + image prompt + key text), **KHÔNG render**. Render là bước riêng (tay/Claude+MCP).
- Gate = Notion `chosen_option` (A/B/C). Dashboard HTML chỉ read-only.
- Model id giữ `claude-sonnet-4-20250514` theo update (không đổi trong scope này).

---

## Phase A — Đưa 4 module v3 vào agent-service

### Task A1: Copy + flatten import 3 module update
**Files:**
- Create: `agent-service/lib/humanVoiceFilter.js`, `agent-service/lib/contentAgent.js`, `agent-service/lib/masterPlannerAgent.js`

- [ ] **Step 1:** Copy 3 file từ update vào lib:
```bash
cd "/Users/yennievo/Documents/Claude/Projects/TWC social page/agent-service"
cp /tmp/twc_update/humanVoiceFilter.js lib/
cp /tmp/twc_update/contentAgent.js lib/
cp /tmp/twc_update/masterPlannerAgent.js lib/
```
- [ ] **Step 2:** Sửa import trong `lib/contentAgent.js` (bỏ subfolder):
```js
import { TWC_CONTEXT } from "./01_TWC_BRAND_CONTEXT.js";
import { runSafe } from "./02_GROUND_TRUTH.js";
import { filterPostOptions, detectAIScore } from "./humanVoiceFilter.js";
```
- [ ] **Step 3:** Sửa import trong `lib/masterPlannerAgent.js`:
```js
import { TWC_CONTEXT } from "./01_TWC_BRAND_CONTEXT.js";
import { runSafe, GT, applyAdRule } from "./02_GROUND_TRUTH.js";
import { detectAIScore } from "./humanVoiceFilter.js";
```
- [ ] **Step 4:** `node --check lib/humanVoiceFilter.js lib/contentAgent.js lib/masterPlannerAgent.js` → no error.
- [ ] **Step 5:** Commit `git add agent-service/lib && git commit -m "feat: add v3 content/master/humanVoice modules"`

### Task A2: Viết designAgent.js (đang THIẾU trong update)
**Files:**
- Create: `agent-service/lib/designAgent.js`
- Test: `agent-service/test/design.test.js`

Schema output **phải khớp** masterPlanner `mergeOptions()`: mỗi post `{ post_id, _failed, time_estimate:{total_min}, options:{A,B,C} }`, mỗi option có `canva_spec.source_template.design_id`, `canva_spec.slides[].designer_note`, `higgsfield.model`, `key_text`.

- [ ] **Step 1: Failing test**
```js
import { test } from "node:test";
import assert from "node:assert";
import { buildDesignSpec } from "../lib/designAgent.js";

test("design spec maps angle -> higgsfield model", () => {
  const post = { post_id: "A1", content_type: "Carousel", platform: "FB+IG",
    options: [ { label: "A", hook_angle: "contrast_data", hook_line: "Từ 45→12 phút", key_text_on_visual: "45→12" },
               { label: "B", hook_angle: "founder_story", hook_line: "Mình từng..." },
               { label: "C", hook_angle: "contrarian", hook_line: "Đừng mua ChatGPT" } ] };
  const spec = buildDesignSpec(post);
  assert.equal(spec.post_id, "A1");
  assert.equal(spec.options.A.higgsfield.model, "ms_image");
  assert.equal(spec.options.B.higgsfield.model, "nano_banana_pro");
  assert.ok(spec.options.A.canva_spec.source_template.design_id);
  assert.ok(spec.time_estimate.total_min > 0);
});
```
- [ ] **Step 2: Run → FAIL**
- [ ] **Step 3: Implement (rule-based core — rẻ, deterministic; KHÔNG gọi LLM)**
```js
// agent-service/lib/designAgent.js
// Sinh visual SPEC cho mỗi option (không render). Rule-based, no LLM.
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
        slides: [ { designer_note: `[${opt.hook_angle}] Headline: "${keyText}". Palette Indigo #050090 + Lime #C0F100. ${type}.` } ],
      },
      higgsfield: {
        model,
        prompt: `${opt.hook_angle} visual cho TWC. Text chính: "${keyText}". Tông Indigo/Lime, sạch, marketing-grade, no stock-photo feel.`,
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
```
- [ ] **Step 4: Run → PASS**
- [ ] **Step 5: Commit** `git commit -am "feat: designAgent.js (spec generator, rule-based)"`

### Task A3: Export planning + ads helpers từ 05_RUN
**Files:** Modify `agent-service/lib/05_RUN.js`

- [ ] **Step 1:** Thay nội dung `lib/05_RUN.js` bằng bản update (flatten imports về `./`), và **thêm `export`** trước `runPlanningAgent` và `runAdsAgent`. Sửa import design về `./designAgent.js`.
- [ ] **Step 2:** Guard main block giống cũ (`isDirectRun`) để không tự chạy khi import.
- [ ] **Step 3:** `node --check lib/05_RUN.js`
- [ ] **Step 4: Commit**

---

## Phase B — Cập nhật agent-service endpoints

### Task B1: `/generate` trả 3 options + design + ad copy
**Files:** Modify `agent-service/server.js`, `agent-service/test/generate.test.js`

Hợp đồng mới: input `{post}` → output `{post_id, options:[{label,caption,hook_score,human_score,visual:{template,model,key_text},ad}], recommended, design_minutes}`.

- [ ] **Step 1: Test 400 vẫn giữ** (post/post_id bắt buộc) — không đổi.
- [ ] **Step 2: Implement**
```js
import { runContentAgent } from "./lib/contentAgent.js";
import { runDesignAgentBatch } from "./lib/designAgent.js";
import { runAdsAgent } from "./lib/05_RUN.js";

app.post("/generate", async (req, res) => {
  const post = req.body?.post;
  if (!post || !post.post_id) return res.status(400).json({ error: "post (kèm post_id) bắt buộc" });
  try {
    const content = await runContentAgent([post], req.body?.planning_summary || {});
    const cp = (content || [])[0];
    if (!cp) return res.status(200).json({ _failed: true });
    const designs = await runDesignAgentBatch(content);
    const design = designs.find(d => d.post_id === cp.post_id);
    const hasBudget = post.ad_budget && post.ad_budget !== "none";
    const ads = hasBudget ? await runAdsAgent([cp]) : { ad_copies: [] };
    const adCopy = ads.ad_copies?.find(a => a.post_id === cp.post_id);

    const options = (cp.options || []).map(opt => ({
      label: opt.label,
      hook_angle: opt.hook_angle,
      hook_line: opt.hook_line,
      caption: opt.caption,
      hook_score: opt.hook_score,
      human_score: opt._filter?.caption_human_score ?? null,
      passes_threshold: opt.passes_threshold,
      visual: design?.options?.[opt.label]
        ? { template: design.options[opt.label].canva_spec.source_template.design_id,
            model: design.options[opt.label].higgsfield.model,
            key_text: design.options[opt.label].key_text,
            note: design.options[opt.label].canva_spec.slides[0].designer_note }
        : null,
      ad: adCopy?.[`variation_${opt.label.toLowerCase()}`] || null,
    }));
    res.json({
      post_id: cp.post_id,
      recommended: cp.recommended_option,
      recommended_reason: cp.recommended_reason,
      design_minutes: design?.time_estimate?.total_min || 0,
      options,
    });
  } catch (e) {
    res.status(200).json({ _failed: true, error: String(e) });
  }
});
```
- [ ] **Step 3: Run test** → 400 cases PASS.
- [ ] **Step 4: Smoke (cần API key)**: `curl ... /generate` → kỳ vọng `options` có 3 phần tử A/B/C.
- [ ] **Step 5: Commit**

### Task B2: `/digest` dùng runMasterPlanner v3 + trả dashboard
**Files:** Modify `server.js`, `test/digest.test.js`

- [ ] **Step 1: Test 400** (`posts[]` bắt buộc) giữ nguyên.
- [ ] **Step 2: Implement** — đổi sang object signature:
```js
import { runMasterPlanner } from "./lib/masterPlannerAgent.js";

app.post("/digest", async (req, res) => {
  const { posts, plan, designs, ads, erData, date } = req.body || {};
  if (!Array.isArray(posts)) return res.status(400).json({ error: "posts[] bắt buộc" });
  try {
    const dashboard = await runMasterPlanner({
      planOutput: plan || { campaign_phase: "ph1" },
      contentOutput: posts,
      designOutput: designs || [],
      adsOutput: ads || { ad_copies: [] },
      erData: erData || [],
    });
    res.json({ dashboard, briefing_text: dashboard?.briefing_text || "" });
  } catch (e) {
    res.status(200).json({ _failed: true, briefing_text: "Digest failed: " + String(e) });
  }
});
```
- [ ] **Step 3: Run test** → PASS.
- [ ] **Step 4: Commit**

---

## Phase C — Dashboard HTML → GitHub Pages (free)

### Task C1: Renderer dashboard JSON → HTML
**Files:** Create `agent-service/render-dashboard.js`, `agent-service/templates/dashboard.css` (inline cũng được)

- [ ] **Step 1:** Script đọc dashboard JSON (từ `/digest` hoặc file) → ghi `../dashboard/index.html` ở repo root. Dùng palette Indigo #050090 + Lime #C0F100. Sections: health, ad performance (worked/failed/next), options_to_review (3 cards/post với hook+human score, recommended highlight), today_actions, briefing_text. **Read-only**, không JS tương tác.
```js
// agent-service/render-dashboard.js
import fs from "fs";
import path from "path";
const data = JSON.parse(fs.readFileSync(process.argv[2] || "./output/latest-dashboard.json", "utf8"));
const d = data.dashboard || data;
const esc = s => String(s ?? "").replace(/[&<>]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;" }[c]));
// ... build html string (sections theo schema masterPlanner) ...
const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TWC Dashboard ${esc(d.report_date)}</title>
<style>:root{--ind:#050090;--lime:#c0f100}body{font-family:-apple-system,sans-serif;background:#f5f5f7;margin:0;padding:20px;color:#1b1b23}
.card{background:#fff;border-radius:12px;padding:16px;margin:12px 0;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.rec{border:2px solid var(--lime)}.h{color:var(--ind);font-weight:800}.muted{color:#6b7280;font-size:12px}</style></head>
<body><h1 class="h">🃏 TWC Dashboard — ${esc(d.report_date)} (${esc(d.phase_label||d.phase)})</h1>
<div class="card"><b>Health:</b> ${esc(d.health?.overall)} · B2B ${esc(d.health?.b2b?.status)} · B2C ${esc(d.health?.b2c?.status)}</div>
${(d.options_to_review||[]).map(p=>`<div class="card"><div class="h">${esc(p.post_id)} · ${esc(p.platform)}</div>
<div class="muted">Recommended: ${esc(p.recommended)} — ${esc(p.recommended_reason)}</div>
${(p.options||[]).map(o=>`<div class="card ${o.label===p.recommended?'rec':''}">[${esc(o.label)}] ${esc(o.hook_angle)} · hook ${esc(o.hook_score)}/35 · human ${esc(o.human_score)}/10<br>
<i>"${esc(o.hook_line)}"</i><div class="muted">${esc(o.visual_concept||'')}</div></div>`).join("")}</div>`).join("")}
<div class="card"><b>Briefing:</b><pre style="white-space:pre-wrap;font-family:inherit">${esc(d.briefing_text)}</pre></div>
<div class="muted">Cập nhật tự động · pick option trong Notion</div></body></html>`;
const out = path.resolve("../dashboard"); if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "index.html"), html);
console.log("Dashboard written: dashboard/index.html");
```
- [ ] **Step 2: Test render với dashboard mẫu**: tạo `output/latest-dashboard.json` giả 1 post 3 options → `node render-dashboard.js` → mở `dashboard/index.html` xem layout.
- [ ] **Step 3: Commit** (chưa push html)

### Task C2: Publish script → push GitHub Pages
**Files:** Create `agent-service/publish-dashboard.js`

- [ ] **Step 1:** Script: `node render-dashboard.js` rồi git add/commit/push `dashboard/` lên `main`.
```js
// agent-service/publish-dashboard.js
import { execSync } from "child_process";
const root = "/Users/yennievo/Documents/Claude/Projects/TWC social page";
execSync("node render-dashboard.js", { cwd: root + "/agent-service", stdio: "inherit" });
execSync('git add dashboard/index.html', { cwd: root });
try { execSync('git commit -m "chore: update dashboard"', { cwd: root, stdio: "inherit" }); } catch {}
execSync("git push origin HEAD:main", { cwd: root, stdio: "inherit" });
console.log("Live: https://yennievo2011-source.github.io/twc-operation-hub/dashboard/");
```
- [ ] **Step 2: Chạy thử** → kiểm tra trang live load sau ~1 phút.
- [ ] **Step 3: Commit**

> Lưu ý: dashboard đẩy lên **main** (đang là default + Pages source). Vì repo public, không tốn phí. Branch làm việc v3 merge sau qua PR; nhưng `dashboard/index.html` push thẳng main để Pages cập nhật ngay.

---

## Phase D — Mở rộng Notion cho 3 options + gate pick

### Task D1: Thêm field vào Notion DB
**Notion UI / MCP** — DB `47b1e8e3dbf94ce5bfc2ff6a23519af9`. Thêm:
- [ ] `options_json` (rich_text) — lưu full 3 options (caption + scores + visual) dạng JSON
- [ ] `recommended_option` (select: A, B, C)
- [ ] `chosen_option` (select: A, B, C) — **gate mới: Yên pick**
- [ ] `human_score` (number) — của option được chọn
- [ ] `dashboard_url` (url) — link Pages

Giữ nguyên `caption` (sau khi pick = caption của option đã chọn), `review_decision` (vẫn dùng Revise/Reject), `ad_copy_a/b`.

### Task D2: Logic gate mới
- Pending Review: row có `options_json` + `recommended_option`; email/dashboard cho Yên xem.
- Yên set `chosen_option = A|B|C` → coi như Approved. (Revise/Reject vẫn qua `review_decision`.)

---

## Phase E — Cập nhật n8n workflows

### Task E1: WF-Pipeline nhánh Draft → lưu 3 options
- [ ] Node "Lưu content": ghi `options_json` = `JSON.stringify($json.options)`, `recommended_option` = `$json.recommended`, set `Pending Review`. Email liệt kê 3 hook_line + recommended + link `dashboard_url`.

### Task E2: WF-Pipeline nhánh publish dùng chosen_option
- [ ] Trigger publish khi `chosen_option` không rỗng (thay vì `review_decision=Approved`).
- [ ] Node "Build publish": parse `options_json`, lấy option theo `chosen_option` → set `caption` = option.caption; dùng visual template/model của option đó cho bước đăng.

### Task E3: WF-Morning gọi /digest v3 + publish dashboard
- [ ] Sau ER decisions: gọi `/digest` (truyền posts + erData) → nhận `dashboard`.
- [ ] Ghi `dashboard` JSON ra file `agent-service/output/latest-dashboard.json` (qua agent-service ghi sẵn, hoặc HTTP rồi Execute Command).
- [ ] **Execute Command** node: `node agent-service/publish-dashboard.js` → đẩy Pages.
- [ ] Brevo email digest kèm link Pages.

---

## Phase F — Verify E2E
- [ ] `npm test` agent-service xanh.
- [ ] Smoke `/generate` → 3 options A/B/C có hook + human score + visual spec.
- [ ] `/digest` → dashboard JSON đủ sections.
- [ ] `publish-dashboard.js` → trang Pages live cập nhật.
- [ ] Notion: 1 row Draft → 3 options vào `options_json`, email tới, set `chosen_option=B` → publish dùng caption B.

---

## Tổng kết thay đổi vs v2
| | v2 đã build | v3 sau plan này |
|--|--|--|
| Content | 1 caption | 3 options A/B/C |
| Anti-AI voice | không | humanVoiceFilter (score /10) |
| Visual | manual brief | Design Agent sinh spec/option |
| Master | briefing text | dashboard 3 sections |
| Gate | review_decision Approved | chosen_option A/B/C |
| Hiển thị | email | + HTML dashboard GitHub Pages (free) |
