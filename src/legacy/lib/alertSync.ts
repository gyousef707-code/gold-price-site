import type { AlertKey, AlertPreferences } from "../hooks/useAlertPreferences";

// تنبيهات الجهاز المخزّنة على السيرفر (الصفحة بتزامن معاها).
export type ServerAlerts = Partial<Record<AlertKey, { target: number; firedAt?: number }>>;

// endpoint اشتراك الـ Push الحالي للجهاز ده (أو null لو مش مشترك / المتصفح مش بيدعم)
async function getEndpoint(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    return sub?.endpoint ?? null;
  } catch {
    return null;
  }
}

async function post(body: unknown): Promise<{ ok: boolean; alerts?: ServerAlerts }> {
  try {
    const res = await fetch("/api/push/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false };
    const json: any = await res.json();
    return { ok: true, alerts: (json?.alerts ?? {}) as ServerAlerts };
  } catch {
    return { ok: false };
  }
}

// بيجيب التنبيهات اللي السيرفر شايفها لجهازك (null لو الجهاز مش مشترك)
export async function fetchServerAlerts(): Promise<ServerAlerts | null> {
  const endpoint = await getEndpoint();
  if (!endpoint) return null;
  const r = await post({ endpoint });
  return r.ok ? (r.alerts ?? {}) : null;
}

// بيبعت التنبيهات المفعّلة للسيرفر (هو اللي بيقارنها بالأسعار كل دقيقة ويبعت
// الإشعار حتى لو الموقع مقفول). livePrices بتتبعت كمرجع لتحديد اتجاه الهدف.
export async function pushAlertsToServer(
  prefs: AlertPreferences,
  livePrices: Partial<Record<AlertKey, number>>,
): Promise<"synced" | "not-subscribed" | "failed"> {
  const enabled = (Object.keys(prefs) as AlertKey[]).filter(
    (k) => prefs[k].enabled && prefs[k].target != null,
  );
  const endpoint = await getEndpoint();
  if (!endpoint) return enabled.length ? "not-subscribed" : "synced";

  const alerts: Record<string, { target: number; ref: number | null }> = {};
  for (const k of enabled) {
    alerts[k] = { target: prefs[k].target as number, ref: livePrices[k] ?? null };
  }
  const r = await post({ endpoint, alerts });
  return r.ok ? "synced" : "failed";
}
