// مزامنة تنبيهات الدولة مع السيرفر (/api/push/country-alerts). منفصلة عن تنبيهات مصر.
export type CountryAlertKey = "gold24" | "gold22" | "gold21" | "gold18" | "silver999" | "silver925";
export type CountryServerAlerts = Partial<Record<CountryAlertKey, { target: number; firedAt?: number }>>;

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

async function post(body: unknown): Promise<{ ok: boolean; alerts?: CountryServerAlerts }> {
  try {
    const res = await fetch("/api/push/country-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false };
    const json: any = await res.json();
    return { ok: true, alerts: (json?.alerts ?? json?.data?.alerts ?? {}) as CountryServerAlerts };
  } catch {
    return { ok: false };
  }
}

export async function fetchCountryServerAlerts(country: string): Promise<CountryServerAlerts | null> {
  const endpoint = await getEndpoint();
  if (!endpoint) return null;
  const r = await post({ endpoint, country });
  return r.ok ? (r.alerts ?? {}) : null;
}

export async function pushCountryAlertsToServer(
  country: string,
  prefs: Record<string, { enabled: boolean; target: number | null }>,
  live: Partial<Record<CountryAlertKey, number>>,
): Promise<"synced" | "not-subscribed" | "failed"> {
  const enabled = Object.keys(prefs).filter((k) => prefs[k].enabled && prefs[k].target != null);
  const endpoint = await getEndpoint();
  if (!endpoint) return enabled.length ? "not-subscribed" : "synced";
  const alerts: Record<string, { target: number; ref: number | null }> = {};
  for (const k of enabled) alerts[k] = { target: prefs[k].target as number, ref: live[k as CountryAlertKey] ?? null };
  const r = await post({ endpoint, country, alerts });
  return r.ok ? "synced" : "failed";
}
