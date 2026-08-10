import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(null);

// الوضع الافتراضي للموقع كله: داكن (Dark Mode) — حسب المطلوب
const DEFAULT_MODE = 'dark';

function resolveIsLight(mode) {
  if (mode === 'light') return true;
  if (mode === 'dark') return false;
  // auto: حسب نظام تشغيل الجهاز
  return typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: light)').matches;
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_MODE;
    return localStorage.getItem('theme-mode') || DEFAULT_MODE;
  });

  const applyMode = useCallback((m) => {
    const isLight = resolveIsLight(m);
    document.body.classList.toggle('light-mode', isLight);
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      isLight ? '#f5f5f5' : '#0d1117'
    );
  }, []);

  useEffect(() => {
    applyMode(mode);
    localStorage.setItem('theme-mode', mode);
  }, [mode, applyMode]);

  useEffect(() => {
    if (mode !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => applyMode('auto');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode, applyMode]);

  const setMode = (m) => setModeState(m);

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
