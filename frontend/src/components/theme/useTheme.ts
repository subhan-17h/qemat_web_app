'use client';

import { useContext } from 'react';

import { ThemeContext } from '@/components/theme/ThemeProvider';

export function useTheme() {
  return useContext(ThemeContext);
}
