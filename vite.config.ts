// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // موديول "cloudflare:workers" (اللي بنستخدمه في market.server.ts عشان نوصل
  // لتخزين KV المشترك بين نسخ Cloudflare) موديول خاص بيبقى متاح بس وقت
  // التشغيل الفعلي على Cloudflare، مش ملف حقيقي موجود في المشروع. من غير
  // السطر ده، أداة البناء (Vite/Rolldown) بتحاول تدوّر عليه كملف عادي
  // وتفشل البناء بالكامل. الإعداد ده بيقولها "سيبيه زي ما هو من غير ما
  // تفحصه، هيتحل لوحده وقت التشغيل الحقيقي بس".
  vite: {
    build: {
      rollupOptions: {
        external: ["cloudflare:workers"],
      },
    },
  },
});
