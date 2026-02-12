# 高級腕時計アプリ：プロダクト・データ設計書

## アウトプット一覧

| # | 内容 | 記載箇所 |
|---|------|----------|
| ① | データ取得元（Wikipedia / Wikidata のどの項目を使うか） | [① データ取得元](#①-データ取得元wikipedia--wikidata-のどの項目を使うか) |
| ② | 最終データスキーマ（フィールド一覧） | [② 最終データスキーマ](#②-最終データスキーマdb設計) |
| ③ | 初期 seed.json の構造例 | [4.3 seed.json の構造例](#43-seedjson-の構造例) および [`seed-schema-example.json`](./seed-schema-example.json) |
| ④ | この設計で実現できるUI体験 | [⑤ この設計で実現できるUI体験](#⑤-この設計で実現できるui体験) |

---

## 目的
高級腕時計の「歴史・進化・派生」を体験的に理解できるモバイルアプリ。  
価格・資産価値は扱わない。年代スライダーで進化が分かり、ユーザーが「自分の持っている時計」を紐づけられることを重視する。

---

## ① データ取得元（Wikipedia / Wikidata のどの項目を使うか）

### 1.1 対象ブランド・象徴モデル（15モデル）と取得先

| ブランド | 象徴モデル | Wikipedia記事（en） | Wikidata QID（取得元） |
|----------|------------|---------------------|------------------------|
| TAG Heuer | Carrera | [TAG Heuer Carrera](https://en.wikipedia.org/wiki/TAG_Heuer_Carrera) | 記事のWikidataリンクから取得 |
| TAG Heuer | Monaco | [TAG Heuer Monaco](https://en.wikipedia.org/wiki/TAG_Heuer_Monaco) | 同上 |
| TAG Heuer | Autavia | [Heuer Autavia](https://en.wikipedia.org/wiki/Heuer_Autavia) | 同上 |
| Omega | Speedmaster | [Omega Speedmaster](https://en.wikipedia.org/wiki/Omega_Speedmaster) | Q1414495 |
| Omega | Seamaster | [Omega Seamaster](https://en.wikipedia.org/wiki/Omega_Seamaster) | Q7090020 |
| Omega | Constellation | [Omega Constellation](https://en.wikipedia.org/wiki/Omega_Constellation) | 要取得 |
| Zenith | El Primero | [Zenith El Primero](https://en.wikipedia.org/wiki/Zenith_El_Primero) | 要取得 |
| Zenith | Defy | [Zenith Defy](https://en.wikipedia.org/wiki/Zenith_Defy) | 要取得 |
| Zenith | Pilot | [Zenith Pilot](https://en.wikipedia.org/wiki/Zenith_Pilot) | 要取得 |
| Breitling | Navitimer | [Breitling Navitimer](https://en.wikipedia.org/wiki/Breitling_Navitimer) | 要取得 |
| Breitling | Chronomat | [Breitling Chronomat](https://en.wikipedia.org/wiki/Breitling_Chronomat) | 要取得 |
| Breitling | Superocean | [Breitling Superocean](https://en.wikipedia.org/wiki/Breitling_Superocean) | 要取得 |
| Rolex | Daytona | [Rolex Daytona](https://en.wikipedia.org/wiki/Rolex_Daytona) | 要取得 |
| Rolex | Submariner | [Rolex Submariner](https://en.wikipedia.org/wiki/Rolex_Submariner) | Q3440353 |
| Rolex | Datejust | [Rolex Datejust](https://en.wikipedia.org/wiki/Rolex_Datejust) | 要取得 |

- **QID取得方法**: Wikipedia API の `pageprops`（`wikibase_item`）で記事からQIDを取得可能。または Wikidata 検索 API で「ブランド名 + モデル名」で検索。

---

### 1.2 Wikipedia から取得可能な「事実データ項目」（網羅）

- **記事ソース**: 各モデルの英語版記事 + 必要に応じて他言語（事実の補完のみ）。
- **利用する要素**（著作権のある長文は転載せず、**事実＋自前要約**のみ保存）:

| カテゴリ | 取得元 | 項目例 | 備考 |
|----------|--------|--------|------|
| **時系列** | 本文・Infobox・セクション見出し | 発表年、発売年、デビュー年、リニューアル年、廃止年 | Infobox: `introduced`, `discontinued` |
| **分類・用途** | 本文・Infobox・カテゴリ | タイプ（diving / chronograph / pilot / dress 等）、想定用途 | Infobox: `type` |
| **技術** | 本文・Infobox | ムーブメント（手巻き/自動/クォーツ）、キャリバー名、振動数、パワーリザーブ、耐磁 | Infobox: `movement`, `display` |
| **仕様（事実のみ）** | 本文・表 | ケース径（mm）、防水性能（m/ATM）、ベゼル素材・形状、クリスタル | 数値・用語のみ。文章は要約で自前表現 |
| **デザイン・派生** | 本文・リスト | ケース素材（ステンレス/貴金属/チタン等）、ダイアル色、ベルト/ブレス形態、限定・特別版の存在 | 列挙可能な事実 |
| **イベント・背景** | 本文 | 宇宙飛行採用、軍納品、レース公式時計、映画登場、復刻年 | 年＋短いラベルで保存 |
| **ブランド文脈** | ブランド記事 | ブランド設立年、本社国、モデルが属するコレクション名 | 進化の土台 |

**取得しないもの**: 公式画像URL・ロゴ・価格・販売チャネル・在庫情報。WatchBase等の商用DBは使用しない。

---

### 1.3 Wikidata から取得可能な「事実データ項目」

- **API**: MediaWiki Wikidata API（`wbgetentities`, `wbsearch` 等）。無料・認証不要で利用可能。

| プロパティID | ラベル | 用途 | 備考 |
|--------------|--------|------|------|
| **P31** | instance of | エンティティ種別（model series, product 等） | モデル/ブランドの種別 |
| **P279** | subclass of | 上位概念（diving watch, chronograph 等） | 用途・タイプの補強 |
| **P571** | inception | 開始・発表年 | 年代スライダーの起点 |
| **P576** | dissolved / abolished | 終了年 | 組織向け。製品は P2669 も検討 |
| **P2669** | discontinuation date | 製造終了年 | 製品ラインの終了 |
| **P176** | manufacturer | 製造者（QID） | ブランド紐づけ |
| **P1716** | brand | ブランド（QID） | ブランド名解決 |
| **P136** | genre | ジャンル | 用途分類の補完 |
| **P366** | use | 用途 | 例: ダイビング、航空 |
| **P373** | Commons category | カテゴリ名 | 画像差し替え時の検索キー（URLは保存しない） |
| **P646** | Freebase ID / **sitelinks** | 他DBID・Wikipediaリンク | 記事タイトル・言語別URL取得 |

- **文章の扱い**: Wikidata の「description」は短いため事実の補足に利用可能。長文は転載せず要約のみ自前で保存する。
- **画像**: P18（image）は「公式画像を使わない」方針のため**取得しない**。のちに差し替え可能な `imageSource` 等のフィールドだけスキーマに用意する。

---

### 1.4 取得フロー（推奨）

1. **ブランド**: Wikidata でブランドQIDを取得 → P571（設立年）、国、英語ラベル。
2. **モデル**: Wikipedia 記事タイトルから `wikibase_item` でQID取得 → 上記プロパティで事実を取得。
3. **年代・派生**: Wikipedia 本文の「歴史」「バリエーション」「世代」セクションから**年号と事実**を抽出し、自前の要約テキスト（1〜2文）として保存。Wikidata に細かい世代が無い場合は事実ベースで **Era** を定義する（後述）。

---

## ② 最終データスキーマ（DB設計）

- リレーション: **Brand → Collection（象徴モデル）→ Era（年代）→ Variant（派生）**。ユーザー所有は **UserOwnedWatch** が **Variant** または **Era** を参照。

### 2.1 エンティティ一覧

| エンティティ | 説明 |
|--------------|------|
| **Brand** | ブランド（TAG Heuer, Omega, Zenith, Breitling, Rolex） |
| **Collection** | 象徴モデル（Carrera, Speedmaster, Submariner 等）。1ブランドに複数。 |
| **Era** | 年代・世代ノード。スライダーの「区切り」。1コレクションに複数。 |
| **Variant** | 派生（素材・サイズ・ムーブ・防水・ベルト等の組み合わせ）。1 Era に複数。 |
| **UserOwnedWatch** | ユーザーが「持っている」と紐づけた時計。1ユーザーに複数。 |

### 2.2 フィールド定義

#### Brand

| フィールド | 型 | 必須 | 説明 |
|------------|-----|------|------|
| id | string (UUID または slug) | ✓ | 一意識別子 |
| slug | string | ✓ | URL・API用（例: `tag-heuer`） |
| name | string | ✓ | 表示名（例: TAG Heuer） |
| nameEn | string | - | 英語名（検索・ソート用） |
| foundedYear | number | - | 設立年（Wikidata P571） |
| country | string | - | 本社国（コードまたは名称） |
| descriptionSummary | string | - | 自前要約（1〜3文）。著作権文章は転載しない |
| wikidataQid | string | - | 例: "Q645984" |
| wikipediaSlug | string | - | 英語版記事スラッグ（差し替え・再取得用） |
| **countryNameEn** | string | - | 国の英語ラベル（QID を wbgetentities で解決）。表示用。 |
| **wikipediaUrlEn** | string | - | 英語版記事の確定URL（`https://en.wikipedia.org/wiki/Title_With_Underscores`） |
| sortOrder | number | - | 一覧表示順 |

#### Collection（象徴モデル）

| フィールド | 型 | 必須 | 説明 |
|------------|-----|------|------|
| id | string | ✓ | 一意識別子 |
| brandId | string (FK) | ✓ | Brand.id |
| slug | string | ✓ | 例: `carrera`, `speedmaster` |
| name | string | ✓ | 表示名（例: Carrera） |
| nameEn | string | - | 英語名 |
| type | string | - | 用途タイプ: `chronograph`, `diving`, `pilot`, `dress`, `racing` 等 |
| introducedYear | number | - | 初出年（Wikidata P571 または Wikipedia introduced） |
| discontinuedYear | number | - | 製造終了年（P2669 等。継続中は null） |
| descriptionSummary | string | - | 自前要約 |
| wikidataQid | string | - | モデルQID |
| wikipediaSlug | string | - | 英語版記事スラッグ |
| **wikipediaUrlEn** | string | - | 英語版記事の確定URL（スペースは `_`）。 |
| commonsCategory | string | - | P373。画像差し替え時の検索用（URLは持たない） |
| **variantOptions** | object | - | 派生の「選択肢」集合。`materials`, `caseSizesMm`, `movementTypes`, `braceletStrap` の配列。個体 variant を大量に作らない場合に使用。 |
| sortOrder | number | - | ブランド内表示順 |

#### Era（年代・世代：スライダー用）

| フィールド | 型 | 必須 | 説明 |
|------------|-----|------|------|
| id | string | ✓ | 一意識別子 |
| collectionId | string (FK) | ✓ | Collection.id |
| slug | string | ✓ | 例: `speedmaster-1960s-moonwatch` |
| name | string | ✓ | 表示名（例: "1960s Moonwatch" / "初代〜321時代"） |
| nameEn | string | - | 英語名 |
| startYear | number | ✓ | 区間開始年 |
| endYear | number | - | 区間終了年（継続中は null または現在年） |
| summary | string | - | この時代の特徴の自前要約（1〜3文） |
| keyFacts | string[] | - | 箇条書きの事実（例: ["アポロ11号採用", "キャリバー321"]） |
| events | { year: number, label: string }[] | - | 関連イベント（年＋短いラベル） |
| sortOrder | number | ✓ | スライダー順（時系列） |

#### Variant（派生）

| フィールド | 型 | 必須 | 説明 |
|------------|-----|------|------|
| id | string | ✓ | 一意識別子 |
| eraId | string (FK) | ✓ | Era.id |
| slug | string | ✓ | 例: `submariner-5513-steel` |
| name | string | ✓ | 表示名（例: "Submariner 5513 ステンレス"） |
| nameEn | string | - | 英語名 |
| movementType | string | - | `manual` / `automatic` / `quartz` / `spring_drive` 等 |
| caliber | string | - | キャリバー名（例: 321, 861） |
| caseSizeMm | number | - | ケース径（mm） |
| caseMaterial | string | - | ステンレス / ゴールド / ツートン 等 |
| waterResistanceM | number | - | 防水（m） |
| crystal | string | - | クリスタル（例: サファイア） |
| bezel | string | - | ベゼル（一方向/二方向、素材等） |
| braceletStrap | string[] | - | ベルト/ブレス形態（例: ["ステンレス", "レザー"]） |
| dialColor | string | - | ダイアル色 |
| keyFacts | string[] | - | 派生の特徴を短い事実で |
| wikidataQid | string | - | 特定モデルが別QIDで存在する場合 |
| imageSource | string | - | 将来の差し替え用（"wikidata" / "official" / null） |
| sortOrder | number | - | Era内表示順 |

#### UserOwnedWatch（ユーザー所有）

| フィールド | 型 | 必須 | 説明 |
|------------|-----|------|------|
| id | string | ✓ | 一意識別子 |
| userId | string (FK) | ✓ | ユーザー（アプリ側で管理） |
| collectionId | string (FK) | ✓ | どの象徴モデルか |
| eraId | string (FK) | - | 可能なら年代まで紐づけ |
| variantId | string (FK) | - | 可能なら派生まで紐づけ |
| customName | string | - | ユーザーが付けた愛称 |
| acquiredYear | number | - | 取得年（任意） |
| notes | string | - | メモ（非公開） |
| createdAt | string (ISO 8601) | ✓ | 登録日時 |
| updatedAt | string (ISO 8601) | ✓ | 更新日時 |

- **紐づけ方針**: 最小は `collectionId` のみ。`eraId` / `variantId` は選択肢として提供し、分かれば選べるようにする。

### 2.3 実装上の階層（Release 中心・1 Release = 1 スライド）

UI と seed の実装では、**年代スライダーの1単位 = Release** とする。

| 階層 | 説明 | 例 |
|------|------|-----|
| **Brand** | ブランド | Rolex |
| **Collection** | 象徴モデル（固定） | Daytona |
| **Era** | 大まかな時代タブ（手巻き / ゼニス / インハウス等） | インハウス4130 |
| **Milestone** | Era 内の年範囲ブロック（build_seed_v2 で生成） | 2000–2012, 2013–2026 |
| **Release** | **仕様・Ref の進化点**で分割した1スライド単位 | 2013–2015 初期 Cal.4130, 2016–2019 セラクロム拡充, 2020–2022 Oysterflex, 2023– 現行 Cal.4131 |
| **RefGroup** | その Release 内の型番（Ref）。**UI 表記: ベースモデル** | 116500LN, 126500LN |
| **VariantMap** | Ref ごとの仕様の選択肢（ダイヤル/ベゼル/素材/ブレス）。**UI 表記: 派生モデル** | 黒/白, セラミック等 |

**重要な設計方針**

- **「最新 = 1 ページ」は禁止**。最新モデル（例: Daytona 2013–現在）でも、**最低でも複数 Release**（例: 4 つ以上）が存在する前提でデータを定義する。
- Release は**年単位均等分割ではなく**「Ref 更新・ムーブメント更新・仕様変更」の区切りで分割する。
- コレクション詳細では **Release 単位で横スライド or 年代スライダー**が動き、長寿モデル（Daytona, Submariner, Speedmaster）がスカスカにならないようにする。

データ定義: `data/release_definitions.json` で Milestone ごとに Release を列挙。`data/ref_group_definitions.json` で Release ごとに RefGroup（型番＋variantMap）を定義。

---

## ③ 年代スライダーUIを成立させる「Era」のデータ化方針

### 3.1 方針

- **「どの年代で何が変わったか」**を、公式の世代名がなくても**事実ベースで Era ノード**として定義する。
- 各 **Era** は `startYear` / `endYear` を持ち、スライダーは「年」で区切る。同一コレクション内で Era は時系列で並ぶ（`sortOrder`）。
- スライダー操作: ユーザーが選んだ「年」に対して、その年に「存在した」Era をハイライトし、その Era に属する Variant を表示する。

### 3.2 Era の決め方（事実ベース）

1. **Wikipedia の「歴史」「バリエーション」「世代」セクション**から、年号とキーワードを抽出する。  
   - 例: "1969年にモナコがデビュー" → Era name "1969 デビュー", startYear 1969。
2. **ムーブメント・キャリバー変更**を区切りにする。  
   - 例: Speedmaster "321時代" → startYear/endYear を記事から取得し、Era を1つ定義。
3. **デザイン・ラインの大きな変更**（ケース形状、サイズ、防水の世代）を区切りにする。  
   - 例: Submariner "5512/5513" 時代、"1680" 時代 等。
4. **公式の「ジェネレーション」名**がある場合は、それを Era の `name` に使ってよい（例: "Mark II", "First generation"）。
5. 1つの Era は**重複しない年範囲**とする。隣接は可（前の endYear と次の startYear が同じなど）。

### 3.3 スライダー用の派生データ（算出可能）

- **Timeline 用ビュー**: 各 Collection に対して、全 Era を `startYear` 昇順で並べたリストを生成可能。
- **「この年」の表示**: 指定年 Y に対して、`startYear <= Y && (endYear == null || endYear >= Y)` を満たす Era を取得 → その Era の Variant を表示。
- アプリ側で「年スライダー」＋「コレクション選択」で、その年に存在した Era / Variant を一意に表示できる。

### 3.4 初期 seed での扱い

- seed では、**全15コレクションについて、少なくとも1 Era 以上**を定義する（例: "初代〜○○年" のような大まかな区切りでも可）。
- 後から Wikipedia/Wikidata の追加取得で、Era を細分化したり `keyFacts` / `events` を増やしたりできる設計にする。

---

## ④ 初期 seed.json の構造例と差し替え可能性

### 4.1 seed の位置づけ

- 初期データは **JSON（seed データ）** としてリポジトリに持つ。
- 公式データや画像が後から入手できても、**差し替え可能な構造**にする。

### 4.2 差し替えを考慮した設計

- **画像**: 画像URLは seed に含めない。`Variant.imageSource` や `Collection.commonsCategory` のように「ソース種別・検索キー」だけ持ち、アプリまたはバックエンドが「表示用画像URL」を解決する。
- **テキスト**: `descriptionSummary` / `summary` / `keyFacts` は自前要約のみ。公式文案が後で使える場合は、別フィールド（例: `officialDescription`）を追加し、表示優先度をアプリで切り替え可能にする。
- **年代・派生**: Era / Variant は id ベースで参照しているため、後から行の追加・`keyFacts` の拡張だけで対応できる。スキーマに `source`（例: "wikidata", "wikipedia", "manual"）を入れてもよい。

### 4.3 seed.json の構造例

**ファイル**: [`docs/seed-schema-example.json`](./seed-schema-example.json)

- **brands**: 1件（Omega）
- **collections**: 1件（Speedmaster）
- **eras**: 2件（321時代 / 861・1861時代）
- **variants**: 2件（CK2915 / Moonwatch 1861）
- **userOwnedWatches**: 1件（デモ用）

実データでは `brands` に5ブランド、`collections` に15象徴モデルを並べ、各コレクションに1以上の `eras`、各 Era に1以上の `variants` を定義する。実データの大量投入前のテンプレートとして利用する。

- **era_variant_specs.json**（見分け方・仕様の元データ）: 各 era のキャリバー・ケース径・ベゼル等は、Wikipedia・ブランド公式・時計史の**一般的なネット・文献情報**に基づく。同様の出典で誰でも確認できる範囲で記載し、未検証の創作は入れない。

---

## ⑤ この設計で実現できるUI体験

1. **年代スライダーで進化を理解**
   - ユーザーが年（例: 1965〜2025）を選ぶと、その年に「存在した」Era が各コレクションで表示される。
   - コレクション単位で「この年はこの世代・この派生」が一目で分かる。複数ブランドを横並びで比較することも可能。

2. **「自分の時計」の紐づけ**
   - ユーザーは「持っている時計」を登録し、**Collection → 任意で Era → 任意で Variant** まで選んで紐づけられる。
   - 紐づけた時計は、年代スライダーやコレクション詳細画面で「あなたの時計」として表示され、歴史の中での位置が体験できる。

3. **派生パターンの理解**
   - 各 Era 配下の Variant で、素材・サイズ・ムーブ・防水・ベルトなどの違いを一覧できる。
   - 価格は出さず、「どんなバリエーションがあるか」「いつ頃の仕様か」に焦点を当てた体験になる。

4. **事実ベース・著作権クリア**
   - 表示テキストは自前要約＋事実データに限定し、Wikipedia 長文の転載を避ける。Wikidata/Wikipedia は「取得元」として参照し、再取得・更新が可能な形にしておく。

5. **拡張性**
   - のちに公式画像や公式説明を差し替え可能なフィールドを用意しているため、ライセンスが取れた段階で表示を切り替えられる。

---

以上が、データ取得方針・最終データスキーマ・年代スライダー用 Era のデータ化・seed 構造とUI体験の整理である。
