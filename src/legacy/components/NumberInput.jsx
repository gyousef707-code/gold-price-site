import { useEffect, useRef, useState } from 'react';

// حقل رقمى بيسمح بالكتابة اليدوى بحرية (مسح، نقطة عشرية، لصق) من غير ما يقفل عليك
export default function NumberInput({
  value,
  onChange,
  className = 'calc-input',
  placeholder = '0',
  ...rest
}) {
  const [text, setText] = useState(value == null || Number.isNaN(value) ? '' : String(value));
  const editing = useRef(false);

  useEffect(() => {
    if (editing.current) return;
    const next = value == null || Number.isNaN(value) ? '' : String(value);
    if (Number(next) !== Number(text)) setText(next);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

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
      className={className}
      type="text"
      inputMode="decimal"
      dir="ltr"
      placeholder={placeholder}
      value={text}
      onChange={handleChange}
      onBlur={() => {
        editing.current = false;
        if (text === '' || text === '.') setText('0');
      }}
    />
  );
}
