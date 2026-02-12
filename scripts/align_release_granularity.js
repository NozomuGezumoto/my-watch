/**
 * 全コレクションの release_definitions を El Primero / Daytona と同粒度にする。
 * - 汎用「この時期の仕様・展開の区切り」を era_definitions の summary / keyFacts / events で置換
 * - ref_group_definitions に不足している release 用の RefGroup を 1 件ずつ追加
 * node scripts/align_release_granularity.js
 *
 * 【ヒーローセクション固定】whyItMatters / heroSubline は現状で固定。
 * 明確な指示があるまで、全モデル共通でこのスクリプトによる上書きは行わないこと。
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
/** 明確な指示があるまで true：ヒーロー（whyItMatters / heroSubline）を上書きしない */
const FREEZE_HERO_SECTION = true;
const SEED_PATH = path.join(ROOT, "data", "seed.json");
const RELEASE_DEF_PATH = path.join(ROOT, "data", "release_definitions.json");
const REF_GROUP_DEF_PATH = path.join(ROOT, "data", "ref_group_definitions.json");
const ERA_DEF_PATH = path.join(ROOT, "data", "era_definitions.json");
const SPECS_PATH = path.join(ROOT, "data", "era_variant_specs.json");

function eraShortSlug(collSlug, eraSlug) {
  const prefix = collSlug + "-";
  return eraSlug.startsWith(prefix) ? eraSlug.slice(prefix.length) : eraSlug;
}

function eventsInRange(events, yearFrom, yearTo) {
  if (!events || !Array.isArray(events)) return [];
  const to = yearTo ?? new Date().getFullYear();
  return events.filter((e) => e.year >= yearFrom && e.year <= to).map((e) => e.label);
}

function main() {
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
  const releaseDefs = JSON.parse(fs.readFileSync(RELEASE_DEF_PATH, "utf8"));
  const refGroupDefs = JSON.parse(fs.readFileSync(REF_GROUP_DEF_PATH, "utf8"));
  const eraDefs = JSON.parse(fs.readFileSync(ERA_DEF_PATH, "utf8"));
  const specs = JSON.parse(fs.readFileSync(SPECS_PATH, "utf8"));

  const collections = seed.collections || [];
  const eras = seed.eras || [];
  const milestones = seed.milestones || [];

  const getCollection = (id) => collections.find((c) => c.id === id);
  const getEra = (id) => eras.find((e) => e.id === id);

  let releasesUpdated = 0;
  let refGroupsAdded = 0;
  const eraReleaseIndex = {};

  for (const m of milestones) {
    const era = m.eraId ? getEra(m.eraId) : null;
    const coll = getCollection(m.collectionId);
    const collSlug = coll?.slug ?? "";
    const eraShort = era ? eraShortSlug(collSlug, era.slug) : null;
    const defList = eraDefs[collSlug];
    const def = eraShort && defList ? defList.find((d) => d.slug === eraShort) : null;
    const spec = (specs[collSlug] && eraShort && specs[collSlug][eraShort]) || null;

    const list = releaseDefs[m.id];
    if (!list || !Array.isArray(list)) continue;

    const genericWhy = "この時期の仕様・展開の区切り。";
    const hasGeneric = list.some((r) => r.whyItMatters === genericWhy);
    const isFineGrained = collSlug === "daytona" || collSlug === "el-primero";

    if (def && (hasGeneric || !isFineGrained)) {
      const eraKey = collSlug + "-" + (eraShort || "");
      const variants = Array.isArray(def.heroSublineVariants) ? def.heroSublineVariants : null;

      for (let i = 0; i < list.length; i++) {
        const r = list[i];
        if (isFineGrained && r.whyItMatters !== genericWhy) continue;
        const idx = (eraReleaseIndex[eraKey] = (eraReleaseIndex[eraKey] ?? 0));
        eraReleaseIndex[eraKey] = idx + 1;
        const yFrom = r.yearFrom ?? m.yearFrom;
        const yTo = r.yearTo ?? m.yearTo;
        const ev = eventsInRange(def.events, yFrom, yTo);
        const kf = def.keyFacts || [];
        const summaryOrFirst = def.summary || (kf[0] && (kf[0].endsWith("。") ? kf[0] : kf[0] + "。")) || r.whyItMatters;

        if (!FREEZE_HERO_SECTION) {
          r.whyItMatters = summaryOrFirst && summaryOrFirst.startsWith("この時期は") ? summaryOrFirst.slice(5) : (summaryOrFirst || r.whyItMatters);
          const fallbackSubline = variants && variants[idx % variants.length]
            ? variants[idx % variants.length]
            : ((def.heroSubline && def.heroSubline.trim()) || (summaryOrFirst ? summaryOrFirst.slice(0, 80).trim() + (summaryOrFirst.length > 80 ? "…" : "") : ""));
          r.heroSubline = fallbackSubline;
          if (r.heroSubline && r.heroSubline.trim() === (r.whyItMatters || "").trim()) r.heroSubline = null;
        }
        r.delta = r.delta || { added: [], changed: [], removed: [] };
        if (ev.length) r.delta.added = ev.slice(0, 4);
        else if (def.keyFacts && def.keyFacts.length) r.delta.added = def.keyFacts.slice(0, 3);
        if (!r.delta.changed || !r.delta.changed.length) r.delta.changed = def.summary ? ["デザイン・ムーブ・仕様の更新"] : [];
        if (r.label && r.label.match(/^\d{4}–?\d*$/)) {
          const suffix = def.name ? ` ${def.name}` : "";
          r.label = (yTo === yFrom ? `${yFrom}` : `${yFrom}–${yTo ?? "現行"}`) + suffix;
        }
        releasesUpdated++;
      }
    }

    for (let i = 0; i < list.length; i++) {
      const releaseId = `rel-${m.id}-${i + 1}`;
      if (refGroupDefs[releaseId] != null) continue;

      const variantMap = spec
        ? {
            materials: spec.caseMaterial ? [spec.caseMaterial] : ["ステンレス"],
            bezels: spec.bezel ? [spec.bezel] : ["—"],
            dials: spec.dialColor ? [spec.dialColor] : ["黒", "白"],
            bracelets: Array.isArray(spec.braceletStrap) ? spec.braceletStrap : ["レザー", "メタル"],
            sizes: spec.caseSizeMm != null ? [spec.caseSizeMm] : [38, 40, 42],
          }
        : {
            materials: ["ステンレス"],
            bezels: ["—"],
            dials: ["黒", "白"],
            bracelets: ["レザー", "メタル"],
            sizes: [38, 40, 42],
          };

      refGroupDefs[releaseId] = [
        {
          refCode: "—",
          label: "代表仕様（この時期）",
          sortOrder: 1,
          variantMap,
        },
      ];
      refGroupsAdded++;
    }
  }

  fs.writeFileSync(RELEASE_DEF_PATH, JSON.stringify(releaseDefs, null, 2), "utf8");
  fs.writeFileSync(REF_GROUP_DEF_PATH, JSON.stringify(refGroupDefs, null, 2), "utf8");
  console.log(`Updated ${releasesUpdated} generic releases with era_definitions.`);
  console.log(`Added ${refGroupsAdded} missing ref_group entries.`);
}

main();
