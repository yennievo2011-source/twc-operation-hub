// ═══════════════════════════════════════════════════════════════════
// 01_TWC_BRAND_CONTEXT.js
// SINGLE SOURCE OF TRUTH — import vào TẤT CẢ agents
// Mọi số liệu ở đây là EXACT từ Master Plan v5
// Không tự ý thay đổi, làm tròn, hay sáng tạo thêm
// ═══════════════════════════════════════════════════════════════════

export const TWC_CONTEXT = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE WILD CARD — MASTER PLAN v5
B2B 50% + B2C 50% · Jun 15 – Jul 9 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## IDENTITY
Tên: The Wild Card / Công ty TNHH Lá Bài Tẩy
Tagline: "Every company has a wild card. We make sure it's you."
Định vị: Gen AI Training & Advisory — Vietnam market
Founders: Yên Võ (instructor, 10+ yr Unilever/PepsiCo/Masan) + Nghi Phan (Bain, INSEAD)
Tools hàng ngày: Claude $20/mo + ChatGPT $20/mo + Canva $15/mo + Calendly $10/mo

## PRODUCTS & EXACT PRICING (không làm tròn)
Session 1 — Foundation of AI: 1,599,000 VND (early bird) / 1,999,000 VND (standard)
Session 2 — Turn Data Into Decisions: 2,199,000 VND
Session 3 — Decks That Drive Decisions: 2,199,000 VND
Full Series (4 sessions): 8,999,000 VND → tiết kiệm 1,798,000 VND (17%)
Format cá nhân: 90 min, live virtual, max 10 người/session
Corporate Training (B): In-house half-day $2,000–3,000 / full-day $3,500–5,000 · 6–20 người
C1 Strategy Call: $350–450 / 90 min
C2 Full Roadmap: $700–1,000 / 6-month
C3 Custom Build: $10,000–30,000
A1 Cohort 1: FREE (investment → testimonials)

## CAMPAIGN TIMELINE
Kick off: Jun 15 2026
Soft Launch: Jun 20 2026
Full Launch: Jun 27 2026
End: Jul 9 2026

Phases:
ph1 · W1 Jun 15–19: Pre-Launch A/B Test
ph2 · W2 Jun 20–26: Soft Launch 🚀
ph3 · W3 Jun 27–30: Full Launch 🔥
ph4 · W4 Jul 1–9: July Close 🎯

## AUDIENCE SEGMENTS
### B2C (50%) — FB/IG primary
L2 Experimenter (~38%): không nhất quán, bắt đầu lại từ đầu, không có template
  Pain: "không nhất quán" "bắt đầu lại từ đầu" "mất thời gian" "không biết sai ở đâu"
  Aspiration: "có hệ thống" "template" "workflow"

L3 Practitioner (~15%): AI works cá nhân nhưng chưa scale ra team
  Pain: "chỉ mình tôi biết" "team chưa theo kịp" "khi tôi nghỉ"
  Aspiration: "scale ra team" "SOP chung" "lợi thế tổ chức"

### B2B (50%) — LinkedIn primary
Decision Makers: Marketing Director, CMO, Agency Owner, HR/L&D Manager
  Company size: 20+ · Industry: FMCG, Advertising, Retail, E-commerce · HCM+HN
  Pain: "đội ngũ chưa dùng AI" "cạnh tranh đang tiến" "ROI chưa rõ" "sếp hỏi budget"
  Aspiration: "lợi thế cạnh tranh" "ROI đo được" "team capability"

## CONTENT MIX
Viral 32% · Value 26% · Sales 26% · Authority 16%
B2B: 3 posts/tuần trên LinkedIn (personal profile ưu tiên > company page — 8× engagement)
B2C: 3 posts/tuần FB+IG

## HOOK SCORING RUBRIC (tổng 35 điểm)
🔴 PHẢI CÓ — 5đ mỗi (tổng 20đ):
  - Đọc 3 giây biết target là ai
  - Có trigger word đúng segment
  - Không cần context để hiểu
  - Tạo ngay 1 câu hỏi trong đầu

🟡 NÊN CÓ — 3đ mỗi (tổng 12đ):
  - Có số cụ thể (%, phút, người)
  - Có personal (tôi / bạn / team)
  - Có contrast (before/after)
  - Platform-native format

🟢 BONUS B2B — 2đ mỗi:
  - Có ROI / số tiền cụ thể
  - Nhắm đúng decision maker role
  - Controversial / polarizing
  - Vietnam context cụ thể

⛔ LOẠI NGAY NẾU:
  - Generic ("AI là tương lai")
  - Không rõ B2B hay B2C target
  - Quá dài (>15 từ cho FB, >210 ký tự cho LinkedIn)
  - Jargon không cần thiết

Threshold: hook phải ≥ 25/35 trước khi test $15

## AD BUDGET v5 (EXACT)
Total: $1,300
LinkedIn Sponsored Content: $260 (20%)
LinkedIn InMail: $190 (15%) — 50–80 sends/tuần
FB/IG Testing $15/post: $210 (16%) — ~14 posts test
FB/IG Boost Winners: $210 (16%) — chỉ boost ER > 5% · max 3–4 posts · $50/post
Retargeting LinkedIn + Website: $200 (15%)
Email Marketing + Tools: $100 (8%) — Brevo setup
Always-On Sales: $130 (10%) — Session 1 evergreen $80 + Corporate $50

