// ═══════════════════════════════════════════════════════════════════
// publish-dashboard.js — render + push dashboard lên GitHub Pages (main)
// Dùng: node publish-dashboard.js [path-to-dashboard.json]
// Live: https://yennievo2011-source.github.io/twc-operation-hub/dashboard/
// ═══════════════════════════════════════════════════════════════════

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const src = process.argv[2] || "./output/latest-dashboard.json";

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: "inherit" });

run(`node render-dashboard.js ${JSON.stringify(src)}`, here);
run("git add dashboard/index.html", root);
try {
  run('git commit -m "chore: update dashboard"', root);
} catch {
  console.log("Không có thay đổi dashboard — bỏ qua commit.");
}
run("git push origin HEAD:main", root);
console.log("\n✅ Live: https://yennievo2011-source.github.io/twc-operation-hub/dashboard/");
