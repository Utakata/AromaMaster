"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Button, Card, Chip, ExternalButton, Field, Meter, Notice, PageTitle, StatusBadge, inputClass } from "@/components/ui";
import { buildReorderUrl } from "@/domain/amazon";
import { STATUS_LABEL, alertLevel, createItemFromProduct, restock, withStatus } from "@/domain/inventory";
import { PRODUCTS, PRODUCT_BY_ID } from "@/domain/products";
import type { InventoryItem, InventoryStatus } from "@/domain/types";
import { newId, useAppData } from "@/lib/store";

const STATUSES: InventoryStatus[] = ["new", "in_use", "unknown", "empty"];
type Filter = "all" | "alerts" | "oil" | "consumable";

function InventoryInner() {
  const params = useSearchParams();
  const { inventory, ready, saveInventory, removeInventory, error } = useAppData();
  const [filter, setFilter] = useState<Filter>(params.get("filter") === "alerts" ? "alerts" : "all");
  const [adding, setAdding] = useState(false);
  const focusId = params.get("item");

  const items = useMemo(
    () =>
      inventory.filter((i) =>
        filter === "alerts" ? alertLevel(i) : filter === "oil" ? i.kind === "oil" : filter === "consumable" ? i.kind !== "oil" : true,
      ),
    [inventory, filter],
  );

  return (
    <div className="space-y-5">
      <PageTitle title="在庫" lead="新品・使用中・わからない・なくなった の4つで管理します。なくなったら通知し、再購入をご案内します。" />
      {error && <Notice tone="danger">{error}</Notice>}

      <div className="flex flex-wrap gap-2" role="group" aria-label="絞り込み">
        {(
          [
            ["all", "すべて"],
            ["alerts", "要確認"],
            ["oil", "精油"],
            ["consumable", "消耗品"],
          ] as [Filter, string][]
        ).map(([f, label]) => (
          <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>
            {label}
          </Chip>
        ))}
        <Button variant="secondary" className="ml-auto" onClick={() => setAdding((v) => !v)}>
          {adding ? "閉じる" : "＋ 追加"}
        </Button>
      </div>

      {adding && <AddItemForm onAdd={async (item) => saveInventory([item])} />}

      {ready && items.length === 0 && <Notice>{filter === "alerts" ? "確認が必要な在庫はありません。" : "まだ在庫がありません。「＋ 追加」から登録しましょう。"}</Notice>}

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <ItemCard
              key={item.updatedAt} item={item} highlight={item.id === focusId} onSave={(i) => saveInventory([i])} onRemove={() => removeInventory(item.id)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ItemCard({
  item,
  highlight,
  onSave,
  onRemove,
}: {
  item: InventoryItem;
  highlight: boolean;
  onSave: (i: InventoryItem) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [remainingInput, setRemainingInput] = useState<string>(item.remaining?.toString() ?? "");
  const level = alertLevel(item);
  const product = item.productId ? PRODUCT_BY_ID[item.productId] : undefined;

  return (
    <Card className={`space-y-3 ${highlight ? "ring-2 ring-primary" : ""}`} data-testid="inventory-item">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted">{item.brand}</p>
          <p className="font-bold">{item.label}</p>
        </div>
        <StatusBadge status={item.status}>{STATUS_LABEL[item.status]}</StatusBadge>
      </div>

      <div className="space-y-1">
        <Meter value={item.remaining} max={item.size} label={`${item.label} の残量`} />
        <p className="text-xs text-muted">
          残量: {item.remaining === null ? "わからない" : `${item.remaining} / ${item.size} ${item.unit}`}
        </p>
      </div>

      {level === "empty" && <Notice tone="danger">なくなりました。補充しますか？</Notice>}
      {level === "low" && <Notice tone="warning">残りわずかです。次回分が足りるか確認しましょう。</Notice>}
      {level === "unknown" && (
        <Notice tone="warning">
          残量がわかりません。ボトルを光にかざすか、軽く振って音を確かめ、だいたいの量を入力してみましょう（10mL 瓶なら肩まで ≒ 10mL、半分 ≒ 5mL）。
        </Notice>
      )}

      <div className="flex flex-wrap gap-2" role="group" aria-label="状態を変更">
        {STATUSES.map((s) => (
          <Chip key={s} selected={item.status === s} onClick={() => onSave(withStatus(item, s))}>
            {STATUS_LABEL[s]}
          </Chip>
        ))}
      </div>

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const v = Number(remainingInput);
          if (!Number.isNaN(v) && remainingInput !== "") onSave(withStatus(item, "in_use", v));
        }}
      >
        <Field label={`残量（${item.unit}）`}>
          <input
            type="number"
            step="0.1"
            min={0}
            max={item.size}
            className={`${inputClass} w-32`}
            value={remainingInput}
            onChange={(e) => setRemainingInput(e.target.value)}
          />
        </Field>
        <Button type="submit" variant="secondary">
          残量を更新
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {(level === "empty" || level === "low") && (
          <ExternalButton href={buildReorderUrl(item, product)} data-testid="reorder-link">
            Amazon で再購入
          </ExternalButton>
        )}
        {(level === "empty" || level === "low") && (
          <Button variant="secondary" onClick={() => onSave(restock(item))}>
            補充した（新品に戻す）
          </Button>
        )}
        <Button variant="danger" className="ml-auto" onClick={() => confirm("この在庫を削除しますか？") && onRemove()}>
          削除
        </Button>
      </div>
    </Card>
  );
}

function AddItemForm({ onAdd }: { onAdd: (item: InventoryItem) => Promise<void> }) {
  const [productId, setProductId] = useState(PRODUCTS[0].id);
  const [status, setStatus] = useState<InventoryStatus>("new");
  const [asin, setAsin] = useState("");
  const [done, setDone] = useState<string | null>(null);

  const groups = useMemo(() => {
    const g = new Map<string, typeof PRODUCTS>();
    for (const p of PRODUCTS) {
      const key = p.kind === "oil" ? p.brand : "消耗品";
      g.set(key, [...(g.get(key) ?? []), p]);
    }
    return [...g.entries()];
  }, []);

  return (
    <Card>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const product = PRODUCT_BY_ID[productId];
          const item = createItemFromProduct(product, status, newId());
          if (asin.trim()) item.asin = asin.trim();
          await onAdd(item);
          setDone(`「${product.name}」を ${STATUS_LABEL[status]} として追加しました。`);
          setAsin("");
        }}
      >
        <h2 className="font-bold">在庫を追加</h2>
        <Field label="商品">
          <select className={inputClass} value={productId} onChange={(e) => setProductId(e.target.value)} aria-label="商品">
            {groups.map(([g, ps]) => (
              <optgroup key={g} label={g}>
                {ps.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.kind === "oil" ? p.name : `${p.brand} ${p.name}`}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">いまの状態</legend>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Chip key={s} selected={status === s} onClick={() => setStatus(s)}>
                {STATUS_LABEL[s]}
              </Chip>
            ))}
          </div>
        </fieldset>
        <Field label="Amazon の ASIN（任意）" hint="購入した商品ページの ASIN を入れると、再購入リンクがその商品に直接つながります。">
          <input className={inputClass} value={asin} onChange={(e) => setAsin(e.target.value)} placeholder="例: B0XXXXXXXX" />
        </Field>
        <Button type="submit">追加する</Button>
        {done && <Notice tone="success">{done}</Notice>}
      </form>
    </Card>
  );
}

export default function InventoryPage() {
  return (
    <Suspense>
      <InventoryInner />
    </Suspense>
  );
}
