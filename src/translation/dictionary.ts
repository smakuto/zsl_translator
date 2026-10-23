import {
  LangCode,
  PhraseTemplate,
  REGION_SEPARATOR,
  Region,
  SignEntry,
  TranslationEntry,
} from '../types';

export interface DictionaryData {
  signs: SignEntry[];
  translations: TranslationEntry[];
  phrases: PhraseTemplate[];
}

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * In-memory, read-optimised view over the SQLite dictionary. Pure TypeScript so
 * the translation pipeline can be unit-tested without native modules.
 */
export class Dictionary {
  private readonly signsByGloss = new Map<string, SignEntry[]>();
  private readonly signsById = new Map<string, SignEntry>();
  private readonly textByGloss = new Map<string, Partial<Record<LangCode, string>>>();
  /** lang -> normalised surface form -> gloss sequence */
  private readonly reverse: Record<LangCode, Map<string, string[]>> = {
    en: new Map(),
    sn: new Map(),
    nd: new Map(),
  };
  private readonly maxSurfaceWords: Record<LangCode, number> = { en: 1, sn: 1, nd: 1 };
  readonly phrases: PhraseTemplate[];

  constructor(data: DictionaryData) {
    for (const s of data.signs) {
      this.signsById.set(s.id, s);
      const list = this.signsByGloss.get(s.gloss) ?? [];
      list.push(s);
      this.signsByGloss.set(s.gloss, list);
    }
    for (const t of data.translations) {
      const entry = this.textByGloss.get(t.gloss) ?? {};
      entry[t.lang] = t.text;
      this.textByGloss.set(t.gloss, entry);
      for (const form of [t.text, ...t.aliases]) this.addSurface(t.lang, form, [t.gloss]);
    }
    this.phrases = [...data.phrases].sort((a, b) => b.pattern.length - a.pattern.length);
    for (const p of this.phrases) {
      if (p.pattern.includes('$WORD')) continue;
      for (const lang of Object.keys(p.text) as LangCode[]) this.addSurface(lang, p.text[lang], p.pattern);
    }
  }

  /** Register an extra surface form (e.g. a Shona verb form) for text→sign lookup. */
  addSurface(lang: LangCode, form: string, glosses: string[]): void {
    const key = normalizeText(form);
    if (!key) return;
    if (!this.reverse[lang].has(key)) this.reverse[lang].set(key, glosses);
    this.maxSurfaceWords[lang] = Math.max(this.maxSurfaceWords[lang], key.split(' ').length);
  }

  /** Strip a regional suffix (e.g. "HELLO~BYO") back to its canonical gloss. */
  canonicalGloss(label: string): string {
    const idx = label.indexOf(REGION_SEPARATOR);
    const base = idx >= 0 ? label.slice(0, idx) : label;
    return base.toUpperCase();
  }

  hasGloss(gloss: string): boolean {
    return this.signsByGloss.has(gloss) || this.textByGloss.has(gloss);
  }

  text(gloss: string, lang: LangCode): string | undefined {
    const t = this.textByGloss.get(gloss);
    return t?.[lang] ?? t?.en;
  }

  /** Pick the sign variant for the user's region, falling back to common/any. */
  sign(gloss: string, region: Region): SignEntry | undefined {
    const list = this.signsByGloss.get(gloss);
    if (!list?.length) return undefined;
    return list.find((s) => s.region === region) ?? list.find((s) => s.region === 'common') ?? list[0];
  }

  signById(id: string): SignEntry | undefined {
    return this.signsById.get(id);
  }

  variants(gloss: string): SignEntry[] {
    return this.signsByGloss.get(gloss) ?? [];
  }

  allGlosses(): string[] {
    return [...this.signsByGloss.keys()].sort();
  }

  lookupSurface(lang: LangCode, normalizedPhrase: string): string[] | undefined {
    return this.reverse[lang].get(normalizedPhrase);
  }

  maxWords(lang: LangCode): number {
    return this.maxSurfaceWords[lang];
  }

  /** Vocabulary list for grammar-constrained offline ASR (e.g. Vosk). */
  vocabulary(lang: LangCode): string[] {
    return [...this.reverse[lang].keys()];
  }
}
