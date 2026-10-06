import { notFound } from "@tanstack/react-router";
import { COUNTRY_CODES, COUNTRY_NAMES, COUNTRY_CURRENCIES } from "@/legacy/data/countryCodes.js";

export function isCountry(code: string) {
  return COUNTRY_CODES.includes(code);
}

// بيانات خفيفة للـ SEO (اسم الدولة والعملة) من غير ما نحمّل بيانات الدول كاملة في الملف الرئيسي
export function countryMeta(code: string) {
  if (!isCountry(code)) return null;
  const currencyName = (COUNTRY_CURRENCIES as Record<string, string>)[code];
  return {
    code,
    name: (COUNTRY_NAMES as Record<string, string>)[code],
    currencyName,
    cur: currencyName.split(" ")[0],
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([promise, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);
}

// بيجيب السعر من السيرفر قبل ما يبعت الصفحة (لو جه في أقل من ثانية) عشان يظهر فوراً.
// في تنقل المتصفح (بعد أول تحميل) بنرجّع null والصفحة بتجيب السعر من الـ API، وكود السيرفر
// بيتحمّل بـ import ديناميكي عشان ميدخلش في الملف الرئيسي اللي كل الزوار بيحمّلوه.
export async function countryLoader(code: string, type: string) {
  if (!isCountry(code)) throw notFound();
  if (typeof window !== "undefined") return { initialData: null };
  try {
    const { getCountryData } = await import("./country-prices.server");
    return { initialData: await withTimeout(getCountryData(code, type), 1000) };
  } catch {
    return { initialData: null };
  }
}
