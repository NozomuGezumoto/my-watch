/**
 * Wikipedia / Wikidata から15モデル分の事実データを取得し、seed 形式の JSON を出力する。
 * 依存: Node 18+ (組み込み fetch)。画像・価格・著作権文章は取得しない。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "data", "config.json");
const OUTPUT_PATH = path.join(ROOT, "data", "seed.json");

const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";

async function apiGet(url, params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${url}?${qs}`, {
    headers: { "User-Agent": "ProjectWatch/1.0" },
  });
  return res.json();
}

async function wikipediaGetQid(title) {
  const data = await apiGet(WIKIPEDIA_API, {
    action: "query",
    format: "json",
    formatversion: "2",
    titles: title,
    prop: "pageprops",
    ppprop: "wikibase_item",
  });
  const pages = data?.query?.pages ?? [];
  if (!pages.length || pages[0].missing) return null;
  return pages[0].pageprops?.wikibase_item ?? null;
}

/** Wikipedia で QID が取れない場合、Wikidata 検索で候補を1件取得。 */
async function wikidataSearchFirst(searchText) {
  const data = await apiGet(WIKIDATA_API, {
    action: "wbsearchentities",
    format: "json",
    search: searchText,
    language: "en",
    limit: 5,
  });
  const list = data?.search ?? [];
  return list.length ? list[0].id : null;
}

async function wikidataGetEntity(qid) {
  const data = await apiGet(WIKIDATA_API, {
    action: "wbgetentities",
    format: "json",
    ids: qid,
    props: "claims|labels",
    languages: "en",
  });
  return data?.entities?.[qid];
}

function parseWikidataYear(claimList) {
  if (!claimList?.length) return null;
  const snak = claimList[0].mainsnak ?? {};
  if (snak.snaktype !== "value") return null;
  const timeStr = snak.datavalue?.value?.time;
  if (!timeStr) return null;
  const m = /\+?(-?\d{4})/.exec(timeStr);
  return m ? parseInt(m[1], 10) : null;
}

function wikidataGetLabel(entity, lang = "en") {
  return entity?.labels?.[lang]?.value ?? "";
}

function wikidataGetSubclassType(entity) {
  const claims = entity?.claims?.P279 ?? [];
  for (const c of claims.slice(0, 3)) {
    const qid = c.mainsnak?.datavalue?.value?.id;
    if (qid === "Q678894") return "diving";   // diving watch
    if (qid === "Q268592") return "chronograph";
  }
  return null;
}

function buildBrand(brandConfig, qid, entity) {
  if (!entity || entity.missing) {
    return {
      id: brandConfig.id,
      slug: brandConfig.slug,
      name: brandConfig.name,
      nameEn: brandConfig.name,
      foundedYear: null,
      country: null,
      descriptionSummary: null,
      wikidataQid: qid,
      wikipediaSlug: brandConfig.wikipediaTitle.replace(/_/g, " "),
      sortOrder: 0,
    };
  }
  const claims = entity.claims ?? {};
  const founded = parseWikidataYear(claims.P571);
  let country = null;
  for (const pid of ["P17", "P159"]) {
    const list = claims[pid];
    if (list?.length && list[0].mainsnak?.datavalue?.value?.id) {
      country = list[0].mainsnak.datavalue.value.id;
      break;
    }
  }
  return {
    id: brandConfig.id,
    slug: brandConfig.slug,
    name: brandConfig.name,
    nameEn: wikidataGetLabel(entity) || brandConfig.name,
    foundedYear: founded,
    country,
    descriptionSummary: null,
    wikidataQid: qid,
    wikipediaSlug: brandConfig.wikipediaTitle.replace(/_/g, " "),
    sortOrder: 0,
  };
}

