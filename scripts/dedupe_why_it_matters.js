/**
 * 同じ whyItMatters / heroSubline が3回以上出ないように release_definitions を修正する。
 * era_definitions の keyFacts / events から代替文を組み立て、3本目以降に割り当てる。
 * node scripts/dedupe_why_it_matters.js
 *
 * 【ヒーローセクション固定】ヒーローセクション（whyItMatters / heroSubline）は現状で固定。
 * 明確な指示があるまで、全モデル共通でヒーロー内容の一括変更・dedupe の再実行は行わないこと。
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
/** 明確な指示があるまで true：ヒーロー（whyItMatters / heroSubline）を変更しない */
const FREEZE_HERO_SECTION = true;
const SEED_PATH = path.join(ROOT, "data", "seed.json");
const RELEASE_DEF_PATH = path.join(ROOT, "data", "release_definitions.json");
const ERA_DEF_PATH = path.join(ROOT, "data", "era_definitions.json");

function eraShortSlug(collSlug, eraSlug) {
  const prefix = collSlug + "-";
  return eraSlug.startsWith(prefix) ? eraSlug.slice(prefix.length) : eraSlug;
}

/** era の keyFacts / events から代替文の候補を最大5本まで作る */
function buildAlternatives(def) {
  const out = [];
  if (!def) return out;
  const kf = def.keyFacts || [];
  const ev = def.events || [];
  for (let i = 0; i < kf.length && out.length < 5; i++) {
    const s = kf[i].trim();
    if (!s) continue;
    const sent = s.endsWith("。") ? s : s + "。";
    if (!out.includes(sent)) out.push(sent);
  }
  for (let i = 0; i < ev.length && out.length < 5; i++) {
    const e = ev[i];
    const s = (e.label || "").trim();
    if (!s) continue;
    const sent = s.endsWith("。") ? s : s + "。";
    if (!out.includes(sent)) out.push(sent);
  }
  if (def.summary && out.length < 5) {
    const s = def.summary.trim();
    const sent = s.endsWith("。") ? s : s + "。";
    if (!out.includes(sent)) out.push(sent);
  }
  return out;
}

/** heroSubline 用の短い代替文（80字目安） */
function buildSublineAlternatives(def) {
  const out = [];
  if (!def) return out;
  const maxLen = 80;
  const trim = (s) => {
    const t = (s || "").trim();
    return t.length > maxLen ? t.slice(0, maxLen).replace(/\s+\S*$/, "") + "…" : t;
  };
  const kf = def.keyFacts || [];
  const ev = def.events || [];
  for (let i = 0; i < kf.length && out.length < 5; i++) {
    const s = trim(kf[i]);
    if (!s || out.includes(s)) continue;
    out.push(s.endsWith("。") || s.endsWith("…") ? s : s + "。");
  }
  for (let i = 0; i < ev.length && out.length < 5; i++) {
    const s = trim((ev[i].label || "").trim());
    if (!s || out.includes(s)) continue;
    out.push(s.endsWith("。") || s.endsWith("…") ? s : s + "。");
  }
  if (def.summary && out.length < 5) {
    const s = trim(def.summary);
    if (s && !out.includes(s)) out.push(s.endsWith("。") || s.endsWith("…") ? s : s + "。");
  }
  return out;
}

const heroSublineFallbacks = [
  "この時期の代表的な仕様・展開。",
  "デザイン・ムーブ・仕様の更新。",
  "モデル展開上の一区切り。",
  "この年代の代表的な変更点。",
  "仕様・デザインが区別される時期。",
];

