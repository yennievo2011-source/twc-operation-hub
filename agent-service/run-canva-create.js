// ═══════════════════════════════════════════════════════════════════
// run-canva-create.js — Tạo design Canva 3-page cho mỗi post
//
// Dùng: node --env-file=.env run-canva-create.js
//
// Flow:
//   1. node --env-file=.env lib/05_RUN.js    → content + plan JSON
//   2. node --env-file=.env run-canva-create.js → brief cho Claude Code
//   3. Claude Code đọc brief → Canva MCP → tạo designs → update Notion
//
// Approach: 1 design = 1 file Canva có 3 pages
//   Page 1: PEOPLE  (ảnh người + hook text)
//   Page 2: HASHTAG ("#" as key device)
//   Page 3: ABSTRACT ART (LIME+INDIGO fills)
//
//   Template: DAHMoGZINCg (A1 final approved)
// ═══════════════════════════════════════════════════════════════════

import fs from "fs";
import { loadCanvaPlan } from "./lib/canvaAgent.js";

let data;
try {
  data = loadCanvaPlan("./output");
} catch (e) {
  console.error("❌ Chưa có canva-creation-plan.json — chạy 05_RUN.js trước");
  process.exit(1);
}

const { plan, created_at } = data;
const pending = plan.filter(p => p.status === "to_create");
const done    = plan.filter(p => p.status === "done");

console.log("\n" + "═".repeat(65));
console.log("🎨 TWC CANVA CREATION BRIEF — 3-PAGE SINGLE FILE × 5 POSTS");
console.log(`   Generated: ${created_at}`);
console.log(`   Total: ${plan.length} | Done: ${done.length} | Pending: ${pending.length}`);
console.log("═".repeat(65));

if (pending.length === 0) {
  console.log("\n✅ Tất cả designs đã xong!");
  done.forEach(d => console.log(`   ${d.post_id}: ${d.canva_url}`));
  process.exit(0);
}

// ─── Print pending posts ──────────────────────────────────────────
console.log(`\n${"─".repeat(65)}`);
console.log("📋 POSTS CẦN TẠO DESIGN:");
console.log("─".repeat(65));

pending.forEach(item => {
  console.log(`\n  ${item.post_id}  (${item.date})`);
  console.log(`  Notion ID: ${item.notion_id}`);
  console.log(`  Hook P1 (LIME bự): "${item.hook_p1}"`);
  console.log(`  Ticker P1:         "${item.ticker_p1}"`);
  console.log(`  Sub P1:            "${item.sub_p1}"`);
  console.log(`  Hook P2 (# page):  "${item.hook_p2}"`);
  console.log(`  Context P3:        "${item.context_p3}"`);
  console.log(`  Hook P3 (LIME):    "${item.hook_p3}"`);
  console.log(`  Sub P3:            "${item.sub_p3}"`);
});

