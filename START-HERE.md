# 🃏 TWC Agent Pipeline — Hướng dẫn chạy thử (làm theo thứ tự)

File này dẫn bạn từ số 0 → chạy thử được 1 post thật. Làm tuần tự, tích ✅ từng ô.
Tham chiếu chi tiết: `docs/superpowers/RUNBOOK.md`.

> **Mẹo:** làm xong PHẦN 1–2 (15 phút) là test được agent AI ngay, chưa cần Notion/n8n.
> PHẦN 3–5 là phần tự động hóa đầy đủ, làm sau cũng được.

---

## PHẦN 1 — Chạy agent-service (10 phút)

### [ ] 1.1 — Lấy Anthropic API key
1. Vào https://console.anthropic.com → **API Keys** → **Create Key**
2. Copy key (dạng `sk-ant-...`)

### [ ] 1.2 — Dán key vào .env
Mở file `agent-service/.env` bằng editor, sửa dòng đầu:
```
ANTHROPIC_API_KEY=sk-ant-...(key thật của bạn)
PORT=8787
```

### [ ] 1.3 — Chạy service
Mở Terminal:
```bash
cd "/Users/yennievo/Documents/Claude/Projects/TWC social page/agent-service"
npm start
```
Thấy dòng `🃏 agent-service đang chạy: http://localhost:8787` là OK.
**Để cửa sổ Terminal này chạy nền, mở Terminal MỚI cho bước sau.**

### [ ] 1.4 — Test khỏe
Terminal mới:
```bash
curl -s localhost:8787/health
```
Kỳ vọng: `{"ok":true}`

### [ ] 1.5 — Test rule engine (boost/kill — không tốn tiền AI)
```bash
curl -s -X POST localhost:8787/er-decision -H "Content-Type: application/json" \
  -d '{"post_id":"TEST","platform":"FB+IG","er":6.5,"budget":15}'
```
Kỳ vọng: `"decision":"BOOST"`. Thử `"er":2.1` → `"KILL"`.

---

## PHẦN 2 — Test agent AI viết bài thật (5 phút, tốn ~vài cent)

### [ ] 2.1 — Generate 1 post
```bash
curl -s -X POST localhost:8787/generate -H "Content-Type: application/json" \
  -d '{"post":{"post_id":"A1-B2C","audience":"b2c","platform":"FB+IG","ad_budget":"test $15","title":"AI workflow cho marketer","hook_brief":"contrast số liệu"}}'
```
Kỳ vọng: JSON có `content.caption`, `content.hook_score` (0–35), và `ads` (A/B copy).
👉 Nếu ra caption hợp lý = **bộ não AI đã chạy đúng.** Đây là trái tim hệ thống.

### [ ] 2.2 — Test lên plan cả tuần
```bash
node plan-week.js "W1 Jun 15-19 2026 — Pre-Launch A/B Test"
```
Kỳ vọng: in ra ~6 posts + lưu `output/week-plan.json`. File này = nội dung để seed vào Notion.

> ✋ **Dừng ở đây nếu bạn chỉ muốn test agent.** PHẦN 3–5 là tự động hóa đầy đủ.

---

## PHẦN 3 — Notion database (20 phút)

### [ ] 3.1 — Tạo database
Trong Notion, tạo page mới → gõ `/database` → **Table - Full page** → đặt tên **TWC Content Pipeline**.

### [ ] 3.2 — Thêm các cột
Thêm đúng các property dưới (xóa cột mặc định thừa). Đây là danh sách rút gọn — chi tiết kiểu dữ liệu xem RUNBOOK §B1:

`post_id`(Title) · `date`(Date) · `audience`(Select: b2b, b2c) · `platforms`(Multi: FB, IG, LinkedIn) · `ad_budget`(Text) · `pipeline_status`(Select: Draft, Generating, Pending Review, Approved, Revise, Publishing, Published, Done) · `hook_line` · `hook_score`(Number) · `caption` · `visual_brief` · `visual_url`(URL) · `ad_copy_a` · `ad_copy_b` · `review_decision`(Select: Approved, Revise, Reject) · `revise_feedback` · `publish_status` · `url_fb`(URL) · `url_ig`(URL) · `url_li`(URL) · `er_status`(Select: Pending, Checked, Boosted) · `er_check_due`(Date) · `er_fb`(Number) · `er_ig`(Number) · `er_li`(Number) · `decision`(Select: Boost, Kill, Hold, Stop) · `spend`(Number) · `learning`

### [ ] 3.3 — Tạo integration token
1. https://www.notion.so/my-integrations → **New integration** → đặt tên "TWC n8n" → Submit
2. Copy **Internal Integration Secret** (dạng `ntn_...` hoặc `secret_...`) → lưu tạm vào ghi chú
3. Quay lại database → nút **⋯** góc phải → **Connections** → chọn "TWC n8n"
4. Copy **database_id**: từ URL `notion.so/xxxxx?v=...` → đoạn `xxxxx` 32 ký tự trước `?v=`

### [ ] 3.4 — Seed 5 post W1
Thêm 5 rows, `pipeline_status = Draft`:
| post_id | audience | platforms | ad_budget |
|---------|----------|-----------|-----------|
| P1-INTRO | b2c | FB, IG | none |
| A1-B2C | b2c | FB, IG | test $15 |
| A1-B2C-V2 | b2c | FB, IG | test $15 |
| A2-B2B | b2b | LinkedIn | test $10 |
| C1-FOUNDER | b2c | FB, IG | none |

### [ ] 3.5 — Tạo Board view để theo dõi
Đổi sang **Board view**, group theo `pipeline_status`. Đây là bảng bạn nhìn mỗi ngày.

---

