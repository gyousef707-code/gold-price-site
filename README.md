# سعر الذهب الآن — دليل النشر

## خطوات النشر (Vercel — مجاني، نفس طريقة موقع الكورة)

1. اعمل حساب على github.com (لو معملتش قبل كده)
2. ارفع الملفات دي في repository جديد: `index.html`, `styles.css`, `script.js`, `about.html`, `contact.html`, `privacy.html`, ومجلد `api` بداخله `gold.js` و`extras.js`
3. روح على vercel.com → سجّل بـ GitHub → Add New Project → اختار الـ repo
4. قبل ما تعمل Deploy، في "Environment Variables" ضيف المتغيّرين دول:
   - Name: `GOLD_API_KEY` — Value: مفتاحك من goldapi.io
   - Name: `METAL_API_KEY` — Value: مفتاحك من metalpriceapi.com
5. دوس Deploy

## ليه في مفتاحين مختلفين؟
- **GOLD_API_KEY**: بيجيب سعر الذهب لحظياً بكل العيارات، بيتحدث كل 15 دقيقة
- **METAL_API_KEY**: بيجيب سعر الدولار الرسمي والرسم البياني التاريخي الحقيقي (30 يوم)، بيتحدث كل 6 ساعات عشان الباقة المجانية بتاعته أصغر (100 طلب/شهر بس)


## احتياطي الكوطة المجانية
GoldAPI.io بيديك عدد طلبات محدود شهرياً في الباقة المجانية. الموقع مظبوط يعمل كاش 15 دقيقة على السيرفر
(`s-maxage=900` في `api/gold.js`) عشان يقلل الطلبات لأقل حد. لو عايز تقلل أكتر، زوّد الرقم في نفس الملف
وفي `script.js` (`setInterval`).

## قبل النشر
- غيّر `contact@example.com` في `contact.html` ببريدك الحقيقي
- سجّل في Google AdSense واستبدل الـ `div.ad-slot` بكود الإعلان
- راجع `privacy.html` مع مختص قانوني
