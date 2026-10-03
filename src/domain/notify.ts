import { shouldNotify, summarizeAlerts, type AlertLevel } from "./inventory";
import type { InventoryItem } from "./types";

export interface SentRecord {
  inventory_item_id: string;
  level: AlertLevel;
  sent_at: string;
}

export interface StockDigest {
  title: string;
  body: string;
  url: string;
  items: { id: string; level: AlertLevel }[];
}

/** 1 ユーザー分の日次通知をまとめる。今日すでに送ったアラートは除外。送るものがなければ null。 */
export function buildStockDigest(items: InventoryItem[], sent: SentRecord[], now = new Date()): StockDigest | null {
  const last = new Map(sent.map((s) => [`${s.inventory_item_id}:${s.level}`, s.sent_at]));
  const due = summarizeAlerts(items).filter((a) => shouldNotify(last.get(`${a.item.id}:${a.level}`), now));
  if (!due.length) return null;
  const empty = due.filter((d) => d.level === "empty").length;
  const low = due.filter((d) => d.level === "low").length;
  const unknown = due.filter((d) => d.level === "unknown").length;
  const parts = [empty && `なくなった ${empty}`, low && `残りわずか ${low}`, unknown && `残量不明 ${unknown}`].filter(Boolean);
  return {
    title: empty ? "補充が必要なアロマがあります" : "在庫を確認してみませんか？",
    body: due.length === 1 ? due[0].message : `${parts.join(" / ")} 件。${due[0].message}`,
    url: "/inventory?filter=alerts",
    items: due.map((d) => ({ id: d.item.id, level: d.level })),
  };
}
