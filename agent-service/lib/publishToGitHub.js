// ═══════════════════════════════════════════════════════════════════
// lib/publishToGitHub.js — đẩy 1 file lên GitHub qua Contents API
// Dùng để publish dashboard từ cloud (Railway) — không cần git local.
// Env cần: GITHUB_TOKEN (repo scope), GH_REPO (vd "user/repo")
// ═══════════════════════════════════════════════════════════════════

const API = "https://api.github.com";

export async function putFileToGitHub({ repo, token, filePath, content, message, branch = "main" }) {
  if (!repo || !token) throw new Error("GH_REPO và GITHUB_TOKEN bắt buộc");
  const url = `${API}/repos/${repo}/contents/${filePath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "twc-agent-service",
  };

  // Lấy sha hiện tại (nếu file đã tồn tại) để update
  let sha;
  const getRes = await fetch(`${url}?ref=${branch}`, { headers });
  if (getRes.ok) {
    const j = await getRes.json();
    sha = j.sha;
  }

  const body = {
    message: message || "chore: update dashboard",
    content: Buffer.from(content, "utf8").toString("base64"),
    branch,
    ...(sha && { sha }),
  };

  const putRes = await fetch(url, { method: "PUT", headers, body: JSON.stringify(body) });
  if (!putRes.ok) {
    throw new Error(`GitHub PUT thất bại ${putRes.status}: ${await putRes.text()}`);
  }
  const out = await putRes.json();
  return out.content?.html_url;
}
