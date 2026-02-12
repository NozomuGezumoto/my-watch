/**
 * era_definitions の全 era に watchHistoryContext が無い場合のみ追加する。
 * 表示年代に沿った時計史の一文を付与（重複可）。
 * node scripts/add_watch_history_context.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ERA_DEF_PATH = path.join(__dirname, "..", "data", "era_definitions.json");

// 年代ごとに時計史の内容を明確に変える（時代なりの変化が分かるように細かく区分）
const PERIOD_BULLETS = {
  "1945-1955": [
    "戦後復興期。スイス時計産業の再建と輸出拡大。",
    "防水技術の民生化が始まり、オイスター等が実用化した時期。",
  ],
  "1955-1962": [
    "スポーツウォッチの胎動。ダイバー・クロノの実用化が各社で進んだ時期。",
    "名前付きラインの前夜。ドレスからスポーツまでラインが広がり始めた時期。",
  ],
  "1962-1969": [
    "名前付きスポーツクロノの登場期。ヘウエル・ロレックス等がラインを確立。",
    "スポーツクロノ・ダイバー需要の高まり。レーシング・航空との結びつきが強まった時期。",
  ],
  "1969-1975": [
    "自動巻きクロノグラフの開発競争。複数メーカーが同年に発表した「自動巻きクロノ元年」前後。",
    "高振動ムーブメントの実用化。角型・スポーツクロノのデザインが多様化した時期。",
  ],
  "1970-1978": [
    "クォーツショック真っ只中。スイス機械式の生産縮小と日本クォーツの台頭。",
    "電池式の精度・価格で機械式が圧迫され、業界再編が進んだ時期。",
  ],
  "1978-1985": [
    "クォーツ全盛期。スイスも電池式へ本格移行し、機械式はニッチ化。",
    "機械式高振動を維持した稀有なムーブメントが、後に再評価される土壌ができた時期。",
  ],
  "1985-1995": [
    "機械式復権の兆し。スイス高級時計の再評価が始まった時期。",
    "スポーツクロノの機械式ラインが再び注目され始めた時期。",
  ],
  "1995-2002": [
    "機械式スポーツクロノの復活。映画・文化と結びついたアイコンが再注目された時期。",
    "ヴィンテージ人気の芽生え。限定復刻やホームコメが増え始めた時期。",
  ],
  "2002-2010": [
    "インハウスムーブメントの台頭。大径ケースの流行が本格化した時期。",
    "マスタークロノメーター等の高精度認定が広がり始めた時期。",
  ],
  "2010-2017": [
    "パイロット・航空系クロノの再評価。スポーツクロノの高級化が定着。",
    "ヴィンテージ・復刻人気の高まり。コレクター市場が拡大した時期。",
  ],
  "2017-": [
    "ヴィンテージ・復刻ブームの定着。コレクター市場の拡大と再販価格の注目。",
    "機械式の再評価が一般化し、復刻・限定モデルが各社の顔になった時期。",
  ],
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

/** 長期 era は startYear で時代を代表（90年〜2020年で同じにならないように）。短い era は中点。 */
function pickContext(startYear, endYear) {
  const end = endYear ?? new Date().getFullYear();
  const span = startYear != null ? end - startYear : 0;
  const year = startYear ?? end;
  const useStart = span > 12;
  const pickYear = useStart ? startYear : (startYear != null ? Math.floor((startYear + end) / 2) : end);
  return yearToBand(pickYear);
}

// そのまま残すコレクション（Daytona・El Primeroのみ。他は年代共通で上書きする）
const HAND_CURATED_COLLECTIONS = new Set(["daytona", "el-primero"]);

const data = JSON.parse(fs.readFileSync(ERA_DEF_PATH, "utf8"));
const refresh = process.argv.includes("--refresh");
let added = 0;
let refreshed = 0;
for (const [coll, eras] of Object.entries(data)) {
  if (!Array.isArray(eras)) continue;
  const isHandCurated = HAND_CURATED_COLLECTIONS.has(coll);
  for (const era of eras) {
    const ctx = pickContext(era.startYear, era.endYear ?? new Date().getFullYear());
    if (era.watchHistoryContext != null && era.watchHistoryContext.length > 0) {
      if (refresh && !isHandCurated) {
        era.watchHistoryContext = [...ctx];
        refreshed++;
      }
      continue;
    }
    era.watchHistoryContext = [...ctx];
    added++;
  }
}
fs.writeFileSync(ERA_DEF_PATH, JSON.stringify(data, null, 2), "utf8");
console.log("Added:", added, "Refreshed:", refreshed);
