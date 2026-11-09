import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribeToPush } from '../hooks/useNotifications.js';

// كارت "الإشعارات" بنفس تصميم الإعدادات:
// - سويتش: ضغطة بتشغّل تنبيهات الأسعار (وبتطلب الإذن أوتوماتيك)، وضغطة تانية بتوقفها.
// - "اهتماماتي": شاشة من تحت تختار منها العيار اللي بتتابعه والأونصة العالمية.

const OPT_OUT = 'push-opt-out';
const DEFAULT_PREFS = { k18: false, k21: true, k24: false, ounce: false };
const LEGACY_PREFS = { k18: false, k21: true, k24: true, ounce: false }; // الأجهزة القديمة

const Svg = ({ children, size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const BellIcon = (p) => (
  <Svg {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Svg>
);
const BellOffIcon = (p) => (
  <Svg {...p}>
    <path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5" />
    <path d="M17 17H3s3-2 3-9a4.7 4.7 0 0 1 .3-1.7" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    <path d="m2 2 20 20" />
  </Svg>
);
const GridIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </Svg>
);
const GlobeIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </Svg>
);
const ChevronIcon = (p) => (
  <Svg {...p}>
    <path d="m15 18-6-6 6-6" />
  </Svg>
);

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent || '');
}
function isStandalone() {
  return (
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true
  );
}
function supportState() {
  if (typeof window === 'undefined') return 'unknown';
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return isIos() && !isStandalone() ? 'ios-install' : 'unsupported';
  }
  return Notification.permission; // granted | denied | default
}
async function currentSub() {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    return (await reg?.pushManager.getSubscription()) || null;
  } catch {
    return null;
  }
}
async function postJson(url, body) {
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    let json = null;
    try { json = await r.json(); } catch { /* تجاهل */ }
    return { ok: r.ok, status: r.status, json };
  } catch {
    return { ok: false, status: 0, json: null };
  }
}
// null = جهاز قديم من غير اهتمامات | undefined = فشل التحميل
async function loadPrefs(endpoint) {
  let r = await postJson('/api/push/prefs', { endpoint });
  if (r.status === 404) {
    await subscribeToPush();
    r = await postJson('/api/push/prefs', { endpoint });
  }
  return r.ok ? (r.json?.prefs ?? null) : undefined;
}
function summary(p) {
  const ks = ['18', '21', '24'].filter((k) => p['k' + k]);
  const parts = [];
  if (ks.length) parts.push('عيار ' + ks.join(' و'));
  if (p.ounce) parts.push('الأونصة عالمياً');
  return parts.join(' + ') || 'لم تختر بعد';
}

