import type { InventoryItem, Recipe, SafetyProfile, UsageLog } from "@/domain/types";

export interface Repository {
  readonly mode: "local" | "supabase";
  listInventory(): Promise<InventoryItem[]>;
  upsertInventory(items: InventoryItem[]): Promise<void>;
  deleteInventory(id: string): Promise<void>;
  listRecipes(): Promise<Recipe[]>;
  saveRecipe(recipe: Recipe): Promise<void>;
  deleteRecipe(id: string): Promise<void>;
  listUsage(): Promise<UsageLog[]>;
  addUsage(log: UsageLog): Promise<void>;
  getSafety(): Promise<SafetyProfile>;
  saveSafety(safety: SafetyProfile): Promise<void>;
}

export const DEFAULT_SAFETY: SafetyProfile = { pregnancy: false, children: false, pets: false, epilepsy: false };
