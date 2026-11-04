import { useEffect, useRef, useState } from "react";
import { Link } from "@/lib/router-compat.jsx";
import CountryHero from "../components/CountryHero.jsx";
import FaIcon from "../components/FaIcon.jsx";
import useApiData from "../hooks/useApiData.js";
import useCountryAlertPreferences from "../hooks/useCountryAlertPreferences";
import { subscribeToPush } from "../hooks/useNotifications.js";
import {
  fetchCountryServerAlerts,
  pushCountryAlertsToServer,
  type CountryAlertKey,
} from "../lib/countryAlertSync";
import { COUNTRIES } from "../data/countries.js";

const LABELS: Record<CountryAlertKey, string> = {
  gold24: "ذهب عيار 24",
  gold22: "ذهب عيار 22",
  gold21: "ذهب عيار 21",
  gold18: "ذهب عيار 18",
  silver999: "فضة عيار 999",
  silver925: "فضة عيار 925",
};

function Row({
  label,
  target,
  enabled,
  live,
  step,
  decimals,
  unit,
  onTarget,
  onToggle,
}: {
  label: string;
  target: number | null;
  enabled: boolean;
  live: number | null;
  step: number;
  decimals: number;
  unit: string;
  onTarget: (v: number | null) => void;
  onToggle: (on: boolean, target?: number) => void;
}) {
  const [draft, setDraft] = useState(target != null ? String(target) : "");
  const touched = useRef(target != null);

  useEffect(() => {
    if (!touched.current && live != null) setDraft(String(live));
  }, [live]);

  const valid = draft.trim() !== "" && !Number.isNaN(Number(draft));
  const commit = (v = draft) => {
    const n = v.trim() === "" ? null : Number(v);
    onTarget(Number.isNaN(n as number) ? null : n);
  };
  const bump = (d: number) => {
    touched.current = true;
    const base = draft.trim() === "" ? (live ?? 0) : Number(draft);
    const next = String(Number((base + d).toFixed(decimals)));
    setDraft(next);
    commit(next);
  };

  return (
    <div className="alert-row">
      <div>
        <div className="alert-row-label">{label}</div>
        <div className="alert-row-sub">{live != null ? `الآن: ${live} ${unit}` : "جاري تحميل السعر…"}</div>
      </div>
      <div className="alert-target-controls">
        <div className="alert-target-stepper">
          <button type="button" className="alert-step-btn" aria-label="تقليل" onClick={() => bump(-step)}>
            −
          </button>
          <input
            type="number"
            inputMode="decimal"
            className="alert-target-input"
            placeholder="السعر المستهدف"
            value={draft}
            onChange={(e) => {
              touched.current = true;
              setDraft(e.target.value);
            }}
            onBlur={() => commit()}
          />
          <button type="button" className="alert-step-btn" aria-label="زيادة" onClick={() => bump(step)}>
            +
          </button>
        </div>
        <button
          type="button"
          className={`alert-target-btn${enabled ? " active" : ""}`}
          disabled={!enabled && !valid}
          onClick={() => {
            if (enabled) return onToggle(false);
            const n = Number(draft);
            commit();
            onToggle(true, n);
          }}
        >
          {enabled ? "التنبيه مفعّل ✓" : "تفعيل التنبيه"}
        </button>
      </div>
    </div>
  );
}

