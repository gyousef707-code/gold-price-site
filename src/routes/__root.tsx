import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider } from "@/legacy/context/ThemeContext.jsx";
import { LangProvider } from "@/legacy/context/LangContext.jsx";
import Layout from "@/legacy/components/Layout.jsx";

// لينكات زي /crypto#tool-crypto-calc أو /#tool-zakat-calc المفروض توديك
// لقسم معيّن جوه الصفحة. الراوتر مبيعملش scroll تلقائي للعنصر ده لوحده،
// فالكومبوننت ده بيراقب الـ hash وكل ما يتغيّر بيلف للعنصر اللي بنفس الـ id.
function HashScroll() {
  const hash = useRouterState({ select: (s) => s.location.hash });
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!hash) return;
    // بنستنى شوية عشان محتوى الصفحة الجديدة يخلص يترندر الأول (خصوصًا
    // لو جايين من صفحة تانية) قبل ما نحسب مكان العنصر ونلف له
    const timer = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => clearTimeout(timer);
  }, [hash, pathname]);

  return null;
}

// بيسجّل الـ Service Worker تلقائيًا لكل زائر بمجرد فتح الموقع، بغض النظر
// عن تفعيل الإشعارات من عدمه — عشان صفحة الأوفلاين المخصصة (public/offline.html)
// تشتغل لأي حد حتى لو مفعلش الإشعارات أبدًا.
function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

