// إرسال رسائل لقناة تيليجرام عن طريق Bot API — مجرد fetch عادي، بيشتغل على أي استضافة

export async function sendTelegramMessage(text: string, chatId?: string) {
  const token = process.env['TELEGRAM_BOT_TOKEN'];
  const targetChatId = chatId || process.env['TELEGRAM_CHANNEL_ID'];
  if (!token || !targetChatId) {
    throw new Error(
      "متغيرات تيليجرام غير مضبوطة (TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL_ID)",
    );
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: targetChatId,
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

// إرسال صورة (بوستر PNG) مع نص تحتها (caption — بحد أقصى 1024 حرف)
export async function sendTelegramPhoto(png: Uint8Array, caption: string, chatId?: string) {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  const targetChatId = chatId || process.env["TELEGRAM_CHANNEL_ID"];
  if (!token || !targetChatId) {
    throw new Error("متغيرات تيليجرام غير مضبوطة (TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL_ID)");
  }

  const form = new FormData();
  form.append("chat_id", targetChatId);
  form.append("caption", caption.slice(0, 1024));
  form.append("parse_mode", "HTML");
  form.append("photo", new Blob([png as unknown as BlobPart], { type: "image/png" }), "zahaby.png");

  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    body: form,
  });
  const data: any = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram: ${data.description || "فشل إرسال الصورة"}`);
  }
  return data;
}
