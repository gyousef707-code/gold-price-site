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
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap",
      },
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
              window.addEventListener('load', function () {
                setTimeout(function () {
                  var splash = document.getElementById('splash-screen');
                  if (splash) splash.classList.add('hidden');
                }, 2500);
              });
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
          {/* Layout بيحتوي الهيدر والقائمة والفوتر وبيرندر <Outlet /> جواه */}
          <Layout />
        </LangProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// ملاحظة: <Outlet /> بيترندر جوه Layout
void Outlet;
