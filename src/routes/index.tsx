import { createFileRoute } from "@tanstack/react-router";
import GoldPage from "@/legacy/pages/GoldPage.jsx";
import { seoMeta } from "@/lib/seo";
import { getGoldPrices } from "@/lib/market.server";

export const Route = createFileRoute("/")({
  // بيجيب سعر الذهب من السيرفر قبل ما يبعت الصفحة، عشان السعر يظهر فورًا
  // من غير ما ينتظر تحميل الجافاسكريبت (بيحسّن سرعة ظهور المحتوى/LCP).
  // بيستخدم نفس الكاش الداخلي (30 ثانية) اللي بيستخدمه الـ API، فمفيش
  // تكرار في الطلب لموقع المصدر ولا إبطاء ملحوظ في وقت رد السيرفر.
  loader: async () => {
    try {
      return { initialGoldData: await getGoldPrices() };
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
