/**
 * 左側に表示している年（yearFrom–yearTo）をキーに、年代共通の「時計史全体の動き」文言を返す。
 * add_watch_history_context.mjs の PERIOD_BULLETS と同期すること。
 */
const PERIOD_BULLETS: Record<string, string[]> = {
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

function yearToBand(year: number): string[] {
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

/** 表示している左側の年（yearFrom–yearTo）をキーに、年代共通の時計史文言を返す。 */
export function getIndustryContextForYears(
  yearFrom: number,
  yearTo: number | null
): string[] {
  const end = yearTo ?? new Date().getFullYear();
  const span = end - yearFrom;
  const useStart = span > 12;
  const pickYear = useStart ? yearFrom : Math.floor((yearFrom + end) / 2);
  return yearToBand(pickYear);
}

/** デイトナ・エルプリメロは seed の個別文言を使うため、年代共通キーを使わない。 */
export const USE_SEED_CONTEXT_COLLECTIONS = new Set(["daytona", "el-primero"]);
