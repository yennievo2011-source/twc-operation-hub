# CANVA REDESIGN — TWC 3-PAGE TEMPLATE APPROACH
# Prompt này phản ánh thực tế thực thi — dựa trên A1 final đã approved (DAHMoGZINCg).

---

## BRAND COLORS
- Background: `#050090` (Indigo)
- Accent/Lime: `#C0F100`
- Text: `#FFFFFF` (White)
- Brand Kit ID: `kAGZ7PQvf-I`

---

## APPROVED TEMPLATE
- **Source design**: `DAHMoGZINCg` — A1 final (3 pages, 1080×1350 IG)
- **Approved by**: User sau nhiều vòng iterate
- **Mỗi post = 1 file Canva có 3 pages** (không phải 3 file riêng như trước)

---

## 3-PAGE STRUCTURE

### Page 1 — PEOPLE (ảnh người + hook text)
```
Hình người nhìn từ xa/từ sau, blended với LIME blob shape.
TWC logo góc dưới phải. Orange arrow góc trên trái (non-editable).

Text elements:
  TICKER    (scrolling context, WHITE small, top≈927):
            → VD: "TẠI SAO OUTPUT CỦA AI LUÔN 'ĐÚNG NHƯNG CHƯA TRÚNG?'"
  HOOK MAIN (LIME bold large, top≈990):
            → VD: "CHATGPT KHÔNG BIẾT\nBẠN LÀ AI."
  SUB       (WHITE italic small, bottom area):
            → VD: "Và đó chính là vấn đề."

Image fills:
  Person photo fill (editable=true) → có thể update_fill với ảnh mới
  TWC logo fill (editable=true) → giữ nguyên
  Orange arrow (editable=false) → KHÔNG xóa được — giữ nguyên
```

### Page 2 — HASHTAG ("#" as key device)
```
"#" 800pt LIME chiếm toàn canvas (top=-80, left=-100, overflow).
Hook text WHITE bold bottom left.

Text elements:
  "#" CHAR  (LIME 800pt, top=-80, left=-100, width=1280) — KHÔNG sửa size/position
  HOOK TEXT (WHITE bold 38pt, top≈1100-1125, left=60, width=940):
            → Full hook sentence của post (1-2 dòng)
```

### Page 3 — ABSTRACT ART (LIME+INDIGO AI art fills)
```
3 abstract image fills LIME+INDIGO blended.
Context label + hook LIME lớn + sub WHITE italic.

Text elements:
  CONTEXT   (WHITE 30pt, top≈866) → nhãn context ngắn (VD: "ChatGPT của bạn")
  HOOK LIME (LIME 105pt, top≈940, width=960) → hook statement IN HOA
  SUB       (WHITE italic, top≈1280) → punchline nhỏ
```

---

## CANVA MCP API — FACTS BẮT BUỘC PHẢI BIẾT

```
start-editing-transaction trả về:
  richtexts[] → text elements: replace_text, format_text, position_element, resize_element
  fills[]     → image fills: chỉ editable=true mới update/delete được

format_text áp dụng cho TOÀN BỘ element — không mix 2 màu trong 1 element.
font_size max = 800pt (API validation).
Negative top/left coordinates = bình thường (element overflow canvas edges).

Solid-color background shapes KHÔNG xuất hiện trong API → không thể xóa.
Non-editable fills (editable=false) → không xóa được → chấp nhận và giữ nguyên.
```

---

## MCP SEQUENCE — TẠO DESIGN CHO 1 POST

```
BƯỚC 1 — COPY TEMPLATE:
  copy-design(design_id="DAHMoGZINCg")
  → nhận design_id mới (3 pages)

BƯỚC 2 — START EDITING:
  start-editing-transaction(design_id)
  → Lấy transaction_id và pages array
  → Element IDs sẽ GIỐNG HỆT template (xem bảng Element IDs bên dưới)

BƯỚC 3 — UPDATE ALL TEXT (1 batch, tất cả 3 pages):
  perform-editing-operations(transaction_id, operations=[
    // PAGE 1:
    replace_text(TICKER_ID, "CONTEXT TEXT CỦA POST NÀY")
    replace_text(HOOK_P1_ID, "HOOK LINE 1\nHOOK LINE 2")
    replace_text(SUB_P1_ID, "Sub punchline của post.")

    // PAGE 2:
    replace_text(HOOK_P2_ID, "Hook full sentence dòng 1\nDòng 2 nếu cần.")

    // PAGE 3:
    replace_text(CONTEXT_P3_ID, "Context label ngắn")
    replace_text(HOOK_P3_ID, "HOOK NGẮN\nIN HOA.")
    replace_text(SUB_P3_ID, "Punchline nhỏ.")
  ])

BƯỚC 4 — (OPTIONAL) UPDATE PERSON IMAGE PAGE 1:
  Nếu muốn ảnh người khác cho page 1:
    generate-design(query="person [mood] dark editorial indigo no text overlay",
                    design_type="instagram_post",
                    brand_kit_id="kAGZ7PQvf-I")
    → pick candidate phù hợp nhất
    create-design-from-candidate(job_id, candidate_id) → ai_design_id
    start-editing-transaction(ai_design_id) → fills[0].asset_id → cancel ngay
    perform-editing-operations(transaction_id, operations=[
      update_fill(PERSON_FILL_ID, asset_type="image", asset_id=<new_asset_id>,
                  alt_text="person photo")
    ])

BƯỚC 5 — COMMIT:
  commit-editing-transaction(transaction_id)
  → Design URL: https://www.canva.com/design/<design_id>/edit

BƯỚC 6 — UPDATE NOTION:
  notion-update-page(page_id=<NOTION_PAGE_ID>, command="update_properties",
                     properties={"canva_a": "https://www.canva.com/design/<design_id>/edit"})
  → canva_a chứa 1 file 3-page (thay vì 3 file riêng)
```

