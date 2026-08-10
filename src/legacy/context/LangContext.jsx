import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const LangContext = createContext(null);

export const DICT = {
  ar: {
    'app.name': 'ذهبي',
    'app.tagline': 'أسعار الذهب والفضة والعملات لحظة بلحظة',
    'nav.prices': 'الاسعار',
    'nav.currencies': 'العملات',
    'nav.silver': 'الفضة',
    'nav.crypto': 'رقمية',
    'nav.tools': 'الادوات',
    'header.theme': 'تبديل الوضع',
    'header.refresh': 'تحديث',
    'header.menu': 'القائمة',
    'drawer.notifications': 'الإشعارات',
    'drawer.allNotifications': 'كل الإشعارات',
    'drawer.settings': 'الإعدادات',
    'drawer.share': 'مشاركة التطبيق',
    'drawer.rate': 'قيّمنا',
    'drawer.contact': 'اتصل بنا',
    'drawer.about': 'من نحن',
    'drawer.privacy': 'سياسة الخصوصية',
    'drawer.terms': 'شروط الاستخدام',
    'drawer.disclaimer': 'إخلاء المسؤولية',
    'settings.appearance': 'مظهر التطبيق',
    'settings.language': 'اللغة',
    'theme.light': 'فاتح',
    'theme.dark': 'داكن',
    'theme.auto': 'تلقائي',
    'live': 'مباشر',
    'market.open': 'السوق مفتوح',
    'market.closed': 'السوق مغلق',
    'update.last': 'آخر تحديث',
    'gold.ounce': 'XAU/USD - سعر الاونصة العالمية (لحظي)',
    'silver.ounce': 'XAG/USD - اونصة الفضة العالمية (لحظي)',
    'karat': 'عيار',
    'price.sell': 'البيع لك',
    'price.buy': 'الشراء منك',
    'gold.pound': 'الجنيه ذهب',
    'gold.gap': 'مؤشر الفجوة السعرية (24)',
    'gap.shops': 'دولار الصاغة',
    'gap.bank': 'دولار البنك',
    'gap.value': 'قيمة الفجوة',
    'egp': 'جنيه مصري',
    'loading': 'جارِ تحميل الأسعار...',
    'error': 'تعذر تحميل الأسعار حاليًا، حاول تاني بعد شوية.',
    'share.price': 'مشاركة السعر',
    'articles.related': 'مقالات ذات صلة',
    'news.latest': 'أحدث الأخبار',
    'tools.title': 'الأدوات والحاسبات',
    'tools.subtitle': 'كل الحاسبات في مكان واحد — اختار الأداة وابدأ',
    'converter.title': 'محول العملات',
    'currencies.list': 'سعر صرف العملات بالجنيه المصري',
    'crypto.top': 'اعلى 20 عملة رقمية مقابل الجنيه المصري',
    'rate.title': 'قيّم تطبيق ذهبي',
    'rate.thanks': 'شكرًا لتقييمك! ⭐',
    'notifications.title': 'الإشعارات',
  },
  en: {
    'app.name': 'Zahaby',
    'app.tagline': 'Live gold, silver and currency prices',
    'nav.prices': 'Prices',
    'nav.currencies': 'Currencies',
    'nav.silver': 'Silver',
    'nav.crypto': 'Crypto',
    'nav.tools': 'Tools',
    'header.theme': 'Toggle theme',
    'header.refresh': 'Refresh',
    'header.menu': 'Menu',
    'drawer.notifications': 'Notifications',
    'drawer.allNotifications': 'All notifications',
    'drawer.settings': 'Settings',
    'drawer.share': 'Share the app',
    'drawer.rate': 'Rate us',
    'drawer.contact': 'Contact us',
    'drawer.about': 'About us',
    'drawer.privacy': 'Privacy policy',
    'drawer.terms': 'Terms of use',
    'drawer.disclaimer': 'Disclaimer',
    'settings.appearance': 'Appearance',
    'settings.language': 'Language',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.auto': 'Auto',
    'live': 'Live',
    'market.open': 'Market open',
    'market.closed': 'Market closed',
    'update.last': 'Last update',
    'gold.ounce': 'XAU/USD - Global gold ounce (live)',
    'silver.ounce': 'XAG/USD - Global silver ounce (live)',
    'karat': 'Karat',
    'price.sell': 'You buy at',
    'price.buy': 'You sell at',
    'gold.pound': 'Gold Pound',
    'gold.gap': 'Price gap indicator (24K)',
    'gap.shops': 'Shops USD rate',
    'gap.bank': 'Bank USD rate',
    'gap.value': 'Gap value',
    'egp': 'EGP',
    'loading': 'Loading prices...',
    'error': 'Could not load prices right now, please try again.',
    'share.price': 'Share price',
    'articles.related': 'Related articles',
    'news.latest': 'Latest news',
    'tools.title': 'Tools & calculators',
    'tools.subtitle': 'Every calculator in one place — pick a tool and start',
    'converter.title': 'Currency converter',
    'currencies.list': 'Exchange rates in Egyptian Pound',
    'crypto.top': 'Top 20 cryptocurrencies in EGP',
    'rate.title': 'Rate Zahaby',
    'rate.thanks': 'Thanks for rating! ⭐',
    'notifications.title': 'Notifications',
  },
};

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    if (typeof window === 'undefined') return 'ar';
    return localStorage.getItem('app-lang') || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('app-lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
    document.body.classList.toggle('lang-en', lang === 'en');
  }, [lang]);

  const t = useCallback((key) => DICT[lang]?.[key] ?? DICT.ar[key] ?? key, [lang]);
  const setLang = useCallback((l) => setLangState(l), []);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext) || { lang: 'ar', setLang: () => {}, t: (k) => DICT.ar[k] ?? k };
}
