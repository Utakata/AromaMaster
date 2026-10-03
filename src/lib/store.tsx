"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { applyDeductions, jstDayKey, planDeductions, summarizeAlerts } from "@/domain/inventory";
import type { InventoryItem, Recipe, SafetyProfile, UsageLog } from "@/domain/types";
import { registerServiceWorker, showLocalNotification } from "@/lib/push/client";
import { LocalRepository } from "@/lib/repo/local";
import { SupabaseRepository } from "@/lib/repo/supabase";
import { DEFAULT_SAFETY, type Repository } from "@/lib/repo/types";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface AppData {
  ready: boolean;
  repo: Repository | null;
  user: User | null;
  inventory: InventoryItem[];
  recipes: Recipe[];
  usage: UsageLog[];
  safety: SafetyProfile;
  error: string | null;
  saveInventory: (items: InventoryItem[]) => Promise<void>;
  removeInventory: (id: string) => Promise<void>;
  saveRecipe: (recipe: Recipe) => Promise<void>;
  removeRecipe: (id: string) => Promise<void>;
  recordMade: (recipe: Recipe) => Promise<{ newlyEmpty: InventoryItem[] }>;
  saveSafety: (s: SafetyProfile) => Promise<void>;
  migrateLocalToCloud: () => Promise<number>;
}

const Ctx = createContext<AppData | null>(null);

const LOCAL_NOTIFY_KEY = "aromamaster:last-local-digest";

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [repo, setRepo] = useState<Repository | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [usage, setUsage] = useState<UsageLog[]>([]);
  const [safety, setSafety] = useState<SafetyProfile>(DEFAULT_SAFETY);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ログイン状態に応じて保存先を切り替える
  useEffect(() => {
    const supabase = getBrowserSupabase();
    const pick = (u: User | null) => {
      setUser(u);
      setRepo(supabase && u ? new SupabaseRepository(supabase, u.id) : new LocalRepository());
    };
    if (!supabase) {
      pick(null);
      return;
    }
    supabase.auth.getUser().then(({ data }) => pick(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => pick(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!repo) return;
    let cancelled = false;
    setReady(false);
    Promise.all([repo.listInventory(), repo.listRecipes(), repo.listUsage(), repo.getSafety()])
      .then(([inv, rec, use, saf]) => {
        if (cancelled) return;
        setInventory(inv);
        setRecipes(rec);
        setUsage(use);
        setSafety(saf);
        setError(null);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [repo]);

  // 端末内の日次リマインド（サーバー Cron が使えないローカルモードでも通知できるように）
  useEffect(() => {
    registerServiceWorker();
    if (!ready) return;
    const alerts = summarizeAlerts(inventory);
    if (!alerts.length) return;
    try {
      const today = jstDayKey(new Date());
      if (localStorage.getItem(LOCAL_NOTIFY_KEY) === today) return;
      showLocalNotification("在庫を確認してみませんか？", alerts[0].message, "/inventory?filter=alerts", "daily").then((shown) => {
        if (shown) localStorage.setItem(LOCAL_NOTIFY_KEY, today);
      });
    } catch {
      // localStorage が使えない環境では通知しない
    }
  }, [ready, inventory]);

  const guard = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      if (!repo) throw new Error("データの準備中です。少し待ってからもう一度お試しください。");
      try {
        const r = await fn();
        setError(null);
        return r;
      } catch (e) {
        setError((e as Error).message);
        throw e;
      }
    },
    [repo],
  );

  const saveInventory = useCallback(
    async (items: InventoryItem[]) =>
      guard(async () => {
        await repo!.upsertInventory(items);
        setInventory((prev) => {
          const map = new Map(prev.map((i) => [i.id, i]));
          items.forEach((i) => map.set(i.id, i));
          return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "ja"));
        });
      }),
    [repo, guard],
  );

  const removeInventory = useCallback(
    async (id: string) =>
      guard(async () => {
        await repo!.deleteInventory(id);
        setInventory((prev) => prev.filter((i) => i.id !== id));
      }),
    [repo, guard],
  );

  const saveRecipe = useCallback(
    async (r: Recipe) =>
      guard(async () => {
        await repo!.saveRecipe(r);
        setRecipes((prev) => [r, ...prev.filter((x) => x.id !== r.id)]);
      }),
    [repo, guard],
  );

  const removeRecipe = useCallback(
    async (id: string) =>
      guard(async () => {
        await repo!.deleteRecipe(id);
        setRecipes((prev) => prev.filter((r) => r.id !== id));
      }),
    [repo, guard],
  );

  const recordMade = useCallback(
    async (recipe: Recipe) =>
      guard(async () => {
        const deductions = planDeductions(recipe.blend);
        const res = applyDeductions(inventory, deductions);
        await repo!.upsertInventory(res.changed);
        const log: UsageLog = { id: newId(), recipeId: recipe.id, madeAt: new Date().toISOString(), deductions };
        await repo!.addUsage(log);
        setInventory(res.inventory);
        setUsage((prev) => [log, ...prev]);
        for (const item of res.newlyEmpty) {
          showLocalNotification("なくなりました", `「${item.label}」を使い切りました。再購入しますか？`, `/inventory?item=${item.id}`, `empty-${item.id}`);
        }
        return { newlyEmpty: res.newlyEmpty };
      }),
    [repo, inventory, guard],
  );

  const saveSafety = useCallback(
    async (s: SafetyProfile) => {
      // 楽観的に反映し、保存に失敗したら元に戻す
      const prev = safety;
      setSafety(s);
      await guard(() => repo!.saveSafety(s)).catch(() => setSafety(prev));
    },
    [repo, guard, safety],
  );

  const migrateLocalToCloud = useCallback(
    async () =>
      guard(async () => {
        if (!repo || repo.mode !== "supabase") return 0;
        const local = new LocalRepository();
        const [inv, rec, use] = await Promise.all([local.listInventory(), local.listRecipes(), local.listUsage()]);
        await repo.upsertInventory(inv);
        for (const r of rec) await repo.saveRecipe(r);
        for (const u of use) await repo.addUsage(u).catch(() => undefined);
        setInventory(await repo.listInventory());
        setRecipes(await repo.listRecipes());
        return inv.length + rec.length;
      }),
    [repo, guard],
  );

  const value = useMemo<AppData>(
    () => ({
      ready,
      repo,
      user,
      inventory,
      recipes,
      usage,
      safety,
      error,
      saveInventory,
      removeInventory,
      saveRecipe,
      removeRecipe,
      recordMade,
      saveSafety,
      migrateLocalToCloud,
    }),
    [ready, repo, user, inventory, recipes, usage, safety, error, saveInventory, removeInventory, saveRecipe, removeRecipe, recordMade, saveSafety, migrateLocalToCloud],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData(): AppData {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppData must be used within AppDataProvider");
  return v;
}
