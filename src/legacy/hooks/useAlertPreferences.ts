import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "app-alert-preferences";

export interface AlertPreferences {
  gold: {
    "24": boolean;
    "21": boolean;
    "18": boolean;
    pound: boolean;
  };
  silver: {
    "999": boolean;
    "925": boolean;
    "900": boolean;
    "800": boolean;
    "720": boolean;
    "500": boolean;
  };
  currency: {
    usdSaygha: boolean;
    marketGap: boolean;
  };
}

// القيم الافتراضية: كل التنبيهات مفعّلة، والمستخدم بعد كده يقفل اللي مش
// محتاجه. ده أفضل تجربة أولى (opt-out) بدل ما يفتحها كلها بنفسه من الصفر.
export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  gold: { "24": true, "21": true, "18": true, pound: true },
  silver: { "999": true, "925": true, "900": false, "800": false, "720": false, "500": false },
  currency: { usdSaygha: true, marketGap: true },
};

function readPreferences(): AlertPreferences {
  if (typeof window === "undefined") return DEFAULT_ALERT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ALERT_PREFERENCES;
    const parsed = JSON.parse(raw);
    // بندمج مع الافتراضي عشان لو ضفنا عيار جديد بعدين، القديم يفضل شغال
    // من غير ما يبوّظ إعدادات المستخدمين اللي خزنوا نسخة أقدم.
    return {
      gold: { ...DEFAULT_ALERT_PREFERENCES.gold, ...parsed?.gold },
      silver: { ...DEFAULT_ALERT_PREFERENCES.silver, ...parsed?.silver },
      currency: { ...DEFAULT_ALERT_PREFERENCES.currency, ...parsed?.currency },
    };
  } catch {
    return DEFAULT_ALERT_PREFERENCES;
  }
}

// دالة مساعدة تقدر تستوردها أي حتة تانية في الكود (زي useNotifications)
// عشان تعرف هل المستخدم عايز يستقبل تنبيه نوع معيّن ولا لأ، من غير ما
// تحتاج تستخدم الـ hook نفسه (مفيدة برة الكومبوننتات).
export function getAlertPreferences(): AlertPreferences {
  return readPreferences();
}

export default function useAlertPreferences() {
  const [prefs, setPrefs] = useState<AlertPreferences>(DEFAULT_ALERT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPrefs(readPreferences());
    setLoaded(true);
  }, []);

  const persist = useCallback((next: AlertPreferences) => {
    setPrefs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* تجاهل (مثلاً وضع تصفح خاص بيرفض localStorage) */
    }
  }, []);

  const toggle = useCallback(
    <G extends keyof AlertPreferences>(group: G, key: keyof AlertPreferences[G]) => {
      setPrefs((current) => {
        const next: AlertPreferences = {
          ...current,
          [group]: {
            ...current[group],
            [key]: !current[group][key],
          },
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* تجاهل */
        }
        return next;
      });
    },
    [],
  );

  return { prefs, toggle, setPrefs: persist, loaded };
}
