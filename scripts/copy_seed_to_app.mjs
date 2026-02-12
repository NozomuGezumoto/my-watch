#!/usr/bin/env node
/**
 * data/seed.json を app/public/seed.json と app/dist/seed.json にコピーする。
 * データ更新後に「時計史全体の動き」等を反映するために実行。
 * 実行: node scripts/copy_seed_to_app.mjs （プロジェクトルートで）
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "data", "seed.json");
const publicDest = path.join(root, "app", "public", "seed.json");
const distDest = path.join(root, "app", "dist", "seed.json");

if (!fs.existsSync(src)) {
  console.error("Not found:", src);
  process.exit(1);
}
fs.copyFileSync(src, publicDest);
console.log("Copied to app/public/seed.json");
if (fs.existsSync(path.dirname(distDest))) {
  fs.copyFileSync(src, distDest);
  console.log("Copied to app/dist/seed.json");
} else {
  console.log("Skipped app/dist/seed.json (dist not found; run build first)");
}