export default function CountryAlertsPage({ code }: { code: string }) {
  const c: any = (COUNTRIES as Record<string, any>)[code];
  const { prefs, loaded, setTarget, setEnabled } = useCountryAlertPreferences(code);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [reconciled, setReconciled] = useState(false);

  const { data } = useApiData(`/api/public/country-prices?c=${code}&t=gold`, { intervalMs: 60000 });

  const live: Partial<Record<CountryAlertKey, number>> = {};
  for (const k of data?.karats ?? []) live[`gold${k.karat}` as CountryAlertKey] = k.gram;
  for (const g of data?.silver?.grams ?? []) live[`silver${g.purity}` as CountryAlertKey] = g.gram;
  const liveRef = useRef(live);
  useEffect(() => {
    liveRef.current = live;
  });

  const dec: number = c?.decimals ?? 2;
  const step = dec >= 3 ? 0.1 : 1;
  const unit: string = c?.short ?? "";

  // أول فتح: لو السيرفر بعت تنبيه (وصل هدفه) نقفله هنا عشان ما يفضلش شكله مفعّل
  useEffect(() => {
    if (!loaded) return;
    setReconciled(false);
    let cancelled = false;
    (async () => {
      const server = await fetchCountryServerAlerts(code);
      if (cancelled) return;
      if (server) {
        let fired = 0;
        (Object.keys(server) as CountryAlertKey[]).forEach((k) => {
          const s = server[k];
          if (s?.firedAt && prefs[k]?.enabled && prefs[k].target === s.target) {
            setEnabled(k, false);
            fired++;
          }
        });
        if (fired) {
          setStatus({ kind: "ok", text: "سعر كنت متابعه وصل لهدفك — التنبيه اتبعت واتقفل. فعّله تاني لو عايز تنبيه جديد." });
        }
      }
      setReconciled(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, code]);

  // أي تغيير بيتبعت للسيرفر بعد 600ms، والسيرفر بيفحص كل دقيقة حتى لو الموقع مقفول
  useEffect(() => {
    if (!loaded || !reconciled) return;
    const t = setTimeout(async () => {
      const r = await pushCountryAlertsToServer(code, prefs, liveRef.current);
      if (r === "not-subscribed") {
        setStatus({ kind: "err", text: "الإشعارات مش مفعّلة على الجهاز ده فالتنبيه مش هيوصلك. اسمح بالإشعارات للموقع وفعّل التنبيه تاني." });
      } else if (r === "failed") {
        setStatus({ kind: "err", text: "مقدرناش نحفظ تنبيهاتك على السيرفر. اتأكد من النت وجرّب تاني." });
      }
    }, 600);
    return () => clearTimeout(t);
  }, [prefs, loaded, reconciled, code]);

  if (!c) return null;

  const handleToggle = async (key: CountryAlertKey, on: boolean, target?: number) => {
    if (!on) return setEnabled(key, false);
    const l = live[key];
    if (l != null && target != null && target === l) {
      setStatus({ kind: "err", text: "السعر المستهدف نفس السعر الحالي. عدّله بزرار + أو − عشان نبلّغك لما السعر يوصله." });
      return;
    }
    const res = await subscribeToPush();
    if (!res.ok) return setStatus({ kind: "err", text: res.reason });
    setStatus(null);
    setEnabled(key, true);
  };

  const row = (k: CountryAlertKey) => (
    <Row
      key={k}
      label={LABELS[k]}
      target={prefs[k].target}
      enabled={prefs[k].enabled}
      live={live[k] ?? null}
      step={step}
      decimals={dec}
      unit={unit}
      onTarget={(v) => setTarget(k, v)}
      onToggle={(on, t) => handleToggle(k, on, t)}
    />
  );

  return (
    <div className="cp" data-country={code}>
      <CountryHero code={code} title={`تنبيهات الأسعار في ${c.name}`} subtitle={`الأسعار بـ${c.currencyName} (للجرام)`} live={false} />

      <div className="page-wrap">
        <p className="alert-settings-intro">
          كل حقل بيبدأ بالسعر الحالي — عدّله بزرار +/- أو اكتب سعرك المستهدف، وبعدين فعّل التنبيه. التنبيه بيوصلك مرة واحدة لما السعر يوصل هدفك، حتى لو الموقع مقفول.
        </p>

        {status && (
          <p className={`alert-status alert-status-${status.kind}`} role="status">
            {status.text}
          </p>
        )}

        <div className="alert-section">
          <div className="alert-section-head">
            <FaIcon icon="fa-solid fa-coins" />
            <h2>تنبيهات الذهب</h2>
          </div>
          {(["gold24", "gold22", "gold21", "gold18"] as CountryAlertKey[]).map(row)}
        </div>

        <div className="alert-section">
          <div className="alert-section-head">
            <FaIcon icon="fa-solid fa-gem" />
            <h2>تنبيهات الفضة</h2>
          </div>
          {(["silver999", "silver925"] as CountryAlertKey[]).map(row)}
        </div>

        <div className="alert-settings-footer">
          <Link to="/notifications" className="alert-history-link">
            <FaIcon icon="fa-solid fa-clock-rotate-left" />
            عرض سجل الإشعارات السابقة
          </Link>
        </div>
      </div>
    </div>
  );
}
