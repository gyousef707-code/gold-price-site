import { createFileRoute } from "@tanstack/react-router";
import GoldPage from "@/legacy/pages/GoldPage.jsx";
import { seoMeta } from "@/lib/seo";
import { getGoldPrices } from "@/lib/market.server";

// مهلة أمان: لو السعر مجاش بسرعة (أقل من ثانية)، السيرفر يبعت الصفحة على
// طول ويسيب المتصفح يجيب السعر بنفسه (زي ما كان بالظبط قبل كده)، عشان
// لو مصدر السعر اتأخر لأي سبب، ده منعملوش يبطّئ تحميل الصفحة كلها.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export const Route = createFileRoute("/")({
  // بيحاول يجيب سعر الذهب من السيرفر قبل ما يبعت الصفحة، عشان السعر يظهر
  // فورًا من غير ما ينتظر تحميل الجافاسكريبت (بيحسّن سرعة ظهور المحتوى/LCP).
  // بيستخدم نفس الكاش الداخلي (30 ثانية) اللي بيستخدمه الـ API، فمفيش
  // تكرار في الطلب لموقع المصدر. ولو اتأخر الرد، الصفحة تتبعت عادي فورًا.
  loader: async () => {
    try {
      const initialGoldData = await withTimeout(getGoldPrices(), 1000);
      return { initialGoldData };
    } catch {
      // لو فشل الجلب وقت التحميل، الصفحة تكمل عادي وتجيب البيانات
      // من المتصفح زي ما كانت بتعمل قبل كده (سلوك احتياطي بدون أي كسر).
      return { initialGoldData: null };
    }
  },
  head: () =>
    seoMeta({
      title: "سعر الذهب اليوم في مصر | ذهبي",
      description:
        "تابع سعر الذهب اليوم في مصر لحظة بلحظة: عيار 24 و21 و18 وكل العيارات، بيع وشراء، محدثة أوتوماتيك.",
      keywords: "سعر الذهب اليوم, اسعار الذهب في مصر, سعر الذهب عيار 21",
      path: "/",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  const { initialGoldData } = Route.useLoaderData();
  return <GoldPage initialGoldData={initialGoldData} />;
}
