/**
 * release_definitions.json を読み、seed.json の releases にマージする。
 * node scripts/inject_releases.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SEED_PATH = path.join(ROOT, "data", "seed.json");
const RELEASE_DEF_PATH = path.join(ROOT, "data", "release_definitions.json");

function main() {
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
  const defs = JSON.parse(fs.readFileSync(RELEASE_DEF_PATH, "utf8"));

  const releases = [];
  for (const [milestoneId, list] of Object.entries(defs)) {
    if (milestoneId === "description" || !Array.isArray(list)) continue;
    list.forEach((r, i) => {
      releases.push({
        id: `rel-${milestoneId}-${i + 1}`,
        milestoneId,
        yearFrom: r.yearFrom,
        yearTo: r.yearTo ?? null,
        label: r.label,
        whyItMatters: r.whyItMatters ?? null,
        heroSubline: r.heroSubline ?? null,
        delta: r.delta ?? { added: [], changed: [], removed: [] },
        sortOrder: r.sortOrder ?? i + 1,
      });
    });
  }

  seed.releases = releases;
  fs.writeFileSync(SEED_PATH, JSON.stringify(seed, null, 2), "utf8");
  console.log(`Injected ${releases.length} releases into data/seed.json`);
}

main();