export default function NotificationEnableCard() {
  const [perm, setPerm] = useState('unknown');
  const [on, setOn] = useState(false);
  const [prefs, setPrefs] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState(DEFAULT_PREFS);
  const [sheetMsg, setSheetMsg] = useState('');
  const loadedFor = useRef('');

  const refresh = useCallback(async () => {
    const p = supportState();
    setPerm(p);
    if (p !== 'granted') {
      setOn(false);
      return;
    }
    let optOut = false;
    try { optOut = localStorage.getItem(OPT_OUT) === '1'; } catch { /* تجاهل */ }
    const sub = await currentSub();
    const active = !!sub && !optOut;
    setOn(active);
    if (active && loadedFor.current !== sub.endpoint) {
      loadedFor.current = sub.endpoint;
      const loaded = await loadPrefs(sub.endpoint);
      if (loaded === null) setPrefs(LEGACY_PREFS);
      else if (loaded) setPrefs(loaded);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const afterTouch = () => setTimeout(refresh, 2500); // الاشتراك التلقائي بعد أول لمسة
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refresh);
    window.addEventListener('pointerdown', afterTouch, { once: true });
    let status = null;
    try {
      navigator.permissions?.query({ name: 'notifications' }).then((s) => { status = s; s.onchange = refresh; }).catch(() => {});
    } catch { /* تجاهل */ }
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pointerdown', afterTouch);
      if (status) status.onchange = null;
    };
  }, [refresh]);

  const toggle = async () => {
    if (busy) return;
    setMsg('');
    if (perm === 'denied') {
      setMsg('الإشعارات مقفولة من المتصفح. دوس على القفل 🔒 جنب الرابط ← الإشعارات ← سماح، وارجع هنا وهتتفعّل لوحدها.');
      return;
    }
    setBusy(true);
    try {
      if (!on) {
        try { localStorage.removeItem(OPT_OUT); } catch { /* تجاهل */ }
        const res = await subscribeToPush();
        if (!res.ok) {
          setMsg(res.reason || 'مقدرناش نفعّل الإشعارات، جرّب تاني.');
        } else {
          const sub = await currentSub();
          if (sub) {
            loadedFor.current = sub.endpoint;
            const loaded = await loadPrefs(sub.endpoint);
            if (loaded === null) {
              const r = await postJson('/api/push/prefs', { endpoint: sub.endpoint, prefs: DEFAULT_PREFS });
              setPrefs(r.ok && r.json?.prefs ? r.json.prefs : DEFAULT_PREFS);
            } else if (loaded) {
              setPrefs(loaded);
            }
            setOn(true);
          }
        }
      } else {
        try { localStorage.setItem(OPT_OUT, '1'); } catch { /* تجاهل */ }
        const sub = await currentSub();
        if (sub) {
          const endpoint = sub.endpoint;
          await sub.unsubscribe().catch(() => {});
          await postJson('/api/push/unsubscribe', { endpoint });
        }
        loadedFor.current = '';
        setOn(false);
      }
    } finally {
      setBusy(false);
      setPerm(supportState());
    }
  };

  const openSheet = () => {
    setDraft({ ...DEFAULT_PREFS, ...(prefs || {}) });
    setSheetMsg('');
    setSheet(true);
  };
  const flip = (k) => setDraft((d) => ({ ...d, [k]: !d[k] }));
  const save = async () => {
    if (!draft.k18 && !draft.k21 && !draft.k24 && !draft.ounce) {
      setSheetMsg('اختار عيار واحد على الأقل.');
      return;
    }
    setBusy(true);
    const sub = await currentSub();
    if (!sub) {
      setBusy(false);
      setSheetMsg('الجهاز مش مشترك في الإشعارات.');
      return;
    }
    const r = await postJson('/api/push/prefs', { endpoint: sub.endpoint, prefs: draft });
    setBusy(false);
    if (!r.ok) {
      setSheetMsg('مقدرناش نحفظ، جرّب تاني.');
      return;
    }
    setPrefs(r.json?.prefs || draft);
    setSheet(false);
  };

  if (perm === 'unknown') return null;

  const disabled = busy || perm === 'unsupported' || perm === 'ios-install';
  const subText = on
    ? 'مفعّلة'
    : perm === 'denied'
      ? 'مقفولة من المتصفح'
      : perm === 'ios-install'
        ? 'ضيف الموقع للشاشة الرئيسية الأول'
        : perm === 'unsupported'
          ? 'المتصفح ده مش بيدعمها'
          : 'غير مفعّلة';

  return (
    <section className="ns" aria-label="الإشعارات">
      <div className="ns-head">
        <span className="ns-head-ico"><BellIcon size={22} /></span>
        <h2>الإشعارات</h2>
      </div>

      <div className="ns-card">
        <div className="ns-row">
          <span className={`ns-ico${on ? ' on' : ''}`}>{on ? <BellIcon /> : <BellOffIcon />}</span>
          <div className="ns-text">
            <div className="ns-title">تنبيهات الأسعار</div>
            <div className="ns-sub">{subText}</div>
          </div>
          <button type="button" role="switch" aria-checked={on} aria-label="تنبيهات الأسعار" className={`ns-switch${on ? ' on' : ''}`} onClick={toggle} disabled={disabled}>
            <span />
          </button>
        </div>

        {on && prefs && (
          <>
            <div className="ns-div" />
            <button type="button" className="ns-row ns-row-btn" onClick={openSheet}>
              <span className="ns-ico"><GridIcon /></span>
              <div className="ns-text">
                <div className="ns-title">اهتماماتي</div>
                <div className="ns-sub">{summary(prefs)}</div>
              </div>
              <span className="ns-chev"><ChevronIcon size={22} /></span>
            </button>
          </>
        )}
      </div>
      {msg && <p className="ns-msg" role="status">{msg}</p>}

      {sheet && (
        <div className="ns-backdrop" onClick={() => setSheet(false)}>
          <div className="ns-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="تنبيهات أسعار الذهب">
            <div className="ns-grab" />
            <span className="ns-bubble"><BellIcon size={34} /></span>
            <h3 className="ns-sheet-title">تنبيهات أسعار الذهب</h3>
            <p className="ns-sheet-sub">اختر ما تتابعه، ونضبط إشعاراتك عليه</p>

            <div className="ns-label">العيار الذي تتابعه</div>
            <div className="ns-pills">
              {['24', '21', '18'].map((k) => (
                <button key={k} type="button" className={`ns-pill${draft['k' + k] ? ' on' : ''}`} onClick={() => flip('k' + k)}>
                  عيار {k}
                </button>
              ))}
            </div>

            <div className="ns-label">سعر عالمي</div>
            <div className="ns-row ns-box">
              <span className="ns-ico"><GlobeIcon /></span>
              <div className="ns-text">
                <div className="ns-title">الأونصة عالمياً</div>
                <div className="ns-sub">سعر الذهب العالمي، لا يتبع دولتك</div>
              </div>
              <button type="button" role="switch" aria-checked={draft.ounce} aria-label="الأونصة عالمياً" className={`ns-switch${draft.ounce ? ' on' : ''}`} onClick={() => flip('ounce')}>
                <span />
              </button>
            </div>

            {sheetMsg && <p className="ns-msg">{sheetMsg}</p>}
            <button type="button" className="ns-save" onClick={save} disabled={busy}>{busy ? 'لحظة…' : 'حفظ'}</button>
            <button type="button" className="ns-cancel" onClick={() => setSheet(false)}>إلغاء</button>
          </div>
        </div>
      )}
    </section>
  );
}