---

## ELEMENT IDs — GIỐNG NHAU TRONG MỌI DESIGN COPY TỪ DAHMoGZINCg

```
PAGE 1 (PB0lRv3L9xrQLngF):
  TICKER text:    PB0lRv3L9xrQLngF-LBqBngrYrdybdZ83
  HOOK LIME:      PB0lRv3L9xrQLngF-LB2w593gtGpj6z51
  SUB WHITE:      PB0lRv3L9xrQLngF-LBvjd8wkgSJX96tT
  Person fill ✏️: PB0lRv3L9xrQLngF-LB4R5WgKDBJrmJfq  (asset: MAHMoClhmVU, editable=true)
  Logo fill ✏️:   PB0lRv3L9xrQLngF-LB7XP3GD56X3Gh9c  (asset: MAHHBlONuhk, editable=true)
  Arrow fill 🔒:  PB0lRv3L9xrQLngF-LByRDkZscMHKQDKj  (NON-editable — giữ nguyên)

PAGE 2 (PBndHWg4VX6WbxvK):
  "#" char:       PBndHWg4VX6WbxvK-LBY3dbBsfd5p2xgT  (800pt LIME, KHÔNG sửa)
  HOOK text:      PBndHWg4VX6WbxvK-LBNXwQ7tqqLVPzhK

PAGE 3 (PBhbFHvmLvNZtfPT):
  CONTEXT text:   PBhbFHvmLvNZtfPT-LBrl0sQJn1C4NjTg-LBbKl0rPVtH48sH7
  HOOK LIME:      PBhbFHvmLvNZtfPT-LBrl0sQJn1C4NjTg-LB2cZdpCFQ2gdWws
  SUB italic:     PBhbFHvmLvNZtfPT-LBxWd1ZsbchvWxDX
  Abstract fill 1 ✏️: PBhbFHvmLvNZtfPT-LB9SfkCG5MTCxMm8
  Abstract fill 2 ✏️: PBhbFHvmLvNZtfPT-LBRPSlcX29fKxMyB
  Abstract fill 3 ✏️: PBhbFHvmLvNZtfPT-LBNMlrB1f6JmSxJn

✏️ = editable=true (có thể update_fill)
🔒 = editable=false (giữ nguyên, không xóa được)
```

---

## 5 POSTS — TEXT CONTENT

### A1 — "ChatGPT không biết bạn là ai" ✅ ĐÃ XONG
- Design: `DAHMoGZINCg`
- Notion: `37ffe8c9-a9e2-8178-a221-c75b7fe8dcee`

| Page | Field | Text |
|------|-------|------|
| 1 | TICKER | `TẠI SAO OUTPUT CỦA AI LUÔN "ĐÚNG NHƯNG CHƯA TRÚNG?"` |
| 1 | HOOK | `CHATGPT KHÔNG BIẾT\nBẠN LÀ AI.` |
| 1 | SUB | `Và đó chính là vấn đề.` |
| 2 | HOOK | `Tại sao output AI của bạn luôn generic?\nVì bạn chưa bao giờ giới thiệu bản thân.` |
| 3 | CONTEXT | `ChatGPT của bạn` |
| 3 | HOOK | `KHÔNG BIẾT\nBẠN LÀ AI.` |
| 3 | SUB | `Và đó chính là vấn đề.` |

---

### A2 — "Team bạn đang dùng AI ở mức độ nào?" (Thu Jun 18)
- Design: `DAHMtw0iVQc`
- Notion: `37ffe8c9-a9e2-811c-8d30-ec2fbd28aac0`

