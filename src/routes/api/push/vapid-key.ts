import { createFileRoute } from "@tanstack/react-router";
import { jsonOk } from "@/lib/api-response";

// المفتاح العام (public) بتاع VAPID مش سر، والمتصفح محتاجه عشان يشترك في الإشعارات.
// بنرجّعه من متغيرات السيرفر عشان الاشتراك يشتغل حتى لو VITE_VAPID_PUBLIC_KEY مش موجود وقت الـ build.
export const Route = createFileRoute("/api/push/vapid-key")({
  server: {
    handlers: {
      GET: async () => jsonOk({ key: process.env["VAPID_PUBLIC_KEY"] ?? null }),
    },
  },
});
