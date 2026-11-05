import { useCallback, useEffect, useState } from "react";
import type { CountryAlertKey } from "../lib/countryAlertSync";

// تنبيهات كل دولة متخزنة في مفتاح منفصل (app-country-alerts-sa مثلاً) عشان متتلخبطش مع تنبيهات مصر.
export const COUNTRY_ALERT_KEYS: CountryAlertKey[] = ["gold24", "gold22", "gold21", "gold18", "silver999", "silver925"];
export type CountryAlertPrefs = Record<CountryAlertKey, { enabled: boolean; target: number | null }>;

const empty = (): CountryAlertPrefs =>
  Object.fromEntries(COUNTRY_ALERT_KEYS.map((k) => [k, { enabled: false, target: null }])) as CountryAlertPrefs;

function read(code: string): CountryAlertPrefs {
  const out = empty();
  if (typeof window === "undefined") return out;
  try {
    const parsed = JSON.parse(localStorage.getItem(`app-country-alerts-${code}`) || "{}");
    for (const k of COUNTRY_ALERT_KEYS) {
      const it = parsed?.[k];
      if (it && typeof it === "object") {
        out[k] = {
          enabled: Boolean(it.enabled),
          target: typeof it.target === "number" && !Number.isNaN(it.target) ? it.target : null,
        };
      }
    }
  } catch {
    /* تجاهل */
  }
  return out;
}

export default function useCountryAlertPreferences(code: string) {
  const [prefs, setPrefs] = useState<CountryAlertPrefs>(empty);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setPrefs(read(code));
    setLoaded(true);
  }, [code]);

  const update = useCallback(
    (key: CountryAlertKey, patch: Partial<{ enabled: boolean; target: number | null }>) => {
      setPrefs((cur) => {
        const merged = { ...cur[key], ...patch };
        if (merged.enabled && merged.target == null) return cur;
        const next = { ...cur, [key]: merged };
        try {
          localStorage.setItem(`app-country-alerts-${code}`, JSON.stringify(next));
        } catch {
          /* تجاهل */
        }
        return next;
      });
    },
    [code],
  );

  return {
    prefs,
    loaded,
    setTarget: (k: CountryAlertKey, v: number | null) => update(k, { target: v }),
    setEnabled: (k: CountryAlertKey, v: boolean) => update(k, { enabled: v }),
  };
}
