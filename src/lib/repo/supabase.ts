import type { SupabaseClient } from "@supabase/supabase-js";
import type { InventoryItem, Recipe, SafetyProfile, UsageLog } from "@/domain/types";
import { DEFAULT_SAFETY, type Repository } from "./types";

type InventoryRow = {
  id: string;
  user_id: string;
  product_id: string | null;
  kind: InventoryItem["kind"];
  oil_id: string | null;
  brand: string;
  label: string;
  size: number;
  unit: InventoryItem["unit"];
  remaining: number | null;
  status: InventoryItem["status"];
  low_threshold: number | null;
  asin: string | null;
  custom_url: string | null;
  updated_at: string;
};

export function inventoryToRow(i: InventoryItem, userId: string): InventoryRow {
  return {
    id: i.id,
    user_id: userId,
    product_id: i.productId ?? null,
    kind: i.kind,
    oil_id: i.oilId ?? null,
    brand: i.brand,
    label: i.label,
    size: i.size,
    unit: i.unit,
    remaining: i.remaining,
    status: i.status,
    low_threshold: i.lowThreshold ?? null,
    asin: i.asin ?? null,
    custom_url: i.customUrl ?? null,
    updated_at: i.updatedAt,
  };
}

export function rowToInventory(r: InventoryRow): InventoryItem {
  return {
    id: r.id,
    productId: r.product_id ?? undefined,
    kind: r.kind,
    oilId: r.oil_id ?? undefined,
    brand: r.brand,
    label: r.label,
    size: Number(r.size),
    unit: r.unit,
    remaining: r.remaining === null ? null : Number(r.remaining),
    status: r.status,
    lowThreshold: r.low_threshold === null ? undefined : Number(r.low_threshold),
    asin: r.asin ?? undefined,
    customUrl: r.custom_url ?? undefined,
    updatedAt: r.updated_at,
  };
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

/** Supabase（RLS で本人の行のみ読み書き可） */
export class SupabaseRepository implements Repository {
  readonly mode = "supabase" as const;
  constructor(private client: SupabaseClient, private userId: string) {}

  async listInventory() {
    const rows = check(await this.client.from("inventory_items").select("*").order("label"));
    return (rows as InventoryRow[]).map(rowToInventory);
  }
  async upsertInventory(items: InventoryItem[]) {
    if (!items.length) return;
    check(await this.client.from("inventory_items").upsert(items.map((i) => inventoryToRow(i, this.userId))));
  }
  async deleteInventory(id: string) {
    check(await this.client.from("inventory_items").delete().eq("id", id));
  }
  async listRecipes() {
    const rows = check(await this.client.from("recipes").select("*").order("created_at", { ascending: false }));
    return (rows as { id: string; created_at: string; title: string; ofnr: Recipe["ofnr"]; blend: Recipe["blend"] }[]).map(
      (r) => ({ id: r.id, createdAt: r.created_at, title: r.title, ofnr: r.ofnr, blend: r.blend }),
    );
  }
  async saveRecipe(r: Recipe) {
    check(
      await this.client.from("recipes").upsert({
        id: r.id,
        user_id: this.userId,
        created_at: r.createdAt,
        title: r.title,
        device: r.blend.device,
        capacity_ml: r.blend.capacityMl,
        ofnr: r.ofnr,
        blend: r.blend,
      }),
    );
  }
  async deleteRecipe(id: string) {
    check(await this.client.from("recipes").delete().eq("id", id));
  }
  async listUsage() {
    const rows = check(await this.client.from("usage_logs").select("*").order("made_at", { ascending: false }));
    return (rows as { id: string; recipe_id: string; made_at: string; deductions: UsageLog["deductions"] }[]).map((r) => ({
      id: r.id,
      recipeId: r.recipe_id,
      madeAt: r.made_at,
      deductions: r.deductions,
    }));
  }
  async addUsage(log: UsageLog) {
    check(
      await this.client.from("usage_logs").insert({
        id: log.id,
        user_id: this.userId,
        recipe_id: log.recipeId,
        made_at: log.madeAt,
        deductions: log.deductions,
      }),
    );
  }
  async getSafety(): Promise<SafetyProfile> {
    const res = await this.client.from("profiles").select("safety").eq("id", this.userId).maybeSingle();
    const row = check(res) as { safety: SafetyProfile } | null;
    return { ...DEFAULT_SAFETY, ...(row?.safety ?? {}) };
  }
  async saveSafety(safety: SafetyProfile) {
    check(await this.client.from("profiles").upsert({ id: this.userId, safety }));
  }
}
