"use client";

import Link from "next/link";
import { ButtonLink, Card, ExternalButton, Notice, PageTitle } from "@/components/ui";
import { buildReorderUrl } from "@/domain/amazon";
import { summarizeAlerts } from "@/domain/inventory";
import { PRODUCT_BY_ID } from "@/domain/products";
import { PURPOSES, PURPOSE_IDS } from "@/domain/purposes";
import { useAppData } from "@/lib/store";

export default function HomePage() {
  const { inventory, recipes, ready } = useAppData();
  const alerts = summarizeAlerts(inventory);

  return (
    <div className="space-y-6">
      <PageTitle title="いまの自分に、香りでこたえる" lead="観察・感情・ニーズ・リクエスト（NVC）の4ステップで、根拠のある精油と分量を提案します。" />

      <Card className="space-y-3">
        <p className="text-sm">
          リードディフューザー・ネブライザー・超音波ディフューザーに対応。容器の容量から、無水エタノールと精油の量、メーカーと商品まで具体的に出します。
        </p>
        <ButtonLink href="/blend" className="w-full sm:w-auto">
          調合をはじめる
        </ButtonLink>
      </Card>

      <section aria-labelledby="alerts-h" className="space-y-2">
        <h2 id="alerts-h" className="font-bold">
          在庫のお知らせ
        </h2>
        {ready && alerts.length === 0 && <Notice tone="success">確認が必要な在庫はありません。</Notice>}
        <ul className="space-y-2" data-testid="alerts">
          {alerts.map(({ item, level, message }) => (
            <li key={item.id}>
              <Notice tone={level === "empty" ? "danger" : "warning"}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>{message}</span>
                  {level === "unknown" ? (
                    <Link className="underline" href={`/inventory?item=${item.id}`}>
                      確認する
                    </Link>
                  ) : (
                    <ExternalButton href={buildReorderUrl(item, item.productId ? PRODUCT_BY_ID[item.productId] : undefined)} data-testid="reorder-link">
                      Amazon で再購入
                    </ExternalButton>
                  )}
                </div>
              </Notice>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="purposes-h" className="space-y-2">
        <h2 id="purposes-h" className="font-bold">
          こんなときに
        </h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PURPOSE_IDS.map((p) => (
            <li key={p} className="rounded-md border border-line bg-surface p-3 text-sm">
              <strong className="block">{PURPOSES[p].label}</strong>
              <span className="text-xs text-muted">{PURPOSES[p].description}</span>
            </li>
          ))}
        </ul>
      </section>

      {recipes.length > 0 && (
        <section aria-labelledby="recent-h" className="space-y-2">
          <h2 id="recent-h" className="font-bold">
            最近の調合
          </h2>
          <ul className="space-y-2">
            {recipes.slice(0, 3).map((r) => (
              <li key={r.id}>
                <Link href={`/recipes?saved=${r.id}`} className="block rounded-md border border-line bg-surface p-3 text-sm hover:bg-surface-2">
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
