// إعدادات الدول: كل دولة ليها عملتها وهويتها (ألوان + زخرفة) ومحتواها المحلي.
// الذهب والفضة بيتحسبوا من السعر العالمي للأونصة × سعر الصرف المحلي.
// peg = سعر الربط الرسمي بالدولار (ثابت)، والكويت بتتحسب من سوق الصرف.

export const GOLD_KARATS = [24, 22, 21, 18];
export const SILVER_PURITIES = [999, 925];

// theme: ألوان الوضع الداكن (dark) والفاتح (light) — accent هو اللون الرئيسي للدولة
export const COUNTRIES = {
  eg: {
    code: 'eg',
    path: '/',
    name: 'مصر',
    flag: 'eg',
    currency: 'egp',
    currencyName: 'جنيه مصري',
    short: 'جنيه',
    active: true,
    isHome: true,
    theme: { accent: '#e3b341', bright: '#f0c040', deep: '#b8860b', bg: '#0d1117', card: '#161b22' },
  },
  sa: {
    code: 'sa',
    path: '/sa',
    name: 'السعودية',
    flag: 'sa',
    currency: 'sar',
    currencyName: 'ريال سعودي',
    short: 'ر.س',
    decimals: 2,
    peg: 3.75,
    active: true,
    pattern: 'dunes',
    tagline: 'الرياض وجدة والدمام',
    theme: {
      dark: { accent: '#34d399', bright: '#6ee7b7', deep: '#059669', bg: '#06130e', card: '#0d1f18', elev: '#12291f', rgb: '52, 211, 153' },
      light: { accent: '#0d8a5f', bright: '#10a374', deep: '#066a49', bg: '#eff7f3', card: '#ffffff', rgb: '13, 138, 95' },
    },
    about:
      'الريال السعودي مربوط بالدولار الأمريكي بسعر ثابت 3.75 ريال لكل دولار، لذلك يتحرك سعر جرام الذهب في السعودية مع حركة الأونصة العالمية بالدولار. الأسعار هنا استرشادية، محسوبة من السعر العالمي لكل عيار، ولا تشمل المصنعية ولا الضريبة اللي بتضيفها محلات الذهب.',
    faq: [
      ['كيف يُحسب سعر جرام الذهب بالريال؟', 'نقسم سعر الأونصة العالمية بالدولار على 31.1035 (جرامات الأونصة)، ونضرب في نقاء العيار، ثم في سعر الصرف 3.75.'],
      ['هل السعر المعروض هو سعر المحلات؟', 'لا، هو السعر العالمي بالريال بدون مصنعية أو ضريبة. المحلات بتضيف عليه حسب تصميم القطعة.'],
    ],
  },
  ae: {
    code: 'ae',
    path: '/ae',
    name: 'الإمارات',
    flag: 'ae',
    currency: 'aed',
    currencyName: 'درهم إماراتي',
    short: 'د.إ',
    decimals: 2,
    peg: 3.6725,
    active: true,
    pattern: 'skyline',
    tagline: 'دبي وأبوظبي والشارقة',
    theme: {
      dark: { accent: '#ff5a5f', bright: '#ff8a8e', deep: '#d62f3a', bg: '#150a0d', card: '#211015', elev: '#2a161c', rgb: '255, 90, 95' },
      light: { accent: '#c8323c', bright: '#dc3f49', deep: '#a1232d', bg: '#fbf1f1', card: '#ffffff', rgb: '200, 50, 60' },
    },
    about:
      'الدرهم الإماراتي مربوط بالدولار الأمريكي بسعر ثابت 3.6725 درهم لكل دولار، فسعر الذهب بالدرهم يتبع الأونصة العالمية مباشرة. الأسعار هنا استرشادية لكل عيار بدون مصنعية أو ضريبة، وتفيدك كمرجع قبل الشراء من أي محل في دبي أو أبوظبي أو الشارقة.',
    faq: [
      ['كم سعر الدرهم مقابل الدولار؟', 'الدرهم مربوط بالدولار عند 3.6725 درهم لكل دولار، وهو السعر المستخدم في حساب الذهب هنا.'],
      ['ما العيارات المتداولة؟', 'العيارات الأكثر تداولاً هي 24 و22 و21 و18، ونعرضها كلها بسعر الجرام بالدرهم.'],
    ],
  },
  kw: {
    code: 'kw',
    path: '/kw',
    name: 'الكويت',
    flag: 'kw',
    currency: 'kwd',
    currencyName: 'دينار كويتي',
    short: 'د.ك',
    decimals: 3,
    fallbackFx: 0.307,
    active: true,
    pattern: 'waves',
    tagline: 'مدينة الكويت والأحمدي وحولي',
    theme: {
      dark: { accent: '#22c3d3', bright: '#67e0ec', deep: '#0e8fa0', bg: '#061219', card: '#0d1d27', elev: '#122733', rgb: '34, 195, 211' },
      light: { accent: '#0a8797', bright: '#0e9eb0', deep: '#066573', bg: '#eef7f9', card: '#ffffff', rgb: '10, 135, 151' },
    },
    about:
      'الدينار الكويتي من أعلى العملات قيمة في العالم، وهو مرتبط بسلة عملات وليس بالدولار فقط، لذلك نحسب سعر الصرف من السوق لحظة بلحظة. سعر الذهب هنا استرشادي لكل عيار بالدينار بدون مصنعية، ويتغير مع الأونصة العالمية ومع سعر الدينار.',
    faq: [
      ['هل الدينار الكويتي مربوط بالدولار؟', 'لا، الدينار مرتبط بسلة عملات، فسعر الصرف بيتغير بشكل بسيط، ونحدّثه تلقائياً في الحساب.'],
      ['لماذا الأسعار بثلاث خانات عشرية؟', 'الدينار الكويتي يتجزأ إلى 1000 فلس، فنعرض الأسعار بثلاث خانات لدقة أعلى.'],
    ],
  },
  qa: {
    code: 'qa',
    path: '/qa',
    name: 'قطر',
    flag: 'qa',
    currency: 'qar',
    currencyName: 'ريال قطري',
    short: 'ر.ق',
    decimals: 2,
    peg: 3.64,
    active: true,
    pattern: 'dhow',
    tagline: 'الدوحة والريان والوكرة',
    theme: {
      dark: { accent: '#d65a8e', bright: '#ec85b0', deep: '#a8346a', bg: '#14080f', card: '#210f18', elev: '#2b141f', rgb: '214, 90, 142' },
      light: { accent: '#a8325f', bright: '#bd3f70', deep: '#862449', bg: '#faf0f4', card: '#ffffff', rgb: '168, 50, 95' },
    },
    about:
      'الريال القطري مربوط بالدولار الأمريكي بسعر ثابت 3.64 ريال لكل دولار. نحسب سعر جرام الذهب بالريال القطري من الأونصة العالمية لكل عيار، وهو سعر استرشادي لا يشمل المصنعية ولا هامش المحل.',
    faq: [
      ['ما سعر صرف الريال القطري؟', 'الريال القطري مربوط بالدولار عند 3.64 ريال لكل دولار.'],
      ['هل تتغير الأسعار خلال اليوم؟', 'نعم، تتحدث مع حركة الأونصة العالمية أثناء ساعات التداول.'],
    ],
  },
  bh: {
    code: 'bh',
    path: '/bh',
    name: 'البحرين',
    flag: 'bh',
    currency: 'bhd',
    currencyName: 'دينار بحريني',
    short: 'د.ب',
    decimals: 3,
    peg: 0.376,
    active: true,
    pattern: 'pearls',
    tagline: 'المنامة والمحرق والرفاع',
    theme: {
      dark: { accent: '#9db4ff', bright: '#c0cfff', deep: '#5f7ae0', bg: '#090c1a', card: '#10152b', elev: '#171d38', rgb: '157, 180, 255' },
      light: { accent: '#3f58c4', bright: '#4d68d6', deep: '#2f449c', bg: '#f0f2fb', card: '#ffffff', rgb: '63, 88, 196' },
    },
    about:
      'الدينار البحريني مربوط بالدولار الأمريكي بسعر ثابت 0.376 دينار لكل دولار، ويتجزأ إلى 1000 فلس. نحسب سعر جرام الذهب بالدينار من الأونصة العالمية لكل عيار، وهو سعر استرشادي بدون مصنعية.',
    faq: [
      ['ما سعر الدينار البحريني مقابل الدولار؟', 'مربوط عند 0.376 دينار لكل دولار.'],
      ['لماذا ثلاث خانات عشرية؟', 'لأن الدينار يتجزأ إلى 1000 فلس.'],
    ],
  },
  om: {
    code: 'om',
    path: '/om',
    name: 'عُمان',
    flag: 'om',
    currency: 'omr',
    currencyName: 'ريال عماني',
    short: 'ر.ع',
    decimals: 3,
    peg: 0.3845,
    active: true,
    pattern: 'khanjar',
    tagline: 'مسقط وصلالة وصحار',
    theme: {
      dark: { accent: '#a3c93a', bright: '#c4e063', deep: '#76951a', bg: '#0c1005', card: '#161c0b', elev: '#1d2512', rgb: '163, 201, 58' },
      light: { accent: '#5f7d0f', bright: '#6f9112', deep: '#475f0a', bg: '#f4f7ea', card: '#ffffff', rgb: '95, 125, 15' },
    },
    about:
      'الريال العماني مربوط بالدولار الأمريكي بسعر ثابت 0.3845 ريال لكل دولار، ويتجزأ إلى 1000 بيسة. نحسب سعر جرام الذهب بالريال العماني من الأونصة العالمية لكل عيار، وهو سعر استرشادي بدون مصنعية.',
    faq: [
      ['ما سعر الريال العماني مقابل الدولار؟', 'مربوط عند 0.3845 ريال لكل دولار.'],
      ['هل السعر يشمل المصنعية؟', 'لا، هو السعر العالمي بالريال العماني، والمصنعية تختلف من محل لآخر.'],
    ],
  },
  jo: {
    code: 'jo',
    path: '/jo',
    name: 'الأردن',
    flag: 'jo',
    currency: 'jod',
    currencyName: 'دينار أردني',
    short: 'د.أ',
    decimals: 3,
    peg: 0.709,
    active: true,
    pattern: 'petra',
    tagline: 'عمّان وإربد والزرقاء',
    theme: {
      dark: { accent: '#e8896b', bright: '#f2a68c', deep: '#c05f3f', bg: '#160c09', card: '#221410', elev: '#2c1b16', rgb: '232, 137, 107' },
      light: { accent: '#b4482a', bright: '#c85a3a', deep: '#8f3720', bg: '#fbf1ee', card: '#ffffff', rgb: '180, 72, 42' },
    },
    about:
      'الدينار الأردني مربوط بالدولار الأمريكي بسعر ثابت 0.709 دينار لكل دولار، ويتجزأ إلى 1000 فلس. نحسب سعر جرام الذهب بالدينار الأردني من الأونصة العالمية لكل عيار، وهو سعر استرشادي بدون مصنعية.',
    faq: [
      ['ما سعر الدينار الأردني مقابل الدولار؟', 'مربوط عند 0.709 دينار لكل دولار.'],
      ['ما العيارات المعروضة؟', 'نعرض عيارات 24 و22 و21 و18 بسعر الجرام بالدينار.'],
    ],
  },
  // دول جاية قريباً — محتاجين نضيف أسعار عملاتهم الأول
  tn: { code: 'tn', name: 'تونس', flag: 'tn', currencyName: 'دينار تونسي', active: false },
  dz: { code: 'dz', name: 'الجزائر', flag: 'dz', currencyName: 'دينار جزائري', active: false },
  ma: { code: 'ma', name: 'المغرب', flag: 'ma', currencyName: 'درهم مغربي', active: false },
};

