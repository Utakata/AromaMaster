import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

interface SubscriptionJSON {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as SubscriptionJSON | null;
  if (!body?.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
  }
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ stored: false, reason: "supabase-not-configured" });
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ stored: false, reason: "not-signed-in" }, { status: 401 });

  const { error } = await supabase.from("push_subscriptions").upsert({
    endpoint: body.endpoint,
    user_id: data.user.id,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stored: true });
}

export async function DELETE(req: Request) {
  const body = (await req.json().catch(() => null)) as SubscriptionJSON | null;
  const supabase = await getServerSupabase();
  if (!supabase || !body?.endpoint) return NextResponse.json({ ok: true });
  await supabase.from("push_subscriptions").delete().eq("endpoint", body.endpoint);
  return NextResponse.json({ ok: true });
}
