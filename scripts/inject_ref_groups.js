/**
 * ref_group_definitions.json を読み、seed.json の refGroups にマージする。
 * node scripts/inject_ref_groups.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SEED_PATH = path.join(ROOT, "data", "seed.json");
const REF_GROUP_DEF_PATH = path.join(ROOT, "data", "ref_group_definitions.json");

function main() {
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
  const defs = JSON.parse(fs.readFileSync(REF_GROUP_DEF_PATH, "utf8"));

  const refGroups = [];
  for (const [releaseId, list] of Object.entries(defs)) {
    if (releaseId === "description" || !Array.isArray(list)) continue;
    list.forEach((r, i) => {
      refGroups.push({
        id: `rg-${releaseId}-${i + 1}`,
        releaseId,
        refCode: r.refCode,
        label: r.label,
        sortOrder: r.sortOrder ?? i + 1,
        variantMap: r.variantMap ?? null,
      });
    });
  }

  seed.refGroups = refGroups;
  fs.writeFileSync(SEED_PATH, JSON.stringify(seed, null, 2), "utf8");
  console.log(`Injected ${refGroups.length} refGroups into data/seed.json`);
}

main();