// ─── Claude execution instructions ───────────────────────────────
console.log(`\n${"═".repeat(65)}`);
console.log("📌 CLAUDE CODE — THỰC HIỆN THEO THỨ TỰ:");
console.log(`
════ CONFIG ════
  Template: DAHMoGZINCg  (A1 final, 3 pages, 1080×1350)
  Brand kit: kAGZ7PQvf-I
  Colors: Indigo #050090 | Lime #C0F100 | White #FFFFFF

════ ELEMENT IDs — SAME TRONG MỌI COPY TỪ DAHMoGZINCg ════

  PAGE 1 (page_id: PB0lRv3L9xrQLngF):
    TICKER:       PB0lRv3L9xrQLngF-LBqBngrYrdybdZ83
    HOOK LIME:    PB0lRv3L9xrQLngF-LB2w593gtGpj6z51
    SUB WHITE:    PB0lRv3L9xrQLngF-LBvjd8wkgSJX96tT
    Person fill:  PB0lRv3L9xrQLngF-LB4R5WgKDBJrmJfq  [editable]
    Logo fill:    PB0lRv3L9xrQLngF-LB7XP3GD56X3Gh9c  [editable]
    Arrow fill:   PB0lRv3L9xrQLngF-LByRDkZscMHKQDKj  [NON-editable — giữ nguyên]

  PAGE 2 (page_id: PBndHWg4VX6WbxvK):
    "#" char:     PBndHWg4VX6WbxvK-LBY3dbBsfd5p2xgT  ← KHÔNG sửa
    HOOK TEXT:    PBndHWg4VX6WbxvK-LBNXwQ7tqqLVPzhK

  PAGE 3 (page_id: PBhbFHvmLvNZtfPT):
    CONTEXT:      PBhbFHvmLvNZtfPT-LBrl0sQJn1C4NjTg-LBbKl0rPVtH48sH7
    HOOK LIME:    PBhbFHvmLvNZtfPT-LBrl0sQJn1C4NjTg-LB2cZdpCFQ2gdWws
    SUB italic:   PBhbFHvmLvNZtfPT-LBxWd1ZsbchvWxDX

════ MCP SEQUENCE CHO MỖI POST ════

  1. copy-design("DAHMoGZINCg")
     → nhận design_id mới

  2. start-editing-transaction(design_id)
     → lấy transaction_id + pages array

  3. perform-editing-operations(transaction_id, page_index=1, pages=[...], operations=[
       // PAGE 1:
       {type:"replace_text", element_id:"PB0lRv3L9xrQLngF-LBqBngrYrdybdZ83", text: <ticker_p1>},
       {type:"replace_text", element_id:"PB0lRv3L9xrQLngF-LB2w593gtGpj6z51", text: <hook_p1>},
       {type:"replace_text", element_id:"PB0lRv3L9xrQLngF-LBvjd8wkgSJX96tT", text: <sub_p1>},
       // PAGE 2:
       {type:"replace_text", element_id:"PBndHWg4VX6WbxvK-LBNXwQ7tqqLVPzhK", text: <hook_p2>},
       // PAGE 3:
       {type:"replace_text", element_id:"PBhbFHvmLvNZtfPT-LBrl0sQJn1C4NjTg-LBbKl0rPVtH48sH7", text: <context_p3>},
       {type:"replace_text", element_id:"PBhbFHvmLvNZtfPT-LBrl0sQJn1C4NjTg-LB2cZdpCFQ2gdWws", text: <hook_p3>},
       {type:"replace_text", element_id:"PBhbFHvmLvNZtfPT-LBxWd1ZsbchvWxDX",                  text: <sub_p3>},
     ])

  4. commit-editing-transaction(transaction_id)
     → URL: https://www.canva.com/design/<design_id>/edit

  5. notion-update-page(
       page_id = <notion_id>,
       command = "update_properties",
       properties = { canva_a: "https://www.canva.com/design/<design_id>/edit" }
     )

  ⚠️ canva_a = 1 file 3-page (không cần canva_b / canva_c nữa)

════ (OPTIONAL) THAY ẢNH NGƯỜI — PAGE 1 ════

  Nếu muốn ảnh người khác cho page 1 của một post cụ thể:

  A. generate-design(
       query = "<mood description> dark editorial indigo no text overlay",
       design_type = "instagram_post",
       brand_kit_id = "kAGZ7PQvf-I"
     )
     → chọn candidate phù hợp nhất

  B. create-design-from-candidate(job_id, candidate_id) → ai_design_id

  C. start-editing-transaction(ai_design_id)
     → ghi fills[0].asset_id → cancel-editing-transaction ngay

  D. Thêm vào batch operations ở BƯỚC 3:
     {type:"update_fill", element_id:"PB0lRv3L9xrQLngF-LB4R5WgKDBJrmJfq",
      asset_type:"image", asset_id:<new_asset_id>, alt_text:"person photo"}

  generate-design query gợi ý theo post:
    A1: "Person alone back to viewer dramatic indigo window light cinematic"
    A2: "Team workshop projector light audience back editorial dark"
    A5: "Marketer working laptop screen glow candid atmospheric dark"
    A8: "Person walking office corridor momentum dramatic light editorial"
    L1: "Person doorway backlit silhouette dramatic light entering new space"
`);
console.log("═".repeat(65));

// Save brief JSON for reference
const brief = {
  template_id: "DAHMoGZINCg",
  brand_kit_id: "kAGZ7PQvf-I",
  brand_colors: { bg: "#050090", accent: "#C0F100", text: "#FFFFFF" },
  element_ids: {
    page1: {
      page_id: "PB0lRv3L9xrQLngF",
      ticker: "PB0lRv3L9xrQLngF-LBqBngrYrdybdZ83",
      hook_lime: "PB0lRv3L9xrQLngF-LB2w593gtGpj6z51",
      sub_white: "PB0lRv3L9xrQLngF-LBvjd8wkgSJX96tT",
      person_fill: "PB0lRv3L9xrQLngF-LB4R5WgKDBJrmJfq",
    },
    page2: {
      page_id: "PBndHWg4VX6WbxvK",
      hash_char: "PBndHWg4VX6WbxvK-LBY3dbBsfd5p2xgT",
      hook_text: "PBndHWg4VX6WbxvK-LBNXwQ7tqqLVPzhK",
    },
    page3: {
      page_id: "PBhbFHvmLvNZtfPT",
      context: "PBhbFHvmLvNZtfPT-LBrl0sQJn1C4NjTg-LBbKl0rPVtH48sH7",
      hook_lime: "PBhbFHvmLvNZtfPT-LBrl0sQJn1C4NjTg-LB2cZdpCFQ2gdWws",
      sub_italic: "PBhbFHvmLvNZtfPT-LBxWd1ZsbchvWxDX",
    },
  },
  pending_posts: pending,
};
fs.writeFileSync("./output/canva-claude-brief.json", JSON.stringify(brief, null, 2));
console.log("\n📄 Brief saved: ./output/canva-claude-brief.json\n");
