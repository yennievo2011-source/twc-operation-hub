# n8n Workflows — import & wiring

2 file JSON import thẳng vào n8n. Đã điền sẵn `database_id` Notion thật.
Bạn chỉ cần gán **credentials** và điền token kênh (Meta/LinkedIn) ở các node có ghi `⚠️ TODO`.

## Thông tin đã điền sẵn
- Notion database: **TWC Content Pipeline**
- database_id: `47b1e8e3dbf94ce5bfc2ff6a23519af9`
- agent-service: `http://localhost:8787`

## Cách import
1. Mở n8n (http://localhost:5678) → góc phải **⋯** → **Import from File**
2. Import `wf-pipeline.json` rồi `wf-morning.json`
3. Mỗi workflow: mở các node màu đỏ (chưa có credential) → gán credential đã tạo ở RUNBOOK §C2

## Credentials cần tạo trước (Settings → Credentials)
| Tên | Loại n8n | Dùng ở node |
|-----|----------|-------------|
| Notion TWC | **Header Auth** — name `Authorization`, value `Bearer ntn_xxx` | tất cả node gọi Notion API |
| Gmail TWC | Gmail OAuth2 | "Email duyệt" |
| Brevo TWC | Header Auth — name `api-key`, value `xkeysib-xxx` | "Gửi digest" |
| Meta Graph | (điền token vào node) | "Đăng FB", "Đăng IG", "Lấy ER FB/IG" |
| LinkedIn | LinkedIn OAuth2 | "Đăng LinkedIn" |

> Lưu ý: dùng **Header Auth** cho Notion vì gọi REST API trực tiếp (ổn định hơn node Notion built-in khi import). Notion API version header `2022-06-28` đã set sẵn.

## Sau khi gán xong
- Activate cả 2 workflow (toggle góc phải)
- Test: xem RUNBOOK §6 / START-HERE.md PHẦN 6

## Các node ⚠️ TODO bạn phải hoàn thiện
- **Đăng FB / IG** (wf-pipeline): điền `page_id`, `ig_user_id`, `access_token` Meta — vì mỗi page khác nhau
- **Đăng LinkedIn** (wf-pipeline): điền `person_urn`
- **Lấy ER FB/IG** (wf-morning): điền endpoint insights theo post id thật
Các node này để sẵn cấu trúc + comment hướng dẫn; phần publish phụ thuộc token riêng của bạn nên không hardcode được.
