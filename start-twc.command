#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# start-twc.command — double-click để chạy agent-service (không cần terminal)
# Lần đầu: chuột phải → Open (để Mac cho phép chạy).
# ═══════════════════════════════════════════════════════════════
cd "$(dirname "$0")/agent-service" || exit 1

echo "🃏 Đang khởi động TWC agent-service..."
# Tắt instance cũ nếu có
lsof -ti:8787 | xargs kill -9 2>/dev/null

# Chạy service (tự nạp .env)
npm start &
sleep 3

echo ""
echo "✅ Service chạy tại http://localhost:8787"
echo "📋 Mở Notion để duyệt bài..."
open "https://app.notion.com/p/47b1e8e3dbf94ce5bfc2ff6a23519af9"
open "https://yennievo2011-source.github.io/twc-operation-hub/dashboard/"
echo ""
echo "👉 Để chạy tự động (poll Notion + email), mở thêm n8n: gõ 'npx n8n' ở Terminal."
echo "   Đóng cửa sổ này = tắt service."
echo ""
# Giữ cửa sổ mở
wait
