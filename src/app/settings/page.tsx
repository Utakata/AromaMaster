"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, Notice, PageTitle } from "@/components/ui";
import type { SafetyProfile } from "@/domain/types";
import { enablePush, pushSupported } from "@/lib/push/client";
import { useAppData } from "@/lib/store";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const SAFETY_LABEL: Record<keyof SafetyProfile, string> = {
  pregnancy: "妊娠中・授乳中",
  children: "乳幼児（6歳未満）と同じ部屋で使う",
  pets: "ペット（特に猫・小鳥）と同じ部屋で使う",
  epilepsy: "てんかんの既往がある",
};

export default function SettingsPage() {
  const { safety, saveSafety, user, repo, migrateLocalToCloud } = useAppData();
  const [pushState, setPushState] = useState<string | null>(null);
  const [migrated, setMigrated] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <PageTitle title="設定" />

      <Card className="space-y-3">
        <h2 className="font-bold">安全のための設定</h2>
        <p className="text-sm text-muted">当てはまるものを選ぶと、注意が必要な精油を調合から除外します。</p>
        {(Object.keys(SAFETY_LABEL) as (keyof SafetyProfile)[]).map((k) => (
          <label key={k} className="flex items-center gap-3 text-sm">
            <input type="checkbox" className="h-5 w-5" checked={safety[k]} onChange={(e) => saveSafety({ ...safety, [k]: e.target.checked })} />
            {SAFETY_LABEL[k]}
          </label>
        ))}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-bold">通知</h2>
        <p className="text-sm text-muted">
          在庫が「なくなった」とき、また残りわずか・残量不明の在庫があるときに通知します（同じ内容は1日1回まで）。
          {!user && " ログインすると、アプリを開いていなくても毎朝サーバーから通知が届きます。"}
        </p>
        <Button
          onClick={async () => {
            const r = await enablePush();
            setPushState(
              {
                granted: "通知を有効にしました。",
                "local-only": "この端末での通知を有効にしました（サーバー通知はログインと VAPID 鍵の設定後に有効になります）。",
                denied: "通知が許可されませんでした。ブラウザの設定から許可できます。",
                unsupported: "このブラウザは通知に対応していません。iPhone はホーム画面に追加すると利用できます。",
              }[r],
            );
          }}
          disabled={typeof window !== "undefined" && !pushSupported()}
        >
          通知を有効にする
        </Button>
        {pushState && <Notice>{pushState}</Notice>}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-bold">アカウントと保存先</h2>
        <p className="text-sm">
          現在の保存先: <strong>{repo?.mode === "supabase" ? "クラウド（Supabase）" : "この端末のブラウザ"}</strong>
        </p>
        {!isSupabaseConfigured && <Notice>クラウド保存はまだ設定されていません（管理者が Supabase を設定すると利用できます）。</Notice>}
        {isSupabaseConfigured && !user && (
          <Link href="/login" className="text-primary underline">
            ログインしてクラウドに保存する
          </Link>
        )}
        {user && (
          <div className="space-y-2">
            <p className="text-sm">{user.email} でログイン中</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={async () => {
                  const n = await migrateLocalToCloud();
                  setMigrated(`${n} 件をクラウドへ移しました。`);
                }}
              >
                この端末のデータをクラウドへ移す
              </Button>
              <Button variant="ghost" onClick={() => getBrowserSupabase()?.auth.signOut()}>
                ログアウト
              </Button>
            </div>
            {migrated && <Notice tone="success">{migrated}</Notice>}
          </div>
        )}
      </Card>
    </div>
  );
}
