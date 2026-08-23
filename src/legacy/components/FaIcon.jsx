import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { config } from '@fortawesome/fontawesome-svg-core';

// تنسيقات Font Awesome بقت متحمّلة مع ملف الستايل الأساسي (src/styles/fontawesome.css)
// عشان الأيقونات متظهرش بحجم عملاق لحظة أول تحميل/تحديث للصفحة قبل تشغيل الجافاسكريبت.
config.autoAddCss = false;

import {
  faChevronLeft,
  faPiggyBank,
  faCoins,
  faCalculator,
  faHandHoldingDollar,
  faGem,
  faChartLine,
  faMoneyBillTransfer,
  faToolbox,
  faChartArea,
  faRotate,
  faBars,
  faStar,
  faXmark,
  faGear,
  faShareNodes,
  faShieldHalved,
  faFileContract,
  faTriangleExclamation,
  faChevronDown,
  faChevronUp,
  faEnvelopeOpenText,
  faCircleInfo,
  faPaperPlane,
  faBullhorn,
  faArrowDown,
  faArrowUp,
  faRightLeft,
  faList,
  faMagnifyingGlass,
  faChartSimple,
  faSackDollar,
  faClock as faClockSolid,
} from '@fortawesome/free-solid-svg-icons';

import {
  faNewspaper,
  faClock,
  faBell,
  faEnvelope,
  faCircleQuestion,
  faTrashCan,
} from '@fortawesome/free-regular-svg-icons';

import { faBitcoin, faTelegram } from '@fortawesome/free-brands-svg-icons';

// خريطة بكل الأيقونات المستخدمة في الموقع، بنفس أسماء كلاسات Font Awesome القديمة
// عشان نقدر نستبدل <i className="fa-solid fa-xxx" /> بـ <FaIcon icon="fa-solid fa-xxx" />
// من غير ما نغيّر أي بيانات (زي icon: 'fa-solid fa-xxx' في الملفات اللي بتخزن اسم الأيقونة كـ string)
const ICON_MAP = {
  'fa-solid fa-chevron-left': faChevronLeft,
  'fa-solid fa-piggy-bank': faPiggyBank,
  'fa-solid fa-coins': faCoins,
  'fa-solid fa-calculator': faCalculator,
  'fa-solid fa-hand-holding-dollar': faHandHoldingDollar,
  'fa-solid fa-gem': faGem,
  'fa-brands fa-bitcoin': faBitcoin,
  'fa-solid fa-chart-line': faChartLine,
  'fa-solid fa-money-bill-transfer': faMoneyBillTransfer,
  'fa-solid fa-toolbox': faToolbox,
  'fa-solid fa-chart-area': faChartArea,
  'fa-solid fa-rotate': faRotate,
  'fa-solid fa-bars': faBars,
  'fa-solid fa-star': faStar,
  'fa-regular fa-clock': faClock,
  'fa-solid fa-xmark': faXmark,
  'fa-regular fa-bell': faBell,
  'fa-solid fa-gear': faGear,
  'fa-solid fa-share-nodes': faShareNodes,
  'fa-brands fa-telegram': faTelegram,
  'fa-regular fa-envelope': faEnvelope,
  'fa-regular fa-circle-question': faCircleQuestion,
  'fa-solid fa-shield-halved': faShieldHalved,
  'fa-solid fa-file-contract': faFileContract,
  'fa-solid fa-triangle-exclamation': faTriangleExclamation,
  'fa-solid fa-chevron-down': faChevronDown,
  'fa-solid fa-chevron-up': faChevronUp,
  'fa-regular fa-newspaper': faNewspaper,
  'fa-solid fa-envelope-open-text': faEnvelopeOpenText,
  'fa-solid fa-circle-info': faCircleInfo,
  'fa-solid fa-paper-plane': faPaperPlane,
  'fa-solid fa-bullhorn': faBullhorn,
  'fa-solid fa-arrow-down': faArrowDown,
  'fa-solid fa-arrow-up': faArrowUp,
  'fa-solid fa-right-left': faRightLeft,
  'fa-solid fa-list': faList,
  'fa-solid fa-magnifying-glass': faMagnifyingGlass,
  'fa-solid fa-chart-simple': faChartSimple,
  'fa-regular fa-trash-can': faTrashCan,
  'fa-solid fa-sack-dollar': faSackDollar,
  'fa-solid fa-clock': faClockSolid,
};

/**
 * بديل عن <i className="fa-solid fa-xxx" /> بنفس الشكل بالظبط،
 * لكن كـ SVG مُضمّن في الـ bundle (من غير تحميل ملف Font Awesome كامل من CDN خارجي).
 * icon: نفس السترينج القديم بالظبط، زي "fa-solid fa-bars"
 * أي كلاسات إضافية (زي converter-select-arrow) بتتبعت زي ما هي في className.
 */
export default function FaIcon({ icon, className, ...rest }) {
  const def = ICON_MAP[icon];
  if (!def) {
    if (import.meta.env?.DEV) {
      console.warn(`FaIcon: أيقونة غير معروفة "${icon}"`);
    }
    return null;
  }
  return <FontAwesomeIcon icon={def} className={className} {...rest} />;
}
