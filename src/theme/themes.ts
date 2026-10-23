export type ThemeName = 'dark' | 'outdoor';

export interface Theme {
  name: ThemeName;
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  danger: string;
  success: string;
  border: string;
  /** Multiplier applied to font sizes (outdoor mode uses larger text). */
  scale: number;
  statusBar: 'light' | 'dark';
}

/** Pure-black dark theme: OLED pixels off → lower battery drain during load shedding. */
export const darkTheme: Theme = {
  name: 'dark',
  bg: '#000000',
  surface: '#111111',
  surfaceAlt: '#1E1E1E',
  text: '#FFFFFF',
  textMuted: '#B8B8B8',
  accent: '#FFD400',
  accentText: '#000000',
  danger: '#FF5A5A',
  success: '#3DDC84',
  border: '#333333',
  scale: 1,
  statusBar: 'light',
};

/** Maximum-contrast light theme for direct sunlight (WCAG AAA contrast, bigger type). */
export const outdoorTheme: Theme = {
  name: 'outdoor',
  bg: '#FFFFFF',
  surface: '#F2F2F2',
  surfaceAlt: '#E0E0E0',
  text: '#000000',
  textMuted: '#2B2B2B',
  accent: '#0033CC',
  accentText: '#FFFFFF',
  danger: '#B00000',
  success: '#006B2E',
  border: '#000000',
  scale: 1.15,
  statusBar: 'dark',
};

export const themes: Record<ThemeName, Theme> = { dark: darkTheme, outdoor: outdoorTheme };
