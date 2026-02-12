/**
 * seed.json の全 milestone に対して、release_definitions に無いものを
 * 年範囲を2〜3分割した Release で追加する。デイトナ同様に全コレクションを細かくする。
 * node scripts/expand_releases_all_collections.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SEED_PATH = path.join(ROOT, "data", "seed.json");
const RELEASE_DEF_PATH = path.join(ROOT, "data", "release_definitions.json");

function splitIntoReleases(yearFrom, yearTo, milestoneId) {
  const end = yearTo ?? new Date().getFullYear();
  const span = Math.max(1, end - yearFrom);
  const count = span <= 2 ? 1 : span <= 6 ? 2 : 3;
  const step = Math.max(1, Math.floor(span / count));
  const releases = [];
  let y = yearFrom;
  for (let i = 0; i < count && y <= end; i++) {
    const yTo = i === count - 1 ? end : Math.min(y + step - 1, end);
    const label =
      yTo === y ? `${y}` : yTo >= end && end >= new Date().getFullYear() - 1 ? `${y}– 現行` : `${y}–${yTo}`;
    releases.push({
      yearFrom: y,
      yearTo: yTo === end && !yearTo ? null : yTo,
      label,
      whyItMatters: "この時期の仕様・展開の区切り。",
      delta: { added: [], changed: [], removed: [] },
      sortOrder: i + 1,
    });
    y = yTo + 1;
  }
  return releases;
}

function main() {
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
  const defs = JSON.parse(fs.readFileSync(RELEASE_DEF_PATH, "utf8"));

  const milestones = seed.milestones ?? [];
  let added = 0;
  for (const m of milestones) {
    if (defs[m.id] != null) continue;
    defs[m.id] = splitIntoReleases(m.yearFrom, m.yearTo, m.id);
    added += defs[m.id].length;
  }

  fs.writeFileSync(RELEASE_DEF_PATH, JSON.stringify(defs, null, 2), "utf8");
  console.log(`Added releases for ${Object.keys(defs).filter((k) => k !== "description").length} milestones (${added} new release entries).`);
}

main();
