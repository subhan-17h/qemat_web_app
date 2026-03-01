'use client';

import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { detectPlatform, getTheme, Platform } from '@/lib/platform';

interface ThemeContextValue {
  platform: Platform;
  theme: 'glass' | 'material';
  isGlass: boolean;
}

export const ThemeContext = createContext<ThemeContextValue>({
  platform: 'other',
  theme: 'material',
  isGlass: false
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [platform, setPlatform] = useState<Platform>('other');
  const [theme, setTheme] = useState<'glass' | 'material'>('material');

  useEffect(() => {
    const cached = localStorage.getItem('qemat-theme');
    const cachedPlatform = localStorage.getItem('qemat-platform') as Platform | null;

    if (cachedPlatform) setPlatform(cachedPlatform);
    if (cached === 'glass' || cached === 'material') setTheme(cached);

    const p = detectPlatform();
    const nextTheme = getTheme(p);

    setPlatform(p);
    setTheme(nextTheme);

    localStorage.setItem('qemat-platform', p);
    localStorage.setItem('qemat-theme', nextTheme);
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  const value = useMemo(
    () => ({
      platform,
      theme,
      isGlass: theme === 'glass'
    }),
    [platform, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
