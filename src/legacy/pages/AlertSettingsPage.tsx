import { useEffect, useRef, useState } from "react";
import { Link } from "@/lib/router-compat.jsx";
import { useLang } from "../context/LangContext.jsx";
import FaIcon from "../components/FaIcon.jsx";
import useApiData from "../hooks/useApiData.js";
import useAlertPreferences, { type AlertKey } from "../hooks/useAlertPreferences";

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
  onToggleEnabled: (key: AlertKey, enabled: boolean) => void;
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
            if (!enabled) commit();
            onToggleEnabled(akey, !enabled);
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
  const { prefs, setTarget, setEnabled } = useAlertPreferences();

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
    silver800: silverData?.silverPrices?.["800"]?.sell,
    silver720: silverData?.silverPrices?.["720"]?.sell,
    silver500: silverData?.silverPrices?.["500"]?.sell,
    usdSaygha: goldData?.implied_usd_rate,
    marketGap: goldData?.gap_value,
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
      onToggleEnabled={setEnabled}
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
          ? "Each field starts at today's live price — adjust it with + / − or type your own target, then activate the alert. Everything is saved on this device only."
          : "كل حقل بيبدأ بالسعر الحي لحظة بلحظة — عدّله بزرار +/- أو اكتب سعرك المستهدف بنفسك، وبعدين فعّل التنبيه. كل حاجة بتتحفظ على الجهاز ده بس."}
      </p>

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
        {row("silver800", "عيار 800", "Purity 800")}
        {row("silver720", "عيار 720", "Purity 720")}
        {row("silver500", "عيار 500", "Purity 500")}
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
