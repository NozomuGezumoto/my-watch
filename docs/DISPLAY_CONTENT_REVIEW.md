# 表示内容の確認レポート（全箇所）

## 確認方針
- **確認のみ**（修正は行わない）。表示される文言・データの一貫性・欠損をチェックした。
- 対象: アプリ全画面の表示文言、seed.json / era_definitions の内容、静的コピー。

---

## 0. 全体サマリ

| 対象 | 結果 | 備考 |
|------|------|------|
| アプリ静的文言（読み込み中・エラー・ナビ・見出し） | ✓ | 日本語で統一、不足なし。 |
| ブランド・コレクション一覧 | ✓ | 5ブランド・15コレクション、name / type / introducedYear 揃い。 |
| 年代ビュー（Timeline） | ✓ | milestone.label・年表示が seed と一致。 |
| マイ時計 | ✓ | コレクション・milestone・refGroup の表示が seed 参照で一貫。 |
| コレクション詳細（ヒーロー・時計史・差分・仕様・Ref） | ✓ | 下記セクションで詳細。 |
| seed の必須テキスト | ✓ | 空の label / whyItMatters / name は 0 件。 |
| refGroups の tagline | — | 未使用（任意のため問題なし）。 |

---

## 確認日・範囲（時計史）
- 年代共通の PERIOD_BULLETS（スクリプト・アプリ両方）
- era_definitions の watchHistoryContext（全コレクション）
- 検証スクリプトによる era 一致確認

---

## 1. 年代共通の文言（11 区分）

| 年代帯 | 内容の方向性 | 評価 |
|--------|----------------|------|
| 1945-1955 | 戦後復興・防水の民生化 | 適切。オイスター等の具体例あり。 |
| 1955-1962 | スポーツウォッチ胎動・名前付きラインの前夜 | 適切。次の時代への橋渡しが明確。 |
| 1962-1969 | 名前付きスポーツクロノ登場・レーシング・航空 | 適切。ヘウエル・ロレックス等の具体名。 |
| 1969-1975 | 自動巻きクロノ元年・高振動・角型多様化 | 適切。「元年」で印象が残る。 |
| 1970-1978 | クォーツショック真っ只中・日本クォーツ台頭 | 適切。業界再編まで言及。 |
| 1978-1985 | クォーツ全盛・機械式ニッチ・再評価の土壌 | 適切。後の復権への伏線。 |
| 1985-1995 | 機械式復権の兆し・スイス高級再評価 | 適切。短い年代で区切れている。 |
| 1995-2002 | 映画・文化とアイコン・ヴィンテージ芽生え | 適切。ホームコメ等の用語も良い。 |
| 2002-2010 | インハウス・大径ケース・マスタークロノメーター | 適切。技術・認定が分かる。 |
| 2010-2017 | パイロット・航空系再評価・コレクター市場拡大 | 適切。スポーツクロノの高級化が分かる。 |
| 2017- | ヴィンテージ・復刻ブーム定着・再販価格 | 適切。現代的で一貫している。 |

**総評**: 戦後〜現在まで、時計史の流れが一貫して追える。各帯 2 文で「業界の出来事＋その意味」が押さえられており、完成度は高い。

---

## 2. データ・ロジックの一貫性

- **スクリプトとアプリ**: `add_watch_history_context.mjs` の PERIOD_BULLETS と `app/src/periodContext.ts` の PERIOD_BULLETS は**完全一致**（文言・区分とも同じ）。
- **表示キー**: デイトナ・エルプリメロ以外は「左側の表示年」をキーに `getIndustryContextForYears(yFrom, yTo)` で文言を取得しており、**表示している年と内容がずれない**設計になっている。
- **era 定義**: デイトナ・エルプリメロ以外の 33 era は検証スクリプトで**すべて年代共通の理想と一致**（要更新 0）。
- **デイトナ・エルプリメロ**: era_definitions の watchHistoryContext がそのまま使われ、誕生〜存続〜現代の流れがモデルごとに書かれており、**個別性と史実のバランスが取れている**。

---

## 3. 軽微な注意点（維持用）

- **文言の更新**: 年代共通の文言を変える場合は、次の 3 か所を**同時に**揃える必要がある。
  - `scripts/add_watch_history_context.mjs`（PERIOD_BULLETS）
  - `app/src/periodContext.ts`（PERIOD_BULLETS）
  - `scripts/enrich_milestones.js`（PERIOD_BULLETS／リリース用）
- **検証**: データ更新後は `node scripts/verify_watch_history_context.mjs` で era 一致を確認すると安全。

---

## 4. 結論

- 時計史の流れが年代ごとに明確で、戦後復興からヴィンテージ・復刻ブームまで一通りカバーできている。
- 表示年をキーにした共通文言と、デイトナ・エルプリメロの個別文言の役割分担も明確で、**表示内容としての完成度は高い**と判断できる。

---

## 5. アプリ静的文言（App・各ビュー）

### App.tsx
- 「読み込み中…」「データの読み込みに失敗しました。」「データがありません。seed.json を確認してください。」→ エラー・空状態で適切。
- ヘッダー: 「Project Watch」「ブランド」「年代」「マイ時計」→ ナビと一貫。

### BrandsView
- 「ブランドから選ぶ」「ブランド → モデル → 進化の歴史 の順でたどれます。」→ 導線が明確。
- 「ブランドが見つかりません。」「← ブランド一覧」→ 存在。
- ブランド詳細: brand.name, countryNameEn, コレクション名・type・introducedYear を表示。データと一致。

