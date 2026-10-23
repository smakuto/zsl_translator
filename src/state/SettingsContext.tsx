import Storage from 'expo-sqlite/kv-store';
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { StringKey, t as translate } from '../i18n/strings';
import { Theme, ThemeName, themes } from '../theme/themes';
import { LangCode, Region } from '../types';

export interface Settings {
  uiLang: LangCode;
  outputLang: LangCode;
  inputLang: LangCode;
  region: Region;
  theme: ThemeName;
  autoSpeak: boolean;
}

const DEFAULTS: Settings = {
  uiLang: 'en',
  outputLang: 'en',
  inputLang: 'en',
  region: 'harare',
  theme: 'dark',
  autoSpeak: true,
};

const KEY = 'settings.v1';

function load(): Settings {
  try {
    const raw = Storage.getItemSync(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

interface SettingsContextValue {
  settings: Settings;
  theme: Theme;
  update(patch: Partial<Settings>): void;
  t(key: StringKey): string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      Storage.setItemSync(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      theme: themes[settings.theme],
      update,
      t: (key) => translate(key, settings.uiLang),
    }),
    [settings, update],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
