// نظام تنبيه بسيط: بيتابع فشل مصادر الأسعار (ذهب/عملات/فضة/عملات رقمية)
// وبيبعت رسالة تيليجرام خاصة (مش في القناة العامة) لو مصدر فشل بشكل متكرر
// أو مفيش بيانات احتياطية خالص.
//
// بيستخدم Upstash Redis (نفس اللي مستخدم في push.server.ts) عشان عداد
// الفشل يفضل متزامن حتى لو الموقع شغال على أكتر من edge node/isolate
// في نفس الوقت (زي Cloudflare Workers).
//
// مهم جدًا: الدوال دي بتتنادى من `cached()` في market.server.ts على كل
// طلب سعر، وده بينفّذ كل دقيقة عن طريق cron خارجي (/api/push/check).
// عشان كده لازم نضمن إن الحالة الطبيعية (كل حاجة شغالة) متكلفش ولا أمر
// واحد إضافي على Upstash - غير كده هنستهلك الكوتة اليومية المجانية بسرعة
// ونأثر على باقي الموقع (زي إشعارات البوش اللي بتستخدم نفس Upstash).
// لذلك بنحتفظ محليًا (في الميموري) بمين فاشل دلوقتي، وما بنكلمش Upstash
// إلا وقت فشل فعلي أو وقت التعافي من فشل كنا عارفينه.
//
// النظام ده اختياري بالكامل: لو UPSTASH_* أو TELEGRAM_ALERT_CHAT_ID مش
// مضبوطين، بيتجاهل نفسه بهدوء ومبيأثرش على جلب الأسعار خالص.

import { upstash } from "./upstash.server";
import { sendTelegramMessage } from "./telegram.server";

const FAILURE_THRESHOLD = 3; // ابعت تنبيه بعد 3 فشل متتالي حتى لو فيه كاش شغال
const COOLDOWN_SECONDS = 30 * 60; // متبعتش تنبيه تاني لنفس المصدر قبل ما تعدي 30 دقيقة
const STREAK_TTL_SECONDS = 60 * 60; // الستريك بيتصفر لوحده لو مفيش فشل جديد خلال ساعة

// مين فاشل حاليًا حسب معرفة الـ isolate ده بس - تخمين مش مرجع رسمي،
// الهدف بس نتجنب أمر DEL مش لازم على المسار الطبيعي (لما كل حاجة تمام)
const locallyFailing = new Set<string>();

export async function reportSuccess(sourceKey: string) {
  if (!locallyFailing.has(sourceKey)) return; // معرفناش بفشل قريب - متبعتش لUpstash خالص
  locallyFailing.delete(sourceKey);
  try {
    await upstash("DEL", `alert:streak:${sourceKey}`);
  } catch {
    // Upstash مش مضبوط أو فشل الاتصال به - متجاهلينه، ده نظام تنبيه ثانوي
  }
}

export async function reportFailure(
  sourceKey: string,
  hasCachedFallback: boolean,
  errorMessage: string,
) {
  locallyFailing.add(sourceKey);
  try {
    const streakRaw = await upstash("INCR", `alert:streak:${sourceKey}`);
    const streak = Number(streakRaw ?? 1);
    await upstash("EXPIRE", `alert:streak:${sourceKey}`, STREAK_TTL_SECONDS);

    // فشل كامل بدون أي بيانات احتياطية = خطر فوري (المستخدم هيشوف خطأ فعلي)
    const isCritical = !hasCachedFallback;
    const hitThreshold = streak >= FAILURE_THRESHOLD;
    if (!isCritical && !hitThreshold) return;

    const cooldownKey = `alert:cooldown:${sourceKey}`;
    const onCooldown = await upstash("GET", cooldownKey);
    if (onCooldown) return; // اتبعت تنبيه قريب لنفس المصدر، متكررش

    const label = isCritical
      ? "🔴 فشل كامل - مفيش بيانات احتياطية، المستخدم هيشوف رسالة خطأ"
      : `🟠 فشل متكرر (${streak} مرات على التوالي) - الموقع شغال على بيانات قديمة`;

    await sendPrivateAlert(
      `${label}\n\nالمصدر: ${sourceKey}\nالخطأ: ${errorMessage}`,
    );

    await upstash("SET", cooldownKey, "1", "EX", COOLDOWN_SECONDS);
  } catch {
    // فشل نظام التنبيه نفسه متأثرش على جلب الأسعار الأساسي
  }
}

async function sendPrivateAlert(text: string) {
  const chatId = process.env["TELEGRAM_ALERT_CHAT_ID"];
  if (!chatId) return; // مش مضبوط - تجاهل بهدوء
  await sendTelegramMessage(text, chatId);
}
