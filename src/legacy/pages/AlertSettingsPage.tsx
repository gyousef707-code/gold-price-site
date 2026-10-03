import { useEffect, useRef, useState } from "react";
import { Link } from "@/lib/router-compat.jsx";
import { useLang } from "../context/LangContext.jsx";
import FaIcon from "../components/FaIcon.jsx";
import useApiData from "../hooks/useApiData.js";
import useAlertPreferences, { type AlertKey } from "../hooks/useAlertPreferences";
import { subscribeToPush } from "../hooks/useNotifications.js";
import { fetchServerAlerts, pushAlertsToServer } from "../lib/alertSync";

// صف واحد: تسمية العيار + حقل السعر المستهدف (متعبّى بالسعر الحي أول
// مرة) + زرار زيادة/نقصان + زرار التفعيل/الإلغاء.
function AlertTargetRow({
  akey,
  label,
  sublabel,
  target,
  enabled,
  livePrice,
  step,
  onCommitTarget,
  onToggleEnabled,
  en,
  unit,
}: {
  akey: AlertKey;
  label: string;
  sublabel?: string;
  target: number | null;
  enabled: boolean;
  livePrice: number | null;
  step: number;
  onCommitTarget: (key: AlertKey, value: number | null) => void;
  onToggleEnabled: (key: AlertKey, enabled: boolean, target?: number) => void;
  en: boolean;
  unit?: string;
}) {
  const [draft, setDraft] = useState(target != null ? String(target) : "");
  // بنسجّل هل المستخدم اتفاعل مع الحقل بنفسه (كتب أو دوس +/-) عشان بعد
  // كده نوقف تحديث الحقل تلقائيًا بالسعر الحي، ونسيب اختياره هو زي ما هو.
  const touchedRef = useRef(target != null);

  // أول ما السعر الحي يوصل (أو يتغيّر)، لو المستخدم لسه محددش سعر خاص بيه
  // بنفسه، بنعرض السعر الحالي كقيمة مبدئية جاهزة يقدر يعدّلها أو يقبلها.
  useEffect(() => {
    if (!touchedRef.current && livePrice != null) {
      setDraft(String(livePrice));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePrice]);

  const hasValidTarget = draft.trim() !== "" && !Number.isNaN(Number(draft));

  const commit = (nextDraft = draft) => {
    const num = nextDraft.trim() === "" ? null : Number(nextDraft);
    onCommitTarget(akey, Number.isNaN(num as number) ? null : num);
  };

  const bump = (delta: number) => {
    touchedRef.current = true;
    const base = draft.trim() === "" ? (livePrice ?? 0) : Number(draft);
    const next = Math.round((base + delta) * 100) / 100;
    const nextStr = String(next);
    setDraft(nextStr);
    commit(nextStr);
  };

  return (
    <div className="alert-row">
      <div>
        <div className="alert-row-label">{label}</div>
        {sublabel && <div className="alert-row-sub">{sublabel}</div>}
      </div>
      <div className="alert-target-controls">
        <div className="alert-target-stepper">
          <button
            type="button"
            className="alert-step-btn"
            aria-label={en ? "Decrease" : "تقليل"}
            onClick={() => bump(-step)}
          >
            −
          </button>
          <input
            type="number"
            inputMode="decimal"
            className="alert-target-input"
            placeholder={unit ?? (en ? "Target price" : "السعر المستهدف")}
            value={draft}
            onChange={(e) => {
              touchedRef.current = true;
              setDraft(e.target.value);
            }}
            onBlur={() => commit()}
          />
          <button
            type="button"
            className="alert-step-btn"
            aria-label={en ? "Increase" : "زيادة"}
            onClick={() => bump(step)}
          >
            +
          </button>
        </div>
        <button
          type="button"
          className={`alert-target-btn${enabled ? " active" : ""}`}
          disabled={!enabled && !hasValidTarget}
          onClick={() => {
            if (enabled) {
              onToggleEnabled(akey, false);
              return;
            }
            const num = Number(draft);
            commit();
            onToggleEnabled(akey, true, num);
          }}
        >
          {enabled ? (en ? "Alert active ✓" : "التنبيه مفعّل ✓") : en ? "Activate alert" : "تفعيل التنبيه"}
        </button>
      </div>
    </div>
  );
}

export default function AlertSettingsPage() {
  const { lang } = useLang();
  const en = lang === "en";
  const { prefs, setTarget, setEnabled, loaded } = useAlertPreferences();
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [reconciled, setReconciled] = useState(false);

  // نفس الـ endpoints المستخدمة في صفحتي الذهب والفضة، عشان الحقول تتعبّى
  // بالسعر اللحظي الحقيقي نفسه من غير أي مصدر تاني أو تكرار منطق.
  const { data: goldData } = useApiData("/api/public/gold-price", { intervalMs: 45000 });
  const { data: silverData } = useApiData("/api/public/silver-price", { intervalMs: 5 * 60000 });

  const livePrices: Partial<Record<AlertKey, number>> = {
    gold24: goldData?.caratPrices?.["24"]?.sell,
    gold21: goldData?.caratPrices?.["21"]?.sell,
    gold18: goldData?.caratPrices?.["18"]?.sell,
    goldPound: goldData?.pound?.sell,
    silver999: silverData?.silverPrices?.["999"]?.sell,
    silver925: silverData?.silverPrices?.["925"]?.sell,
    silver900: silverData?.silverPrices?.["900"]?.sell,
    usdSaygha: goldData?.implied_usd_rate,
    marketGap: goldData?.gap_value,
  };

  const livePricesRef = useRef(livePrices);
  useEffect(() => {
    livePricesRef.current = livePrices;
  });

  // أول ما الصفحة تفتح: لو السيرفر بعت تنبيه فعلاً (وصل الهدف) نقفله هنا كمان،
  // عشان ما يفضلش شكله "مفعّل" وهو خلاص اتبعت. لازم يخلص قبل أول مزامنة.
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    (async () => {
      const server = await fetchServerAlerts();
      if (cancelled) return;
      if (server) {
        let firedCount = 0;
        (Object.keys(server) as AlertKey[]).forEach((k) => {
          const s = server[k];
          if (s?.firedAt && prefs[k].enabled && prefs[k].target === s.target) {
            setEnabled(k, false);
            firedCount++;
          }
        });
        if (firedCount) {
          setStatus({
            kind: "ok",
            text: en
              ? "A price you were watching reached its target — the alert was sent and is now off."
              : "سعر كنت متابعه وصل لهدفك — التنبيه اتبعت واتقفل. فعّله تاني لو عايز تنبيه جديد.",
          });
        }
      }
      setReconciled(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // أي تغيير في التنبيهات بيتبعت للسيرفر (بعد نص ثانية من آخر تعديل)، والسيرفر
  // هو اللي بيقارن بالأسعار كل دقيقة ويبعت الإشعار حتى لو الموقع مقفول.
  useEffect(() => {
    if (!loaded || !reconciled) return;
    const t = setTimeout(async () => {
      const r = await pushAlertsToServer(prefs, livePricesRef.current);
      if (r === "not-subscribed") {
        setStatus({
          kind: "err",
          text: en
            ? "Notifications aren't enabled on this device, so alerts can't be delivered. Allow notifications for this site and activate again."
            : "الإشعارات مش مفعّلة على الجهاز ده فالتنبيه مش هيوصلك. اسمح بالإشعارات للموقع وفعّل التنبيه تاني.",
        });
      } else if (r === "failed") {
        setStatus({
          kind: "err",
          text: en
            ? "Couldn't save your alerts to the server. Check your connection and try again."
            : "مقدرناش نحفظ تنبيهاتك على السيرفر. اتأكد من النت وجرّب تاني.",
        });
      }
    }, 600);
    return () => clearTimeout(t);
  }, [prefs, loaded, reconciled, en]);

  const handleToggle = async (key: AlertKey, next: boolean, target?: number) => {
    if (!next) {
      setEnabled(key, false);
      return;
    }
    const live = livePrices[key];
    if (live != null && target != null && target === live) {
      setStatus({
        kind: "err",
        text: en
          ? "Your target equals the current price. Move it with + / − so we can notify you when it gets there."
          : "السعر المستهدف نفس السعر الحالي. عدّله بزرار + أو − عشان نبلّغك لما السعر يوصله.",
      });
      return;
    }
    // طلب إذن الإشعارات + تسجيل الجهاز (لازم يحصل من ضغطة المستخدم نفسها)
    const res = await subscribeToPush();
    if (!res.ok) {
      setStatus({ kind: "err", text: res.reason });
      return;
    }
    setStatus(null);
    setEnabled(key, true);
  };

  const row = (
    key: AlertKey,
    label: string,
    labelEn: string,
    sublabel?: string,
    sublabelEn?: string,
    opts?: { unit?: string; step?: number },
  ) => (
    <AlertTargetRow
      key={key}
      akey={key}
      label={en ? labelEn : label}
      sublabel={sublabel ? (en ? sublabelEn : sublabel) : undefined}
      target={prefs[key].target}
      enabled={prefs[key].enabled}
      livePrice={livePrices[key] ?? null}
      step={opts?.step ?? 5}
      onCommitTarget={setTarget}
      onToggleEnabled={handleToggle}
      en={en}
      unit={opts?.unit}
    />
  );

  return (
    <div className="page-wrap">
      <div className="breadcrumb">
        <Link to="/">{en ? "Home" : "الرئيسية"}</Link> /{" "}
        {en ? "Price alert settings" : "إعدادات تنبيهات الأسعار"}
      </div>

      <div className="notif-head">
        <h1>{en ? "Price alert settings" : "إعدادات تنبيهات الأسعار"}</h1>
      </div>
      <p className="alert-settings-intro">
        {en
          ? "Each field starts at today's live price — adjust it with + / − or type your own target, then activate the alert. Each alert is sent once, when the price reaches your target — even if the site is closed."
          : "كل حقل بيبدأ بالسعر الحي لحظة بلحظة — عدّله بزرار +/- أو اكتب سعرك المستهدف بنفسك، وبعدين فعّل التنبيه. والتنبيه بيوصلك مرة واحدة لما السعر يوصل هدفك، حتى لو الموقع مقفول."}
      </p>

      {status && (
        <p className={`alert-status alert-status-${status.kind}`} role="status">
          {status.text}
        </p>
      )}

      {/* تنبيهات الذهب */}
      <div className="alert-section">
        <div className="alert-section-head">
          <FaIcon icon="fa-solid fa-coins" />
          <h2>{en ? "Gold alerts" : "تنبيهات الذهب"}</h2>
        </div>
        <p className="alert-section-sub">
          {en
            ? "Get notified when a karat's price reaches your target"
            : "استقبل تنبيه لما سعر العيار يوصل للهدف اللي حددته"}
        </p>
        {row("gold24", "عيار 24", "24 karat")}
        {row("gold21", "عيار 21", "21 karat")}
        {row("gold18", "عيار 18", "18 karat")}
        {row("goldPound", "الجنيه الذهب", "Gold pound")}
      </div>

      {/* تنبيهات الفضة */}
      <div className="alert-section">
        <div className="alert-section-head">
          <FaIcon icon="fa-solid fa-gem" />
          <h2>{en ? "Silver alerts" : "تنبيهات الفضة"}</h2>
        </div>
        <p className="alert-section-sub">
          {en
            ? "Get notified when a purity's price reaches your target"
            : "استقبل تنبيه لما سعر العيار يوصل للهدف اللي حددته"}
        </p>
        {row("silver999", "عيار 999", "Purity 999")}
        {row("silver925", "عيار 925", "Purity 925")}
        {row("silver900", "عيار 900", "Purity 900")}
      </div>

      {/* تنبيهات العملات ودولار الصاغة */}
      <div className="alert-section">
        <div className="alert-section-head">
          <FaIcon icon="fa-solid fa-money-bill-transfer" />
          <h2>{en ? "Currency & jeweler's dollar alerts" : "تنبيهات العملات ودولار الصاغة"}</h2>
        </div>
        {row(
          "usdSaygha",
          "سعر دولار الصاغة",
          "Jeweler's dollar price",
          "تنبيه لما السعر يوصل للهدف",
          "Alert when price reaches target",
        )}
        {row(
          "marketGap",
          "فجوة السوق",
          "Market gap",
          "تنبيه لما نسبة الفجوة (%) توصل للهدف",
          "Alert when the gap (%) reaches target",
          { unit: en ? "Target %" : "النسبة %", step: 0.1 },
        )}
      </div>

      <div className="alert-settings-footer">
        <Link to="/notifications" className="alert-history-link">
          <FaIcon icon="fa-solid fa-clock-rotate-left" />
          {en ? "View past notification history" : "عرض سجل الإشعارات السابقة"}
        </Link>
      </div>
    </div>
  );
}
