# TWC Agent Pipeline — RUNBOOK (vận hành & tracking)

Hướng dẫn setup phần UI (Notion + n8n) và cách Yên theo dõi công việc mỗi ngày.
Code đã xong ở `agent-service/`. Phần dưới là việc tay 1 lần để hệ thống chạy.

---

## A. Chạy agent-service (mỗi lần bật máy)

```bash
cd "agent-service"
# 1 lần: dán API key thật vào .env (thay sk-ant-xxx)
#   ANTHROPIC_API_KEY=sk-ant-...   PORT=8787
npm start
```
Kiểm tra: mở `http://localhost:8787/health` → thấy `{"ok":true}`.

**Smoke test 1 post thật (sau khi có key):**
```bash
curl -s -X POST localhost:8787/generate -H "Content-Type: application/json" \
  -d '{"post":{"post_id":"A1-B2C","audience":"b2c","platform":"FB+IG","ad_budget":"test $15","title":"AI workflow","hook_brief":"contrast"}}'
```
Kỳ vọng: JSON có `content.caption` + `content.hook_score`.

---

## B. Notion — tạo 1 database "TWC Content Pipeline"

### B1. Tạo database + properties
Tạo database mới, thêm đúng các cột (spec §4):

| Nhóm | Cột |
|------|-----|
| Input | `post_id`(Title), `date`(Date), `day`(Text), `audience`(Select: b2b/b2c), `platforms`(Multi: FB/IG/LinkedIn), `content_type`(Text), `series`(Text), `ad_budget`(Text), `ad_objective`(Select) |
| Lifecycle | `pipeline_status`(Select: Draft, Generating, Pending Review, Approved, Revise, Publishing, Published, Done) |
| Content | `hook_line`(Text), `hook_score`(Number), `passes_threshold`(Checkbox), `caption`(Text), `visual_brief`(Text), `visual_url`(URL) |
| Ads | `ad_copy_a`(Text), `ad_copy_b`(Text), `run_a_first`(Checkbox) |
| Human gate | `review_decision`(Select: Approved/Revise/Reject), `revise_feedback`(Text) |
| Publish | `publish_status`(Text), `url_fb`(URL), `url_ig`(URL), `url_li`(URL) |
| Tracking | `er_status`(Select: Pending/Checked/Boosted), `er_check_due`(Date), `er_fb`(Number), `er_ig`(Number), `er_li`(Number), `decision`(Select: Boost/Kill/Hold/Stop), `spend`(Number), `learning`(Text) |

### B2. Integration token
1. notion.so/my-integrations → **New integration** → copy `Internal Integration Secret`.
2. Mở database → ⋯ → **Connections** → add integration vừa tạo.
3. Copy `database_id` từ URL (đoạn 32 ký tự trước `?v=`).
4. Lưu token vào n8n Credentials (KHÔNG commit vào git).

### B3. Seed 5 posts W1
Thêm 5 rows từ `agent-service/lib/04_FIRST_5_POSTS.js`: P1-INTRO, A1-B2C, A1-B2C-V2, A2-B2B, C1-FOUNDER. Đặt `pipeline_status = Draft`.

### B4. Board view để tracking
Tạo **Board view** group theo `pipeline_status`. Đây là bảng Yên nhìn mỗi ngày.

---

## C. n8n — orchestrator (local)

### C1. Cài + chạy
```bash
npx n8n          # mở http://localhost:5678, tạo owner account
```

### C2. Credentials (Settings → Credentials) — KHÔNG hardcode
- Notion (internal token B2)
- Gmail OAuth2 (gửi email duyệt)
- HTTP Header Auth — Meta Graph token (+ page_id, ig_user_id)
- LinkedIn OAuth2 — scope `w_member_social`
- Brevo — API key (header `api-key`)
- LinkedIn Ads token (cho boost → Sponsored)

