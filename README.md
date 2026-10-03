# AromaMaster

NVC（観察・感情・ニーズ・リクエスト）の流れで「いまの自分」を言葉にし、科学的根拠レベル付きの精油データから
**リードディフューザー / ネブライザー / 超音波** ごとに、容器容量・無水エタノール量・精油量（mL / 滴）・メーカーと商品まで具体的に調合するアプリ。
消耗品は「新品 / 使用中 / わからない / なくなった」で在庫管理し、なくなったら通知 → Amazon 再購入へ案内します。

## 主な機能
- **OFNR ウィザード** (`/blend`): 評価語・思考語の検出と言い換えヒント、ニーズ → 目的（睡眠・リラックス・安心・集中・活力・気分/意欲・リフレッシュ・温かさ）への変換
- **調合エンジン** (`src/domain/blendEngine.ts`): 根拠レベル（A/B/C）で重み付け、トップ/ミドル/ベース構成、在庫優先、安全設定（妊娠・乳幼児・ペット・てんかん）での除外、滴数の合計を保つ配分
- **デバイス規則** (`src/domain/devices.ts`): リード=精油 15–25%＋無水エタノール、ネブライザー=原液、超音波=水 100mL あたり 3–5 滴（エタノール不使用）
- **在庫** (`/inventory`): 状態管理、残量メーター、作った記録での自動減算、なくなったら即時通知、Amazon 再購入リンク（`NEXT_PUBLIC_AMAZON_TAG`）
- **通知**: 端末内通知 + Web Push（Vercel Cron で毎朝、同一品は 1 日 1 回まで）
- **保存先**: 未ログイン/未設定 → IndexedDB、Supabase ログイン時 → クラウド（RLS）
- **精油ライブラリ** (`/library`): 主成分・作用・文献（DOI）・禁忌

> 本アプリは医療行為の代わりではありません。「ドーパミン」など脳内物質への作用は主に動物研究（根拠 C）であることを画面上でも明示しています。

## 開発
```bash
npm install
cp .env.example .env.local   # 何も設定しなくてもローカルモードで動きます
npm run dev
```

| コマンド | 内容 |
|---|---|
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Vitest（調合エンジン・在庫・通知・Amazon URL） |
| `npm run test:e2e` | Playwright（ビルドして OFNR → 調合 → 在庫 → 再購入 を検証） |

## ドキュメント
- 製品仕様・受け入れ基準: [`gan-harness/spec.md`](gan-harness/spec.md)
- Claude Design への依頼書: [`docs/design-brief.md`](docs/design-brief.md)（見た目は `src/styles/tokens.css` と `src/components/ui/` を差し替え）
- デプロイ（Vercel / Supabase / prodenz.com）: [`docs/deploy.md`](docs/deploy.md)
