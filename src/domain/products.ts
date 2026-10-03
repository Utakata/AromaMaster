import { OILS } from "./oils";
import type { Product } from "./types";

/**
 * 商品カタログ。ASIN は未検証のため初期は空とし、Amazon 検索 URL で案内する。
 * ASIN が分かったら asin を埋めると商品ページ (/dp/ASIN) リンクに切り替わる。
 */
const OIL_BRANDS: { brand: string; size: number; slug: string }[] = [
  { brand: "生活の木", size: 10, slug: "seikatsunoki" },
  { brand: "@aroma", size: 10, slug: "ataroma" },
  { brand: "フレーバーライフ", size: 10, slug: "flavorlife" },
];

/** 精油ごとの取り扱いブランド（すべてのブランドが全精油を扱うわけではない） */
const OIL_BRAND_AVAILABILITY: Record<string, string[]> = {
  lavender: ["seikatsunoki", "ataroma", "flavorlife"],
  bergamot: ["seikatsunoki", "ataroma", "flavorlife"],
  sweet_orange: ["seikatsunoki", "ataroma", "flavorlife"],
  lemon: ["seikatsunoki", "ataroma", "flavorlife"],
  grapefruit: ["seikatsunoki", "ataroma", "flavorlife"],
  rosemary: ["seikatsunoki", "ataroma", "flavorlife"],
  peppermint: ["seikatsunoki", "ataroma", "flavorlife"],
  eucalyptus: ["seikatsunoki", "ataroma", "flavorlife"],
  roman_chamomile: ["seikatsunoki", "flavorlife"],
  clary_sage: ["seikatsunoki", "flavorlife"],
  geranium: ["seikatsunoki", "ataroma", "flavorlife"],
  ylang_ylang: ["seikatsunoki", "ataroma", "flavorlife"],
  hinoki: ["seikatsunoki", "ataroma", "flavorlife"],
  sandalwood: ["seikatsunoki", "flavorlife"],
  frankincense: ["seikatsunoki", "ataroma", "flavorlife"],
};

const oilProducts: Product[] = OILS.flatMap((oil) =>
  OIL_BRANDS.filter((b) => (OIL_BRAND_AVAILABILITY[oil.id] ?? []).includes(b.slug)).map((b) => ({
    id: `${b.slug}-${oil.id}`,
    kind: "oil" as const,
    brand: b.brand,
    name: `${oil.name} エッセンシャルオイル ${b.size}mL`,
    size: b.size,
    unit: "mL" as const,
    oilId: oil.id,
    searchQuery: `${b.brand} ${oil.name.replace(/（.*?）/g, "")} 精油 ${b.size}ml`,
  })),
);

const consumables: Product[] = [
  {
    id: "kenei-ethanol-500",
    kind: "ethanol",
    brand: "健栄製薬",
    name: "無水エタノールIP 500mL",
    size: 500,
    unit: "mL",
    searchQuery: "健栄製薬 無水エタノールIP 500ml",
  },
  {
    id: "kenei-ethanol-100",
    kind: "ethanol",
    brand: "健栄製薬",
    name: "無水エタノールIP 100mL",
    size: 100,
    unit: "mL",
    searchQuery: "健栄製薬 無水エタノールIP 100ml",
  },
  {
    id: "rattan-sticks-20",
    kind: "stick",
    brand: "汎用",
    name: "リードディフューザー用ラタンスティック 20本",
    size: 20,
    unit: "本",
    searchQuery: "リードディフューザー ラタンスティック 詰め替え",
  },
  {
    id: "reed-bottle-100",
    kind: "bottle",
    brand: "汎用",
    name: "リードディフューザー用ガラス瓶 100mL",
    size: 1,
    unit: "本",
    searchQuery: "リードディフューザー 空瓶 ガラス 100ml",
  },
];

export const PRODUCTS: Product[] = [...oilProducts, ...consumables];

export const PRODUCT_BY_ID: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

export function productsForOil(oilId: string): Product[] {
  return PRODUCTS.filter((p) => p.oilId === oilId);
}

export const DEFAULT_ETHANOL_PRODUCT_ID = "kenei-ethanol-500";
