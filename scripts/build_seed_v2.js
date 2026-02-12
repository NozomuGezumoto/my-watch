/**
 * Seed v2.0 builder: reads data/seed.json, adds milestones (min 8 per collection),
 * writes data/seed.json with version 2.0. Run: node scripts/build_seed_v2.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SEED_PATH = path.join(ROOT, "data", "seed.json");
const MIN_MILESTONES_PER_COLLECTION = 8;

function splitRange(start, end, count) {
  const to = end ?? new Date().getFullYear();
  const span = Math.max(1, to - start);
  const step = Math.max(1, Math.floor(span / count));
  const ranges = [];
  let y = start;
  for (let i = 0; i < count && y <= to; i++) {
    const yTo = i === count - 1 ? to : Math.min(y + step - 1, to);
    ranges.push([y, yTo]);
    y = yTo + 1;
  }
  if (ranges.length === 0) ranges.push([start, to]);
  return ranges;
}

function placeholderMilestone(collectionId, eraId, eraName, yearFrom, yearTo, index, collName) {
  const id = `ms-${collectionId.replace("coll-", "")}-${index + 1}`;
  const yearLabel = yearTo != null && yearTo !== yearFrom ? `${yearFrom}–${yearTo}` : `${yearFrom}`;
  return {
    id,
    collectionId,
    eraId,
    yearFrom,
    yearTo: yearTo ?? null,
    label: `${eraName}（${yearLabel}）`,
    whyItMatters: `${collName}のこの時期は、デザイン・ムーブ・素材の変化が集中した重要な区切りです。`,
    delta: {
      added: ["仕様・バリエーションの追加（要補足）"],
      changed: ["前世代からの変更点（要補足）"],
      removed: [],
    },
    howToSpot: ["ダイアル刻印", "ベゼル形状", "ケース径", "ムーブメント型番", "裏蓋"],
    industryContext: ["業界の技術移行期", "ブランド方針の転換"],
    specSnapshot: {
      movementType: null,
      caliber: null,
      caseSizeMmRange: null,
      waterResistanceM: null,
      materials: ["ステンレス"],
      bezels: ["要補足"],
      bracelets: ["レザー", "メタル"],
      dialTags: ["要補足"],
    },
    variantMap: {
      materials: ["ステンレス"],
      bezels: ["要補足"],
      dials: ["黒", "白"],
      bracelets: ["レザー", "メタル"],
      sizes: [38, 40, 42],
    },
    sources: [],
  };
}

function main() {
  const raw = fs.readFileSync(SEED_PATH, "utf8");
  const seed = JSON.parse(raw);

  const collections = seed.collections || [];
  const eras = (seed.eras || []).slice();
  const milestones = [];

  for (const coll of collections) {
    const collEras = eras
      .filter((e) => e.collectionId === coll.id)
      .sort((a, b) => a.startYear - b.startYear);

    let need = MIN_MILESTONES_PER_COLLECTION;
    const perEra = collEras.length > 0
      ? Math.max(2, Math.ceil(need / collEras.length))
      : need;

    let msIndex = 0;
    if (collEras.length === 0) {
      const start = coll.introducedYear ?? 1970;
      const end = coll.discontinuedYear ?? new Date().getFullYear();
      const ranges = splitRange(start, end, need);
      for (const [yFrom, yTo] of ranges) {
        milestones.push(
          placeholderMilestone(coll.id, null, "区分なし", yFrom, yTo, msIndex++, coll.name)
        );
      }
      continue;
    }

    for (const era of collEras) {
      const endYear = era.endYear ?? new Date().getFullYear();
      const ranges = splitRange(era.startYear, endYear, perEra);
      for (const [yFrom, yTo] of ranges) {
        milestones.push(
          placeholderMilestone(coll.id, era.id, era.name, yFrom, yTo, msIndex++, coll.name)
        );
      }
    }
  }

  seed.version = "2.0";
  seed.milestones = milestones;
  if (!seed.userOwnedWatches) seed.userOwnedWatches = [];

  fs.writeFileSync(SEED_PATH, JSON.stringify(seed, null, 2), "utf8");
  console.log(`Written ${milestones.length} milestones to data/seed.json (version 2.0)`);
}

main();
