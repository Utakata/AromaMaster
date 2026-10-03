"use client";

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** 通知許可を求め、VAPID 鍵があればサーバーに購読を登録する */
export async function enablePush(): Promise<"granted" | "denied" | "unsupported" | "local-only"> {
  if (!pushSupported()) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";
  const reg = await registerServiceWorker();
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!reg || !key) return "local-only";
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }));
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
  return res.ok ? "granted" : "local-only";
}

/** 端末内で即時に通知を出す（在庫が 0 になった瞬間など） */
export async function showLocalNotification(title: string, body: string, url = "/inventory", tag?: string) {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await registerServiceWorker());
  if (!reg) return false;
  await reg.showNotification(title, { body, tag, data: { url }, icon: "/icon.svg", badge: "/icon.svg" });
  return true;
}