function buildCollection(collConfig, qid, entity, collectionIndex) {
  if (!entity || entity.missing) {
    return {
      id: `coll-${collConfig.slug}`,
      brandId: collConfig.brandId,
      slug: collConfig.slug,
      name: collConfig.name,
      nameEn: collConfig.name,
      type: null,
      introducedYear: null,
      discontinuedYear: null,
      descriptionSummary: null,
      wikidataQid: qid,
      wikipediaSlug: collConfig.wikipediaTitle.replace(/_/g, " "),
      commonsCategory: null,
      sortOrder: collectionIndex,
    };
  }
  const claims = entity.claims ?? {};
  const intro = parseWikidataYear(claims.P571);
  const disco = parseWikidataYear(claims.P2669) ?? parseWikidataYear(claims.P576);
  const p373 = claims.P373?.[0];
  const commons = p373?.mainsnak?.datavalue?.value ?? null;
  const watchType = wikidataGetSubclassType(entity);
  return {
    id: `coll-${collConfig.slug}`,
    brandId: collConfig.brandId,
    slug: collConfig.slug,
    name: collConfig.name,
    nameEn: wikidataGetLabel(entity) || collConfig.name,
    type: watchType,
    introducedYear: intro,
    discontinuedYear: disco,
    descriptionSummary: null,
    wikidataQid: qid,
    wikipediaSlug: collConfig.wikipediaTitle.replace(/_/g, " "),
    commonsCategory: commons,
    sortOrder: collectionIndex,
  };
}

function buildEra(collection, sortOrder) {
  const start = collection.introducedYear ?? 1900;
  const end = collection.discontinuedYear;
  return {
    id: `era-${collection.slug}`,
    collectionId: collection.id,
    slug: `${collection.slug}-main`,
    name: `${start}年〜` + (end ? `${end}年` : "現在"),
    nameEn: end ? `${start}-${end}` : `${start}-present`,
    startYear: start,
    endYear: end ?? null,
    summary: null,
    keyFacts: [],
    events: [],
    sortOrder,
  };
}

function buildVariantPlaceholder(era, sortOrder) {
  const base = era.collectionId.replace("coll-", "");
  return {
    id: `var-${base}-main`,
    eraId: era.id,
    slug: `${base}-representative`,
    name: "代表モデル（要補足）",
    nameEn: "Representative (to be filled)",
    movementType: null,
    caliber: null,
    caseSizeMm: null,
    caseMaterial: null,
    waterResistanceM: null,
    crystal: null,
    bezel: null,
    braceletStrap: [],
    dialColor: null,
    keyFacts: [],
    wikidataQid: null,
    imageSource: null,
    sortOrder,
  };
}

async function main() {
  console.log("Loading config...");
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  const { brands: brandsConfig, collections: collectionsConfig } = config;

  const seed = {
    version: "1.0",
    source: "Wikipedia + Wikidata API (fetched)",
    brands: [],
    collections: [],
    eras: [],
    variants: [],
    userOwnedWatches: [],
  };

  console.log("Fetching brands...");
  for (let i = 0; i < brandsConfig.length; i++) {
    const bc = brandsConfig[i];
    const qid = await wikipediaGetQid(bc.wikipediaTitle);
    if (!qid) {
      console.warn(`  WARN: No QID for brand ${bc.name} (${bc.wikipediaTitle})`);
      seed.brands.push(buildBrand(bc, null, null));
    } else {
      const entity = await wikidataGetEntity(qid);
      seed.brands.push(buildBrand(bc, qid, entity));
    }
    seed.brands[seed.brands.length - 1].sortOrder = i + 1;
  }

  console.log("Fetching collections...");
  for (let i = 0; i < collectionsConfig.length; i++) {
    const cc = collectionsConfig[i];
    let qid = cc.wikidataQidOverride ?? (await wikipediaGetQid(cc.wikipediaTitle));
    if (!qid) {
      const brand = seed.brands.find((b) => b.id === cc.brandId);
      const brandName = brand?.name ?? "";
      qid = await wikidataSearchFirst(`${brandName} ${cc.name}`);
      if (!qid) qid = await wikidataSearchFirst(cc.name);
      if (qid) console.log(`  Fallback QID for ${cc.name}: ${qid}`);
      else console.warn(`  WARN: No QID for ${cc.name} (${cc.wikipediaTitle})`);
    }
    let coll;
    if (!qid) {
      coll = buildCollection(cc, null, null, i + 1);
    } else {
      const entity = await wikidataGetEntity(qid);
      coll = buildCollection(cc, qid, entity, i + 1);
    }
    seed.collections.push(coll);

    const era = buildEra(coll, 1);
    seed.eras.push(era);
    seed.variants.push(buildVariantPlaceholder(era, 1));
  }

  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(seed, null, 2), "utf-8");
  console.log(`Written: ${OUTPUT_PATH}`);
  console.log(`  brands: ${seed.brands.length}, collections: ${seed.collections.length}, eras: ${seed.eras.length}, variants: ${seed.variants.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
