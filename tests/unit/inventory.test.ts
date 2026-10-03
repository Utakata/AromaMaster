import { describe, expect, it } from "vitest";
import { buildAmazonUrl, buildReorderUrl } from "@/domain/amazon";
import { computeBlend } from "@/domain/blendEngine";
import {
  alertLevel,
  applyDeductions,
  createItemFromProduct,
  planDeductions,
  restock,
  shouldNotify,
  summarizeAlerts,
  withStatus,
} from "@/domain/inventory";
import { needsToPurposes } from "@/domain/needs";
import { PRODUCT_BY_ID } from "@/domain/products";

const lav = () => createItemFromProduct(PRODUCT_BY_ID["seikatsunoki-lavender"], "new", "lav");

describe("inventory status", () => {
  it("状態ごとに残量が整合する", () => {
    expect(lav().remaining).toBe(10);
    expect(withStatus(lav(), "unknown").remaining).toBeNull();
    expect(withStatus(lav(), "empty").remaining).toBe(0);
    expect(withStatus(lav(), "in_use", 3).remaining).toBe(3);
    expect(withStatus(lav(), "in_use", 0).status).toBe("empty");
    expect(restock(withStatus(lav(), "empty")).status).toBe("new");
  });

  it("アラート: 20% 以下で low、unknown/empty", () => {
    expect(alertLevel(lav())).toBeNull();
    expect(alertLevel(withStatus(lav(), "in_use", 2))).toBe("low");
    expect(alertLevel(withStatus(lav(), "unknown"))).toBe("unknown");
    expect(alertLevel(withStatus(lav(), "empty"))).toBe("empty");
    const s = summarizeAlerts([withStatus(lav(), "unknown"), { ...withStatus(lav(), "empty"), id: "x" }]);
    expect(s[0].level).toBe("empty");
  });

  it("作った記録で減算し、0 で empty へ遷移", () => {
    const item = withStatus(lav(), "in_use", 0.3);
    const blend = computeBlend({
      device: "nebulizer",
      capacityMl: 10,
      purposes: needsToPurposes(["sleep"]),
      inventory: [item],
      preferOwned: true,
    });
    const deductions = planDeductions(blend);
    expect(deductions.find((d) => d.inventoryItemId === "lav")).toBeTruthy();
    const res = applyDeductions([item], deductions);
    expect(res.inventory[0].status).toBe("empty");
    expect(res.newlyEmpty.map((i) => i.id)).toEqual(["lav"]);
  });

  it("unknown は減算しても unknown のまま", () => {
    const res = applyDeductions([withStatus(lav(), "unknown")], [{ inventoryItemId: "lav", amount: 1 }]);
    expect(res.inventory[0].status).toBe("unknown");
  });
});

describe("notifications", () => {
  it("JST で同じ日は再通知しない", () => {
    const now = new Date("2026-10-03T12:00:00+09:00");
    expect(shouldNotify(undefined, now)).toBe(true);
    expect(shouldNotify("2026-10-03T01:00:00+09:00", now)).toBe(false);
    expect(shouldNotify("2026-10-02T23:59:00+09:00", now)).toBe(true);
  });
});

describe("amazon", () => {
  it("ASIN なしは検索 URL、tag を付与", () => {
    const url = new URL(buildAmazonUrl({ searchQuery: "生活の木 ラベンダー" }, "abc-22"));
    expect(url.pathname).toBe("/s");
    expect(url.searchParams.get("k")).toBe("生活の木 ラベンダー");
    expect(url.searchParams.get("tag")).toBe("abc-22");
  });
  it("ASIN ありは /dp/、tag 未設定ならタグなし", () => {
    expect(buildAmazonUrl({ asin: "B000TEST", searchQuery: "x" }, undefined)).toBe("https://www.amazon.co.jp/dp/B000TEST");
  });
  it("カスタム URL は Amazon ドメインのときだけ tag 付与", () => {
    const item = { ...lav(), customUrl: "https://www.amazon.co.jp/dp/B0ABC" };
    expect(buildReorderUrl(item, undefined, "t-22")).toContain("tag=t-22");
    const other = { ...lav(), customUrl: "https://example.com/p" };
    expect(buildReorderUrl(other, undefined, "t-22")).toBe("https://example.com/p");
  });
});

import { buildStockDigest } from "@/domain/notify";

describe("buildStockDigest", () => {
  const now = new Date("2026-10-03T08:00:00+09:00");
  it("アラートをまとめ、今日送信済みは除外", () => {
    const empty = { ...withStatus(lav(), "empty"), id: "e" };
    const unknown = { ...withStatus(lav(), "unknown"), id: "u" };
    const d = buildStockDigest([empty, unknown, lav()], [], now);
    expect(d?.items).toEqual([{ id: "e", level: "empty" }, { id: "u", level: "unknown" }]);
    expect(d?.title).toContain("補充");
    const d2 = buildStockDigest([empty, unknown], [
      { inventory_item_id: "e", level: "empty", sent_at: "2026-10-03T07:00:00+09:00" },
      { inventory_item_id: "u", level: "unknown", sent_at: "2026-10-03T07:00:00+09:00" },
    ], now);
    expect(d2).toBeNull();
  });
});
