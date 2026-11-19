// بيولّد صورة مشاركة فيها لوجو "ذهبي" + الأسعار وقت المشاركة + الوقت والتاريخ
// وبيشاركها كملف عبر Web Share، ولو مش مدعوم بينزّلها أو بينسخ النص.

const W = 1080;
const H = 1350;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

let logoPromise = null;
function loadLogo() {
  if (logoPromise) return logoPromise;
  logoPromise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = '/logo.png';
  });
  return logoPromise;
}

function stamp() {

  const now = new Date();
  const time = new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(now);
  const date = new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(now);
  return `${time} — ${date}`;
}

/**
 * @param {{title:string, subtitle?:string, rows:{label:string,value:string}[], footer?:string}} card
 */
export async function buildShareImage(card) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // خلفية
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0d1117');
  bg.addColorStop(0.55, '#131a23');
  bg.addColorStop(1, '#0b0e13');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // هالة ذهبية
  const glow = ctx.createRadialGradient(W - 120, 120, 20, W - 120, 120, 460);
  glow.addColorStop(0, 'rgba(227,179,65,0.22)');
  glow.addColorStop(1, 'rgba(227,179,65,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 600);

  ctx.direction = 'rtl';
  ctx.textAlign = 'right';

  // لوجو الموقع (صورة) + الاسم
  try {
    const logo = await loadLogo();
    if (logo) ctx.drawImage(logo, W - 70 - 120, 40, 120, 120);
  } catch {
    /* تجاهل لو الصورة مش متاحة */
  }

  const goldGrad = ctx.createLinearGradient(W - 480, 0, W - 60, 0);
  goldGrad.addColorStop(0, '#f7d774');
  goldGrad.addColorStop(0.5, '#e3b341');
  goldGrad.addColorStop(1, '#c99a2e');
  ctx.fillStyle = goldGrad;
  ctx.font = '800 82px Cairo, system-ui, sans-serif';
  ctx.fillText('ذهبي', W - 210, 130);

  ctx.fillStyle = '#8b949e';
  ctx.font = '600 34px Cairo, system-ui, sans-serif';
  ctx.fillText('أسعار الذهب والفضة والعملات لحظة بلحظة', W - 70, 215);


  // العنوان
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 58px Cairo, system-ui, sans-serif';
  ctx.fillText(card.title, W - 70, 330);

  if (card.subtitle) {
    ctx.fillStyle = '#e3b341';
    ctx.font = '700 40px Cairo, system-ui, sans-serif';
    ctx.fillText(card.subtitle, W - 70, 395);
  }

  // صندوق الأسعار
  const boxY = 440;
  const rowH = 108;
  const boxH = card.rows.length * rowH + 48;
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.strokeStyle = 'rgba(227,179,65,0.35)';
  ctx.lineWidth = 3;
  roundRect(ctx, 60, boxY, W - 120, boxH, 36);
  ctx.fill();
  ctx.stroke();

  card.rows.forEach((row, i) => {
    const y = boxY + 40 + i * rowH + 50;
    ctx.fillStyle = '#8b949e';
    ctx.font = '600 38px Cairo, system-ui, sans-serif';
    ctx.fillText(row.label, W - 110, y);

    ctx.textAlign = 'left';
    ctx.fillStyle = row.color || '#ffffff';
    ctx.font = '800 48px Cairo, system-ui, sans-serif';
    ctx.fillText(row.value, 110, y);
    ctx.textAlign = 'right';

    if (i < card.rows.length - 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(110, y + 30);
      ctx.lineTo(W - 110, y + 30);
      ctx.stroke();
    }
  });

  // الوقت والتاريخ
  ctx.fillStyle = '#8b949e';
  ctx.font = '600 34px Cairo, system-ui, sans-serif';
  ctx.fillText(`الأسعار وقت المشاركة: ${stamp()}`, W - 70, boxY + boxH + 80);

  if (card.footer) {
    ctx.fillStyle = '#6e7681';
    ctx.font = '500 30px Cairo, system-ui, sans-serif';
    ctx.fillText(card.footer, W - 70, boxY + boxH + 135);
  }

  // الفوتر
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e3b341';
  ctx.font = '700 38px Cairo, system-ui, sans-serif';
  ctx.fillText(location.host, W / 2, H - 80);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
}

export function showToast(message) {
  let el = document.querySelector('.app-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'app-toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

export async function shareCard(card, text) {
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  try {
    const blob = await buildShareImage(card);
    if (blob) {
      const file = new File([blob], 'zahaby-price.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'ذهبي', text: `${text}\n${url}` });
        return;
      }
      // مفيش دعم لمشاركة الملفات → ننزّل الصورة
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'zahaby-price.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      showToast('تم حفظ صورة السعر');
      return;
    }
  } catch (e) {
    if (e?.name === 'AbortError') return;
  }

  if (navigator.share) {
    try {
      await navigator.share({ title: 'ذهبي', text, url });
      return;
    } catch (e) {
      if (e?.name === 'AbortError') return;
    }
  }
  await navigator.clipboard?.writeText(`${text}\n${url}`);
  showToast('تم نسخ السعر');
}
