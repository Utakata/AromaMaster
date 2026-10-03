# デプロイ手順（Vercel + Supabase + prodenz.com）

## 1. Supabase
1. https://supabase.com でプロジェクトを作成（リージョン: Tokyo 推奨）。
2. SQL Editor で `supabase/migrations/0001_init.sql` を実行（または `supabase db push`）。
3. Authentication → URL Configuration
   - Site URL: `https://prodenz.com`（サブドメイン運用なら `https://aroma.prodenz.com`）
   - Redirect URLs: `https://prodenz.com/auth/callback`, `http://localhost:3000/auth/callback`
4. Project Settings → API から `URL` / `anon key` / `service_role key` を控える（service_role は絶対にクライアントへ出さない）。

## 2. Web Push 鍵
```bash
npx web-push generate-vapid-keys
```
Public Key → `NEXT_PUBLIC_VAPID_PUBLIC_KEY`、Private Key → `VAPID_PRIVATE_KEY`。

## 3. Vercel
1. Vercel で GitHub の `Utakata/AromaMaster` を Import（Framework: Next.js、設定はデフォルトのまま）。
2. Settings → Environment Variables に `.env.example` の項目を設定。
   - `CRON_SECRET` はランダムな長い文字列（Vercel Cron が `Authorization: Bearer <CRON_SECRET>` を自動付与）。
   - `NEXT_PUBLIC_AMAZON_TAG` は Amazon アソシエイトのトラッキング ID（例 `xxxx-22`）。空ならタグなし。
3. `vercel.json` の Cron（毎日 23:00 UTC = 08:00 JST）で `/api/cron/stock-check` が実行されます。

## 4. ドメイン prodenz.com
1. Vercel → Project → Settings → Domains で `prodenz.com`（と `www.prodenz.com`）を追加。
2. DNS（レジストラ側）に Vercel が表示するレコードを設定:
   - Apex `prodenz.com`: A レコード（Vercel の表示する IP）
   - `www`: CNAME `cname.vercel-dns.com`
   - サブドメイン運用なら `aroma` に CNAME `cname.vercel-dns.com`
3. `NEXT_PUBLIC_SITE_URL` を実際の URL に合わせて再デプロイ。

## 5. 動作確認
- `/settings` → 通知を有効にする → ログイン済みならサーバー購読が保存される。
- 手動で Cron を叩く:
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" https://prodenz.com/api/cron/stock-check
  ```
