import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palettes, type Palette, type ThemeMode } from './palettes';

const STORAGE_KEY = '@temporary/theme';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: Palette;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Persists the user's choice; falls back to the device's system scheme the first time. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (cancelled) return;
      if (stored === 'dark' || stored === 'light') {
        setModeState(stored);
      } else {
        setModeState(Appearance.getColorScheme() === 'light' ? 'light' : 'dark');
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo<ThemeContextValue>(() => ({ mode, colors: palettes[mode], setMode }), [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
