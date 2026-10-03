import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { InventoryItem, Recipe, SafetyProfile, UsageLog } from "@/domain/types";
import { DEFAULT_SAFETY, type Repository } from "./types";

interface AromaDB extends DBSchema {
  inventory: { key: string; value: InventoryItem };
  recipes: { key: string; value: Recipe };
  usage: { key: string; value: UsageLog };
  settings: { key: string; value: { key: string; value: unknown } };
}

/** ブラウザ内（IndexedDB）に保存する。ログイン不要・この端末のみ。 */
export class LocalRepository implements Repository {
  readonly mode = "local" as const;
  private db: Promise<IDBPDatabase<AromaDB>>;

  constructor(name = "aromamaster") {
    this.db = openDB<AromaDB>(name, 1, {
      upgrade(db) {
        db.createObjectStore("inventory", { keyPath: "id" });
        db.createObjectStore("recipes", { keyPath: "id" });
        db.createObjectStore("usage", { keyPath: "id" });
        db.createObjectStore("settings", { keyPath: "key" });
      },
    });
  }

  async listInventory() {
    const items = await (await this.db).getAll("inventory");
    return items.sort((a, b) => a.label.localeCompare(b.label, "ja"));
  }
  async upsertInventory(items: InventoryItem[]) {
    const tx = (await this.db).transaction("inventory", "readwrite");
    await Promise.all([...items.map((i) => tx.store.put(i)), tx.done]);
  }
  async deleteInventory(id: string) {
    await (await this.db).delete("inventory", id);
  }
  async listRecipes() {
    const items = await (await this.db).getAll("recipes");
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async saveRecipe(recipe: Recipe) {
    await (await this.db).put("recipes", recipe);
  }
  async deleteRecipe(id: string) {
    await (await this.db).delete("recipes", id);
  }
  async listUsage() {
    const items = await (await this.db).getAll("usage");
    return items.sort((a, b) => b.madeAt.localeCompare(a.madeAt));
  }
  async addUsage(log: UsageLog) {
    await (await this.db).put("usage", log);
  }
  async getSafety(): Promise<SafetyProfile> {
    const row = await (await this.db).get("settings", "safety");
    return { ...DEFAULT_SAFETY, ...((row?.value as SafetyProfile | undefined) ?? {}) };
  }
  async saveSafety(safety: SafetyProfile) {
    await (await this.db).put("settings", { key: "safety", value: safety });
  }
}
