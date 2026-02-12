/**
 * era_definitions.json の各 era に heroSubline を追加する。
 * summary と重複しない一文（Wikipedia/一般情報風）。El Primero / Daytona は触れない。
 * node scripts/add_hero_sublines.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ERA_DEF_PATH = path.join(ROOT, "data", "era_definitions.json");

const SKIP_COLLECTIONS = new Set(["daytona", "el-primero"]);

const HERO_SUBLINES = {
  carrera: {
    origins: "レーシング由来の名前付きクロノグラフ。",
    "quartz-era": "クォーツ・デジタルへ移行した時期。",
    "modern-revival": "インハウスムーブで復活したスポーツクロノ。",
  },
  monaco: {
    debut: "角型ケースの自動巻きクロノとしてデビュー。",
    "quartz-period": "角型デザインを継承したクォーツ期。",
    modern: "ル・マンや映画と結びついたアイコンモデル。",
  },
  autavia: {
    "first-era": "レーシング・航空向けの名前付きクロノ。",
    revival: "レトロダイアルで復刻した現行ライン。",
  },
  speedmaster: {
    "caliber-321": "NASA採用から月面着陸まで。",
    "861-1861": "ムーンウォッチの定番キャリバー時代。",
    modern: "マスタークロノメーター認定の現行仕様。",
  },
  seamaster: {
    early: "日常用防水ラインの起点。",
    "diver-line": "本格ダイバー仕様の確立期。",
    modern: "ボンド着用で知られる300mダイバー。",
  },
  constellation: {
    early: "高精度ドレスウォッチとして確立。",
    "quartz-manhattan": "マンハッタンケースで人気を広げた時期。",
    modern: "至臻天文台認定の現行ライン。",
  },
  defy: {
    original: "角型・耐磁の実験的ライン。",
    "revival-modern": "1/100秒やスケルトンなど前衛ライン。",
  },
  pilot: {
    contemporary: "航空計器風の大径クロノグラフ。",
  },
  navitimer: {
    "slide-rule": "航空計算尺ベゼルでパイロットに採用。",
    evolution: "スライドルール継承のうえで進化。",
    modern: "B01インハウスで再編した現行。",
  },
  chronomat: {
    origins: "F1連携で復活したスポーツクロノ。",
    modern: "B01と44mmの定番ライン。",
  },
  superocean: {
    early: "高防水ダイバーラインの誕生期。",
    modern: "Heritageなど多様な防水・サイズ。",
  },
  submariner: {
    "first-sub": "回転ベゼルとオイスターのダイバー確立。",
    "5512-5513": "クラウンガードのクラシック時代。",
    modern: "セラミックベゼルと現行キャリバー。",
  },
  datejust: {
    early: "日付窓付きオイスターの代表。",
    evolution: "サイズ・素材のバリエーション拡大。",
    modern: "36/41mmとフルートベゼルの定番。",
  },
};

function main() {
  const eraDefs = JSON.parse(fs.readFileSync(ERA_DEF_PATH, "utf8"));
  let added = 0;
  for (const [collSlug, list] of Object.entries(eraDefs)) {
    if (SKIP_COLLECTIONS.has(collSlug) || !Array.isArray(list)) continue;
    const map = HERO_SUBLINES[collSlug];
    if (!map) continue;
    for (const era of list) {
      const sub = map[era.slug];
      if (!sub) continue;
      const summary = (era.summary || "").trim();
      if (sub === summary || summary.startsWith(sub) || sub.startsWith(summary.slice(0, 20))) continue;
      era.heroSubline = sub;
      added++;
    }
  }
  fs.writeFileSync(ERA_DEF_PATH, JSON.stringify(eraDefs, null, 2), "utf8");
  console.log("Added heroSubline to " + added + " eras (daytona/el-primero skipped).");
}

main();
