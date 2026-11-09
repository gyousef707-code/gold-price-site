import { useCallback, useEffect, useRef, useState } from 'react';
import FaIcon from './FaIcon.jsx';
import { subscribeToPush } from '../hooks/useNotifications.js';

// كارت بسيط في صفحات التنبيهات: بيقول حالة الإشعارات على جهاز المستخدم.
// - لو لسه ما اتسألش: زرار واحد بيفتح طلب الإذن ويسجّل الجهاز أوتوماتيك.
// - لو مقفولة من المتصفح: سطر واحد قصير، ولما المستخدم يفتحها ويرجع بتتفعّل لوحدها.

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
  const registered = useRef(false);

  const refresh = useCallback(() => {
    const s = readState();
    setState(s);
    // لو الإذن اتفتح (من هنا أو من إعدادات المتصفح)، نسجّل الجهاز تلقائياً
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
    let status = null;
    try {
      navigator.permissions
        ?.query({ name: 'notifications' })
        .then((p) => {
          status = p;
          p.onchange = refresh;
        })
        .catch(() => {});
    } catch {
      /* تجاهل */
    }
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refresh);
      if (status) status.onchange = null;
    };
  }, [refresh]);

  const enable = async () => {
    setMsg('');
    if (state === 'denied') {
      const s = refresh();
      if (s !== 'granted') setMsg('لسه مقفولة. فعّلها من القفل 🔒 فوق وارجع، وهتتفعل لوحدها.');
      return;
    }
    setBusy(true);
    const res = await subscribeToPush();
    setBusy(false);
    refresh();
    if (!res.ok) setMsg(res.reason || 'مقدرناش نفعّل الإشعارات، جرّب تاني.');
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
        : state === 'denied'
          ? 'الإشعارات مقفولة من المتصفح'
          : 'فعّل الإشعارات على جهازك';
  const sub =
    state === 'ios-install'
      ? 'على الآيفون: دوس زرار المشاركة ثم «إضافة إلى الشاشة الرئيسية»، وافتحه من الأيقونة.'
      : state === 'unsupported'
        ? 'جرّب تفتح الموقع من متصفح Chrome.'
        : state === 'denied'
          ? 'دوس على القفل 🔒 جنب الرابط ← الإشعارات ← سماح. وارجع هنا وهتتفعّل لوحدها.'
          : 'عشان توصلك تنبيهات الأسعار حتى لو الموقع مقفول.';

  return (
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
          {busy ? 'لحظة…' : state === 'denied' ? 'فعّلتها، تحقّق' : 'فعّل الإشعارات الآن'}
        </button>
      )}
      {msg && <div className="ne-msg">{msg}</div>}
    </div>
  );
}
