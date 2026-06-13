# TWC Marketing Agent Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bán-tự-động hóa social pipeline: Notion → AI caption+ad copy → email duyệt → auto-post FB/IG/LinkedIn → 48h ER check → rule engine boost/kill → digest 9AM.

**Architecture:** n8n local làm orchestrator; Node.js Express service wrap files.zip (3 endpoint) làm AI engine; Notion 1 database làm state store; Gmail duyệt; Brevo digest.

**Tech Stack:** n8n (local), Node.js 20 + Express, @anthropic-ai/sdk, Notion API, Meta Graph API, LinkedIn API, Brevo API.

**Spec:** `docs/superpowers/specs/2026-06-12-twc-agent-pipeline-design.md`

---

## Phase 0 — Project skeleton

### Task 0: Scaffold agent service from files.zip

**Files:**
- Create: `agent-service/` (copy 5 JS từ files.zip vào subfolder `lib/`)
- Create: `agent-service/package.json`
- Create: `agent-service/.env.example`
- Create: `agent-service/.gitignore`

- [ ] **Step 1: Tạo folder + copy files.zip**

```bash
cd "/Users/yennievo/Documents/Claude/Projects/TWC social page"
mkdir -p agent-service/lib agent-service/test
unzip -o ~/Downloads/files.zip -d /tmp/twc_src/
cp /tmp/twc_src/0*.js agent-service/lib/
```

- [ ] **Step 2: Sửa import path trong lib (05 tham chiếu ./prompts ./harness ./posts — flatten về ./)**

Trong `agent-service/lib/05_RUN.js` sửa 3 dòng import thành cùng cấp:
```js
import { PLANNING_PROMPT, CONTENT_PROMPT, ADS_PROMPT, MASTER_PROMPT } from "./03_AGENT_PROMPTS.js";
import { runSafe, applyAdRule, GT } from "./02_GROUND_TRUTH.js";
import { FIRST_5_POSTS, W1_BRIEF } from "./04_FIRST_5_POSTS.js";
```

- [ ] **Step 3: package.json**

```json
{
  "name": "twc-agent-service",
  "type": "module",
  "version": "1.0.0",
  "scripts": { "start": "node server.js", "test": "node --test test/" },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "express": "^4.19.0"
  }
}
```

- [ ] **Step 4: .env.example + .gitignore**

`.env.example`:
```
ANTHROPIC_API_KEY=sk-ant-xxx
PORT=8787
```
`.gitignore`:
```
node_modules/
.env
output/
```

- [ ] **Step 5: Install + commit**

```bash
cd agent-service && cp .env.example .env && npm install
git add agent-service/ && git commit -m "chore: scaffold agent service from files.zip"
```

---

## Phase 1 — Agent Service endpoints (TDD)

### Task 1: `/health` endpoint

**Files:**
- Create: `agent-service/server.js`
- Test: `agent-service/test/health.test.js`

- [ ] **Step 1: Failing test**

```js
import { test } from "node:test";
import assert from "node:assert";
import { app } from "../server.js";
import http from "node:http";

function get(path) {
  return new Promise((resolve) => {
    const srv = app.listen(0, () => {
      const port = srv.address().port;
      http.get(`http://localhost:${port}${path}`, (res) => {
        let body = ""; res.on("data", c => body += c);
        res.on("end", () => { srv.close(); resolve({ status: res.statusCode, body: JSON.parse(body) }); });
      });
    });
  });
}

test("health returns ok", async () => {
  const r = await get("/health");
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
});
```

- [ ] **Step 2: Run → FAIL** `cd agent-service && npm test` — Expected: cannot find `../server.js`

- [ ] **Step 3: Minimal server.js**

```js
import express from "express";
export const app = express();
app.use(express.json({ limit: "1mb" }));
app.get("/health", (_req, res) => res.json({ ok: true }));

if (process.env.NODE_ENV !== "test") {
  const port = process.env.PORT || 8787;
  app.listen(port, () => console.log(`agent-service on :${port}`));
}
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: agent service /health"`

---

### Task 2: `/er-decision` endpoint (rule engine — no LLM, fully testable)

**Files:**
- Modify: `agent-service/server.js`
- Test: `agent-service/test/er-decision.test.js`

- [ ] **Step 1: Failing tests (3 rule cases từ spec)**