export const COUNTRY_ORDER = ['eg', 'sa', 'ae', 'kw', 'qa', 'bh', 'om', 'jo', 'tn', 'dz', 'ma'];
export const ACTIVE_COUNTRY_CODES = COUNTRY_ORDER.filter((c) => COUNTRIES[c].active && !COUNTRIES[c].isHome);

export function getCountry(code) {
  const c = COUNTRIES[code];
  return c && c.active && !c.isHome ? c : null;
}

export function flagUrl(code, width = 80) {
  return `https://flagcdn.com/w${width}/${code}.png`;
}

// بيحوّل رقم لنص بعدد الخانات العشرية الخاصة بالعملة
export function formatMoney(value, decimals = 2) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// CSS متغيرات الثيم لدولة معينة (داكن + فاتح). بيتحقن كـ <style> على الصفحة فقط.
export function countryThemeCss(country) {
  const d = country.theme.dark;
  const l = country.theme.light;
  return `
html body{--gold-primary:${d.accent};--gold-bright:${d.bright};--gold-dark:${d.deep};--border-gold:rgba(${d.rgb},.28);--bg-color:${d.bg};--card-bg:${d.card};--card-bg-elevated:${d.elev};--dot-rgb:${d.rgb};--dot-a:.2;--glow-a:.12;background-image:radial-gradient(ellipse 80% 340px at 50% -60px,rgba(${d.rgb},.14),transparent 70%)}
html body.light-mode{--gold-primary:${l.accent};--gold-bright:${l.bright};--gold-dark:${l.deep};--border-gold:rgba(${l.rgb},.3);--bg-color:${l.bg};--card-bg:${l.card};--card-bg-elevated:${l.card};--dot-rgb:${l.rgb};--dot-a:.24;--glow-a:.1;background-image:linear-gradient(180deg,rgba(${l.rgb},.1) 0,var(--bg-color) 320px)}
`;
}