### C3. WF-Pipeline (poll 5 phút)
1. **Schedule Trigger** — mỗi 5 phút
2. **Notion Get Many** — filter `pipeline_status` ∈ {Draft, Approved, Revise}
3. **Switch** theo `pipeline_status`:
   - **Draft** → Notion Update `Generating` → **HTTP POST** `localhost:8787/generate` (timeout 120000ms, retry OFF) → Notion Update (caption, hook_score, ad_copy_a/b) + `Pending Review` → **Gmail**: tới Yên, subject `[Duyệt] {{post_id}} — hook {{hook_score}}/35`, body = caption + link Notion page.
   - **Approved** (chỉ khi `publish_status` trống) → Update `Publishing` → theo `platforms`: Meta Graph POST (FB+IG) ghi `url_fb/url_ig`; LinkedIn POST ghi `url_li` (bật **Continue On Fail** mỗi node để 1 platform fail không chặn cái kia) → set `er_check_due = now+48h`, `er_status=Pending`, `pipeline_status=Published`.
   - **Revise** → đọc `revise_feedback` → HTTP POST `/generate` kèm `revise_feedback` → update caption → `Pending Review`, xóa `review_decision`.
4. **Activate.**

> Idempotency: mỗi nhánh set status mới NGAY trước khi gọi API → lần poll sau không trúng lại.

### C4. WF-Morning (daily 9AM — ER trước, digest sau)
1. **Schedule Trigger** 09:00
2. **Notion Get Many** — filter `er_check_due` ≤ now AND `er_status = Pending`
3. **Loop** từng post:
   - FB/IG: HTTP Meta Graph lấy reactions+comments+shares ÷ reach → ghi `er_fb/er_ig`
   - LinkedIn organic: đọc `er_li` (Yên nhập tay); nếu trống → đánh dấu nhắc trong digest
   - HTTP POST `/er-decision` → ghi `decision`, `learning`; BOOST → tạo Sponsored (Ads API) + `er_status=Boosted`, else `Checked`
4. Gom posts → **HTTP POST** `/digest` → **Brevo** gửi email 9AM cho Yên
5. **Activate.**

---

## D. Vận hành hằng tuần

**Đầu mỗi tuần** (tay):
```bash
cd agent-service
node plan-week.js "W2 Jun 20-26 Soft Launch"
```
→ review `output/week-plan.json` → copy rows vào Notion (`pipeline_status=Draft`).

---

## E. Tracking công việc — Yên làm gì mỗi ngày

**3 việc duy nhất của con người:**

1. **Duyệt nội dung** — khi có email `[Duyệt] ...`:
   - Mở link Notion → đọc caption + ad copy
   - **OK** → set `review_decision = Approved` (→ tự đăng trong ≤5')
   - **Sửa** → set `review_decision = Revise` + ghi `revise_feedback` (→ AI viết lại)
   - Trước khi Approved: dán link Canva vào `visual_url` (visual làm tay)

2. **Nhập ER LinkedIn** — digest 9AM nhắc post nào cần:
   - Mở LinkedIn → xem impressions/reactions/comments của post → tính ER → nhập `er_li`
   - (FB/IG tự động, không cần đụng)

3. **Duyệt quyết định ads** — digest liệt kê Boost/Kill cần OK.

**Bảng theo dõi nhanh (Notion Board view):**
- Cột `Pending Review` = việc cần duyệt ngay
- Cột `Published` + `er_status=Pending` = đang chờ 48h
- `decision` = Boost/Kill đã chạy

**Khi tắt máy:** automation dừng (state nằm ở Notion, không mất). Bật lại + `npm start` + n8n active là chạy tiếp.

---

## F. Trạng thái hiện tại (12 Jun 2026)

| Phần | Trạng thái |
|------|-----------|
| agent-service code (4 endpoint + planning CLI) | ✅ Xong, 9/9 test pass |
| Smoke test LLM endpoints | ⏳ Cần dán API key thật vào `.env` |
| Notion database | ⏳ Việc tay (mục B) |
| n8n 2 workflows | ⏳ Việc tay (mục C) |
| E2E dry run | ⏳ Sau khi B+C xong |
