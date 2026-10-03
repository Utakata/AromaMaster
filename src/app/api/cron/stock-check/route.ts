import { NextResponse } from "next/server";
import { buildStockDigest, type SentRecord } from "@/domain/notify";
import { isPushConfigured, sendPush, type StoredSubscription } from "@/lib/push/server";
import { rowToInventory } from "@/lib/repo/supabase";
import { getAdminSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Vercel Cron（vercel.json）から日次で呼ばれ、low / unknown / empty の在庫をプッシュ通知する */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = getAdminSupabase();
  if (!admin || !isPushConfigured()) {
    return NextResponse.json({ skipped: true, reason: "supabase or VAPID not configured" });
  }

  const { data: subs, error } = await admin.from("push_subscriptions").select("endpoint,user_id,p256dh,auth");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byUser = new Map<string, StoredSubscription[]>();
  for (const s of subs ?? []) byUser.set(s.user_id, [...(byUser.get(s.user_id) ?? []), s]);

  const now = new Date();
  let notified = 0;
  for (const [userId, userSubs] of byUser) {
    const [{ data: items }, { data: sent }] = await Promise.all([
      admin.from("inventory_items").select("*").eq("user_id", userId),
      admin.from("notifications_sent").select("inventory_item_id,level,sent_at").eq("user_id", userId),
    ]);
    const digest = buildStockDigest((items ?? []).map(rowToInventory), (sent ?? []) as SentRecord[], now);
    if (!digest) continue;

    const results = await Promise.all(
      userSubs.map((s) => sendPush(s, { title: digest.title, body: digest.body, url: digest.url, tag: "stock-check" })),
    );
    const gone = userSubs.filter((_, i) => results[i] === "gone").map((s) => s.endpoint);
    if (gone.length) await admin.from("push_subscriptions").delete().in("endpoint", gone);
    if (results.includes("ok")) {
      notified++;
      await admin.from("notifications_sent").upsert(
        digest.items.map((i) => ({ user_id: userId, inventory_item_id: i.id, level: i.level, sent_at: now.toISOString() })),
      );
    }
  }
  return NextResponse.json({ users: byUser.size, notified });
}
