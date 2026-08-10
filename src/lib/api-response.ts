export function jsonOk(data: unknown, cacheControl?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json; charset=utf-8" };
  if (cacheControl) headers["Cache-Control"] = cacheControl;
  return new Response(JSON.stringify(data), { status: 200, headers });
}

export function jsonErr(err: unknown, status = 500) {
  const message = err instanceof Error ? err.message : "حصل خطأ غير متوقع";
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
