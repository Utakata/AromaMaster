import { expect, test } from "@playwright/test";

test("OFNR → 調合 → 作った → 在庫が 0 で通知と Amazon 再購入", async ({ page }) => {
  // 1. 在庫にラベンダー（使用中・残り 0.2mL）を登録
  await page.goto("/inventory");
  await page.getByRole("button", { name: "＋ 追加" }).click();
  await page.getByLabel("商品", { exact: true }).selectOption("seikatsunoki-lavender");
  await page.getByRole("button", { name: "追加する" }).click();
  await expect(page.getByTestId("inventory-item")).toHaveCount(1);
  const item = page.getByTestId("inventory-item").first();
  await item.getByLabel("残量（mL）").fill("0.2");
  await item.getByRole("button", { name: "残量を更新" }).click();
  await expect(page.getByTestId("inventory-item").first()).toContainText("残りわずか");

  // 2. OFNR ウィザード
  await page.goto("/blend");
  await page.getByLabel("観察").fill("いつも最悪な夜で眠れない");
  await expect(page.getByText("評価の言葉かもしれません")).toBeVisible();
  await page.getByLabel("観察").fill("23時、寝室で布団に入って30分たっても眠れていない");
  await page.getByRole("button", { name: "次へ →" }).click();

  await page.getByRole("button", { name: "不安" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();

  const next = page.getByRole("button", { name: "次へ →" });
  await expect(next).toBeDisabled();
  await page.getByRole("button", { name: "よい眠り", exact: true }).click();
  await next.click();

  await page.getByRole("button", { name: /リードディフューザー/ }).click();
  await page.getByRole("button", { name: "100 mL", exact: true }).click();
  await page.getByRole("button", { name: "調合を見る" }).click();

  // 3. 結果: 要約・精油・エタノール 80mL・Amazon リンク（tag 付き）
  await expect(page.getByTestId("ofnr-summary")).toContainText("不安");
  await expect(page.getByTestId("ofnr-summary")).toContainText("よい眠り");
  await expect(page.getByTestId("ethanol-ml")).toHaveText("80 mL");
  const components = page.getByTestId("blend-component");
  expect(await components.count()).toBeGreaterThanOrEqual(2);
  await expect(components.filter({ hasText: "ラベンダー" })).toHaveCount(1);
  const drops = await page.getByTestId("drops").allInnerTexts();
  expect(drops.reduce((a, d) => a + Number(d), 0)).toBe(400);
  const href = await page.getByTestId("amazon-link").first().getAttribute("href");
  expect(href).toContain("amazon.co.jp");
  expect(href).toContain("tag=aromamaster-22");

  // 4. 作った → 在庫減算 → なくなった
  await page.getByRole("button", { name: "作った（在庫から差し引く）" }).click();
  await expect(page).toHaveURL(/\/recipes/);
  await expect(page.getByText("なくなった在庫があります")).toBeVisible();
  await expect(page.getByTestId("recipe")).toHaveCount(1);

  // 5. ダッシュボードに通知と再購入リンク
  await page.goto("/");
  await expect(page.getByTestId("alerts")).toContainText("なくなりました");
  await expect(page.getByTestId("reorder-link").first()).toHaveAttribute("href", /tag=aromamaster-22/);

  // 6. 補充すると新品に戻る
  await page.goto("/inventory?filter=alerts");
  await page.getByRole("button", { name: "補充した（新品に戻す）" }).click();
  await page.getByRole("button", { name: "すべて" }).click();
  await expect(page.getByTestId("inventory-item").first()).toContainText("10 / 10 mL");
});

test("状態「わからない」と安全設定による除外", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("てんかんの既往がある").check();

  await page.goto("/inventory");
  await page.getByRole("button", { name: "＋ 追加" }).click();
  await page.getByLabel("商品", { exact: true }).selectOption("kenei-ethanol-500");
  await page.getByRole("button", { name: "わからない" }).first().click();
  await page.getByRole("button", { name: "追加する" }).click();
  await expect(page.getByTestId("inventory-item").first()).toContainText("残量: わからない");

  await page.goto("/blend");
  await page.getByLabel("観察").fill("14時、デスクで同じ資料を3回読み直している");
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.getByRole("button", { name: "集中", exact: true }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.getByRole("button", { name: /ネブライザー式/ }).click();
  await page.getByRole("button", { name: "調合を見る" }).click();
  await expect(page.getByTestId("ethanol-ml")).toHaveText("0 mL");
  await expect(page.getByTestId("blend-component").filter({ hasText: "ローズマリー" })).toHaveCount(0);
  await expect(page.getByText(/ローズマリー.*除外しました/)).toBeVisible();
});

test("モバイル幅で横スクロールしない", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  for (const path of ["/", "/blend", "/inventory", "/library", "/settings"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
