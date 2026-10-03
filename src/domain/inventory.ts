import type { Blend, InventoryItem, InventoryStatus, Product } from "./types";

export type AlertLevel = "empty" | "low" | "unknown";

export const STATUS_LABEL: Record<InventoryStatus, string> = {
  new: "新品",
  in_use: "使用中",
  unknown: "わからない",
  empty: "なくなった",
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export function lowThreshold(item: InventoryItem): number {
  return item.lowThreshold ?? round1(item.size * 0.2);
}

export function alertLevel(item: InventoryItem): AlertLevel | null {
  if (item.status === "empty") return "empty";
  if (item.status === "unknown") return "unknown";
  if (item.remaining !== null && item.remaining <= lowThreshold(item)) return "low";
  return null;
}

export function isAvailable(item: InventoryItem): boolean {
  return item.status !== "empty" && (item.remaining === null || item.remaining > 0);
}

export function createItemFromProduct(product: Product, status: InventoryStatus, id: string, now = new Date()): InventoryItem {
  return withStatus(
    {
      id,
      productId: product.id,
      kind: product.kind,
      oilId: product.oilId,
      brand: product.brand,
      label: product.name,
      size: product.size,
      unit: product.unit,
      remaining: product.size,
      status: "new",
      asin: product.asin,
      updatedAt: now.toISOString(),
    },
    status,
    undefined,
    now,
  );
}

/** 状態を変更する。残量は状態に合わせて整合させる。 */
export function withStatus(item: InventoryItem, status: InventoryStatus, remaining?: number | null, now = new Date()): InventoryItem {
  let nextRemaining: number | null;
  switch (status) {
    case "new":
      nextRemaining = item.size;
      break;
    case "empty":
      nextRemaining = 0;
      break;
    case "unknown":
      nextRemaining = null;
      break;
    case "in_use": {
      const r = remaining !== undefined ? remaining : item.remaining ?? item.size;
      nextRemaining = r === null ? null : Math.min(item.size, Math.max(0, round1(r)));
      break;
    }
  }
  const finalStatus: InventoryStatus = status === "in_use" && nextRemaining === 0 ? "empty" : status;
  return { ...item, status: finalStatus, remaining: nextRemaining, updatedAt: now.toISOString() };
}

/** 使用量を差し引く。不明な残量は不明のまま（使用中扱いにはしない）。 */
export function deduct(item: InventoryItem, amount: number, now = new Date()): InventoryItem {
  if (item.remaining === null || item.status === "unknown") return { ...item, updatedAt: now.toISOString() };
  const remaining = Math.max(0, round1(item.remaining - amount));
  return {
    ...item,
    remaining,
    status: remaining <= 0 ? "empty" : "in_use",
    updatedAt: now.toISOString(),
  };
}

/** 補充（再購入して新品に戻す） */
export function restock(item: InventoryItem, now = new Date()): InventoryItem {
  return withStatus(item, "new", undefined, now);
}

export interface Deduction {
  inventoryItemId: string;
  amount: number;
}

/** 調合を作ったときに在庫から差し引く量の一覧 */
export function planDeductions(blend: Blend): Deduction[] {
  const list: Deduction[] = [];
  for (const c of blend.components) {
    if (c.inventoryItemId) list.push({ inventoryItemId: c.inventoryItemId, amount: c.ml });
  }
  if (blend.ethanolInventoryItemId && blend.ethanolMl > 0) {
    list.push({ inventoryItemId: blend.ethanolInventoryItemId, amount: blend.ethanolMl });
  }
  return list;
}

export function applyDeductions(
  inventory: InventoryItem[],
  deductions: Deduction[],
  now = new Date(),
): { inventory: InventoryItem[]; changed: InventoryItem[]; newlyEmpty: InventoryItem[] } {
  const byId = new Map(inventory.map((i) => [i.id, i]));
  const changed: InventoryItem[] = [];
  const newlyEmpty: InventoryItem[] = [];
  for (const d of deductions) {
    const before = byId.get(d.inventoryItemId);
    if (!before) continue;
    const after = deduct(before, d.amount, now);
    byId.set(after.id, after);
    changed.push(after);
    if (before.status !== "empty" && after.status === "empty") newlyEmpty.push(after);
  }
  return { inventory: inventory.map((i) => byId.get(i.id) ?? i), changed, newlyEmpty };
}

/** 日本時間の日付キー（通知の 1 日 1 回制御に使う） */
export function jstDayKey(date: Date): string {
  return date.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

/** 同じアイテム・同じアラートは JST で 1 日 1 回まで */
export function shouldNotify(lastSentAt: string | undefined | null, now = new Date()): boolean {
  if (!lastSentAt) return true;
  return jstDayKey(new Date(lastSentAt)) !== jstDayKey(now);
}

export const ALERT_TEXT: Record<AlertLevel, (label: string) => string> = {
  empty: (l) => `「${l}」がなくなりました。補充しますか？`,
  low: (l) => `「${l}」が残りわずかです。`,
  unknown: (l) => `「${l}」の残量がわかりません。確認してみませんか？`,
};

export function summarizeAlerts(items: InventoryItem[]): { level: AlertLevel; item: InventoryItem; message: string }[] {
  const order: Record<AlertLevel, number> = { empty: 0, low: 1, unknown: 2 };
  return items
    .map((item) => ({ item, level: alertLevel(item) }))
    .filter((x): x is { item: InventoryItem; level: AlertLevel } => x.level !== null)
    .sort((a, b) => order[a.level] - order[b.level])
    .map(({ item, level }) => ({ item, level, message: ALERT_TEXT[level](item.label) }));
}
