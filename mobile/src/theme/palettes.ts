export interface Palette {
  background: string;
  surface: string;
  surfaceHover: string;
  border: string;
  borderStrong: string;
  ink: string;
  inkDim: string;
  accent: string;
  accentInk: string;
  danger: string;
  card: string;
  cardAlt: string;
  /** Recessed fill for text inputs — distinct from `surface`'s subtle card tinting. */
  inputBackground: string;
  /** Tinted background/border pair for error banners (derived from `danger`, precomputed per theme). */
  dangerBg: string;
  dangerBorder: string;
}

export type ThemeMode = 'dark' | 'light';

/**
 * Two palettes, same shape. `dark` is the original (unchanged) look; `light`
 * is a warm "luxury" ivory rather than stark white, with the brand's green
 * deepened into a forest tone so it reads as premium instead of loud.
 */
export const palettes: Record<ThemeMode, Palette> = {
  dark: {
    background: '#0d0d0c',
    surface: 'rgba(255,255,255,0.03)',
    surfaceHover: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.16)',
    ink: '#e8e6e0',
    inkDim: '#8a877e',
    accent: '#d8fd51',
    accentInk: '#1a1c06',
    danger: '#e5695e',
    card: '#141412',
    cardAlt: '#171715',
    inputBackground: 'rgba(0,0,0,0.3)',
    dangerBg: 'rgba(229,105,94,0.08)',
    dangerBorder: 'rgba(229,105,94,0.25)',
  },
  light: {
    background: '#f6f3ec',
    surface: 'rgba(42,38,32,0.035)',
    surfaceHover: 'rgba(42,38,32,0.06)',
    border: 'rgba(42,38,32,0.10)',
    borderStrong: 'rgba(42,38,32,0.20)',
    ink: '#2a2620',
    inkDim: '#7d7566',
    accent: '#3f5e33',
    accentInk: '#f6f3ec',
    danger: '#b3402f',
    card: '#efe9dd',
    cardAlt: '#e8e0d0',
    inputBackground: '#ffffff',
    dangerBg: 'rgba(179,64,47,0.08)',
    dangerBorder: 'rgba(179,64,47,0.25)',
  },
};
