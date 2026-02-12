# seed.json の反映がアプリに出ないとき

## 原因として考えた点と対応

### 1. コレクション切り替えで状態が残る
- **対応**: `App.tsx` で `<CollectionView key={location.pathname} seed={seed} />` に変更。コレクション（URL）が変わるたびにコンポーネントが再マウントされ、先頭スライドから表示される。

### 2. 開発サーバーやブラウザのキャッシュ
- **対応**: `vite.config.ts` に JSON 用ミドルウェアを追加。`seed.json` など `.json` リクエストに `Cache-Control: no-store` を付与。
- **対応**: `useSeed.ts` で開発時は `?t=Date.now()` で毎回別URLにして取得。

### 3. 表示データの参照元
- **対応**: `CollectionView.tsx` で「時計史全体の動き」は、表示中のミレストーン id で `seed.milestones` からその場で参照するように変更（キャッシュや参照ずれを防ぐ）。

### 4. コピー先が public だけ
- **対応**: `npm run copy-seed` で `data/seed.json` を **app/public/seed.json** と **app/dist/seed.json** の両方にコピー。dist を開いている場合も最新になる。

## 反映手順（データを更新したとき）

1. プロジェクトルートで `npm run copy-seed` を実行。
2. 開発サーバーをいったん止めてから `npm run dev` で再起動。
3. ブラウザで **Ctrl+Shift+R**（強制再読み込み）を実行。
4. 別コレクション（例: シーマスター ⇔ モナコ）や、同じコレクション内で **Era タブ**を切り替えて表示が変わるか確認。

## ファイル一覧（関連するもの）

| 役割 | パス |
|------|------|
| データ元 | `data/seed.json` |
| アプリが読む（dev） | `app/public/seed.json` |
| アプリが読む（build後） | `app/dist/seed.json` |
| コピー用スクリプト | `scripts/copy_seed_to_app.mjs` |
| 表示ロジック | `app/src/views/CollectionView.tsx`（industryContext は seed.milestones から id で取得） |
| 取得・キャッシュ対策 | `app/src/useSeed.ts` |
| ルート key でリセット | `app/src/App.tsx` |
| JSON キャッシュ無効化 | `app/vite.config.ts` |
