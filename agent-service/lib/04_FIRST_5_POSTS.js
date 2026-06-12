// ═══════════════════════════════════════════════════════════════════
// 04_FIRST_5_POSTS.js
// W1 Jun 15–19 — Pre-Launch A/B Test
// 5 posts đầu tiên — brief sẵn sàng để chạy qua Content Agent
// ═══════════════════════════════════════════════════════════════════

export const FIRST_5_POSTS = [

  // ─── POST 1 ─── Jun 15 (Sun) — B2C · FB+IG · CAMPAIGN KICKOFF ───
  {
    post_id: "P1-INTRO",
    date: "2026-06-15",
    day: "Sun Jun 15",
    audience: "b2c",
    platform: "FB+IG",
    content_type: "Single image",
    series: "C",  // Founder intro
    title: "Giới thiệu The Wild Card — campaign mở màn",
    hook_brief: "Pattern interrupt — không phải course AI thông thường. CRAFT framework. 'Ai cũng nói AI. Chúng tôi nói workflow thật.'",
    caption_brief: "Giới thiệu TWC + Yên + Nghi. Định vị khác biệt vs AI courses khác. CTA: follow để theo dõi series.",
    visual_direction: "Dark Indigo bg + Lime accent. TWC logo lớn. 2 founders. 'The Wild Card — Gen AI cho Marketing Teams'",
    ad_budget: "none",  // organic only — kick off day
    ad_objective: "none",
    target_segment: "L2 + L3",
    hook_examples: [
      "Ai cũng có ChatGPT. Không phải ai cũng có hệ thống.",
      "The Wild Card không dạy AI. Chúng tôi dạy bạn dùng AI vào đúng thứ bạn làm mỗi tuần.",
    ],
    cta: "Follow để không bỏ lỡ — tuần này mình ra mắt series về AI workflow thật cho marketers VN.",
    notes: "Bài đầu tiên — set tone cho cả campaign. Không bán hàng. Introduce TWC identity.",
  },

  // ─── POST 2 ─── Jun 16 (Mon) — B2C · FB+IG · A-series opener ───
  {
    post_id: "A1-B2C",
    date: "2026-06-16",
    day: "Mon Jun 16",
    audience: "b2c",
    platform: "FB+IG",
    content_type: "Carousel",
    series: "A",  // AI skills & frameworks
    title: "CRAFT framework — 5 yếu tố prompt không bao giờ fail",
    hook_brief: "Curiosity gap — 'Tại sao 80% prompt AI của bạn ra output tệ — và không phải lỗi của AI.'",
    caption_brief: "Introduce CRAFT framework. 5 slides = 5 yếu tố. Proof: 'Diệu Cao tiết kiệm 30 phút/ngày'. CTA: lưu bài + session 1 waitlist.",
    visual_direction: "5-slide carousel. Slide 1: hook + CRAFT acronym. Slides 2-6: C-R-A-F-T từng yếu tố. Slide 7: before/after output quality. Cuối: Session 1 CTA.",
    ad_budget: "test $15 FB",
    ad_objective: "Engagement",  // W1 = CPE objective
    target_segment: "L2 Experimenter",
    hook_examples: [
      "Tại sao AI trả lời chung chung dù bạn hỏi rất cụ thể?",
      "5 yếu tố khiến prompt của bạn fail — và cách fix trong 30 giây.",
      "CRAFT Checklist: đây là lý do output AI của bạn chưa đủ tốt.",
    ],
    cta: "Lưu carousel này lại — dùng được ngay sáng mai.\nSession 1 Foundation of AI → link trong bio.",
    notes: "Hook type C (curiosity gap). Target L2 Experimenter. Test với $15 Engagement objective. Đây là post A/B test hook đầu tiên — xem ER sau 48h.",
  },

  // ─── POST 3 ─── Jun 17 (Tue) — B2C · FB+IG · Pain hook test ────
  {
    post_id: "A1-B2C-V2",
    date: "2026-06-17",
    day: "Tue Jun 17",
    audience: "b2c",
    platform: "FB+IG",
    content_type: "Single image",
    series: "A",
    title: "A/B test hook — pain/contrast vs curiosity",
    hook_brief: "Contrast số liệu — 'Từ 3 tiếng đọc Nielsen xuống 30 phút. Cùng data. Cùng insights. Khác workflow.'",
    caption_brief: "Hook contrast time-saved. Body: case thật Diệu Cao AB Foods. CTA: Session 1 waitlist. Paired với P2 để A/B test hook type.",
    visual_direction: "Split screen: LEFT '3 giờ' gạch đỏ / RIGHT '30 phút' xanh lá. Nielsen logo blur bg. TWC watermark.",
    ad_budget: "test $15 FB",
    ad_objective: "Engagement",
    target_segment: "L2 Experimenter",
    hook_examples: [
      "Từ 3 tiếng đọc Nielsen xuống 30 phút.",
      "Diệu Cao (ABM, AB Foods) tiết kiệm 30 phút mỗi ngày — đây là workflow cô ấy dùng.",
      "3 tiếng → 30 phút. Cùng data. Cùng insights. Khác hệ thống.",
    ],
    cta: "Bạn đang mất bao nhiêu giờ/tuần cho Nielsen?\nSession 1 → link trong bio — cohort tháng này còn chỗ.",
    notes: "A/B test với A1-B2C (curiosity hook P2 vs contrast hook P3). Sau 48h: ER nào cao hơn → boost cái đó, kill cái còn lại.",
  },

  // ─── POST 4 ─── Jun 18 (Thu) — B2B · LinkedIn · W1 Playbook ────
  {
    post_id: "A2-B2B",
    date: "2026-06-18",
    day: "Thu Jun 18",
    audience: "b2b",
    platform: "LinkedIn",
    content_type: "Text post",  // LinkedIn text post — assessment drive
    series: "A",
    title: "AI Maturity Assessment — B2B awareness opener",
    hook_brief: "Curiosity/value — 'Team marketing của bạn đang dùng AI ở mức độ nào? 5 câu hỏi, 2 phút, biết ngay mình đứng ở đâu.'",
    caption_brief: "Định vị vấn đề team B2B. Không pitch. Offer AI Maturity Assessment nhẹ nhàng. CTA: 'Link trong comment — không có gì để pitch'",
    visual_direction: "Minimal text post. Không cần visual phức tạp. Personal profile Yên post — không phải company page.",
    ad_budget: "test $10 LI",
    ad_objective: "Engagement",
    target_segment: "Marketing Manager, Director, CMO",
    hook_examples: [
      "Team marketing của bạn đang dùng AI ở mức độ nào? Mình có 1 assessment nhỏ — 5 câu hỏi, 2 phút.",
      "Hỏi thật: bạn có biết team mình đang ở L1, L2, L3, hay L4 với AI không?",
    ],
    cta: "Mình để link assessment trong comment — không cần điền gì, không có gì để pitch cả 🙂\nCurious về kết quả của team bạn thì share nhé.",
    linkedin_format_note: "Text post — hook trong 210 chars đầu. Personal Yên profile. Dùng emoji nhẹ (1-2 cái). Tone thân tình như người trong ngành nói chuyện.",
    notes: "W1 LinkedIn playbook — Assessment Drive. Target Marketing Manager+. CTA nhẹ tuyệt đối. Đây là post đầu tiên trên LinkedIn — set tone relationship-first, không sales.",
  },

  // ─── POST 5 ─── Jun 19 (Fri) — B2C · FB+IG · Founder voice ─────
  {
    post_id: "C1-FOUNDER",
    date: "2026-06-19",
    day: "Fri Jun 19",
    audience: "b2c",
    platform: "FB+IG",
    content_type: "Single image",
    series: "C",  // Founder story
    title: "Tại sao tôi xây The Wild Card",
    hook_brief: "Founder voice (hook type D) — honest, không hero narrative. 'Tôi không xây TWC vì tôi giỏi AI. Tôi xây nó vì tôi từng là người không biết bắt đầu từ đâu.'",
    caption_brief: "Yên's honest story — 10 năm FMCG, AI xuất hiện, bắt đầu lại từ đầu. Kết nối với L2 pain: 'không biết bắt đầu từ đâu'. CTA: follow + soft waitlist.",
    visual_direction: "Photo của Yên (authentic, không posed studio). Quote overlay: 'Tôi không xây TWC vì tôi giỏi AI.' — Indigo bg text card hoặc photo trực tiếp.",
    ad_budget: "none",  // organic — founder story không cần boost W1
    ad_objective: "none",
    target_segment: "L2 + L3 — người đang feel stuck với AI",
    hook_examples: [
      "Tôi không xây The Wild Card vì tôi giỏi AI.",
      "10 năm marketing Unilever, PepsiCo, Masan — và khi AI xuất hiện, tôi không biết bắt đầu từ đâu.",
      "Lý do thật tôi bỏ corporate để xây TWC không phải là success story.",
    ],
    cta: "Nếu bạn cũng đang ở chỗ đó — không biết bắt đầu từ đâu, hoặc đang dùng AI nhưng chưa có hệ thống — follow để theo series này.",
    notes: "Authentic founder story — không hero narrative. Kết nối với L2 pain point 'không biết sai ở đâu'. Organic only — W1 test hook trước, founder story để build trust.",
  },
];

// ─── W1 CAMPAIGN BRIEF (input cho Planning Agent) ─────────────────
export const W1_BRIEF = {
  week: "2026-W25",
  date_range: "Jun 15–19",
  campaign_phase: "ph1",
  phase_label: "W1 Pre-Launch A/B Test",
  b2b_objective: "Test B2B hook trên LinkedIn — chọn winner cho W2. Bắt đầu 20 connections/ngày LinkedIn outreach.",
  b2c_objective: "A/B test hook types (curiosity vs contrast) trên FB/IG. Chọn winning hook để scale W2.",
  context: "Tuần đầu tiên. Chưa có testimonials. Budget test: $90-150 tổng. Không push sales mạnh — build awareness và test signals.",
  posts: FIRST_5_POSTS.map(p => p.post_id),
  b2c_a_b_test_pair: ["A1-B2C (curiosity hook)", "A1-B2C-V2 (contrast hook)"],
  linkedin_post: "A2-B2B",
  ad_objective_this_week: "Engagement (CPE) — đo ER để chọn hook winner",
  decision_after_48h: "ER > 5% → BOOST +$50 | ER < 3% → KILL cái kém, chạy cái tốt",
};
