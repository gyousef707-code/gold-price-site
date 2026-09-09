import { useState } from "react";
import { Link } from "@/lib/router-compat.jsx";
import { useLang } from "../context/LangContext.jsx";
import FaIcon from "../components/FaIcon.jsx";
import useAlertPreferences, { type AlertKey } from "../hooks/useAlertPreferences";

// صف واحد: تسمية العيار + حقل السعر المستهدف + زرار التفعيل/الإلغاء.
// بيحتفظ بقيمة الحقل محليًا وهو بيتكتب (draft)، ومبيحفظش في localStorage
// إلا لما المستخدم يبعد عن الحقل (blur) أو يدوس على زرار التفعيل، عشان
// منكتبش على القرص مع كل حرف يتكتب.
function AlertTargetRow({
  akey,
  label,
  sublabel,
  target,
  enabled,
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
  onCommitTarget: (key: AlertKey, value: number | null) => void;
  onToggleEnabled: (key: AlertKey, enabled: boolean) => void;
  en: boolean;
  unit?: string;
}) {
  const [draft, setDraft] = useState(target != null ? String(target) : "");

  const hasValidTarget = draft.trim() !== "" && !Number.isNaN(Number(draft));

  const commit = () => {
    const num = draft.trim() === "" ? null : Number(draft);
    onCommitTarget(akey, Number.isNaN(num as number) ? null : num);
  };

  return (
    <div className="alert-row">
      <div>
        <div className="alert-row-label">{label}</div>
        {sublabel && <div className="alert-row-sub">{sublabel}</div>}
      </div>
      <div className="alert-target-controls">
        <div className="alert-target-input-wrap">
          <input
            type="number"
            inputMode="decimal"
            className="alert-target-input"
            placeholder={unit ?? (en ? "Target price" : "السعر المستهدف")}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
          />
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

  const row = (
    key: AlertKey,
    label: string,
    labelEn: string,
    sublabel?: string,
    sublabelEn?: string,
    unit?: string,
  ) => (
    <AlertTargetRow
      key={key}
      akey={key}
      label={en ? labelEn : label}
      sublabel={sublabel ? (en ? sublabelEn : sublabel) : undefined}
      target={prefs[key].target}
      enabled={prefs[key].enabled}
      onCommitTarget={setTarget}
      onToggleEnabled={setEnabled}
      en={en}
      unit={unit}
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
          ? "Set a target price for any item and turn on its alert — we'll notify you once the live price reaches it. Everything is saved on this device only."
          : "اكتب السعر المستهدف لأي عنصر وفعّل تنبيهه — هنبلغك أول ما السعر اللحظي يوصله. كل حاجة بتتحفظ على الجهاز ده بس."}
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
          en ? "Target %" : "النسبة %",
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
