/**
 * Milestone の中身を era_definitions.json と era_variant_specs.json で充填する。
 * data/seed.json を読み、milestones を上書きして保存。node scripts/enrich_milestones.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SEED_PATH = path.join(ROOT, "data", "seed.json");
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

// リリース表示年で時計史を決める（add_watch_history_context.mjs と同じ区分）
const PERIOD_BULLETS = {
  "1945-1955": ["戦後復興期。スイス時計産業の再建と輸出拡大。", "防水技術の民生化が始まり、オイスター等が実用化した時期。"],
  "1955-1962": ["スポーツウォッチの胎動。ダイバー・クロノの実用化が各社で進んだ時期。", "名前付きラインの前夜。ドレスからスポーツまでラインが広がり始めた時期。"],
  "1962-1969": ["名前付きスポーツクロノの登場期。ヘウエル・ロレックス等がラインを確立。", "スポーツクロノ・ダイバー需要の高まり。レーシング・航空との結びつきが強まった時期。"],
  "1969-1975": ["自動巻きクロノグラフの開発競争。複数メーカーが同年に発表した「自動巻きクロノ元年」前後。", "高振動ムーブメントの実用化。角型・スポーツクロノのデザインが多様化した時期。"],
  "1970-1978": ["クォーツショック真っ只中。スイス機械式の生産縮小と日本クォーツの台頭。", "電池式の精度・価格で機械式が圧迫され、業界再編が進んだ時期。"],
  "1978-1985": ["クォーツ全盛期。スイスも電池式へ本格移行し、機械式はニッチ化。", "機械式高振動を維持した稀有なムーブメントが、後に再評価される土壌ができた時期。"],
  "1985-1995": ["機械式復権の兆し。スイス高級時計の再評価が始まった時期。", "スポーツクロノの機械式ラインが再び注目され始めた時期。"],
  "1995-2002": ["機械式スポーツクロノの復活。映画・文化と結びついたアイコンが再注目された時期。", "ヴィンテージ人気の芽生え。限定復刻やホームコメが増え始めた時期。"],
  "2002-2010": ["インハウスムーブメントの台頭。大径ケースの流行が本格化した時期。", "マスタークロノメーター等の高精度認定が広がり始めた時期。"],
  "2010-2017": ["パイロット・航空系クロノの再評価。スポーツクロノの高級化が定着。", "ヴィンテージ・復刻人気の高まり。コレクター市場が拡大した時期。"],
  "2017-": ["ヴィンテージ・復刻ブームの定着。コレクター市場の拡大と再販価格の注目。", "機械式の再評価が一般化し、復刻・限定モデルが各社の顔になった時期。"],
};

function yearToBand(year) {
  if (year == null) return PERIOD_BULLETS["2017-"];
  if (year < 1955) return PERIOD_BULLETS["1945-1955"];
  if (year < 1962) return PERIOD_BULLETS["1955-1962"];
  if (year < 1969) return PERIOD_BULLETS["1962-1969"];
  if (year < 1975) return PERIOD_BULLETS["1969-1975"];
  if (year < 1978) return PERIOD_BULLETS["1970-1978"];
  if (year < 1985) return PERIOD_BULLETS["1978-1985"];
  if (year < 1995) return PERIOD_BULLETS["1985-1995"];
  if (year < 2002) return PERIOD_BULLETS["1995-2002"];
  if (year < 2010) return PERIOD_BULLETS["2002-2010"];
  if (year < 2017) return PERIOD_BULLETS["2010-2017"];
  return PERIOD_BULLETS["2017-"];
}

function pickContextByYears(startYear, endYear) {
  const end = endYear ?? new Date().getFullYear();
  const span = startYear != null ? end - startYear : 0;
  const useStart = span > 12;
  const pickYear = useStart ? startYear : (startYear != null ? Math.floor((startYear + end) / 2) : end);
  return yearToBand(pickYear);
}

const RELEASE_USE_MILESTONE_COLLECTIONS = new Set(["daytona", "el-primero"]);

function main() {
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
  const eraDefs = JSON.parse(fs.readFileSync(ERA_DEF_PATH, "utf8"));
  const specs = JSON.parse(fs.readFileSync(SPECS_PATH, "utf8"));

  const collections = seed.collections || [];
  const eras = seed.eras || [];
  const milestones = seed.milestones || [];

  const getCollection = (id) => collections.find((c) => c.id === id);
  const getEra = (id) => eras.find((e) => e.id === id);

  let updated = 0;
  for (const m of milestones) {
    const era = m.eraId ? getEra(m.eraId) : null;
    const coll = getCollection(m.collectionId);
    const collSlug = coll?.slug ?? "";
    const eraShort = era ? eraShortSlug(collSlug, era.slug) : null;

    const defList = eraDefs[collSlug];
    const def = eraShort && defList ? defList.find((d) => d.slug === eraShort) : null;

    const spec = (specs[collSlug] && eraShort && specs[collSlug][eraShort]) || null;

    // whyItMatters: 要約 or 最初の keyFact
    if (def) {
      m.whyItMatters = def.summary || (def.keyFacts && def.keyFacts[0]) || m.whyItMatters;
      const sub = def.heroSubline && def.heroSubline.trim() !== (m.whyItMatters || "").trim() ? def.heroSubline.trim() : null;
      m.heroSubline = sub || null;
    }

    // delta: keyFacts を added、この期間の events を added、前世代との違いは changed に要約
    if (def) {
      const added = [];
      if (def.keyFacts && def.keyFacts.length) added.push(...def.keyFacts);
      const ev = eventsInRange(def.events, m.yearFrom, m.yearTo);
      ev.forEach((l) => added.push(l));
      m.delta = m.delta || { added: [], changed: [], removed: [] };
      m.delta.added = added.length ? added.slice(0, 5) : (def.summary ? [def.summary] : []);
      const hasPlaceholder = (arr) => arr.some((s) => s && String(s).includes("要補足"));
      if (hasPlaceholder(m.delta.changed) || !m.delta.changed.length) {
        m.delta.changed = def.summary ? ["デザイン・ムーブ・仕様の更新"] : [];
      }
      if (hasPlaceholder(m.delta.added)) {
        m.delta.added = m.delta.added.filter((s) => !String(s).includes("要補足"));
        if (!m.delta.added.length && def.summary) m.delta.added = [def.summary];
      }
      m.delta.removed = m.delta.removed || [];
    }

    // howToSpot: 仕様があればそれベース、なければ汎用
    if (spec) {
      m.howToSpot = [
        spec.bezel ? `ベゼル: ${spec.bezel}` : "ベゼル形状",
        spec.caseSizeMm ? `ケース径 ${spec.caseSizeMm}mm` : "ケース径",
        spec.dialColor ? `ダイアル色: ${spec.dialColor}` : "ダイアル刻印",
        spec.caliber ? `キャリバー ${spec.caliber}` : "ムーブメント型番",
        "裏蓋・刻印",
      ].filter(Boolean);
    } else if (def) {
      m.howToSpot = ["ダイアル刻印", "ベゼル形状", "ケース径", "ムーブメント型番", "裏蓋"];
    }

    // industryContext: 時計史全体の動き（表示年代に沿う内容。watchHistoryContext 優先、なければ industryPosition）
    if (def && Array.isArray(def.watchHistoryContext) && def.watchHistoryContext.length > 0) {
      m.industryContext = def.watchHistoryContext.slice(0, 6);
    } else if (def && Array.isArray(def.industryPosition) && def.industryPosition.length > 0) {
      m.industryContext = def.industryPosition.slice(0, 6);
    } else {
      m.industryContext = [];
    }

    // specSnapshot: era_variant_specs から
    if (spec) {
      m.specSnapshot = {
        movementType: spec.movementType ?? null,
        caliber: spec.caliber ?? null,
        caseSizeMmRange: spec.caseSizeMm != null ? [spec.caseSizeMm, spec.caseSizeMm] : null,
        waterResistanceM: spec.waterResistanceM ?? null,
        materials: spec.caseMaterial ? [spec.caseMaterial] : [],
        bezels: spec.bezel ? [spec.bezel] : [],
        bracelets: Array.isArray(spec.braceletStrap) ? spec.braceletStrap : [],
        dialTags: spec.dialColor ? [spec.dialColor] : [],
      };
    } else if (def) {
      m.specSnapshot = {
        movementType: null,
        caliber: null,
        caseSizeMmRange: null,
        waterResistanceM: null,
        materials: ["ステンレス"],
        bezels: ["—"],
        bracelets: ["レザー", "メタル"],
        dialTags: ["黒", "白"],
      };
    }

    // variantMap: era_variant_specs から
    if (spec) {
      m.variantMap = {
        materials: spec.caseMaterial ? [spec.caseMaterial] : ["ステンレス"],
        bezels: spec.bezel ? [spec.bezel] : [],
        dials: spec.dialColor ? [spec.dialColor] : ["黒", "白"],
        bracelets: Array.isArray(spec.braceletStrap) ? spec.braceletStrap : ["レザー", "メタル"],
        sizes: spec.caseSizeMm != null ? [spec.caseSizeMm] : [38, 40, 42],
      };
    } else if (def) {
      m.variantMap = {
        materials: ["ステンレス"],
        bezels: ["—"],
        dials: ["黒", "白"],
        bracelets: ["レザー", "メタル"],
        sizes: [38, 40, 42],
      };
    }

    // label: 期間が短い場合はイベント入りに
    if (def && def.events && def.events.length) {
      const ev = eventsInRange(def.events, m.yearFrom, m.yearTo);
      if (ev.length) {
        m.label = `${def.name}（${ev[0]}）`;
      }
    }

    // 見分け方: 未設定・空の場合は必ずデフォルト5項目を入れる（致命的な空表示を防ぐ）
    const defaultHowToSpot = ["ダイアル刻印・色", "ベゼル形状・素材", "ケース径", "ムーブメント型番（裏蓋またはスペック表）", "ブレス・ベルト"];
    if (!m.howToSpot || !Array.isArray(m.howToSpot) || m.howToSpot.length === 0) {
      m.howToSpot = defaultHowToSpot;
    }

    // どこかに「要補足」が残っていたら汎用文言に
    const strip = (s) => (s && String(s).includes("要補足") ? "—" : s);
    if (m.specSnapshot) {
      if (m.specSnapshot.bezels) m.specSnapshot.bezels = m.specSnapshot.bezels.map(strip);
      if (m.specSnapshot.dialTags) m.specSnapshot.dialTags = m.specSnapshot.dialTags.map(strip);
    }
    if (m.variantMap) {
      if (m.variantMap.bezels) m.variantMap.bezels = m.variantMap.bezels.map(strip);
    }
    if (m.delta) {
      m.delta.added = (m.delta.added || []).filter((s) => !String(s).includes("要補足"));
      m.delta.changed = (m.delta.changed || []).map((s) => (String(s).includes("要補足") ? "デザイン・仕様の更新" : s));
      m.delta.removed = (m.delta.removed || []).filter((s) => !String(s).includes("要補足"));
    }

    updated++;
  }

  // リリースごとに industryContext を設定（表示カードの年で時計史を表示するため）
  const releases = seed.releases || [];
  const milestoneById = new Map(milestones.map((m) => [m.id, m]));
  let releasesWithContext = 0;
  for (const r of releases) {
    const m = milestoneById.get(r.milestoneId);
    const coll = m ? getCollection(m.collectionId) : null;
    const collSlug = coll?.slug ?? "";
    if (RELEASE_USE_MILESTONE_COLLECTIONS.has(collSlug)) {
      r.industryContext = m && Array.isArray(m.industryContext) ? m.industryContext.slice(0, 6) : [];
    } else {
      r.industryContext = pickContextByYears(r.yearFrom, r.yearTo ?? r.yearFrom);
    }
    if (r.industryContext && r.industryContext.length > 0) releasesWithContext++;
  }

  fs.writeFileSync(SEED_PATH, JSON.stringify(seed, null, 2), "utf8");
  console.log(`Enriched ${updated} milestones and ${releasesWithContext} releases in data/seed.json`);
}

main();
