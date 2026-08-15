// إرسال رسائل لقناة تيليجرام عن طريق Bot API — مجرد fetch عادي، بيشتغل على أي استضافة

export async function sendTelegramMessage(text: string) {
  const token = process.env['TELEGRAM_BOT_TOKEN'];
  const chatId = process.env['TELEGRAM_CHANNEL_ID'];
  if (!token || !chatId) {
    throw new Error(
      "متغيرات تيليجرام غير مضبوطة (TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL_ID)",
    );
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  const data: any = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram: ${data.description || "فشل الإرسال"}`);
  }
  return data;
}
