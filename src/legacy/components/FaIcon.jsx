import {
  ChevronLeft,
  PiggyBank,
  Coins,
  Calculator,
  HandCoins,
  Gem,
  Bitcoin,
  TrendingUp,
  Banknote,
  Toolbox,
  ChartArea,
  RotateCw,
  Menu,
  Star,
  Clock,
  X,
  Bell,
  Settings,
  Share2,
  Mail,
  CircleHelp,
  ShieldHalf,
  FileText,
  TriangleAlert,
  ChevronDown,
  ChevronUp,
  Newspaper,
  MailOpen,
  Info,
  Send,
  Megaphone,
  ArrowDown,
  ArrowUp,
  ArrowRightLeft,
  List,
  Search,
  ChartColumn,
  Trash2,
  CircleDollarSign,
  History,
} from 'lucide-react';

// شعار تليجرام مش موجود في lucide-react (مكتبة أيقونات عامة، مش شعارات ماركات)،
// فبنرسمه هنا كـ SVG صغير بدل ما نجيب مكتبة كاملة عشان أيقونة واحدة بس.
// الـ path نفسه مأخوذ حرفيًا من نفس أيقونة Font Awesome اللي كانت شغالة في
// الموقع قبل كده، عشان الشكل يفضل مطابق 100% زي ما هو من غير أي فرق يُذكر.
const TELEGRAM_PATH =
  'M248,8C111.033,8,0,119.033,0,256S111.033,504,248,504,496,392.967,496,256,384.967,8,248,8ZM362.952,176.66c-3.732,39.215-19.881,134.378-28.1,178.3-3.476,18.584-10.322,24.816-16.948,25.425-14.4,1.326-25.338-9.517-39.287-18.661-21.827-14.308-34.158-23.215-55.346-37.177-24.485-16.135-8.612-25,5.342-39.5,3.652-3.793,67.107-61.51,68.335-66.746.153-.655.3-3.1-1.154-4.384s-3.59-.849-5.135-.5q-3.283.746-104.608,69.142-14.845,10.194-26.894,9.934c-8.855-.191-25.888-5.006-38.551-9.123-15.531-5.048-27.875-7.717-26.8-16.291q.84-6.7,18.45-13.7,108.446-47.248,144.628-62.3c68.872-28.647,83.183-33.623,92.511-33.789,2.052-.034,6.639.474,9.61,2.885a10.452,10.452,0,0,1,3.53,6.716A43.765,43.765,0,0,1,362.952,176.66Z';

function TelegramIcon({ size = '1em', className, style, ...rest }) {
  return (
    <svg
      viewBox="0 0 496 512"
      fill="currentColor"
      width={size}
      height={size}
      className={className}
      style={{ verticalAlign: '-0.125em', ...style }}
      aria-hidden="true"
      {...rest}
    >
      <path d={TELEGRAM_PATH} />
    </svg>
  );
}

// خريطة بكل الأيقونات المستخدمة في الموقع، بنفس أسماء كلاسات Font Awesome القديمة
// عشان نقدر نستبدل <i className="fa-solid fa-xxx" /> بـ <FaIcon icon="fa-solid fa-xxx" />
// من غير ما نغيّر أي بيانات (زي icon: 'fa-solid fa-xxx' في الملفات اللي بتخزن اسم الأيقونة كـ string).
// الأيقونات دلوقتي جايه من lucide-react (أخف بكتير من Font Awesome) بدل ما تتحمّل
// من مكتبة FontAwesome كاملة. الشكل النهائي واضح إنه هيفضل قريب جدًا من الأصل لأن
// كل الاستخدامات في الموقع كانت أيقونات outline بسيطة بلون واحد (currentColor) أصلاً.
const ICON_MAP = {
  'fa-solid fa-chevron-left': ChevronLeft,
  'fa-solid fa-piggy-bank': PiggyBank,
  'fa-solid fa-coins': Coins,
  'fa-solid fa-calculator': Calculator,
  'fa-solid fa-hand-holding-dollar': HandCoins,
  'fa-solid fa-gem': Gem,
  'fa-brands fa-bitcoin': Bitcoin,
  'fa-solid fa-chart-line': TrendingUp,
  'fa-solid fa-money-bill-transfer': Banknote,
  'fa-solid fa-toolbox': Toolbox,
  'fa-solid fa-chart-area': ChartArea,
  'fa-solid fa-rotate': RotateCw,
  'fa-solid fa-bars': Menu,
  'fa-solid fa-star': Star,
  'fa-regular fa-clock': Clock,
  'fa-solid fa-xmark': X,
  'fa-regular fa-bell': Bell,
  'fa-solid fa-gear': Settings,
  'fa-solid fa-share-nodes': Share2,
  'fa-brands fa-telegram': TelegramIcon,
  'fa-regular fa-envelope': Mail,
  'fa-regular fa-circle-question': CircleHelp,
  'fa-solid fa-shield-halved': ShieldHalf,
  'fa-solid fa-file-contract': FileText,
  'fa-solid fa-triangle-exclamation': TriangleAlert,
  'fa-solid fa-chevron-down': ChevronDown,
  'fa-solid fa-chevron-up': ChevronUp,
  'fa-regular fa-newspaper': Newspaper,
  'fa-solid fa-envelope-open-text': MailOpen,
  'fa-solid fa-circle-info': Info,
  'fa-solid fa-paper-plane': Send,
  'fa-solid fa-bullhorn': Megaphone,
  'fa-solid fa-arrow-down': ArrowDown,
  'fa-solid fa-arrow-up': ArrowUp,
  'fa-solid fa-right-left': ArrowRightLeft,
  'fa-solid fa-list': List,
  'fa-solid fa-magnifying-glass': Search,
  'fa-solid fa-chart-simple': ChartColumn,
  'fa-regular fa-trash-can': Trash2,
  'fa-solid fa-sack-dollar': CircleDollarSign,
  'fa-solid fa-clock': Clock,
  'fa-solid fa-clock-rotate-left': History,
  'fa-solid fa-caret-up': ChevronUp,
  'fa-solid fa-caret-down': ChevronDown,
};

/**
 * بديل عن <i className="fa-solid fa-xxx" /> بنفس الشكل بالظبط،
 * لكن بأيقونات lucide-react الخفيفة بدل Font Awesome.
 * icon: نفس السترينج القديم بالظبط، زي "fa-solid fa-bars"
 * أي كلاسات إضافية (زي converter-select-arrow) بتتبعت زي ما هي في className.
 */
export default function FaIcon({ icon, className, ...rest }) {
  const IconComponent = ICON_MAP[icon];
  if (!IconComponent) {
    if (import.meta.env?.DEV) {
      console.warn(`FaIcon: أيقونة غير معروفة "${icon}"`);
    }
    return null;
  }
  // size="1em" + verticalAlign بيخلوا حجم ومحاذاة الأيقونة زي ما كانوا بالظبط
  // مع Font Awesome (نفس القاعدة اللي كانت في fontawesome.css)، عشان الشكل
  // النهائي يفضل مطابق تمامًا من غير ما نحتاج نسيب ملف الستايل القديم.
  return (
    <IconComponent
      size="1em"
      style={{ verticalAlign: '-0.125em' }}
      className={className}
      {...rest}
    />
  );
}