## AD DECISION RULES v5 (RULE ENGINE — không qua LLM)
### FB/IG:
ER > 5% sau 48h → BOOST +$50 (scale +20% mỗi 48h nếu tiếp tục perform)
ER 3–5% sau 48h → HOLD, monitor thêm 24h
ER < 3% sau 48h → KILL

### LinkedIn (v5 — KHÁC v4):
ER > 5% → BOOST $50 + InMail follow-up
ER > 3% → BOOST $30
ER 2–3% → HOLD
ER < 2% → STOP + rewrite hook

### Test budgets:
FB/IG: $15/post (Engagement objective — CPE, không phải Reach)
LinkedIn: $10/post
Ad objective: W1=Engagement · W2=Traffic (CPC) · W3-W4=Leads/Conversions

### Threshold tín hiệu:
W1 Engagement obj: ER > 5% = winner hook
W2 Traffic obj: CTR > 1% = scale

## WEEKLY AD SPEND TARGETS
W1 (Jun 15–19): $90–150
W2 (Jun 20–26): $200–300
W3 (Jun 27–30): $260–360
W4 (Jul 1–9): $210–310

## LINKEDIN B2B PLAYBOOK (4 tuần)
W1 Jun 15–19: Awareness — Jun 18 "AI Maturity Assessment" (curiosity hook, CTA nhẹ)
W2 Jun 20–26: Consideration
  Jun 22: V1-B2B "Marketing Skillset Gen AI Era 2026" (document/carousel 8 slides)
  Jun 25: C7-P2 Founder Story (10 năm marketing, trao lại kiến thức)
  Jun 26: V10 Engagement poll "Team bạn ở L1/L2/L3/L4?"
W3 Jun 27–Jul 2: Intent
  Jun 28: Hot Take "Mua ChatGPT cho cả team là lãng phí nhất 2026"
  Jul 2: V4 Data Carousel "Prompt viết brief campaign trong 7 phút" (screenshot thực)
W4 Jul 3–9: Conversion
  Jul 7: L4 Corporate CTA "1 người học = lợi thế cá nhân. Cả team = lợi thế cạnh tranh."
  Jul 9: C7 ROI Calculator close "Team 10 người × 8h/tuần × $/năm"

## LINKEDIN OUTREACH SOP (20 connections/ngày)
Bước 1 (ngay): Connect request — "research AI adoption marketing VN"
Bước 2 (24h sau accept): Value DM + attach AI Maturity PDF, không pitch
Bước 3 (3–4 ngày): Soft qualify — "team bạn ở level nào?"
Bước 4 (7 ngày): Discovery invite — "20 phút, không phải sales call"
Bước 5 (14 ngày): Final follow-up — drop link /corporate, no pressure

## EMAIL B2B NURTURE (5-email sequence)
Tone: thân tình như người quen — KHÔNG phải corporate marketing email
Tool: Brevo free (đến 500 contacts) → Mailchimp $13/mo khi scale
Trigger: Lead magnet download hoặc /corporate page visit

Email 1 (ngay): Deliver report + observation cá nhân, câu hỏi mở — KHÔNG CTA cứng
Email 2 (ngày 3): Tâm sự observation — "mình hay thấy ở các team..."
Email 3 (ngày 7): Case study anonymous storytelling — "một bạn trong network mình..."
Email 4 (ngày 11): Giới thiệu nhẹ Session 1 — "nếu bạn thấy relevant"
Email 5 (ngày 16): 1 câu hỏi thôi — micro-commitment, không pitch

Email KPIs: Open rate 42.35% · CTR 6% · Reply rate 15%

## CAMPAIGN KPIs TỔNG
Reach: 222,222
Website clicks: 3,333 (CTR 1.5%)
Warm leads: 500 (15% of clicks)
Paid conversions: 10+ (2% of warm leads)
B2B discovery calls: 4–5/tháng
B2B closed deals: 1–2/tháng đầu
B2B CPL target: $65

## BRAND VOICE
Sharp, practical, emotionally intelligent — không academic
Câu ngắn. Động từ mạnh. Số liệu > lời hứa. Proof over promise.
Nói như đồng nghiệp trong ngành — không phải giáo viên với học sinh.

KHÔNG được dùng: "bền" "ngày dài" "hành trình" "đồng hành"
  "giải pháp toàn diện" "tìm hiểu thêm" (generic CTA)
KHÔNG: emoji spam (max 2–3, functional) · dấu chấm than thừa
B2C (FB/IG): tiếng Việt · relatable · story-driven
B2B (LinkedIn): có thể mix Việt-Anh · credibility-first · ROI-focused

## PROOF POINTS (exact — không paraphrase)
"30 phút tiết kiệm mỗi ngày" — Diệu Cao, ABM, AB Foods
"Smarter and more sophisticated" — Mai Nguyễn, Brand Marketing Specialist, Be Group
ROI calc: team 10 người × 8h/tuần × 50 tuần = [số tiền cụ thể] lãng phí
`;
