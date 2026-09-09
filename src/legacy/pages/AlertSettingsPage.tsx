import { Link } from "@/lib/router-compat.jsx";
import { useLang } from "../context/LangContext.jsx";
import FaIcon from "../components/FaIcon.jsx";
import useAlertPreferences, { type AlertPreferences } from "../hooks/useAlertPreferences";

// مفتاح تبديل واحد (Switch) — عنصر بسيط قابل لإعادة الاستخدام في أي قسم
function AlertToggle({
  checked,
  onChange,
  label,
  sublabel,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  sublabel?: string;
}) {
  return (
    <div className="alert-row">
      <div>
        <div className="alert-row-label">{label}</div>
        {sublabel && <div className="alert-row-sub">{sublabel}</div>}
      </div>
      <label className="alert-switch">
        <input type="checkbox" checked={checked} onChange={onChange} aria-label={label} />
        <span className="alert-switch-track" />
        <span className="alert-switch-thumb" />
      </label>
    </div>
  );
}

export default function AlertSettingsPage() {
  const { lang } = useLang();
  const en = lang === "en";
  const { prefs, toggle } = useAlertPreferences();

  const t = <G extends keyof AlertPreferences>(group: G) => (key: keyof AlertPreferences[G]) =>
    toggle(group, key);

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
          ? "Choose exactly which prices you want to be notified about when they change. Your choices are saved on this device only."
          : "اختار بالظبط الأسعار اللي عايز تتبلغ لما تتغيّر. اختياراتك بتتحفظ على الجهاز ده بس."}
      </p>

      {/* تنبيهات الذهب */}
      <div className="alert-section">
        <div className="alert-section-head">
          <FaIcon icon="fa-solid fa-coins" />
          <h2>{en ? "Gold alerts" : "تنبيهات الذهب"}</h2>
        </div>
        <p className="alert-section-sub">
          {en ? "Get notified when the price of a karat changes" : "استقبل تنبيه عند تغيّر سعر العيار"}
        </p>
        <AlertToggle
          checked={prefs.gold["24"]}
          onChange={() => t("gold")("24")}
          label={en ? "24 karat" : "عيار 24"}
        />
        <AlertToggle
          checked={prefs.gold["21"]}
          onChange={() => t("gold")("21")}
          label={en ? "21 karat" : "عيار 21"}
        />
        <AlertToggle
          checked={prefs.gold["18"]}
          onChange={() => t("gold")("18")}
          label={en ? "18 karat" : "عيار 18"}
        />
        <AlertToggle
          checked={prefs.gold.pound}
          onChange={() => t("gold")("pound")}
          label={en ? "Gold pound" : "الجنيه الذهب"}
        />
      </div>

      {/* تنبيهات الفضة */}
      <div className="alert-section">
        <div className="alert-section-head">
          <FaIcon icon="fa-solid fa-gem" />
          <h2>{en ? "Silver alerts" : "تنبيهات الفضة"}</h2>
        </div>
        <p className="alert-section-sub">
          {en ? "Get notified when the price of a purity changes" : "استقبل تنبيه عند تغيّر سعر العيار"}
        </p>
        <AlertToggle
          checked={prefs.silver["999"]}
          onChange={() => t("silver")("999")}
          label={en ? "Purity 999" : "عيار 999"}
        />
        <AlertToggle
          checked={prefs.silver["925"]}
          onChange={() => t("silver")("925")}
          label={en ? "Purity 925" : "عيار 925"}
        />
        <AlertToggle
          checked={prefs.silver["900"]}
          onChange={() => t("silver")("900")}
          label={en ? "Purity 900" : "عيار 900"}
        />
        <AlertToggle
          checked={prefs.silver["800"]}
          onChange={() => t("silver")("800")}
          label={en ? "Purity 800" : "عيار 800"}
        />
        <AlertToggle
          checked={prefs.silver["720"]}
          onChange={() => t("silver")("720")}
          label={en ? "Purity 720" : "عيار 720"}
        />
        <AlertToggle
          checked={prefs.silver["500"]}
          onChange={() => t("silver")("500")}
          label={en ? "Purity 500" : "عيار 500"}
        />
      </div>

      {/* تنبيهات العملات ودولار الصاغة */}
      <div className="alert-section">
        <div className="alert-section-head">
          <FaIcon icon="fa-solid fa-money-bill-transfer" />
          <h2>{en ? "Currency & jeweler's dollar alerts" : "تنبيهات العملات ودولار الصاغة"}</h2>
        </div>
        <AlertToggle
          checked={prefs.currency.usdSaygha}
          onChange={() => t("currency")("usdSaygha")}
          label={en ? "Jeweler's dollar price" : "سعر دولار الصاغة"}
          sublabel={en ? "Notify me when it changes" : "تنبيه عند تغيّر السعر"}
        />
        <AlertToggle
          checked={prefs.currency.marketGap}
          onChange={() => t("currency")("marketGap")}
          label={en ? "Market gap" : "فجوة السوق"}
          sublabel={
            en
              ? "Notify me when the gap between global and local price widens"
              : "تنبيه عند اتساع الفرق بين السعر العالمي والمحلي"
          }
        />
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
