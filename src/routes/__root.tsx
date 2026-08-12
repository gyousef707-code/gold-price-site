import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider } from "@/legacy/context/ThemeContext.jsx";
import { LangProvider } from "@/legacy/context/LangContext.jsx";
import Layout from "@/legacy/components/Layout.jsx";

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
      {
        rel: "stylesheet",
        href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
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
      </head>
      <body>
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
          {/* Layout بيحتوي الهيدر والقائمة والفوتر وبيرندر <Outlet /> جواه */}
          <Layout />
        </LangProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// ملاحظة: <Outlet /> بيترندر جوه Layout
void Outlet;