| Page | Field | Text |
|------|-------|------|
| 1 | TICKER | `TEAM MARKETING CỦA BẠN ĐANG DÙNG AI Ở MỨC ĐỘ NÀO?` |
| 1 | HOOK | `TÔI CÓ\n1 CÂU HỎI NHỎ.` |
| 1 | SUB | `Chỉ 5 câu hỏi — 2 phút — bạn biết ngay mình đang ở đâu.` |
| 2 | HOOK | `Tôi có 1 câu hỏi nhỏ: team marketing của bạn đang dùng AI ở mức độ nào?\nChỉ 5 câu hỏi — 2 phút — bạn biết ngay mình đang đứng ở đâu.` |
| 3 | CONTEXT | `Team marketing của bạn` |
| 3 | HOOK | `ĐANG Ở\nMỨC ĐỘ NÀO?` |
| 3 | SUB | `Chỉ 5 câu hỏi. 2 phút. Biết ngay.` |

---

### A5 — "3 lỗi prompt của marketer" (Wed Jun 17)
- Design: `DAHMt_Xklcw`
- Notion: `37ffe8c9-a9e2-813c-be43-f28f98d70538`

| Page | Field | Text |
|------|-------|------|
| 1 | TICKER | `3 LỖI TÔI THẤY Ở MỌI MARKETER KHI HỌC CRAFT` |
| 1 | HOOK | `BẠN ĐANG\nMẮC LỖI\nSỐ MẤY?` |
| 1 | SUB | `3 lỗi tôi thấy ở mọi marketer khi học CRAFT.` |
| 2 | HOOK | `Bạn đang mắc lỗi số mấy?\n3 lỗi tôi thấy ở mọi marketer khi học CRAFT.` |
| 3 | CONTEXT | `Sau khi review 200+ prompt` |
| 3 | HOOK | `CÙNG 3 LỖI\nLẶP LẠI Ở\nTẤT CẢ.` |
| 3 | SUB | `Và đó chính là vấn đề.` |

---

### A8 — "Before: 2 tiếng / After: 18 phút" (Fri Jun 19)
- Design: `DAHMt1cCMX4`
- Notion: `37ffe8c9-a9e2-8192-af1b-f2714e35ee9f`

| Page | Field | Text |
|------|-------|------|
| 1 | TICKER | `CÙNG 1 NGƯỜI — KHÁC 1 SYSTEM` |
| 1 | HOOK | `BEFORE: 2 TIẾNG.\nAFTER: 18 PHÚT.` |
| 1 | SUB | `Approved ngay. Không cần revise.` |
| 2 | HOOK | `BEFORE: 2 tiếng, 3 vòng revise.\nAFTER: 18 phút, approved ngay. Cùng 1 người — khác 1 system.` |
| 3 | CONTEXT | `Brief marketing của bạn` |
| 3 | HOOK | `MẤT 45 PHÚT\nHAY 12 PHÚT?` |
| 3 | SUB | `Chỉ 1 thứ khác nhau.` |

---

### L1 — "Cohort 2 Launch" (Sat Jun 20)
- Design: `DAHMtw63Bqs`
- Notion: `37ffe8c9-a9e2-8146-b4e6-d04073d5c04b`

| Page | Field | Text |
|------|-------|------|
| 1 | TICKER | `CHƯƠNG TRÌNH GEN AI TRAINING ĐẦU TIÊN CHO BRAND TEAMS VN` |
| 1 | HOOK | `KHÔNG PHẢI\nKHOÁ HỌC AI.` |
| 1 | SUB | `Cohort 2 mở đăng ký hôm nay.` |
| 2 | HOOK | `Không phải khoá học AI.\nLà chương trình Gen AI training đầu tiên cho brand teams VN.` |
| 3 | CONTEXT | `The Wild Card` |
| 3 | HOOK | `COHORT 2\nMỞ HÔM NAY.` |
| 3 | SUB | `Đây là nơi marketer VN học AI theo cách thật.` |

---

## NOTION DB

```
DB: collection://1d96b59e-95d7-4917-b69d-e81bebb38e74

| Post | Notion ID |
|------|-----------|
| A1   | 37ffe8c9-a9e2-8178-a221-c75b7fe8dcee |
| A2   | 37ffe8c9-a9e2-811c-8d30-ec2fbd28aac0 |
| A5   | 37ffe8c9-a9e2-813c-be43-f28f98d70538 |
| A8   | 37ffe8c9-a9e2-8192-af1b-f2714e35ee9f |
| L1   | 37ffe8c9-a9e2-8146-b4e6-d04073d5c04b |

Update field: canva_a (1 URL = 1 file 3-page)
Format: https://www.canva.com/design/<design_id>/edit
```

---

## TUẦN SAU — GENERATE DESIGN MỚI

Khi tạo design cho tuần mới, làm theo thứ tự:

```
1. Fetch posts từ Notion DB — lấy hook_line_a / hook_line_b / hook_line_c cho từng post
2. Với mỗi post:
   a. copy-design("DAHMoGZINCg")                       ← luôn dùng A1 approved làm template
   b. start-editing-transaction(new_design_id)
   c. perform-editing-operations — update 7 text fields (xem bảng Element IDs)
   d. (optional) update person image fill nếu cần ảnh người khác
   e. commit-editing-transaction
   f. notion-update-page → canva_a = new design URL
3. Push GitHub
```