```js
import { test } from "node:test";
import assert from "node:assert";
import { app } from "../server.js";
import http from "node:http";

function post(path, payload) {
  return new Promise((resolve) => {
    const srv = app.listen(0, () => {
      const port = srv.address().port;
      const data = JSON.stringify(payload);
      const req = http.request({ host: "localhost", port, path, method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": data.length } },
        (res) => { let b=""; res.on("data",c=>b+=c); res.on("end",()=>{srv.close();resolve({status:res.statusCode,body:JSON.parse(b)});}); });
      req.write(data); req.end();
    });
  });
}

test("FB ER 6.5% -> BOOST", async () => {
  const r = await post("/er-decision", { post_id:"A1", platform:"FB+IG", er:6.5, budget:15 });
  assert.equal(r.body.decision, "BOOST");
});
test("LinkedIn ER 1.5% -> STOP", async () => {
  const r = await post("/er-decision", { post_id:"A2", platform:"LinkedIn", er:1.5, budget:10 });
  assert.equal(r.body.decision, "STOP");
});
test("FB ER 2.1% -> KILL", async () => {
  const r = await post("/er-decision", { post_id:"A3", platform:"FB+IG", er:2.1, budget:15 });
  assert.equal(r.body.decision, "KILL");
});
```

- [ ] **Step 2: Run → FAIL** (404 / no route)

- [ ] **Step 3: Implement — gọi `applyAdRule` từ lib (deterministic, không qua LLM)**

Thêm vào `server.js`:
```js
import { applyAdRule } from "./lib/02_GROUND_TRUTH.js";

app.post("/er-decision", (req, res) => {
  const { post_id, platform, er, budget } = req.body || {};
  if (post_id == null || er == null || !platform) {
    return res.status(400).json({ error: "post_id, platform, er required" });
  }
  const result = applyAdRule(post_id, Number(er), platform, Number(budget) || 15);
  res.json(result);
});
```

- [ ] **Step 4: Run → PASS** (nếu field name của `applyAdRule` khác `decision`, đọc `lib/02_GROUND_TRUTH.js` và map cho khớp test trước khi sửa test)

- [ ] **Step 5: Commit** `git commit -am "feat: /er-decision rule engine endpoint"`

---

### Task 3: `/generate` endpoint (Content + Ads, LLM)

**Files:**
- Modify: `agent-service/server.js`
- Test: `agent-service/test/generate.test.js`

- [ ] **Step 1: Failing test (validate shape + 400 khi thiếu post)**

```js
// ... reuse post() helper ...
test("generate requires post body", async () => {
  const r = await post("/generate", {});
  assert.equal(r.status, 400);
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement — wrap runContentAgent + runAdsAgent từ lib/05_RUN.js**

Export 2 hàm đó trong `lib/05_RUN.js` (đã `export` sẵn `runContentAgent`, `runAdsAgent`). Thêm route:
```js
import { runContentAgent, runAdsAgent } from "./lib/05_RUN.js";

app.post("/generate", async (req, res) => {
  const post = req.body?.post;
  if (!post || !post.post_id) return res.status(400).json({ error: "post required" });
  try {
    const content = await runContentAgent({ post }, [post]);
    const posts = Array.isArray(content) ? content : [content];
    const ads = post.ad_budget && post.ad_budget !== "none"
      ? await runAdsAgent(posts) : { ad_copies: [] };
    res.json({ content: posts[0], ads: ads.ad_copies?.[0] || null });
  } catch (e) {
    res.status(200).json({ _failed: true, error: String(e), content: null, ads: null });
  }
});
```

- [ ] **Step 4: Run → PASS** (400 test passes không cần API key)

- [ ] **Step 5: Manual smoke với API key thật**

```bash
curl -s -X POST localhost:8787/generate -H "Content-Type: application/json" \
  -d '{"post":{"post_id":"A1-B2C","audience":"b2c","platform":"FB+IG","ad_budget":"test $15","title":"AI workflow","hook_brief":"contrast"}}' | head -40
