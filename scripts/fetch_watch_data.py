#!/usr/bin/env python3
"""
Wikipedia / Wikidata から15モデル分の事実データを取得し、seed 形式の JSON を出力する。
依存: 標準ライブラリのみ (urllib, json)。画像・価格・著作権文章は取得しない。
"""
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

# プロジェクトルート
ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "data" / "config.json"
OVERRIDES_PATH = ROOT / "data" / "collection_overrides.json"
ERA_DEFINITIONS_PATH = ROOT / "data" / "era_definitions.json"
OUTPUT_PATH = ROOT / "data" / "seed.json"

WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
WIKIDATA_API = "https://www.wikidata.org/w/api.php"
WIKIPEDIA_BASE = "https://en.wikipedia.org/wiki/"

# 用途タイプのマッピング (Wikidata QID or label -> our type slug)
TYPE_MAP = {
    "chronograph": "chronograph",
    "diving watch": "diving",
    "diver's watch": "diving",
    "pilot watch": "pilot",
    "aviation watch": "pilot",
    "dress watch": "dress",
    "racing": "racing",
    "dive watch": "diving",
}


def api_get(url, params):
    qs = urllib.parse.urlencode(params)
    req = urllib.request.Request(f"{url}?{qs}", headers={"User-Agent": "ProjectWatch/1.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode())


def wikipedia_get_qid(title):
    """Wikipedia 記事タイトルから Wikidata QID を取得。"""
    params = {
        "action": "query",
        "format": "json",
        "formatversion": "2",
        "titles": title,
        "prop": "pageprops",
        "ppprop": "wikibase_item",
    }
    data = api_get(WIKIPEDIA_API, params)
    pages = data.get("query", {}).get("pages", [])
    if not pages or "missing" in pages[0]:
        return None
    return pages[0].get("pageprops", {}).get("wikibase_item")


def wikidata_search_first(search_text):
    """Wikipedia で QID が取れない場合、Wikidata 検索で候補を1件取得。"""
    params = {
        "action": "wbsearchentities",
        "format": "json",
        "search": search_text,
        "language": "en",
        "limit": 5,
    }
    data = api_get(WIKIDATA_API, params)
    search = data.get("search", [])
    return search[0]["id"] if search else None


def wikidata_get_entity(qid, props="claims|labels|descriptions"):
    """Wikidata エンティティを取得（claims + labels + descriptions）。"""
    params = {
        "action": "wbgetentities",
        "format": "json",
        "ids": qid,
        "props": props,
        "languages": "en",
    }
    data = api_get(WIKIDATA_API, params)
    return data.get("entities", {}).get(qid)


def parse_wikidata_year(claim_list):
    """P571 / P2669 等の time から年を抽出。"""
    if not claim_list:
        return None
    snak = claim_list[0].get("mainsnak", {})
    if snak.get("snaktype") != "value":
        return None
    val = snak.get("datavalue", {}).get("value", {})
    time_str = val.get("time")
    if not time_str:
        return None
    # "+1957-01-01T00:00:00Z" -> 1957
    m = re.match(r"\+?(-?\d{4})", time_str)
    return int(m.group(1)) if m else None


def wikidata_get_label(entity, lang="en"):
    """エンティティのラベルを取得。"""
    labels = entity.get("labels", {})
    return (labels.get(lang) or {}).get("value") or ""


def wikidata_get_subclass_type(entity):
    """P279 (subclass of) から用途タイプを推定。"""
    claims = entity.get("claims", {})
    for claim in claims.get("P279", [])[:3]:
        snak = claim.get("mainsnak", {})
        if snak.get("snaktype") != "value":
            continue
        qid = snak.get("datavalue", {}).get("value", {}).get("id")
        # よくある QID をチェック（必要なら拡張）
        if qid == "Q678894":  # diving watch
            return "diving"
        if qid == "Q268592":  # chronograph
            return "chronograph"
    return None


def resolve_wikidata_label(qid, cache=None):
    """QID の英語ラベルを取得（キャッシュ付き）。"""
    cache = cache or {}
    if qid in cache:
        return cache[qid]
    ent = wikidata_get_entity(qid)
    if not ent or "missing" in ent:
        cache[qid] = None
        return None
    cache[qid] = wikidata_get_label(ent)
    return cache[qid]


def build_brand(brand_config, qid, entity, label_cache=None):
    """Brand オブジェクトを組み立て。countryNameEn, wikipediaUrlEn を追加。"""
    label_cache = label_cache or {}
    wikipedia_url = WIKIPEDIA_BASE + brand_config["wikipediaTitle"]
    if not entity or "missing" in entity:
        return {
            "id": brand_config["id"],
            "slug": brand_config["slug"],
            "name": brand_config["name"],
            "nameEn": brand_config.get("name") or brand_config["name"],
            "foundedYear": None,
            "country": None,
            "countryNameEn": None,
            "descriptionSummary": None,
            "wikidataQid": qid,
            "wikipediaSlug": brand_config["wikipediaTitle"].replace("_", " "),
            "wikipediaUrlEn": wikipedia_url,
            "sortOrder": 0,
        }
    claims = entity.get("claims", {})
    founded = parse_wikidata_year(claims.get("P571"))
    country = None
    for pid in ("P17", "P159"):
        for c in claims.get(pid, [])[:1]:
            val = c.get("mainsnak", {}).get("datavalue", {}).get("value", {})
            q = val.get("id") if isinstance(val, dict) else None
            if q:
                country = q
                break
    country_name = resolve_wikidata_label(country, label_cache) if country else None
    return {
        "id": brand_config["id"],
        "slug": brand_config["slug"],
        "name": brand_config["name"],
        "nameEn": wikidata_get_label(entity) or brand_config["name"],
        "foundedYear": founded,
        "country": country,
        "countryNameEn": country_name,
        "descriptionSummary": None,
        "wikidataQid": qid,
        "wikipediaSlug": brand_config["wikipediaTitle"].replace("_", " "),
        "wikipediaUrlEn": wikipedia_url,
        "sortOrder": 0,
    }


def _is_likely_wrong_watch_entity(entity, coll_config):
    """Wikidata が別人・別物（人名・職業など）のときに True。その場合は config の名前を優先する。"""
    if not entity or "missing" in entity:
        return True
    label = (entity.get("labels") or {}).get("en", {}).get("value", "")
    desc = (entity.get("descriptions") or {}).get("en", {}).get("value", "").lower()
    # 時計以外がヒットしたパターン（人名・職業・姓など）
    wrong_patterns = (
        "surname", "bailey", "aircraft pilot", "aviators",
        "pilot (aeronautics)", "given name",
    )
    combined = f"{label} {desc}"
    if any(p in combined.lower() for p in wrong_patterns):
        return True
    # P31 instance of が product / model series でない場合も疑う（任意）
    claims = entity.get("claims", {})
    for c in claims.get("P31", [])[:2]:
        qid = c.get("mainsnak", {}).get("datavalue", {}).get("value", {}).get("id")
        if qid in ("Q2424752", "Q811701"):  # product, model series
            return False
    return False


def build_collection(coll_config, qid, entity, collection_index, overrides=None):
    """Collection オブジェクトを組み立て。type 全件・introducedYear 補完・wikipediaUrlEn・variantOptions。"""
    overrides = overrides or {}
    intro_overrides = overrides.get("introducedYear", {})
    type_overrides = overrides.get("type", {})
    slug = coll_config["slug"]
    wikipedia_url = WIKIPEDIA_BASE + coll_config["wikipediaTitle"]
    base = {
        "id": f"coll-{slug}",
        "brandId": coll_config["brandId"],
        "slug": slug,
        "name": coll_config["name"],
        "nameEn": coll_config.get("name") or coll_config["name"],
        "type": type_overrides.get(slug),
        "introducedYear": intro_overrides.get(slug),
        "discontinuedYear": None,
        "descriptionSummary": None,
        "wikidataQid": qid,
        "wikipediaSlug": coll_config["wikipediaTitle"].replace("_", " "),
        "wikipediaUrlEn": wikipedia_url,
        "commonsCategory": None,
        "variantOptions": {
            "materials": [],
            "caseSizesMm": [],
            "movementTypes": [],
            "braceletStrap": [],
        },
        "sortOrder": collection_index,
    }
    if not entity or "missing" in entity:
        return base
    claims = entity.get("claims", {})
    intro = parse_wikidata_year(claims.get("P571")) or intro_overrides.get(slug)
    disco = parse_wikidata_year(claims.get("P2669")) or parse_wikidata_year(claims.get("P576"))
    p373 = claims.get("P373", [])
    commons = p373[0].get("mainsnak", {}).get("datavalue", {}).get("value") if p373 else None
    watch_type = wikidata_get_subclass_type(entity) or type_overrides.get(slug)
    use_config_name = _is_likely_wrong_watch_entity(entity, coll_config)
    name_en = coll_config["name"] if use_config_name else (wikidata_get_label(entity) or coll_config["name"])
    if use_config_name:
        commons = None
    base["nameEn"] = name_en
    base["type"] = watch_type
    base["introducedYear"] = intro
    base["discontinuedYear"] = disco
    base["commonsCategory"] = commons
    return base


def build_era_from_def(collection_id, coll_slug, def_era, sort_order):
    """era_definitions の1要素から Era を生成。"""
    return {
        "id": f"era-{coll_slug}-{def_era['slug']}",
        "collectionId": collection_id,
        "slug": f"{coll_slug}-{def_era['slug']}",
        "name": def_era["name"],
        "nameEn": def_era["nameEn"],
        "startYear": def_era["startYear"],
        "endYear": def_era.get("endYear"),
        "summary": def_era.get("summary"),
        "keyFacts": def_era.get("keyFacts") or [],
        "events": def_era.get("events") or [],
        "sortOrder": sort_order,
    }


def build_era_fallback(collection, sort_order):
    """era_definitions が無いときの1 Era フォールバック。"""
    cid = collection["id"]
    start = collection.get("introducedYear") or 1900
    end = collection.get("discontinuedYear")
    return {
        "id": f"era-{collection['slug']}-main",
        "collectionId": cid,
        "slug": f"{collection['slug']}-main",
        "name": f"{start}年〜" + (f"{end}年" if end else "現在"),
        "nameEn": f"{start}-present" if not end else f"{start}-{end}",
        "startYear": start,
        "endYear": end,
        "summary": None,
        "keyFacts": [],
        "events": [],
        "sortOrder": sort_order,
    }


def build_variant_placeholder(era, sort_order):
    """Era に1つプレースホルダー Variant を付与。"""
    coll_part = era["collectionId"].replace("coll-", "")
    return {
        "id": f"var-{coll_part}-{era['slug'].split('-')[-1]}",
        "eraId": era["id"],
        "slug": f"{coll_part}-{era['slug'].split('-')[-1]}-rep",
        "name": "代表モデル（要補足）",
        "nameEn": "Representative (to be filled)",
        "movementType": None,
        "caliber": None,
        "caseSizeMm": None,
        "caseMaterial": None,
        "waterResistanceM": None,
        "crystal": None,
        "bezel": None,
        "braceletStrap": [],
        "dialColor": None,
        "keyFacts": [],
        "wikidataQid": None,
        "imageSource": None,
        "sortOrder": sort_order,
    }


def main():
    print("Loading config...")
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    brands_config = config["brands"]
    collections_config = config["collections"]

    overrides = {}
    if OVERRIDES_PATH.exists():
        overrides = json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))
    era_definitions = {}
    if ERA_DEFINITIONS_PATH.exists():
        era_definitions = json.loads(ERA_DEFINITIONS_PATH.read_text(encoding="utf-8"))

    seed = {
        "version": "1.0",
        "source": "Wikipedia + Wikidata API (fetched)",
        "brands": [],
        "collections": [],
        "eras": [],
        "variants": [],
        "userOwnedWatches": [],
    }
    label_cache = {}

    # 1) Brands: Wikipedia -> QID -> Wikidata（countryNameEn, wikipediaUrlEn）
    print("Fetching brands...")
    for i, bc in enumerate(brands_config):
        qid = wikipedia_get_qid(bc["wikipediaTitle"])
        if not qid:
            print(f"  WARN: No QID for brand {bc['name']} ({bc['wikipediaTitle']})")
            b = build_brand(bc, None, None, label_cache)
            b["wikipediaUrlEn"] = WIKIPEDIA_BASE + bc["wikipediaTitle"]
            seed["brands"].append(b)
            continue
        entity = wikidata_get_entity(qid)
        seed["brands"].append(build_brand(bc, qid, entity, label_cache))
        seed["brands"][-1]["sortOrder"] = i + 1

    # 2) Collections: overrides で type / introducedYear 補完、wikipediaUrlEn, variantOptions
    print("Fetching collections...")
    for i, cc in enumerate(collections_config):
        qid = cc.get("wikidataQidOverride") or wikipedia_get_qid(cc["wikipediaTitle"])
        if not qid:
            brand = next((b for b in seed["brands"] if b["id"] == cc["brandId"]), None)
            brand_name = brand["name"] if brand else ""
            qid = wikidata_search_first(f"{brand_name} {cc['name']}")
            if not qid:
                qid = wikidata_search_first(cc["name"])
            if qid:
                print(f"  Fallback QID for {cc['name']}: {qid}")
            else:
                print(f"  WARN: No QID for {cc['name']} ({cc['wikipediaTitle']})")
        if not qid:
            coll = build_collection(cc, None, None, i + 1, overrides)
        else:
            entity = wikidata_get_entity(qid)
            coll = build_collection(cc, qid, entity, i + 1, overrides)
        seed["collections"].append(coll)

    # 3) Eras: era_definitions があれば複数/コレクション、なければ1つフォールバック
    print("Building eras and variants...")
    for coll in seed["collections"]:
        coll_slug = coll["slug"]
        defs = era_definitions.get(coll_slug)
        if defs:
            for so, def_era in enumerate(defs, 1):
                era = build_era_from_def(coll["id"], coll_slug, def_era, so)
                seed["eras"].append(era)
                seed["variants"].append(build_variant_placeholder(era, 1))
        else:
            era = build_era_fallback(coll, 1)
            seed["eras"].append(era)
            seed["variants"].append(build_variant_placeholder(era, 1))

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(seed, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Written: {OUTPUT_PATH}")
    print(f"  brands: {len(seed['brands'])}, collections: {len(seed['collections'])}, eras: {len(seed['eras'])}, variants: {len(seed['variants'])}")


if __name__ == "__main__":
    main()
