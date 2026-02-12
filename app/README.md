# Project Watch — 思想UI

高級腕時計の「歴史・進化・派生」を体験するためのプロトタイプUIです。

## 機能

- **年代**: スライダーで年を選ぶと、その年に存在したコレクションを表示
- **ブランド**: 5ブランド → 各3コレクションの一覧・詳細
- **コレクション詳細**: Era（年代）一覧、Wikipedia リンク、「マイ時計に追加」
- **マイ時計**: 紐づけた時計の一覧（localStorage に保存）

## 起動方法

```bash
cd app
npm install
npm run dev
```

ブラウザで表示される URL（例: http://localhost:5173）を開いてください。

## データ

- `public/seed.json` に seed データを置いています。`data/seed.json` を更新したら、プロジェクトルートで以下を実行して app に反映してください。
  ```bash
  npm run copy-seed
  ```
  （`app/public/seed.json` と `app/dist/seed.json` の両方にコピーされます。開発サーバーを再起動し、ブラウザで強制再読み込み Ctrl+Shift+R を推奨）
