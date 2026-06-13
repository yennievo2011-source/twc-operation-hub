# 🚂 Deploy lên Railway — chạy 24/7 không cần terminal

Hướng dẫn click-by-click cho người không rành code. Sau khi xong, hệ thống chạy trên cloud,
không cần bật máy / gõ lệnh. ~$5–15/tháng (Railway tính theo dùng).

Có **2 service** trên Railway: (1) **agent-service** (bộ não AI), (2) **n8n** (automation).

---

## PHẦN 1 — Deploy agent-service (10 phút)

### [ ] 1.1 — Tạo tài khoản Railway
Vào https://railway.app → **Login with GitHub** → cho phép truy cập.

### [ ] 1.2 — New Project từ repo
1. **New Project** → **Deploy from GitHub repo**
2. Chọn repo **twc-operation-hub**
3. Railway bắt đầu build. Nó sẽ build nhầm ở root — sửa ở bước sau.

### [ ] 1.3 — Trỏ đúng thư mục agent-service
1. Mở service vừa tạo → tab **Settings**
2. **Root Directory** → gõ `agent-service` → Save
3. Railway tự đọc `agent-service/railway.json` (đã có sẵn: `node server.js`)

### [ ] 1.4 — Thêm biến môi trường (Variables)
Tab **Variables** → thêm:
| Tên | Giá trị |
|-----|---------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (key thật của bạn) |
| `GH_REPO` | `yennievo2011-source/twc-operation-hub` |
| `GITHUB_TOKEN` | token GitHub (xem 1.5) |

> KHÔNG cần set `PORT` — Railway tự cấp, code đã đọc `process.env.PORT`.

### [ ] 1.5 — Tạo GITHUB_TOKEN (để đẩy dashboard)
1. https://github.com/settings/tokens → **Generate new token (classic)**
2. Chọn scope **repo** → Generate → copy → dán vào Variables ở trên.

### [ ] 1.6 — Lấy URL public
Tab **Settings** → **Networking** → **Generate Domain**.
Bạn được URL kiểu `https://twc-agent-service-production.up.railway.app`.
**Copy URL này** — dùng cho n8n ở PHẦN 3.

### [ ] 1.7 — Kiểm tra
Mở `<URL>/health` trên trình duyệt → thấy `{"ok":true}` là chạy.

---

## PHẦN 2 — Deploy n8n (10 phút)

### [ ] 2.1 — Thêm service n8n
Trong cùng Project → **New** → **Database/Service** → tìm template **n8n**
(hoặc **Empty Service** → Docker image `n8nio/n8n`).

### [ ] 2.2 — Biến môi trường n8n
| Tên | Giá trị |
|-----|---------|
| `N8N_BASIC_AUTH_ACTIVE` | `true` |
| `N8N_BASIC_AUTH_USER` | tên đăng nhập bạn chọn |
| `N8N_BASIC_AUTH_PASSWORD` | mật khẩu bạn chọn |
| `N8N_HOST` | (điền sau khi có domain ở 2.3) |
| `WEBHOOK_URL` | (như N8N_HOST) |

### [ ] 2.3 — Domain + Volume
1. **Settings → Networking → Generate Domain** → copy, điền vào `N8N_HOST` và `WEBHOOK_URL`.
2. **Settings → Volumes** → thêm volume mount `/home/node/.n8n` (để n8n nhớ workflow khi restart).

### [ ] 2.4 — Mở n8n
Vào domain n8n → đăng nhập bằng user/pass ở 2.2.

---

## PHẦN 3 — Import workflow + đổi URL (15 phút)

### [ ] 3.1 — Import 2 workflow
n8n → **⋯ → Import from File** → `wf-pipeline.json`, `wf-morning.json`
(tải từ repo `n8n-workflows/`).

### [ ] 3.2 — Đổi localhost → URL Railway
Trong cả 2 workflow, các node HTTP đang trỏ `http://localhost:8787`.
Mở từng node có URL đó → thay `http://localhost:8787` bằng **URL agent-service ở bước 1.6**.
(Có các node: Call /generate, /er-decision, /digest, /publish-dashboard.)

### [ ] 3.3 — Gán credentials
Như RUNBOOK §C2: Notion (Header Auth), Gmail, Brevo (Header Auth). Token Meta/LinkedIn cho 3 node publish (TODO).

### [ ] 3.4 — Activate cả 2 workflow.

---

## Xong! Giờ mọi thứ chạy trên cloud

- **Không cần bật máy** — agent-service + n8n chạy 24/7 trên Railway.
- **Bạn chỉ làm trong Notion**: pick option A/B/C, nhập ER LinkedIn.
- **Dashboard** tự cập nhật: https://yennievo2011-source.github.io/twc-operation-hub/dashboard/
- **Email duyệt + digest** tự gửi.

## Tracking
- Notion Board view (cột pipeline_status) — xem post đang ở đâu.
- Cột `Pending Review` + chưa có `chosen_option` = việc cần pick.
- Dashboard GitHub Pages = ảnh tổng quan đẹp, đọc 2 phút mỗi sáng.

## Lưu ý chi phí
Railway có free trial credit; sau đó ~$5/service/tháng tùy mức dùng. n8n + agent-service nhẹ nên thường trong mức thấp. Có thể tắt service khi không cần.

## Khác biệt vs chạy local
| | Local (terminal) | Railway (cloud) |
|--|--|--|
| Bật máy | Bắt buộc | Không cần |
| Gõ lệnh | `npm start` + `npx n8n` | Không |
| Dashboard publish | git push local | qua `/publish-dashboard` (GitHub API) |
| Chi phí | Miễn phí | ~$5–15/tháng |
