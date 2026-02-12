# データ取得

## 実行方法

```bash
# プロジェクトルートで
node scripts/fetch_watch_data.mjs
```

- **入力**: `data/config.json`（対象ブランド・15コレクションの Wikipedia 記事タイトル）
- **出力**: `data/seed.json`（DESIGN のスキーマに沿った seed 用 JSON）
- **前提**: Node 18+（組み込み `fetch` 使用）。ネットワーク必要。

## 取得の流れ

1. **ブランド**: 各ブランドの英語版 Wikipedia 記事から Wikidata QID を取得 → Wikidata から設立年・国などを取得。
2. **コレクション**: 各モデルの英語版 Wikipedia から QID を取得。取れない場合は「ブランド名 + モデル名」で Wikidata 検索して候補を1件取得。
3. **Era / Variant**: 現状は「1 Collection = 1 Era = 1 Variant（プレースホルダー）」で出力。詳細な年代・派生は手動追加または別スクリプトで対応。

## 誤マッチしたとき

Wikidata 検索で別人・別物（例: 「Pilot」で飛行士がヒットする）になることがあります。  
そのコレクションに正しい QID が分かっている場合は、`config.json` の当該コレクションに **`wikidataQidOverride`** を追加すると、Wikipedia・検索の代わりにその QID を利用します。

例（Omega Speedmaster を確実に Q1414495 にする）:

```json
{ "brandId": "brand-omega", "slug": "speedmaster", "name": "Speedmaster", "wikipediaTitle": "Omega_Speedmaster", "wikidataQidOverride": "Q1414495" }
```

## ファイル

| ファイル | 説明 |
|----------|------|
| `config.json` | 取得対象のブランド・コレクション一覧と Wikipedia タイトル |
| `collection_overrides.json` | 各コレクションの **introducedYear**・**type** の補完値（P571 が無い場合など）。slug をキーに指定。 |
| `era_definitions.json` | 各コレクションの **Era を 3〜6 ノード**で定義。slug をキーに、`slug` / `name` / `nameEn` / `startYear` / `endYear` / `summary` / `keyFacts` / `events` の配列。 |
| `seed.json` | 取得結果。アプリの初期データとして利用する想定 |

スクリプトは `collection_overrides.json` と `era_definitions.json` が存在すれば読み込み、`introducedYear`・`type` の補完と複数 Era の生成に使う。
