# ChatGPT に渡す用（データ確認・検証）

## 手順

1. **1通目**: 下の「依頼文」をコピーして ChatGPT に送る。
2. **2通目**: 同じフォルダの **`seed_pretty.json`** を開き、中身を**すべてコピー**して、「以下が seed データです」と添えて送る。

（1通目に依頼文と JSON をまとめて送っても可。その場合は依頼文のあとに「以下がデータです」と書き、続けて seed_pretty.json の内容を貼る。）

---

## 依頼文（これをコピー）

```
高級腕時計の「歴史・進化・派生」を体験できるモバイルアプリ用の seed データです。
Wikipedia / Wikidata + 補完データから生成済みで、先の指摘を反映して改善しました。

現在の構造:
- brands: 5。countryNameEn（国・所在地のラベル）、wikipediaUrlEn（確定URL）を追加済み。
- collections: 15。introducedYear は全件入り、type（chronograph/diving/dress/pilot/sport）も全件。wikipediaUrlEn、variantOptions（素材/サイズ/ムーブ/ベルトの選択肢の器）あり。
- eras: コレクションあたり 1〜3 ノード（計41）。summary / keyFacts / events を一部に入れ済み。年代スライダー用。
- variants: 各 era に1件のプレースホルダー（計41）。詳細は variantOptions で拡張する想定。
- userOwnedWatches: 空（ユーザーが「持っている時計」を紐づける用）。

お願い（確認・検証）:
1. このデータで「年代スライダー」「コレクション一覧」「ユーザー所有の紐づけ」が成立するか、不足や矛盾がないか観点で簡潔にチェックしてください。
2. brands の countryNameEn が都市名（La Chaux-de-Fonds, Geneva 等）になっています。国名「Switzerland」で表示したい場合の扱い（データ側で直すか、表示で「スイス」にマッピングするか）の提案を1〜2文でください。
3. まだ空のままの項目（descriptionSummary、variantOptions の配列の中身）を今後埋める際の優先順位やコツがあれば教えてください。
```

---

## データの場所

- **ファイル**: `data/seed_pretty.json`  
- 上記依頼の「2通目」で、このファイルの中身をそのまま送ってください。  
- （`seed.json` と同期済みの最新データです。）
