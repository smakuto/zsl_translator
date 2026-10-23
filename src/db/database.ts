import type { SQLiteDatabase } from 'expo-sqlite';
import { Dictionary, DictionaryData } from '../translation/dictionary';
import { Keyframe, LangCode, PhraseTemplate, SignEntry, TranslationEntry } from '../types';
import { SEED_DATA, SEED_VERSION, seedKeyframes } from './seed';

export const DATABASE_NAME = 'zsl.db';

const SCHEMA = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS signs (
  id TEXT PRIMARY KEY NOT NULL,
  gloss TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'common',
  category TEXT NOT NULL,
  descriptor TEXT NOT NULL,
  keyframes TEXT NOT NULL,
  media_uri TEXT,
  reviewed INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_signs_gloss ON signs(gloss);
CREATE TABLE IF NOT EXISTS translations (
  gloss TEXT NOT NULL,
  lang TEXT NOT NULL,
  text TEXT NOT NULL,
  aliases TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (gloss, lang)
);
CREATE TABLE IF NOT EXISTS phrases (
  id TEXT PRIMARY KEY NOT NULL,
  pattern TEXT NOT NULL,
  text_en TEXT NOT NULL,
  text_sn TEXT NOT NULL,
  text_nd TEXT NOT NULL
);
`;

/**
 * Called by <SQLiteProvider onInit>. Creates the schema and (re)seeds the
 * bundled dictionary whenever SEED_VERSION is bumped. Everything stays on-device.
 */
export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= SEED_VERSION) return;

  await db.execAsync(SCHEMA);
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM signs');
    await db.runAsync('DELETE FROM translations');
    await db.runAsync('DELETE FROM phrases');
    for (const s of SEED_DATA.signs) {
      await db.runAsync(
        'INSERT INTO signs (id, gloss, region, category, descriptor, keyframes, media_uri, reviewed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        s.id,
        s.gloss,
        s.region,
        s.category,
        JSON.stringify(s.descriptor),
        JSON.stringify(seedKeyframes(s)),
        s.mediaUri ?? null,
        s.reviewed ? 1 : 0,
      );
    }
    for (const t of SEED_DATA.translations) {
      await db.runAsync(
        'INSERT INTO translations (gloss, lang, text, aliases) VALUES (?, ?, ?, ?)',
        t.gloss,
        t.lang,
        t.text,
        JSON.stringify(t.aliases),
      );
    }
    for (const p of SEED_DATA.phrases) {
      await db.runAsync(
        'INSERT INTO phrases (id, pattern, text_en, text_sn, text_nd) VALUES (?, ?, ?, ?, ?)',
        p.id,
        JSON.stringify(p.pattern),
        p.text.en,
        p.text.sn,
        p.text.nd,
      );
    }
  });
  await db.execAsync(`PRAGMA user_version = ${SEED_VERSION}`);
}

interface SignRow {
  id: string;
  gloss: string;
  region: SignEntry['region'];
  category: string;
  descriptor: string;
  keyframes: string;
  media_uri: string | null;
  reviewed: number;
}

export interface LoadedDictionary {
  dictionary: Dictionary;
  keyframes: Map<string, Keyframe[]>;
}

export async function loadDictionary(db: SQLiteDatabase): Promise<LoadedDictionary> {
  const [signRows, trRows, phraseRows] = await Promise.all([
    db.getAllAsync<SignRow>('SELECT * FROM signs'),
    db.getAllAsync<{ gloss: string; lang: LangCode; text: string; aliases: string }>('SELECT * FROM translations'),
    db.getAllAsync<{ id: string; pattern: string; text_en: string; text_sn: string; text_nd: string }>('SELECT * FROM phrases'),
  ]);
  const keyframes = new Map<string, Keyframe[]>();
  const signs: SignEntry[] = signRows.map((r) => {
    keyframes.set(r.id, JSON.parse(r.keyframes));
    return {
      id: r.id,
      gloss: r.gloss,
      region: r.region,
      category: r.category,
      descriptor: JSON.parse(r.descriptor),
      mediaUri: r.media_uri,
      reviewed: r.reviewed === 1,
    };
  });
  const translations: TranslationEntry[] = trRows.map((r) => ({ ...r, aliases: JSON.parse(r.aliases) }));
  const phrases: PhraseTemplate[] = phraseRows.map((r) => ({
    id: r.id,
    pattern: JSON.parse(r.pattern),
    text: { en: r.text_en, sn: r.text_sn, nd: r.text_nd },
  }));
  const data: DictionaryData = { signs, translations, phrases };
  return { dictionary: new Dictionary(data), keyframes };
}
