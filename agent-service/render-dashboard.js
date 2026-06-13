// render-dashboard.js — CLI: dashboard JSON → ../dashboard/index.html
// Dùng: node render-dashboard.js [path-to-dashboard.json]
import fs from "fs";
import path from "path";
import { buildDashboardHtml } from "./lib/renderDashboard.js";

const src = process.argv[2] || "./output/latest-dashboard.json";
const data = JSON.parse(fs.readFileSync(src, "utf8"));
const html = buildDashboardHtml(data.dashboard || data);

const outDir = path.resolve("../dashboard");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "index.html"), html);
console.log("Dashboard written: dashboard/index.html");
