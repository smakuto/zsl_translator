import * as Speech from 'expo-speech';
import { LangCode } from '../../types';

/**
 * Preferred BCP-47 locales per output language. Android ships few Shona or
 * Ndebele voices, so we fall back to closely-related voices that are often
 * pre-installed (isiZulu is mutually intelligible with Zimbabwean isiNdebele)
 * and finally to English. All engines run locally via the OS TTS service.
 */
const LOCALE_PREFERENCES: Record<LangCode, string[]> = {
  en: ['en-ZW', 'en-ZA', 'en-GB', 'en-US', 'en'],
  sn: ['sn-ZW', 'sn'],
  nd: ['nd-ZW', 'nr-ZA', 'zu-ZA', 'zu', 'xh-ZA'],
};

export interface VoiceChoice {
  language: string;
  voice?: string;
  /** True when no voice for the requested language exists and English is used. */
  fallback: boolean;
}

let voicesCache: Speech.Voice[] | null = null;

async function voices(): Promise<Speech.Voice[]> {
  if (voicesCache) return voicesCache;
  try {
    voicesCache = await Speech.getAvailableVoicesAsync();
  } catch {
    voicesCache = [];
  }
  return voicesCache;
}

export function pickVoice(available: Pick<Speech.Voice, 'identifier' | 'language'>[], lang: LangCode): VoiceChoice {
  const norm = (s: string) => s.replace('_', '-').toLowerCase();
  for (const pref of LOCALE_PREFERENCES[lang]) {
    const p = norm(pref);
    const v = available.find((x) => norm(x.language) === p) ?? available.find((x) => norm(x.language).startsWith(p + '-') || norm(x.language) === p.split('-')[0]);
    if (v) return { language: v.language, voice: v.identifier, fallback: false };
  }
  if (lang !== 'en') {
    const en = pickVoice(available, 'en');
    return { ...en, fallback: true };
  }
  return { language: 'en', fallback: available.length === 0 };
}

export async function resolveVoice(lang: LangCode): Promise<VoiceChoice> {
  return pickVoice(await voices(), lang);
}

export async function speak(text: string, lang: LangCode, rate = 0.95): Promise<VoiceChoice> {
  const choice = await resolveVoice(lang);
  await Speech.stop();
  Speech.speak(text, { language: choice.language, voice: choice.voice, rate });
  return choice;
}

export function stopSpeaking(): Promise<void> {
  return Speech.stop();
}