```
Expected: JSON có `content.caption` và `content.hook_score`.

- [ ] **Step 6: Commit** `git commit -am "feat: /generate content+ads endpoint"`

---

### Task 4: `/digest` endpoint

**Files:**
- Modify: `agent-service/server.js`
- Test: `agent-service/test/digest.test.js`

- [ ] **Step 1: Failing test**

```js
test("digest requires posts array", async () => {
  const r = await post("/digest", {});
  assert.equal(r.status, 400);
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement — wrap runMasterPlanner**

```js
import { runMasterPlanner } from "./lib/05_RUN.js";
app.post("/digest", async (req, res) => {
  const { posts, date } = req.body || {};
  if (!Array.isArray(posts)) return res.status(400).json({ error: "posts[] required" });
  try {
    const out = await runMasterPlanner({ date }, posts, {});
    res.json({ briefing_text: out.briefing_text || "" });
  } catch (e) { res.status(200).json({ _failed: true, briefing_text: "Digest failed: " + e }); }
});
```

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit** `git commit -am "feat: /digest endpoint"`

---

## Phase 2 — Notion database

### Task 5: Tạo Notion "Content Pipeline" database

**Không phải code — làm trong Notion UI hoặc qua MCP.** Một database, các field theo spec §4.

- [ ] **Step 1: Tạo database** tên "TWC Content Pipeline" trong workspace Yên.

- [ ] **Step 2: Thêm properties** (copy y nguyên spec §4): `post_id`(Title), `date`, `day`, `audience`(Select b2b/b2c), `platforms`(Multi: FB/IG/LinkedIn), `content_type`, `series`, `ad_budget`, `ad_objective`, `pipeline_status`(Select: Draft/Generating/Pending Review/Approved/Revise/Publishing/Published/Done), `hook_line`, `hook_score`(Number), `passes_threshold`(Checkbox), `caption`, `visual_brief`, `visual_url`(URL), `ad_copy_a`, `ad_copy_b`, `run_a_first`(Checkbox), `review_decision`(Select), `revise_feedback`, `publish_status`, `url_fb`, `url_ig`, `url_li`, `er_status`(Select: Pending/Checked/Boosted), `er_check_due`(Date), `er_fb`(Number), `er_ig`(Number), `er_li`(Number), `decision`(Select: Boost/Kill/Hold/Stop), `spend`(Number), `learning`.

- [ ] **Step 3: Seed 5 posts W1** từ `04_FIRST_5_POSTS.js` (P1-INTRO, A1-B2C, A1-B2C-V2, A2-B2B, C1-FOUNDER) với `pipeline_status=Draft`.

- [ ] **Step 4: Lấy `database_id`** (từ URL Notion) → lưu cho n8n. Tạo internal integration token, share database với integration.

- [ ] **Step 5: Ghi lại** database_id + token vào `docs/superpowers/RUNBOOK.md` (file mới, gitignore nếu chứa secret — chỉ ghi tên field, KHÔNG ghi token vào git).

---

## Phase 3 — n8n workflows

### Task 6: Cài n8n local + credentials

- [ ] **Step 1: Cài & chạy**
```bash
npx n8n
```
Mở `http://localhost:5678`, tạo owner account.

- [ ] **Step 2: Thêm Credentials** (Settings → Credentials): Notion (internal token), Gmail OAuth2, HTTP Header Auth cho Meta Graph (token), LinkedIn OAuth2 (`w_member_social`), Brevo (API key header), LinkedIn Ads token. KHÔNG hardcode trong node.

- [ ] **Step 3: Chạy agent-service song song** `cd agent-service && npm start` (port 8787). Test n8n → service: HTTP Request node GET `http://localhost:8787/health`.

### Task 7: WF-Pipeline (poll 5 phút, Switch theo pipeline_status)

- [ ] **Step 1:** Schedule Trigger mỗi 5 phút.
- [ ] **Step 2:** Notion "Get Many" — filter `pipeline_status` is one of `Draft, Approved, Revise`.
- [ ] **Step 3:** Switch node theo `pipeline_status`.
- [ ] **Step 4 — nhánh Draft:** Notion Update → `Generating` (ngay, idempotency) → HTTP POST `localhost:8787/generate` (timeout 120s, retry off) → Notion Update (caption, hook_score, ad_copy_a/b) → `Pending Review` → Gmail: gửi Yên, subject `[Duyệt] {post_id} — hook {hook_score}/35`, body có caption + link Notion page.
- [ ] **Step 5 — nhánh Approved:** chỉ khi `publish_status` trống. Update → `Publishing`. Theo `platforms`: Meta Graph POST (FB page + IG) ghi `url_fb/url_ig`; LinkedIn POST ghi `url_li`. Mỗi platform ghi kết quả riêng vào `publish_status` JSON. Set `er_check_due = now+48h`, `er_status=Pending`, `pipeline_status=Published`. Dùng "Continue On Fail" để 1 platform fail không chặn cái kia.
- [ ] **Step 6 — nhánh Revise:** đọc `revise_feedback` → POST `/generate` kèm feedback → cập nhật caption → `Pending Review`, xóa `review_decision`.
- [ ] **Step 7:** Activate workflow. Test: đổi 1 row sang Draft → đợi ≤5 phút → kiểm tra email + Notion.

### Task 8: WF-Morning (daily 9AM, tuần tự: ER-check → digest)

- [ ] **Step 1:** Schedule Trigger 09:00 hằng ngày.
- [ ] **Step 2:** Notion Get Many — filter `er_check_due <= now` AND `er_status = Pending`.
- [ ] **Step 3:** Loop từng post. FB/IG: HTTP Meta Graph lấy reactions+comments+shares / reach → tính ER → ghi `er_fb/er_ig`.
- [ ] **Step 4:** LinkedIn organic: đọc `er_li` (Yên nhập tay). Nếu trống → set flag `li_er_missing` để digest nhắc.
- [ ] **Step 5:** HTTP POST `/er-decision` mỗi post → ghi `decision`, `learning`. BOOST → tạo Sponsored Content (LinkedIn Ads API / Meta boost), set `er_status=Boosted`; else `Checked`.
- [ ] **Step 6:** Gom posts hôm nay → HTTP POST `/digest` → Brevo gửi email Yên (winners, losers, LinkedIn ER cần nhập, quyết định cần Yên).
- [ ] **Step 7:** Activate. Test bằng cách set 1 post `er_check_due` = hôm qua, chạy manual.

---

## Phase 4 — Planning batch tool (tay, 1 lần/tuần)

### Task 9: CLI bootstrap calendar

**Files:**
- Create: `agent-service/plan-week.js`

- [ ] **Step 1:** Script gọi `runPlanningAgent(brief)` từ lib → in JSON content_plan ra console + ghi `output/week-plan.json`.
```js
import { runPlanningAgent } from "./lib/05_RUN.js";
const brief = process.argv[2] || "W1 Jun 15-19 Pre-Launch A/B test";
const plan = await runPlanningAgent(brief);
console.log(JSON.stringify(plan.content_plan, null, 2));
```
- [ ] **Step 2:** Chạy `node plan-week.js "W2 Jun 20-26 Soft Launch"` → Yên copy rows vào Notion (hoặc Task 10 tự push).
- [ ] **Step 3:** Commit.

### Task 10 (optional): Auto-push plan rows vào Notion
- [ ] Thêm Notion create-page loop trong `plan-week.js` để tạo thẳng rows `pipeline_status=Draft`. Skip nếu Yên muốn review thủ công trước.

---

## Phase 5 — End-to-end verification

### Task 11: Dry run toàn pipeline với 1 post thật
- [ ] **Step 1:** agent-service chạy, n8n active 2 workflow.
- [ ] **Step 2:** Tạo 1 row Draft (FB/IG, ad_budget test $15).
- [ ] **Step 3:** Xác nhận: email duyệt đến (≤5'), caption hợp lý, hook_score ghi đúng.
- [ ] **Step 4:** Set `review_decision=Approved` → xác nhận post lên FB/IG, `url_*` + `er_check_due` ghi.
- [ ] **Step 5:** Set `er_check_due`=hôm qua, nhập `er_fb`=6.5 → chạy WF-Morning manual → xác nhận `decision=Boost`, digest email đến.
- [ ] **Step 6:** Test Revise: set `review_decision=Revise` + feedback → caption được viết lại.
- [ ] **Step 7:** Ghi kết quả vào `docs/superpowers/RUNBOOK.md`.

---

## Tracking công việc (cho Yên)

**Mỗi ngày 9AM:** mở email Brevo digest → xem 3 thứ: (1) post nào cần duyệt, (2) LinkedIn ER nào cần nhập tay, (3) quyết định boost/kill nào cần OK.

**Notion board view** theo `pipeline_status`: kéo nhìn post đang ở đâu (Draft→Done). Filter `review_decision is empty AND pipeline_status=Pending Review` = việc cần duyệt ngay.

**Khi tắt máy:** automation dừng. Bật lại máy + `npm start` + n8n active là tiếp tục (state nằm ở Notion, không mất).
