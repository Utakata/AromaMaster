import { describe, expect, it } from "vitest";
import { allocateDrops, computeBlend } from "@/domain/blendEngine";
import { deviceAmounts } from "@/domain/devices";
import { needsToPurposes } from "@/domain/needs";
import { createItemFromProduct } from "@/domain/inventory";
import { PRODUCT_BY_ID } from "@/domain/products";
import type { DeviceId } from "@/domain/types";

const sleep = needsToPurposes(["sleep"]);
const focus = needsToPurposes(["focus"]);

describe("deviceAmounts", () => {
  it("reed: 精油20% + 無水エタノール80%", () => {
    expect(deviceAmounts("reed", 100)).toEqual({ totalDrops: 400, totalOilMl: 20, ethanolMl: 80, waterMl: 0 });
    expect(deviceAmounts("reed", 50, "light")).toMatchObject({ totalOilMl: 7.5, ethanolMl: 42.5 });
  });
  it("nebulizer: 原液・エタノールなし", () => {
    expect(deviceAmounts("nebulizer", 10)).toEqual({ totalDrops: 200, totalOilMl: 10, ethanolMl: 0, waterMl: 0 });
  });
  it("ultrasonic: 4滴/100mL・エタノールなし", () => {
    expect(deviceAmounts("ultrasonic", 200)).toEqual({ totalDrops: 8, totalOilMl: 0.4, ethanolMl: 0, waterMl: 200 });
    expect(deviceAmounts("ultrasonic", 20).totalDrops).toBe(1);
  });
});

describe("allocateDrops", () => {
  it("合計を保ち、各成分 1 滴以上", () => {
    const d = allocateDrops([0.3, 0.5, 0.2], 7);
    expect(d.reduce((a, b) => a + b, 0)).toBe(7);
    expect(Math.min(...d)).toBeGreaterThanOrEqual(1);
  });
});

describe("computeBlend", () => {
  it.each<[DeviceId, number]>([
    ["reed", 100],
    ["nebulizer", 20],
    ["ultrasonic", 300],
  ])("%s %dmL: 滴数の合計が規則どおり・2〜4種", (device, cap) => {
    const b = computeBlend({ device, capacityMl: cap, purposes: sleep });
    const sum = b.components.reduce((a, c) => a + c.drops, 0);
    expect(sum).toBe(deviceAmounts(device, cap).totalDrops);
    expect(b.components.length).toBeGreaterThanOrEqual(2);
    expect(b.components.length).toBeLessThanOrEqual(4);
    if (device === "reed") expect(b.ethanolMl + b.totalOilMl).toBeCloseTo(cap, 5);
    else expect(b.ethanolMl).toBe(0);
  });

  it("睡眠のニーズではラベンダーが選ばれる", () => {
    const b = computeBlend({ device: "ultrasonic", capacityMl: 200, purposes: sleep });
    expect(b.components.map((c) => c.oilId)).toContain("lavender");
  });

  it("集中のニーズではローズマリーが選ばれ、てんかん設定で除外される", () => {
    const b1 = computeBlend({ device: "nebulizer", capacityMl: 10, purposes: focus });
    expect(b1.components.map((c) => c.oilId)).toContain("rosemary");
    const b2 = computeBlend({
      device: "nebulizer",
      capacityMl: 10,
      purposes: focus,
      safety: { pregnancy: false, children: false, pets: false, epilepsy: true },
    });
    expect(b2.components.map((c) => c.oilId)).not.toContain("rosemary");
    expect(b2.warnings.join()).toContain("除外");
  });

  it("在庫優先: 持っている精油を引き当て、エタノール不足を検出", () => {
    const owned = createItemFromProduct(PRODUCT_BY_ID["seikatsunoki-hinoki"], "new", "inv-hinoki");
    const b = computeBlend({ device: "reed", capacityMl: 100, purposes: needsToPurposes(["peace"]), inventory: [owned], preferOwned: true });
    const hinoki = b.components.find((c) => c.oilId === "hinoki");
    expect(hinoki?.inventoryItemId).toBe("inv-hinoki");
    expect(b.ethanolShortage).toBe(true);
  });

  it("ニーズ未選択でもリラックスとして調合できる", () => {
    const b = computeBlend({ device: "ultrasonic", capacityMl: 100, purposes: {} });
    expect(b.components.length).toBeGreaterThan(0);
  });
});
