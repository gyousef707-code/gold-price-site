// إرسال رسائل لقناة واتساب عن طريق بوابة HTTP API تدعم "WhatsApp Channels"
// بشكل صريح (زي Whapi.Cloud) — نفس فكرة telegram.server.ts، مجرد fetch عادي

// شكل الرد المتوقع من الـ API بعد محاولة إرسال رسالة
interface WhatsAppSendResponse {
  sent?: boolean;
  message?: { id?: string } | string;
  error?: { message?: string } | string;
  [key: string]: unknown;
}

// تيليجرام بيقبل HTML (<b>...</b>) لكن واتساب بيستخدم Markdown بسيط بتاعه
// (*bold* بدل <b>bold</b>) وملوش تاجات تانية، فبنحول النص قبل ما نبعته
export function telegramHtmlToWhatsAppText(html: string): string {
  return html
    .replace(/<b>(.*?)<\/b>/gi, "*$1*")
    .replace(/<i>(.*?)<\/i>/gi, "_$1_")
    .replace(/<[^>]+>/g, "");
}

export async function sendWhatsAppMessage(text: string, channelId?: string) {
  // WHATSAPP_API_URL هو الـ base بتاع البوابة، مثال Whapi.Cloud: https://gate.whapi.cloud
  const apiUrl = process.env["WHATSAPP_API_URL"];
  // توكن الـ Bearer الخاص بالـ Channel (instance) بتاعك في لوحة تحكم البوابة
  const token = process.env["WHATSAPP_TOKEN"];
  // آيدي قناة الواتساب اللي هيتبعتلها الرسالة، شكله زي 120363171744447809@newsletter
  const targetChannelId = channelId || process.env["WHATSAPP_CHANNEL_ID"];

  if (!apiUrl || !token || !targetChannelId) {
    throw new Error(
      "متغيرات واتساب غير مضبوطة (WHATSAPP_API_URL / WHATSAPP_TOKEN / WHATSAPP_CHANNEL_ID)",
    );
  }

  // مثل Whapi.Cloud: POST /messages/text مع Authorization: Bearer <token>
  const endpoint = `${apiUrl.replace(/\/+$/, "")}/messages/text`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: targetChannelId,
      body: telegramHtmlToWhatsAppText(text),
    }),
  });

  const data: WhatsAppSendResponse = await res.json();

  // لو الـ request فشل على مستوى الـ HTTP، أو البوابة رجّعت error صريح
  if (!res.ok || data.error) {
    const errorMessage =
      typeof data.error === "string" ? data.error : data.error?.message;
    throw new Error(`WhatsApp: ${errorMessage || `فشل الإرسال (HTTP ${res.status})`}`);
  }

  return data;
}
