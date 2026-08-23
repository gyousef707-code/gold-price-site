// عميل بسيط لـ Upstash Redis عبر REST API (شغال على أي استضافة، حتى Cloudflare Workers،
// لأنه مجرد fetch عادي — مش محتاج tcp socket زي عميل Redis التقليدي)

export async function upstash(...args: Array<string | number>) {
  const url = process.env['UPSTASH_REDIS_REST_URL'];
  const token = process.env['UPSTASH_REDIS_REST_TOKEN'];
  if (!url || !token) {
    throw new Error(
      "متغيرات Upstash غير مضبوطة (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)",
    );
  }

  const path = args.map((a) => encodeURIComponent(String(a))).join("/");
  const res = await fetch(`${url}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json: any = await res.json();
  if (json?.error) throw new Error(`Upstash: ${json.error}`);
  return json?.result;
}