function NotFoundComponent() {
  return (
    <div className="page-wrap" style={{ textAlign: "center", padding: "60px 20px" }}>
      <h1 style={{ fontSize: 60, color: "var(--gold-primary)", marginBottom: 10 }}>404</h1>
      <p style={{ marginBottom: 20 }}>الصفحة اللي بتدور عليها مش موجودة أو اتنقلت.</p>
      <Link to="/" className="live-cta btn" style={{ display: "inline-block" }}>
        الرجوع للصفحة الرئيسية
      </Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="page-wrap" style={{ textAlign: "center", padding: "60px 20px" }}>
      <h1 style={{ fontSize: 22 }}>حصلت مشكلة في تحميل الصفحة</h1>
      <p style={{ margin: "10px 0 20px", color: "var(--text-muted)" }}>
        جرّب تحدّث الصفحة أو ترجع للرئيسية.
      </p>
      <button
        type="button"
        className="btn"
        onClick={() => {
          router.invalidate();
          reset();
        }}
      >
        إعادة المحاولة
      </button>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0d1117" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icons/icon-180.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/icons/icon-32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/icons/icon-16.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
        {/* CSS شاشة الفتح مكتوب هنا مباشرة (inline) عشان يظهر فورًا من غير
            ما يستنى تحميل ملف الـ CSS الرئيسي أو خطوط جوجل — ده اللي بيقصّر
            المدة اللي فيها شاشة أندرويد/كروم الافتراضية (الأيقونة لوحدها)
            بتفضل ظاهرة قبل ما شاشتنا تبان */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              #splash-screen{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0d1117 0%,#161b22 50%,#0d1117 100%);transition:opacity .6s ease,visibility .6s ease}
              #splash-screen.hidden{opacity:0;visibility:hidden;pointer-events:none}
              .splash-bg{position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 50% 50%,rgba(227,179,65,0.08) 0%,transparent 50%);animation:splashPulse 3s ease-in-out infinite}
              @keyframes splashPulse{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.1);opacity:1}}
              .splash-content{position:relative;z-index:1;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px}
              .splash-icon{animation:splashIconIn .8s cubic-bezier(.34,1.56,.64,1) forwards;opacity:0;transform:scale(.5)}
              @keyframes splashIconIn{to{opacity:1;transform:scale(1)}}
              .splash-title{font-size:36px;font-weight:800;color:#e3b341;margin:0;letter-spacing:2px;animation:splashFadeUp .6s .3s ease forwards;opacity:0;transform:translateY(20px)}
              .splash-subtitle{font-size:13px;color:#8b949e;margin:0;animation:splashFadeUp .6s .5s ease forwards;opacity:0;transform:translateY(20px)}
              @keyframes splashFadeUp{to{opacity:1;transform:translateY(0)}}
              .splash-loader{width:120px;height:3px;background:rgba(240,246,252,.1);border-radius:3px;overflow:hidden;margin-top:16px;animation:splashFadeUp .6s .7s ease forwards;opacity:0}
              .splash-loader-bar{width:0%;height:100%;background:linear-gradient(90deg,#e3b341,#f0c040);border-radius:3px;animation:splashLoad 1s .3s ease-in-out forwards}
              @keyframes splashLoad{0%{width:0%}60%{width:70%}100%{width:100%}}
            `,
          }}
        />
        {/* بنحمّل ملف الـ CSS الرئيسي وخط Cairo عن طريق كود JS عادي (مش
            onload attribute اللي اتلخبط بسبب إعدادات الأمان/الكاش عند
            الاستضافة) — إنشاء <link> بالجافاسكريبت وإضافته للصفحة بالطريقة
            دي معروف إنه مبيوقفش عرض الصفحة زي ما بيحصل مع <link> عادي
            موجود في الـ HTML من الأول */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var l1 = document.createElement('link');
                l1.rel = 'stylesheet';
                l1.href = ${JSON.stringify(appCss)};
                document.head.appendChild(l1);
                var l2 = document.createElement('link');
                l2.rel = 'stylesheet';
                l2.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap';
                document.head.appendChild(l2);
              })();
            `,
          }}
        />
        {/* Google Tag Manager */}
        <script
          async
          src="https://www.googletagmanager.com/gtm.js?id=GTM-P4GNGFR7"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
            `,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-P4GNGFR7"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        {/* SPLASH SCREEN — نفس شاشة الفتح القديمة (أيقونة + خط تحميل) */}
        <div id="splash-screen">
          <div className="splash-bg"></div>
          <div className="splash-content">
            <div className="splash-icon">
              <svg viewBox="0 0 100 100" width="80" height="80">
                <defs>
                  <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e3b341" />
                    <stop offset="50%" stopColor="#f0c040" />
                    <stop offset="100%" stopColor="#b8860b" />
                  </linearGradient>
                  <filter id="sglow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <circle cx="50" cy="50" r="46" fill="url(#sg)" filter="url(#sglow)" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#0d1117" strokeWidth="2" />
                <text
                  x="50"
                  y="60"
                  fontSize="26"
                  textAnchor="middle"
                  fill="#0d1117"
                  fontFamily="Cairo, serif"
                  fontWeight="800"
                >
                  ذهبي
                </text>
              </svg>
            </div>
            <h1 className="splash-title">ذهبي</h1>
            <p className="splash-subtitle">أسعار الذهب والفضة والعملات</p>
            <div className="splash-loader">
              <div className="splash-loader-bar"></div>
            </div>
          </div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                function hideSplash() {
                  var splash = document.getElementById('splash-screen');
                  if (splash) splash.classList.add('hidden');
                }
                // بنستنى إن الصفحة تخلص تحميل (مش كل الصور/الخطوط، بس
                // المحتوى نفسه) زائد وقت بسيط يخلي أنيميشن الفتح تتشاف
                // كاملة، بدل ما نستنى وقت ثابت طويل زي الأول أيًا كان
                // سرعة النت.
                function scheduleHide() {
                  setTimeout(hideSplash, 1300);
                }
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', scheduleHide);
                } else {
                  scheduleHide();
                }
                // خط أمان: لو لأي سبب المحتوى اتأخر جدًا، الشاشة تختفي
                // على أقصى تقدير بعد 4 ثواني عشان محدش يفضل شايفها معلّقة.
                setTimeout(hideSplash, 4000);
              })();
            `,
          }}
        />
        {/* END SPLASH SCREEN */}

        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LangProvider>
          <HashScroll />
          <SwRegister />
          {/* Layout بيحتوي الهيدر والقائمة والفوتر وبيرندر <Outlet /> جواه */}
          <Layout />
        </LangProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// ملاحظة: <Outlet /> بيترندر جوه Layout
void Outlet;
