import { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext.jsx';

// بانر تثبيت التطبيق (PWA) على جوجل كروم.
// كروم بيدّي الموقع حدث beforeinstallprompt لما يبقى قابل للتثبيت، فنخزّنه ونظهر البانر فورًا.
// نافذة التثبيت الرسمية نفسها لازم تتفتح بضغطة من المستخدم (قيد من كروم)، فبنعرض زرار "تثبيت".
const DISMISS_KEY = 'install-dismissed-at';
const DISMISS_DAYS = 3;

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return at && Date.now() - at < DISMISS_DAYS * 86400000;
  } catch {
    return false;
  }
}

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export default function InstallPrompt() {
  const { lang } = useLang();
  const [evt, setEvt] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined' || isStandalone()) return undefined;

    // كروم بيحتاج service worker مسجّل عشان يعتبر الموقع قابل للتثبيت
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const onPrompt = (e) => {
      e.preventDefault();
      if (!recentlyDismissed()) setEvt(e);
    };
    const onInstalled = () => setEvt(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!evt) return null;

  const install = async () => {
    const e = evt;
    setEvt(null);
    try {
      await e.prompt();
      await e.userChoice;
    } catch {
      /* تجاهل */
    }
  };
  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* تجاهل */ }
    setEvt(null);
  };

  return (
    <div className="install-banner" role="dialog" aria-label={lang === 'en' ? 'Install app' : 'تثبيت التطبيق'}>
      <img src="/icons/icon-96.png" alt="" width="40" height="40" className="install-banner-icon" />
      <div className="install-banner-text">
        <strong>{lang === 'en' ? 'Install Zahaby app' : 'ثبّت تطبيق ذهبي'}</strong>
        <span>{lang === 'en' ? 'Live prices in one tap' : 'الأسعار لحظة بلحظة بضغطة واحدة'}</span>
      </div>
      <button type="button" className="install-banner-btn" onClick={install}>
        {lang === 'en' ? 'Install' : 'تثبيت'}
      </button>
      <button type="button" className="install-banner-x" onClick={dismiss} aria-label={lang === 'en' ? 'Close' : 'إغلاق'}>
        ×
      </button>
    </div>
  );
}
