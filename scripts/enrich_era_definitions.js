/**
 * era_definitions.json の空の keyFacts と薄い summary を、
 * 一般的な時計史・Wikipedia レベルの知識で補強する。
 * node scripts/enrich_era_definitions.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ERA_DEF_PATH = path.join(ROOT, "data", "era_definitions.json");

const ENRICHMENTS = {
  carrera: {
    "quartz-era": {
      summary: "スイス・クォーツショック期。機械式からクォーツへ移行し、カレラもクォーツモデルを展開。",
      keyFacts: ["クォーツ移行", "機械式縮小"],
    },
    "modern-revival": {
      keyFacts: ["Cal.1887", "Heuer 02", "スポーツクロノ復活"],
    },
  },
  monaco: {
    "quartz-period": {
      summary: "クォーツモデルの展開。角型ケースは継続。",
      keyFacts: ["クォーツ移行", "角型ケース継続"],
    },
    modern: {
      keyFacts: ["ル・マン", "スティーブ・マックイーン", "角型デザイン継承"],
    },
  },
  autavia: {
    revival: {
      keyFacts: ["2017年復刻", "Cal.5 自動巻き", "レトロダイアル"],
    },
  },
  speedmaster: {
    "861-1861": {
      summary: "ムーンウォッチの定番ライン。月面着陸後もNASA採用継続。",
      keyFacts: ["キャリバー861→1861", "月面着陸後も採用", "プロフェッショナル"],
    },
    modern: {
      keyFacts: ["Cal.3861", "マスタークロノメーター", "サファイアバック"],
    },
  },
  seamaster: {
    "diver-line": {
      summary: "300m等のダイバー仕様の拡充。プロフェッショナルライン確立。",
      keyFacts: ["300m防水", "ダイバー専用", "一方向ベゼル"],
    },
    modern: {
      summary: "ジェームズ・ボンド着用で人気。コアキシャルムーブメント。",
      keyFacts: ["ジェームズ・ボンド", "コアキシャル", "300mダイバー"],
    },
  },
  constellation: {
    "quartz-manhattan": {
      summary: "クォーツとマンハッタンケースで人気。",
      keyFacts: ["マンハッタンケース", "クォーツ"],
    },
    modern: {
      summary: "至臻天文台認定。36/41mm 等現行ライン。",
      keyFacts: ["至臻天文台", "36/41mm"],
    },
  },
  "el-primero": {
    survival: {
      summary: "クォーツ危機を乗り越え他社にも供給。ロレックス・デイトナ用4030の母胎に。",
      keyFacts: ["ロレックス4030供給", "復興"],
    },
    modern: {
      summary: "Chronomaster 等。36,000vph の価値が再評価。",
      keyFacts: ["Chronomaster", "36,000vph継承"],
    },
  },
  defy: {
    "revival-modern": {
      summary: "Defy Classic / Defy Extreme / Defy 21（1/100秒）等。",
      keyFacts: ["Defy 21", "1/100秒計測"],
    },
  },
  navitimer: {
    evolution: {
      summary: "クォーツ・自動の両ライン。スライドルールは継続。",
      keyFacts: ["クォーツ・自動", "スライドルール継続"],
    },
    modern: {
      keyFacts: ["B01キャリバー", "インハウス"],
    },
  },
  chronomat: {
    modern: {
      keyFacts: ["B01", "44mm", "F1連携"],
    },
  },
  superocean: {
    modern: {
      summary: "多様な防水・サイズ。 Heritage 等。",
      keyFacts: ["多様な防水", "Heritage"],
    },
  },
  submariner: {
    "5512-5513": {
      summary: "クラシックダイバーの定番。クラウンガード・200m防水。",
      keyFacts: ["クラウンガード", "200m", "Ref.5512/5513"],
    },
    modern: {
      summary: "セラミックベゼル・3235等現行。",
      keyFacts: ["セラミックベゼル", "Cal.3235"],
    },
  },
  datejust: {
    evolution: {
      summary: "サイズ・素材のバリエーション。日付表示の定番化。",
      keyFacts: ["サイズ・素材", "日付表示定番"],
    },
    modern: {
      summary: "36/41mm 等現行ライン。フルートベゼル。",
      keyFacts: ["41mm", "36mm", "フルートベゼル"],
    },
  },
};

function main() {
  const data = JSON.parse(fs.readFileSync(ERA_DEF_PATH, "utf8"));
  let updated = 0;

  for (const [collSlug, entries] of Object.entries(data)) {
    if (!Array.isArray(entries)) continue;
    const map = ENRICHMENTS[collSlug];
    if (!map) continue;

    for (const era of entries) {
      const slug = era.slug;
      const enrich = map[slug];
      if (!enrich) continue;

      if (enrich.summary != null) {
        era.summary = enrich.summary;
        updated++;
      }
      if (enrich.keyFacts != null && Array.isArray(enrich.keyFacts) && (!era.keyFacts || era.keyFacts.length === 0)) {
        era.keyFacts = enrich.keyFacts;
        updated++;
      } else if (enrich.keyFacts != null && Array.isArray(enrich.keyFacts)) {
        era.keyFacts = enrich.keyFacts;
        updated++;
      }
    }
  }

  fs.writeFileSync(ERA_DEF_PATH, JSON.stringify(data, null, 2), "utf8");
  console.log(`Enriched era_definitions.json (${updated} updates).`);
}

main();
