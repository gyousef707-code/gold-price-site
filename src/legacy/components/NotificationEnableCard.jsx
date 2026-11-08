import { useCallback, useEffect, useRef, useState } from 'react';
import FaIcon from './FaIcon.jsx';
import { subscribeToPush } from '../hooks/useNotifications.js';

// كارت بسيط بيظهر في صفحات التنبيهات: بيقول للمستخدم حالة الإشعارات على جهازه،
// وفيه زرار واضح يفعّلها بضغطة. ولو كانت مقفولة من المتصفح بيفتح شرح مختصر بالخطوات.

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent || '');
}
function isStandalone() {
  return (
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true
  );
}

function readState() {
  if (typeof window === 'undefined') return 'unknown';
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return isIos() && !isStandalone() ? 'ios-install' : 'unsupported';
  }
  return Notification.permission; // granted | denied | default
}

export default function NotificationEnableCard() {
  const [state, setState] = useState('unknown');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [sheet, setSheet] = useState(false);
  const registered = useRef(false);

  const refresh = useCallback(() => {
    const s = readState();
    setState(s);
    // لو المستخدم فعّل الإذن من إعدادات المتصفح ورجع، نسجّل جهازه تلقائياً
    if (s === 'granted' && !registered.current) {
      registered.current = true;
      subscribeToPush().catch(() => {});
    }
    return s;
  }, []);

  useEffect(() => {
    refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  const enable = async () => {
    if (state === 'denied') {
      setSheet(true);
      return;
    }
    setBusy(true);
    setMsg('');
    const res = await subscribeToPush();
    setBusy(false);
    const s = refresh();
    if (!res.ok) {
      setMsg(res.reason || 'مقدرناش نفعّل الإشعارات.');
      if (s !== 'granted') setSheet(true);
    }
  };

  const recheck = () => {
    const s = refresh();
    if (s === 'granted') {
      setSheet(false);
      setMsg('');
    } else {
      setMsg('لسه الإشعارات مقفولة. اتبع الخطوات ورجّع الصفحة تاني.');
    }
  };

  if (state === 'unknown') return null;

  if (state === 'granted') {
    return (
      <div className="ne-ok" role="status">
        <FaIcon icon="fa-solid fa-bell" />
        <span>الإشعارات مفعّلة على جهازك ✓</span>
      </div>
    );
  }

  const title =
    state === 'ios-install'
      ? 'ضيف الموقع للشاشة الرئيسية الأول'
      : state === 'unsupported'
        ? 'المتصفح ده مش بيدعم الإشعارات'
        : 'فعّل الإشعارات على جهازك';
  const sub =
    state === 'ios-install'
      ? 'على الآيفون الإشعارات بتشتغل بس لو ضفت الموقع للشاشة الرئيسية: دوس زرار المشاركة ثم «إضافة إلى الشاشة الرئيسية»، وافتحه من الأيقونة.'
      : state === 'unsupported'
        ? 'جرّب تفتح الموقع من متصفح Chrome على الموبايل أو الكمبيوتر.'
        : state === 'denied'
          ? 'الإشعارات مقفولة للموقع. دوس على الزرار وهنوريك تفتحها إزاي.'
          : 'عشان توصلك تنبيهات الأسعار حتى لو الموقع مقفول، لازم تسمح بالإشعارات.';

  return (
    <>
      <div className="ne-card" role="region" aria-label="تفعيل الإشعارات">
        <div className="ne-top">
          <span className="ne-ico"><FaIcon icon="fa-regular fa-bell" /></span>
          <div className="ne-body">
            <div className="ne-title">{title}</div>
            <div className="ne-sub">{sub}</div>
          </div>
        </div>
        {(state === 'default' || state === 'denied') && (
          <button type="button" className="ne-btn" onClick={enable} disabled={busy}>
            {busy ? 'لحظة…' : state === 'denied' ? 'إزاي أفتح الإشعارات؟' : 'فعّل الإشعارات الآن'}
          </button>
        )}
        {msg && <div className="ne-msg">{msg}</div>}
      </div>

      {sheet && (
        <div className="ne-backdrop" onClick={() => setSheet(false)}>
          <div className="ne-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="طريقة فتح الإشعارات">
            <div className="ne-grab" />
            <div className="ne-sheet-title">افتح الإشعارات للموقع</div>
            <ol className="ne-steps">
              <li>دوس على أيقونة القفل (أو ⓘ) اللي جنب رابط الموقع فوق.</li>
              <li>اختار <b>الأذونات</b> (Permissions) ثم <b>الإشعارات</b>.</li>
              <li>اختار <b>سماح</b> (Allow)، وارجع للصفحة دي.</li>
            </ol>
            <p className="ne-hint">
              لو فتحت الموقع من داخل تطبيق تاني (تيليجرام أو واتساب)، افتحه من متصفح Chrome نفسه الأول.
            </p>
            {msg && <div className="ne-msg">{msg}</div>}
            <button type="button" className="ne-btn ne-btn-block" onClick={recheck}>
              فعّلتها، تحقّق دلوقتي
            </button>
            <button type="button" className="ne-link" onClick={() => setSheet(false)}>إغلاق</button>
          </div>
        </div>
      )}
    </>
  );
}
