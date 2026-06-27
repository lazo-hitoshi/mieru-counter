# Mieru Counter

聴覚障害者・難聴者・高齢者が窓口で会話内容を理解しやすくするための、リアルタイム字幕・重要事項カード表示サービス。

## 本番URL

https://mieru-counter.vercel.app

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js 16（App Router） |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v4 |
| ORM | Prisma v7（@prisma/adapter-pg） |
| データベース | Supabase PostgreSQL |
| ホスティング | Vercel |
| リアルタイム通信 | Socket.IO |

## ローカル開発

```bash
cd app
npm install
cp .env.example .env.local  # DATABASE_URLを設定
npm run dev
```

http://localhost:3000 でアクセス。

## 画面一覧

| パス | 画面 | 用途 |
|------|------|------|
| `/` | ホーム | 各画面への導線 |
| `/staff` | スタッフ画面 | セッション管理・字幕送信 |
| `/visitor` | 利用者画面 | 字幕表示・確認ボタン |
| `/lens` | Lens Preview | スマートグラス表示プレビュー |
| `/admin` | 管理画面 | 施設・定型文管理 |
| `/api/health` | ヘルスチェック | DB接続確認 |

## デプロイ

mainブランチへのpushで自動デプロイ（Vercel）。

### 環境変数（Vercel）

| 変数名 | 説明 |
|--------|------|
| `DATABASE_URL` | Supabase PostgreSQL接続文字列 |
