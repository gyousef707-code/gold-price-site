import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "app-target-alerts";

// كل تنبيه = سعر مستهدف + هل التنبيه مفعّل ولا لأ. لما السعر اللحظي القادم
// من السيرفر يوصل (أو يتخطى) السعر ده، هنا محل مقارنة السعر يتم لاحقًا
// (في useNotifications أو أي مكان تاني بيجيب الأسعار الحية).
export interface AlertTarget {
  enabled: boolean;
  target: number | null;
}

// تركيبة Key-Value واضحة ومسطّحة (مش متداخلة) — كل مفتاح هنا لازم يطابق
// بالظبط اسم السعر المقابل له لما نجيب الأسعار اللحظية من الـ API، عشان
// المقارنة بينهم تبقى مباشرة من غير أي تحويل أسماء.
export type AlertKey =
  | "gold24"
  | "gold21"
  | "gold18"
  | "goldPound"
  | "silver999"
  | "silver925"
  | "silver900"
  | "silver800"
  | "silver720"
  | "silver500"
  | "usdSaygha"
  | "marketGap";

export type AlertPreferences = Record<AlertKey, AlertTarget>;

const EMPTY: AlertTarget = { enabled: false, target: null };

export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  gold24: { ...EMPTY },
  gold21: { ...EMPTY },
  gold18: { ...EMPTY },
  goldPound: { ...EMPTY },
  silver999: { ...EMPTY },
  silver925: { ...EMPTY },
  silver900: { ...EMPTY },
  silver800: { ...EMPTY },
  silver720: { ...EMPTY },
  silver500: { ...EMPTY },
  usdSaygha: { ...EMPTY },
  marketGap: { ...EMPTY },
};

function readPreferences(): AlertPreferences {
  if (typeof window === "undefined") return DEFAULT_ALERT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ALERT_PREFERENCES;
    const parsed = JSON.parse(raw);
    // بندمج مع الافتراضي مفتاح مفتاح، عشان لو ضفنا عيار جديد بعدين أو
    // كان عند المستخدم نسخة أقدم، الإعدادات القديمة تفضل شغالة صح.
    const merged = { ...DEFAULT_ALERT_PREFERENCES } as AlertPreferences;
    (Object.keys(DEFAULT_ALERT_PREFERENCES) as AlertKey[]).forEach((key) => {
      const item = parsed?.[key];
      if (item && typeof item === "object") {
        merged[key] = {
          enabled: Boolean(item.enabled),
          target: typeof item.target === "number" && !Number.isNaN(item.target) ? item.target : null,
        };
      }
    });
    return merged;
  } catch {
    return DEFAULT_ALERT_PREFERENCES;
  }
}

function writePreferences(next: AlertPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* تجاهل (مثلاً وضع تصفح خاص بيرفض localStorage) */
  }
}

// دالة مساعدة تقدر تستوردها أي حتة تانية في الكود (زي useNotifications أو
// أي منطق مقارنة أسعار مستقبلي) عشان تجيب كل التنبيهات المفعّلة وأسعارها
// المستهدفة، من غير ما تحتاج تستخدم الـ hook نفسه جوه كومبوننت.
export function getAlertPreferences(): AlertPreferences {
  return readPreferences();
}

export default function useAlertPreferences() {
  const [prefs, setPrefsState] = useState<AlertPreferences>(DEFAULT_ALERT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPrefsState(readPreferences());
    setLoaded(true);
  }, []);

  // بيحدّث السعر المستهدف وهو لسه بيكتب، من غير ما يفعّل التنبيه لوحده —
  // التفعيل خطوة منفصلة (زرار "تفعيل التنبيه") عشان محدش يتبلغ بالغلط
  // وهو لسه بيكتب رقم.
  const setTarget = useCallback((key: AlertKey, value: number | null) => {
    setPrefsState((current) => {
      const next: AlertPreferences = {
        ...current,
        [key]: { ...current[key], target: value },
      };
      writePreferences(next);
      return next;
    });
  }, []);

  // بيفعّل/يلغي تفعيل التنبيه. مش بيسمح بالتفعيل من غير ما يكون فيه سعر
  // مكتوب فعلاً (رقم صحيح)، عشان منمنعش تنبيه من غير هدف واضح.
  const setEnabled = useCallback((key: AlertKey, enabled: boolean) => {
    setPrefsState((current) => {
      if (enabled && (current[key].target == null || Number.isNaN(current[key].target))) {
        return current; // مفيش سعر مكتوب لسه، تجاهل محاولة التفعيل
      }
      const next: AlertPreferences = {
        ...current,
        [key]: { ...current[key], enabled },
      };
      writePreferences(next);
      return next;
    });
  }, []);

  return { prefs, setTarget, setEnabled, loaded };
}
