# TWC Marketing Agent Pipeline — Design Spec

**Date:** 2026-06-12
**Owner:** Yên Võ (The Wild Card)
**Campaign:** TWC Master Plan v5 · B2B 50% + B2C 50% · Jun 15 – Jul 9 2026

---

## 1. Goal

Một hệ thống bán-tự-động: thêm post vào Notion → AI viết caption + ad copy → email duyệt cho Yên → tự đăng FB/IG/LinkedIn → sau 48h chấm ER → rule engine quyết boost/kill → digest email mỗi sáng 9AM. Con người chỉ làm 2 việc: **duyệt nội dung** và **nhập ER LinkedIn organic**.

## 2. Approach (chốt)

- **Orchestrator:** n8n self-host **local** (port 5678). Lưu ý: automation chỉ chạy khi máy bật. Migrate Railway sau nếu cần 24/7.
- **AI engine:** Node.js Express service wrap `files.zip` (giữ nguyên rule engine anti-hallucination). 3 endpoint.
- **Approval gate:** Email (Gmail).
- **Data store:** Notion — **1 database duy nhất** ("Content Pipeline").
- **Email digest:** Brevo.
- **Notification:** Email (KHÔNG dùng Slack).

## 3. Agents (runtime = 3, batch = 1)

| Agent | Khi chạy | Input → Output |
|-------|----------|----------------|
| **Planning** (batch) | Tay, 1 lần/tuần | Weekly brief → ~6 rows vào Notion Calendar |
| **Content** (runtime) | Khi row = Draft | post brief → caption + hook_score + visual_brief |
| **Ads** (runtime) | Generate + ER-check | COPY mode: A/B ad copy · DECISION mode: ER → rule engine boost/kill |
| **Digest** (runtime) | Daily 9AM | Tổng hợp → briefing text email cho Yên |

Tất cả import `TWC_CONTEXT` (01) + `GROUND_TRUTH` rule engine (02) — số liệu exact, không hallucinate.

## 4. Notion — 1 Database "Content Pipeline"

Mỗi post = 1 row đi qua toàn bộ lifecycle. **3 status field độc lập** (tránh nhồi 1 select):

**Lifecycle & input**
- `post_id` (Title) · `date` · `day` · `audience` (b2b/b2c) · `platforms` (multi: FB/IG/LinkedIn)
- `content_type` · `series` · `ad_budget` · `ad_objective`
- `pipeline_status` (Select): `Draft → Generating → Pending Review → Approved → Revise → Publishing → Published → Done`

**Content (Content Agent ghi)**
- `hook_line` · `hook_score` (number) · `passes_threshold` (checkbox) · `caption` (text)
- `visual_brief` (text) · `visual_url` (url — Yên dán link Canva, **manual step**)

**Ads (Ads Agent ghi)**
- `ad_copy_a` · `ad_copy_b` · `run_a_first` (checkbox)

**Human gate**
- `review_decision` (Select): `Approved / Revise / Reject` · `revise_feedback` (text)

**Publish (per-platform, độc lập)**
- `publish_status` (text JSON: `{fb,ig,li}`) · `url_fb` · `url_ig` · `url_li`

**Tracking & ER**
- `er_status` (Select): `Pending / Checked / Boosted`
- `er_check_due` (date = post time + 48h)
- `er_fb` · `er_ig` · `er_li` (number — FB/IG auto, **LI nhập tay**)
- `decision` (Select): `Boost / Kill / Hold / Stop` · `spend` · `learning` (text)

## 5. Agent Service (Express, ~80 LOC)

| Endpoint | Input | Output | Timeout |
|----------|-------|--------|---------|
| `POST /generate` | `{post}` | `{caption, hook_score, visual_brief, ad_copy_a/b}` (Content+Ads tuần tự) | 120s, no-retry |
| `POST /er-decision` | `{post_id, platform, er, budget}` | rule engine `{decision, budget_action, learning}` | 60s |
| `POST /digest` | `{posts[], date}` | `{briefing_text}` (Master Planner) | 60s |
| `GET /health` | — | `{ok:true}` | — |

Secrets từ `.env`: `ANTHROPIC_API_KEY`. Service trả về kết quả ngay cả khi 1 agent fail (fallback có sẵn trong files.zip).

## 6. n8n Workflows (3)

### WF-Pipeline (poll mỗi 5 phút)
Query Notion, **Switch theo `pipeline_status`**:
- `Draft` → set `Generating` → `POST /generate` → ghi caption/ad_copy → set `Pending Review` → Gmail gửi email duyệt (link Notion page)
- `Approved` + chưa publish → set `Publishing` → post FB/IG (Meta Graph API) + LinkedIn (API, scope `w_member_social`) → ghi `url_*`, `publish_status`, `er_check_due = now+48h` → set `Published`
- `Revise` → đọc `revise_feedback` → `POST /generate` lại → set `Pending Review`

**Idempotency:** mỗi nhánh set status mới NGAY trước khi gọi API → poll lần sau không trúng lại. Per-platform publish ghi riêng `{fb,ig,li}` để xử lý fail một nửa.

### WF-Morning (daily 9AM, **tuần tự** — ER trước, digest sau)
1. Query post `er_check_due <= now AND er_status = Pending`
2. FB/IG: pull ER tự động qua Meta Graph API → ghi `er_fb/er_ig`
3. LinkedIn organic: dùng `er_li` Yên đã nhập tay; nếu trống → đánh dấu "cần nhập" cho digest
4. `POST /er-decision` mỗi post → rule engine:
   - FB/IG: ER>5% BOOST+$50 · 3-5% HOLD · <3% KILL
   - LinkedIn: ER>5% BOOST$50+InMail · >3% BOOST$30 · 2-3% HOLD · <2% STOP
   - BOOST LinkedIn → tạo Sponsored Content → từ đó ER pull tự động qua **LinkedIn Ads API**
5. Ghi `decision`, `learning`, set `er_status = Checked/Boosted`
6. `POST /digest` → Brevo gửi email 9AM cho Yên (winners, losers, ER LinkedIn cần nhập, quyết định cần Yên)

## 7. LinkedIn ER constraint (đã xác nhận)
- **Post:** tự động (API).
- **ER organic 48h đầu:** Yên **nhập tay** vào `er_li` (LinkedIn không expose analytics personal profile qua API).
- **Sau khi boost → Sponsored Content:** ER pull **tự động** qua LinkedIn Ads API.

## 8. Manual steps (explicit — không phải bug)
1. **Visual:** Content Agent chỉ viết `visual_brief`. Yên tạo trên Canva Pro → dán `visual_url`. (Canva API/MCP chưa ổn cho auto.)
2. **LinkedIn organic ER:** nhập tay sau 48h.
3. **Planning:** chạy batch tool 1 lần/tuần, Yên review rows trước khi pipeline chạy.

## 9. Secrets
- Agent Service `.env`: `ANTHROPIC_API_KEY`
- n8n Credentials (encrypted): Notion token, Meta Graph token + page/IG id, LinkedIn token, Gmail OAuth, Brevo API key, LinkedIn Ads token.

## 10. Out of scope (YAGNI)
- Auto visual generation · Auto LinkedIn organic analytics · 24/7 cloud · Retargeting automation (manual trong Meta/LinkedIn UI).

## 11. KPIs hệ thống phải track (từ Master Plan v5)
Reach 222,222 · Website clicks 3,333 · Warm leads 500 · Paid conversions 10+ · B2B CPL $65 · Total ad budget $1,300.