### TimelineView
- 「年代で見る」「スライダーで年を選ぶと、その年の「進化点（Milestone）」を優先表示します。」→ 説明として適切。
- 「〇〇 年の進化点（Milestone）」「該当する進化点はありません。」「〇〇 年に存在したコレクション」「進化点 N 件」→ 表示内容と一致。

### MyWatchesView
- 「マイ時計」「あなたが持っている時計をコレクション・進化点・バリエーションに紐づけておけます。」→ 機能説明として適切。
- 「まだ登録されていません。」「ブランドから選んで追加」→ 空状態の導線あり。一覧は brand / coll / milestone.label / refGroup.label / variantMeta / customName を表示。seed 参照で一貫。

### CollectionView（文言のみ）
- 「コレクションが見つかりません。」→ 404 時。
- ヒーロー: 表示年（yearFrom–yearTo）、heroLabel（release.label または refGroup.label または milestone.label）、heroSubline、whyItMatters → すべて seed の milestone / release から取得。空文字はなし。
- 「時計史全体の動き」→ 上記セクション1–4のとおり年代共通 or デイトナ・エルプリメロ個別で表示。
- 画像注釈: 「公式画像は掲載していません。お持ちの時計を撮影した写真を、端末内に個人利用で保存して楽しめます。」→ 方針と一致。
- 「この世代で存在する主な Ref（型番）」、refGroup.label、tagline（任意・未設定なら非表示）→ 問題なし。
- 「この世代のポイント」、delta（追加・変更・廃止）→ milestone / release の delta と一致。
- 「世代の違い」: howToSpot ありなら表示、なければ共通フォールバック（ダイアル刻印・ベゼル・ケース径・ムーブ・ブレス等）→ 妥当。
- 「型番の仕様」: specSnapshot（ムーブ・キャリバー・ケース径・防水・素材・ベゼル・ベルト・ダイアル）→ データあり時のみ表示、不足時は「—」。
- 「このリリースで選べる仕様（選択肢一覧）」、variantMap のチップ→ データと一致。
- 「マイ時計に追加」「追加済み」「追加しました」「削除」「Wikipedia（英語）」「左右にスワイプで切り替え」→ すべて適切。

---

## 6. データ内容（seed.json）の確認

### brands（5件）
- id / slug / name / nameEn / foundedYear / country（QID） / countryNameEn / wikipediaUrlEn / sortOrder が存在。
- **注意**: countryNameEn は都市名（La Chaux-de-Fonds, Biel/Bienne, Geneva 等）になっている。DESIGN では「国名で表示したい場合の扱い」が for_chatgpt で言及済み。表示上は「所在地」として矛盾なし。

### collections（15件）
- 全件で name, slug, type, introducedYear, wikipediaUrlEn あり。design の 15 モデルと一致。descriptionSummary は null が多く、現状表示で未使用のため問題なし。

### eras（41件）
- name, startYear, endYear, summary, keyFacts, events, sortOrder を確認。タブ表示は era.name のみで、内容は era_definitions の watchHistoryContext と連携（デイトナ・エルプリメロは個別、他は年代共通）。欠損なし。

### milestones
- label, whyItMatters, heroSubline, delta（added/changed/removed）, howToSpot, industryContext, specSnapshot, variantMap が充実。サンプル（Speedmaster, Navitimer, Chronomat, Datejust, Submariner, Daytona）で史実・型番・キャリバーが一貫。**空の label / whyItMatters は 0 件**。

### releases
- milestoneId, yearFrom, yearTo, label, whyItMatters, heroSubline, delta, sortOrder, industryContext（enrich 済み）を確認。デイトナ・エルプリメロは seed の industryContext を表示、他は表示年から periodContext で算出。Autavia など同一 era 内で label が「初代オートビア」で重複するものあり（年代で区切られているため表示上は許容範囲）。

### refGroups
- releaseId, refCode, label, sortOrder, variantMap あり。**tagline は未使用**（任意のため表示されないだけ）。Daytona 等で「ステンレス・メタル/レザー（6239）」形式の label で型番が分かる。

---

## 7. 軽微な点（維持・改善の参考）

- **countryNameEn**: 国名ではなく都市名。国名表示にしたい場合は seed のマッピング or 表示側で「スイス」等に変換する運用を検討可。
- **delta の重複**: 一部 milestone で added に label と同文言が入ることがある（例: 「Chronomat 復活」）。表示上の重複は deltaFirstLine で 1 行目のみ強調しているため影響は小さい。
- **Autavia の release label**: 「初代オートビア」が複数 release で同じ。年範囲で区切られているため識別可能。必要なら「1964–1966 初代オートビア」のように年を前面にした表記に寄せる余地あり。

---

## 8. 総括（全箇所）

- **表示内容**: アプリ全画面の文言は日本語で統一され、エラー・空状態・導線が揃っている。
- **データ**: brands / collections / eras / milestones / releases / refGroups に必須テキストの欠損はなく、時計史・型番・キャリバーが一貫している。
- **時計史全体の動き**: 年代共通 11 区分とデイトナ・エルプリメロの個別文言が役割分担できており、検証スクリプトでも 33 era が理想と一致。
- **完成度**: 他箇所も含め、表示内容として完成度は高い。
