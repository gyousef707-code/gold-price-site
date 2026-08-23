import { useCallback, useEffect, useRef, useState } from 'react';

export default function NumberInput({
  value,
  onChange,
  className = 'calc-input',
  placeholder = '0',
  ...rest
}) {
  const [text, setText] = useState(value == null || Number.isNaN(value) ? '' : String(value));
  const editing = useRef(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing.current) return;
    const next = value == null || Number.isNaN(value) ? '' : String(value);
    if (Number(next) !== Number(text)) setText(next);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const caretToEnd = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const len = el.value.length;
      try {
        el.setSelectionRange(len, len);
      } catch {
        /* ignore */
      }
    });
  }, []);

  // لمس أى مكان جوه الكارت/الصف بيفوكس الحقل ويحط المؤشر فى الآخر
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return undefined;
    const zone = el.closest('.calc-group, .converter-row');
    if (!zone) return undefined;
    const handler = (e) => {
      const target = e.target;
      if (target === el) return;
      if (target.closest('input, select, textarea, button, a')) return;
      el.focus();
      caretToEnd();
    };
    zone.addEventListener('pointerup', handler);
    return () => zone.removeEventListener('pointerup', handler);
  }, [caretToEnd]);

  const handleChange = (e) => {
    editing.current = true;
    let raw = e.target.value
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .replace(/[٫,]/g, '.')
      .replace(/[^\d.]/g, '');
    const parts = raw.split('.');
    if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');
    setText(raw);
    const n = parseFloat(raw);
    onChange(Number.isFinite(n) ? n : 0);
  };

  return (
    <input
      {...rest}
      ref={inputRef}
      className={className}
      type="text"
      inputMode="decimal"
      dir="ltr"
      placeholder={placeholder}
      value={text}
      onChange={handleChange}
      onFocus={caretToEnd}
      onPointerUp={caretToEnd}
      onClick={caretToEnd}
      onBlur={() => {
        editing.current = false;
        if (text === '' || text === '.') setText('0');
      }}
    />
  );
}
