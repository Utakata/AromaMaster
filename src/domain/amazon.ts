import type { InventoryItem, Product } from "./types";

const AMAZON_ORIGIN = "https://www.amazon.co.jp";

export function amazonTag(): string | undefined {
  const tag = process.env.NEXT_PUBLIC_AMAZON_TAG?.trim();
  return tag ? tag : undefined;
}

/** 商品の Amazon URL を作る。ASIN があれば商品ページ、無ければ検索結果。tag は環境変数から付与。 */
export function buildAmazonUrl(
  target: Pick<Product, "asin" | "searchQuery"> | { asin?: string; searchQuery: string },
  tag: string | undefined = amazonTag(),
): string {
  const url = target.asin
    ? new URL(`/dp/${encodeURIComponent(target.asin)}`, AMAZON_ORIGIN)
    : new URL("/s", AMAZON_ORIGIN);
  if (!target.asin) url.searchParams.set("k", target.searchQuery);
  if (tag) url.searchParams.set("tag", tag);
  return url.toString();
}

/** 在庫アイテムの再購入 URL。ユーザー登録の URL があればそれを優先（tag は Amazon ドメインのみ付与）。 */
export function buildReorderUrl(item: InventoryItem, product?: Product, tag: string | undefined = amazonTag()): string {
  if (item.customUrl) {
    try {
      const url = new URL(item.customUrl);
      if (tag && /(^|\.)amazon\.co\.jp$/.test(url.hostname)) url.searchParams.set("tag", tag);
      return url.toString();
    } catch {
      // 不正な URL は無視して既定リンクへ
    }
  }
  return buildAmazonUrl(
    { asin: item.asin ?? product?.asin, searchQuery: product?.searchQuery ?? `${item.brand} ${item.label}` },
    tag,
  );
}
