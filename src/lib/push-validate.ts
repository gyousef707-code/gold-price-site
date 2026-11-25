// تحقق من بيانات اشتراك الإشعارات قبل ما تتخزن.
// ليه: السيرفر بيبعت إشعارات لكل endpoint متخزّن، فلو أي حد قدر يسجّل رابط غريب
// يبقى السيرفر هيبعت طلبات لمواقع إحنا مختارناهاش. فبنقبل بس روابط خدمات الإشعارات
// المعروفة (كروم/أندرويد، فايرفوكس، سفاري/آيفون، ويندوز/إيدج).
const ALLOWED_PUSH_HOSTS = [
  "googleapis.com", // fcm.googleapis.com (كروم، إيدج، بريف، أوبرا، سامسونج)
  "mozilla.com", // updates.push.services.mozilla.com (فايرفوكس)
  "push.apple.com", // web.push.apple.com (سفاري والآيفون)
  "notify.windows.com", // ويندوز / إيدج
];

const MAX_ENDPOINT_LENGTH = 2048;
const KEY_PATTERN = /^[A-Za-z0-9_\-+/=]{16,128}$/;

function isAllowedHost(host: string) {
  const h = host.toLowerCase();
  return ALLOWED_PUSH_HOSTS.some((allowed) => h === allowed || h.endsWith(`.${allowed}`));
}

// بيرجّع رسالة الخطأ لو البيانات مش سليمة، أو null لو تمام.
export function validatePushSubscription(body: any): string | null {
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;
  if (typeof endpoint !== "string" || typeof p256dh !== "string" || typeof auth !== "string") {
    return "بيانات الاشتراك ناقصة";
  }
  if (endpoint.length > MAX_ENDPOINT_LENGTH) return "بيانات الاشتراك غير صالحة";
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return "بيانات الاشتراك غير صالحة";
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) {
    return "بيانات الاشتراك غير صالحة";
  }
  if (!isAllowedHost(url.hostname)) return "خدمة الإشعارات غير مدعومة";
  if (!KEY_PATTERN.test(p256dh) || !KEY_PATTERN.test(auth)) return "بيانات الاشتراك غير صالحة";
  return null;
}
