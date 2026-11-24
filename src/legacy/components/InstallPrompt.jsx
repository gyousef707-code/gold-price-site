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

// الآيفون/الآيباد مفيهمش beforeinstallprompt، فالتثبيت بيتم يدويًا من قايمة المشاركة.
// بنعرض نفس البانر، وزرار "تثبيت" بيفتح شرح بسيط بالخطوات.
function isIos() {
  const ua = window.navigator.userAgent || '';
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  // الآيباد الحديث بيعرّف نفسه كأنه Mac
  return window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
}
function isSafari() {
  const ua = window.navigator.userAgent || '';
  return !/crios|fxios|edgios|opios|gsa\//i.test(ua);
}

export default function InstallPrompt() {
  const { lang } = useLang();
  const en = lang === 'en';
  const [evt, setEvt] = useState(null);
  const [ios, setIos] = useState(false);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || isStandalone()) return undefined;

    // كروم بيحتاج service worker مسجّل عشان يعتبر الموقع قابل للتثبيت
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    if (isIos() && !recentlyDismissed()) setIos(true);

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

  if (!evt && !ios) return null;

  const install = async () => {
    if (ios) {
      setSheet(true);
      return;
    }
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
    setIos(false);
    setSheet(false);
  };

  return (
    <>
      <div className="install-banner" role="dialog" aria-label={en ? 'Install app' : 'تثبيت التطبيق'}>
        <img src="/icons/icon-96.png" alt="" width="40" height="40" className="install-banner-icon" />
        <div className="install-banner-text">
          <strong>{en ? 'Install Zahaby app' : 'ثبّت تطبيق ذهبي'}</strong>
          <span>{en ? 'Live prices in one tap' : 'الأسعار لحظة بلحظة بضغطة واحدة'}</span>
        </div>
        <button type="button" className="install-banner-btn" onClick={install}>
          {en ? 'Install' : 'تثبيت'}
        </button>
        <button type="button" className="install-banner-x" onClick={dismiss} aria-label={en ? 'Close' : 'إغلاق'}>
          ×
        </button>
      </div>

      {ios && sheet && (
        <div className="install-sheet-overlay" onClick={() => setSheet(false)}>
          <div
            className="install-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={en ? 'Install on iPhone' : 'التثبيت على الآيفون'}
            dir={en ? 'ltr' : 'rtl'}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{en ? 'Install Zahaby on your iPhone' : 'ثبّت ذهبي على الآيفون'}</h3>
            <ol>
              <li>
                {en ? 'Tap the ' : 'اضغط زر '}
                <strong>{en ? 'Share' : 'المشاركة'}</strong>
                <span className="install-sheet-share" aria-hidden="true">⬆︎</span>
                {en ? ' button in the browser bar.' : ' في شريط المتصفح.'}
              </li>
              <li>
                {en ? 'Choose ' : 'اختار '}
                <strong>{en ? 'Add to Home Screen' : 'إضافة إلى الشاشة الرئيسية'}</strong>
                {en ? '.' : '.'}
              </li>
              <li>
                {en ? 'Tap ' : 'اضغط '}
                <strong>{en ? 'Add' : 'إضافة'}</strong>
                {en ? ' and open the app from your home screen.' : ' وافتح التطبيق من الشاشة الرئيسية.'}
              </li>
            </ol>
            {!isSafari() && (
              <p className="install-sheet-note">
                {en
                  ? "Can't find it? Open this page in Safari and try again."
                  : 'لو ماظهرتش الخيارات دي، افتح الموقع من متصفح Safari وجرّب تاني.'}
              </p>
            )}
            <p className="install-sheet-note">
              {en
                ? 'Price alerts on iPhone work only after adding the app to the home screen.'
                : 'تنبيهات الأسعار على الآيفون بتشتغل بعد إضافة التطبيق للشاشة الرئيسية بس.'}
            </p>
            <button type="button" className="install-banner-btn install-sheet-close" onClick={() => setSheet(false)}>
              {en ? 'Got it' : 'تمام'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
