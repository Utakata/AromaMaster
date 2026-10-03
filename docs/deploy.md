# デプロイ手順（Vercel + Supabase + aroma.prodenz.com）

## 現在の構成
| 項目 | 値 |
|---|---|
| Supabase プロジェクト | `aromamaster`（ref: `erttculntyszxgichfcv`、東京リージョン、無料プラン） |
| Supabase URL | https://erttculntyszxgichfcv.supabase.co |
| Vercel プロジェクト | `aromamaster`（関数リージョン: hnd1 / 東京） |
| 公開 URL | https://aroma.prodenz.com |
| DNS | Cloudflare |
| 本番ブランチ | `main` |

マイグレーション `supabase/migrations/0001_init.sql` は適用済み（6 テーブル・RLS 有効・セキュリティ警告 0 件）。

## Vercel に設定済みの環境変数
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`（publishable key）,
`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`（sensitive）, `VAPID_SUBJECT`, `CRON_SECRET`（sensitive）

## 手作業が必要な設定
1. **Vercel と GitHub の連携**
   Vercel → aromamaster → Settings → Git → Connect Git Repository → GitHub で `Utakata/AromaMaster` を選択。
   リポジトリが一覧に出ない場合は、GitHub の Vercel アプリ設定（Settings → Applications → Vercel → Configure）でこのリポジトリへのアクセスを許可。
   本番ブランチは `main`。
2. **`SUPABASE_SERVICE_ROLE_KEY`**（Cron の在庫通知に必要）
   Supabase → Project Settings → API Keys → `service_role`（または secret key）をコピーし、
   Vercel → Settings → Environment Variables に Production / Preview・Sensitive で追加。**クライアントやリポジトリには絶対に置かない。**
3. **Cloudflare の DNS**
   prodenz.com → DNS → レコードを追加:
   | Type | Name | Target | Proxy |
   |---|---|---|---|
   | CNAME | `aroma` | `cname.vercel-dns.com` | **DNS のみ（グレーの雲）** |
   オレンジの雲（プロキシ）だと Vercel の SSL 証明書発行が失敗しやすい。
4. **Supabase Auth の URL**
   Authentication → URL Configuration
   - Site URL: `https://aroma.prodenz.com`
   - Redirect URLs: `https://aroma.prodenz.com/auth/callback`, `http://localhost:3000/auth/callback`
5. **Amazon アソシエイト**（任意）: タグが決まったら `NEXT_PUBLIC_AMAZON_TAG` を追加して再デプロイ。

## 動作確認
- `https://aroma.prodenz.com` が証明書付きで開く
- `/settings` でログイン後、保存先が「クラウド（Supabase）」になる
- Cron の手動実行:
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" https://aroma.prodenz.com/api/cron/stock-check
  ```
  service role 未設定のうちは `{"skipped":true,...}` が返る。