## PHẦN 4 — Lấy token các kênh (30–45 phút, phần khó nhất)

Lấy trước, sẽ dán vào n8n ở PHẦN 5. Cái nào chưa lấy được thì bỏ qua, test kênh còn lại trước.

### [ ] 4.1 — Gmail (gửi email duyệt) — DỄ
n8n có sẵn node Gmail OAuth, chỉ cần đăng nhập Google khi tạo credential ở PHẦN 5. Không cần lấy gì trước.

### [ ] 4.2 — Brevo (email digest) — DỄ
https://app.brevo.com → **SMTP & API** → **API Keys** → tạo key → copy.

### [ ] 4.3 — Meta Graph (đăng FB/IG + đọc ER) — TRUNG BÌNH
1. https://developers.facebook.com → tạo App (type Business)
2. Add product **Facebook Login** + **Instagram Graph API**
3. Graph API Explorer → lấy **Page Access Token** (long-lived) với quyền:
   `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`
4. Lưu: `page_access_token`, `page_id`, `ig_user_id`
> Lần đầu Meta App ở chế độ Dev — đủ để đăng lên page của chính bạn. Muốn scale cần App Review (làm sau).

### [ ] 4.4 — LinkedIn (đăng bài) — TRUNG BÌNH
1. https://www.linkedin.com/developers → Create App (gắn với 1 Company Page)
2. Request product **Share on LinkedIn** + **Sign In with LinkedIn**
3. Scope cần: `w_member_social` (đăng bài cá nhân)
4. Lấy OAuth access token + `person_id` (URN dạng `urn:li:person:xxxx`)
> Nhắc lại: ER organic LinkedIn KHÔNG đọc được qua API → bạn nhập tay sau 48h. Đây là giới hạn của LinkedIn.

---

## PHẦN 5 — n8n workflows (45 phút)

### [ ] 5.1 — Cài & chạy n8n
Terminal mới:
```bash
npx n8n
```
Mở http://localhost:5678 → tạo tài khoản owner (local, miễn phí).

### [ ] 5.2 — Nhập Credentials
Settings → **Credentials** → New, tạo từng cái với token đã lấy ở PHẦN 4:
- Notion API (token + đã share database)
- Gmail OAuth2 (đăng nhập Google)
- Brevo (HTTP Header Auth: header `api-key` = key Brevo)
- Meta Graph (HTTP Header Auth hoặc query token)
- LinkedIn OAuth2

### [ ] 5.3 — Test n8n gọi được agent-service
Tạo workflow tạm: **Manual Trigger** → **HTTP Request** GET `http://localhost:8787/health` → Execute.
Kỳ vọng: trả `{"ok":true}`. (agent-service ở PHẦN 1 phải đang chạy.)

### [ ] 5.4 — Dựng WF-Pipeline
Theo RUNBOOK §C3 (Schedule 5' → Notion Get Many → Switch theo `pipeline_status` → 3 nhánh Draft/Approved/Revise). **Activate.**

### [ ] 5.5 — Dựng WF-Morning
Theo RUNBOOK §C4 (Schedule 9AM → ER check → `/er-decision` → `/digest` → Brevo). **Activate.**

---

## PHẦN 6 — Chạy thử End-to-End (test toàn pipeline)

### [ ] 6.1 — Đảm bảo đang chạy
- Terminal 1: `agent-service` (`npm start`)
- Terminal 2: `n8n` (`npx n8n`), 2 workflow đã Activate

### [ ] 6.2 — Test luồng tạo nội dung
1. Vào Notion, sửa row **A1-B2C** → `pipeline_status = Draft` (nếu chưa)
2. Đợi ≤ 5 phút (hoặc bấm Execute WF-Pipeline thủ công)
3. ✅ Kiểm tra: row có `caption`, `hook_score`, `ad_copy_a/b` được điền + status `Pending Review` + **email duyệt** tới Gmail

### [ ] 6.3 — Test luồng đăng bài
1. Dán 1 link Canva bất kỳ vào `visual_url`
2. Set `review_decision = Approved`
3. Đợi ≤ 5 phút → ✅ post lên FB/IG, `url_fb/url_ig` được điền, `er_check_due` = +48h

### [ ] 6.4 — Test luồng ER + quyết định
1. Sửa `er_check_due` = hôm qua, nhập `er_fb = 6.5`
2. Bấm Execute WF-Morning thủ công
3. ✅ `decision = Boost`, email digest tới

### [ ] 6.5 — Test luồng sửa bài (Revise)
1. Set `review_decision = Revise` + ghi `revise_feedback` (vd "hook mạnh hơn")
2. Đợi → ✅ caption được viết lại, về `Pending Review`

🎉 **Nếu 6.2–6.5 chạy đúng = hệ thống hoàn chỉnh.**

---

## Việc hằng ngày sau khi chạy (chỉ 3 thứ)
1. **Email `[Duyệt]...`** → mở Notion → `Approved` (OK) hoặc `Revise` + feedback
2. **Digest 9AM** nhắc nhập ER LinkedIn → mở LinkedIn xem số → nhập `er_li`
3. **Digest** liệt kê Boost/Kill → OK

## Khi tắt máy
Automation dừng (dữ liệu an toàn ở Notion). Bật lại: `npm start` + `npx n8n` → chạy tiếp.

---

## Gặp lỗi?
| Triệu chứng | Xử lý |
|-------------|-------|
| `/health` không trả | agent-service chưa chạy → `npm start` lại |
| `/generate` lỗi | key sai/hết hạn trong `.env` |
| n8n không thấy post mới | check filter `pipeline_status` + integration đã share database chưa |
| Post không lên FB | Meta token hết hạn / thiếu scope (4.3) |
| Email không tới | check Gmail credential + thư mục Spam |
