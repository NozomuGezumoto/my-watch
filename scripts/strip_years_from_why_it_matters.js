/**
 * whyItMatters から年表記を除去する。（表示期間と食い違わないように）
 * - "（2012年）" などの括弧付き年を削除
 * - 文頭の "2017年 " などを削除
 * node scripts/strip_years_from_why_it_matters.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const RELEASE_DEF_PATH = path.join(ROOT, "data", "release_definitions.json");
const SEED_PATH = path.join(ROOT, "data", "seed.json");
const ERA_DEF_PATH = path.join(ROOT, "data", "era_definitions.json");

function stripYears(s) {
  if (typeof s !== "string") return s;
  let t = s
    .replace(/[（(][0-9]{3,4}年[）)]/g, "")
    .replace(/^[0-9]{3,4}年\s*/g, "")
    .replace(/^[0-9]{3,4}年/g, "");
  return t.trim();
}

function main() {
  let changed = 0;
  const eraDefs = JSON.parse(fs.readFileSync(ERA_DEF_PATH, "utf8"));
  for (const coll of Object.values(eraDefs)) {
    if (!Array.isArray(coll)) continue;
    for (const era of coll) {
      if (era.summary) {
        const next = stripYears(era.summary);
        if (next !== era.summary) {
          era.summary = next;
          changed++;
        }
      }
      for (const arr of [era.keyFacts].filter(Boolean)) {
        for (let i = 0; i < arr.length; i++) {
          const next = stripYears(arr[i]);
          if (next !== arr[i]) {
            arr[i] = next;
            changed++;
          }
        }
      }
      for (const e of era.events || []) {
        if (e.label) {
          const next = stripYears(e.label);
          if (next !== e.label) {
            e.label = next;
            changed++;
          }
        }
      }
    }
  }
  fs.writeFileSync(ERA_DEF_PATH, JSON.stringify(eraDefs, null, 2), "utf8");
  console.log("era_definitions: stripped years from " + changed + " fields.");

  changed = 0;
  const releaseDefs = JSON.parse(fs.readFileSync(RELEASE_DEF_PATH, "utf8"));
  for (const [key, list] of Object.entries(releaseDefs)) {
    if (key === "description" || !Array.isArray(list)) continue;
    for (const r of list) {
      if (r.whyItMatters) {
        const next = stripYears(r.whyItMatters);
        if (next !== r.whyItMatters) {
          r.whyItMatters = next;
          changed++;
        }
      }
      for (const arr of [r.delta?.added, r.delta?.changed].filter(Boolean)) {
        for (let i = 0; i < arr.length; i++) {
          const next = stripYears(arr[i]);
          if (next !== arr[i]) {
            arr[i] = next;
            changed++;
          }
        }
      }
    }
  }
  fs.writeFileSync(RELEASE_DEF_PATH, JSON.stringify(releaseDefs, null, 2), "utf8");
  console.log("release_definitions: stripped years from " + changed + " fields.");

  changed = 0;

  const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
  changed = 0;
  for (const r of seed.releases || []) {
    if (r.whyItMatters) {
      const next = stripYears(r.whyItMatters);
      if (next !== r.whyItMatters) {
        r.whyItMatters = next;
        changed++;
      }
    }
    for (const arr of [r.delta?.added, r.delta?.changed].filter(Boolean)) {
      for (let i = 0; i < arr.length; i++) {
        const next = stripYears(arr[i]);
        if (next !== arr[i]) {
          arr[i] = next;
          changed++;
        }
      }
    }
  }
  for (const m of seed.milestones || []) {
    if (m.whyItMatters) {
      const next = stripYears(m.whyItMatters);
      if (next !== m.whyItMatters) {
        m.whyItMatters = next;
        changed++;
      }
    }
    for (const arr of [m.delta?.added, m.delta?.changed].filter(Boolean)) {
      for (let i = 0; i < arr.length; i++) {
        const next = stripYears(arr[i]);
        if (next !== arr[i]) {
          arr[i] = next;
          changed++;
        }
      }
    }
  }
  fs.writeFileSync(SEED_PATH, JSON.stringify(seed, null, 2), "utf8");
  console.log("seed.json: stripped years from " + changed + " fields (releases + milestones + delta).");
}

main();
