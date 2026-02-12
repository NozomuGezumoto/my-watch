/**
 * 各コレクションの Wikipedia 記事イントロを取得し、
 * ヒーロー用の summary / heroSubline を era ごとに割り当てて保存する。
 * 使いまわしの汎用フレーズではなく、Wikipedia から得られる内容を入れる。
 * node scripts/fetch_wikipedia_hero_content.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "data", "config.json");
const ERA_DEF_PATH = path.join(ROOT, "data", "era_definitions.json");
const OUT_PATH = path.join(ROOT, "data", "wikipedia_hero_content.json");

const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";

async function apiGet(params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${WIKIPEDIA_API}?${qs}`, {
    headers: { "User-Agent": "ProjectWatch/1.0 (Wikipedia hero content)" },
  });
  return res.json();
}

/** 記事タイトルでイントロ取得。最大10文。 */
async function fetchExtract(title) {
  const data = await apiGet({
    action: "query",
    format: "json",
    formatversion: "2",
    titles: title,
    prop: "extracts",
    exintro: true,
    explaintext: true,
    exsentences: 10,
    exsectionformat: "plain",
  });
  const pages = data?.query?.pages ?? [];
  if (!pages.length || pages[0].missing) return null;
  const text = pages[0].extract?.trim() ?? "";
  return text || null;
}

/** 英文を文単位に分割（簡易）。 */
function splitSentences(enText) {
  if (!enText) return [];
  return enText
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 英文1文を短い日本語説明に（要約スタイル）。ここでは英文をそのまま保存し、表示側で翻訳するか、手動で日本語を補う。 */
function toHeroLine(enSentence) {
  const max = 80;
  if (!enSentence) return "";
  const t = enSentence.trim();
  return t.length > max ? t.slice(0, max).replace(/\s+\S*$/, "") + "…" : t;
}

async function main() {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  const eraDefs = JSON.parse(fs.readFileSync(ERA_DEF_PATH, "utf-8"));
  const out = { description: "Wikipedia intro extracts per collection, mapped to era slugs for hero content.", byCollection: {} };
  const collections = config.collections || [];
  let fetched = 0;
  let missing = 0;
  for (const coll of collections) {
    const slug = coll.slug;
    const title = coll.wikipediaTitle || coll.name?.replace(/\s/g, "_");
    const eraList = eraDefs[slug];
    if (!eraList || !Array.isArray(eraList)) {
      out.byCollection[slug] = { error: "no era list", eras: {} };
      continue;
    }
    const extract = await fetchExtract(title);
    if (!extract) {
      missing++;
      out.byCollection[slug] = { error: "missing or empty extract", title, eras: {} };
      continue;
    }
    fetched++;
    const sentences = splitSentences(extract);
    const byEra = {};
    eraList.forEach((era, i) => {
      const eraSlug = era.slug;
      const sent = sentences[i % sentences.length] || sentences[0] || extract.slice(0, 200);
      byEra[eraSlug] = {
        summary: sent,
        heroSubline: toHeroLine(sent),
        source: "Wikipedia intro",
      };
    });
    out.byCollection[slug] = { title, extract: extract.slice(0, 500), sentences: sentences.length, eras: byEra };
    await new Promise((r) => setTimeout(r, 300));
  }
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf-8");
  console.log(`Fetched ${fetched} collections, ${missing} missing. Written: ${OUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