function main() {
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));
  const releaseDefs = JSON.parse(fs.readFileSync(RELEASE_DEF_PATH, "utf8"));
  const eraDefs = JSON.parse(fs.readFileSync(ERA_DEF_PATH, "utf8"));

  const collections = seed.collections || [];
  const eras = seed.eras || [];
  const milestones = seed.milestones || [];
  const getColl = (id) => collections.find((c) => c.id === id);
  const getEra = (id) => eras.find((e) => e.id === id);

  const milestoneToDef = {};
  for (const m of milestones) {
    const era = m.eraId ? getEra(m.eraId) : null;
    const coll = getColl(m.collectionId);
    const collSlug = coll?.slug ?? "";
    const eraShort = era ? eraShortSlug(collSlug, era.slug) : null;
    const list = eraDefs[collSlug];
    const def = eraShort && list ? list.find((d) => d.slug === eraShort) : null;
    milestoneToDef[m.id] = def;
  }

  const allReleases = [];
  for (const [milestoneId, list] of Object.entries(releaseDefs)) {
    if (milestoneId === "description" || !Array.isArray(list)) continue;
    const def = milestoneToDef[milestoneId];
    list.forEach((r) => {
      allReleases.push({ milestoneId, r, def });
    });
  }

  const byWhy = {};
  for (const item of allReleases) {
    const w = (item.r.whyItMatters || "").trim();
    if (!w) continue;
    if (!byWhy[w]) byWhy[w] = [];
    byWhy[w].push(item);
  }

  const usedCount = {};
  function canUse(t) {
    return (usedCount[t] || 0) < 2;
  }
  function assignAndCount(t) {
    usedCount[t] = (usedCount[t] || 0) + 1;
  }
  for (const items of Object.values(byWhy)) {
    items.forEach((item) => assignAndCount(item.r.whyItMatters.trim()));
  }

  const genericFallbacks = [
    "この時期の代表的な仕様・モデル展開。",
    "デザイン・ムーブ・仕様の更新が行われた区切り。",
    "コレクション展開上の一区切り。",
    "仕様・デザインの更新がみられる時期。",
    "モデル展開のうえでの一区切り。",
    "この年代の代表的な変更点。",
    "ムーブメント・ケース等の仕様が区別される時期。",
    "収集家が区別するうえでの一区切り。",
  ];
  let genericIndex = 0;

  const milestoneToCollSlugWhy = {};
  for (const m of milestones) {
    const c = getColl(m.collectionId);
    milestoneToCollSlugWhy[m.id] = c?.slug ?? "";
  }
  let replaced = 0;
  if (FREEZE_HERO_SECTION) {
    console.log("FREEZE_HERO_SECTION=true: skipping whyItMatters and heroSubline dedupe.");
  }
  for (const entries of Object.values(byWhy)) {
    if (FREEZE_HERO_SECTION) continue;
    if (entries.length <= 2) continue;
    entries.forEach((item, i) => {
      if (i < 2) return;
      const collSlug = milestoneToCollSlugWhy[item.milestoneId] || "";
      if (collSlug === "daytona" || collSlug === "el-primero") return;
      const t = (item.r.whyItMatters || "").trim();
      usedCount[t] = Math.max(0, (usedCount[t] || 0) - 1);
      const alternatives = buildAlternatives(item.def);
      let assigned = false;
      for (const alt of alternatives) {
        if (!canUse(alt)) continue;
        item.r.whyItMatters = alt;
        assignAndCount(alt);
        replaced++;
        assigned = true;
        break;
      }
      if (!assigned) {
        for (let g = 0; g < genericFallbacks.length; g++) {
          const fallback = genericFallbacks[(genericIndex + g) % genericFallbacks.length];
          if (canUse(fallback)) {
            item.r.whyItMatters = fallback;
            assignAndCount(fallback);
            replaced++;
            genericIndex = (genericIndex + g + 1) % genericFallbacks.length;
            assigned = true;
            break;
          }
        }
        if (!assigned && item.def && item.def.name) {
          const eraSentence = item.def.name + "の時期の一区切り。";
          if (canUse(eraSentence)) {
            item.r.whyItMatters = eraSentence;
            assignAndCount(eraSentence);
            replaced++;
            assigned = true;
          }
        }
        if (!assigned) {
          const fallback = genericFallbacks[genericIndex % genericFallbacks.length];
          genericIndex++;
          item.r.whyItMatters = fallback;
          assignAndCount(fallback);
          replaced++;
        }
      }
    });
  }

  // heroSubline: 同じ文言は最大2回まで（Daytona / El Primero は触らない）
  if (FREEZE_HERO_SECTION) {
    console.log("FREEZE_HERO_SECTION=true: hero section unchanged. Exiting without writing.");
    return;
  }
  const milestoneToCollSlug = milestoneToCollSlugWhy;
  const bySubline = {};
  for (const item of allReleases) {
    const h = (item.r.heroSubline || "").trim();
    if (!h) continue;
    if (!bySubline[h]) bySubline[h] = [];
    bySubline[h].push(item);
  }
  const sublineUsed = {};
  const sublineCanUse = (t) => (sublineUsed[t] || 0) < 2;
  const sublineAssign = (t) => { sublineUsed[t] = (sublineUsed[t] || 0) + 1; };
  for (const entries of Object.values(bySubline)) {
    entries.forEach((item) => sublineAssign((item.r.heroSubline || "").trim()));
  }
  let sublineReplaced = 0;
  let sublineFallbackIdx = 0;
  for (const entries of Object.values(bySubline)) {
    if (entries.length <= 2) continue;
    entries.forEach((item, i) => {
      if (i < 2) return;
      const collSlug = milestoneToCollSlug[item.milestoneId] || "";
      if (collSlug === "daytona" || collSlug === "el-primero") return;
      const prev = (item.r.heroSubline || "").trim();
      sublineUsed[prev] = Math.max(0, (sublineUsed[prev] || 0) - 1);
      const alts = buildSublineAlternatives(item.def);
      let done = false;
      for (const alt of alts) {
        if (!sublineCanUse(alt)) continue;
        if (alt === (item.r.whyItMatters || "").trim()) continue;
        item.r.heroSubline = alt;
        sublineAssign(alt);
        sublineReplaced++;
        done = true;
        break;
      }
      if (!done) {
        for (let g = 0; g < heroSublineFallbacks.length; g++) {
          const fb = heroSublineFallbacks[(sublineFallbackIdx + g) % heroSublineFallbacks.length];
          if (sublineCanUse(fb) && fb !== (item.r.whyItMatters || "").trim()) {
            item.r.heroSubline = fb;
            sublineAssign(fb);
            sublineReplaced++;
            sublineFallbackIdx = (sublineFallbackIdx + g + 1) % heroSublineFallbacks.length;
            done = true;
            break;
          }
        }
      }
      if (!done) {
        const fb = heroSublineFallbacks[sublineFallbackIdx % heroSublineFallbacks.length];
        sublineFallbackIdx++;
        item.r.heroSubline = fb;
        sublineAssign(fb);
        sublineReplaced++;
      }
      if (item.r.heroSubline && item.r.heroSubline.trim() === (item.r.whyItMatters || "").trim()) item.r.heroSubline = null;
    });
  }

  fs.writeFileSync(RELEASE_DEF_PATH, JSON.stringify(releaseDefs, null, 2), "utf8");
  console.log("Deduplicated whyItMatters: " + replaced + " releases updated. No text appears more than twice.");
  console.log("Deduplicated heroSubline: " + sublineReplaced + " releases updated (Daytona/El Primero unchanged).");
}

main();
