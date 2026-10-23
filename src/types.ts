export type LangCode = 'en' | 'sn' | 'nd';
export type Region = 'harare' | 'bulawayo';
export type SignRegion = Region | 'common';

export const LANGS: LangCode[] = ['en', 'sn', 'nd'];

export const LANG_LABEL: Record<LangCode, { short: string; native: string }> = {
  en: { short: 'EN', native: 'English' },
  sn: { short: 'SN', native: 'ChiShona' },
  nd: { short: 'ND', native: 'isiNdebele' },
};

/** Basic ZSL-style handshape families used by the placeholder avatar. */
export type Handshape =
  | 'flat'
  | 'fist'
  | 'point'
  | 'v'
  | 'open'
  | 'c'
  | 'o'
  | 'y'
  | 'l'
  | 'thumb';

export type BodyLocation = 'forehead' | 'eyes' | 'chin' | 'mouth' | 'chest' | 'neutral' | 'side' | 'belly';
export type Movement = 'none' | 'tap' | 'circle' | 'outward' | 'inward' | 'down' | 'up' | 'wave' | 'twist';
export type FacialExpression = 'neutral' | 'raised' | 'furrowed' | 'smile' | 'headshake';

/** Compact phonological description of a sign (handshape, location, movement, non-manual). */
export interface SignDescriptor {
  hs: Handshape;
  loc: BodyLocation;
  move: Movement;
  twoHanded?: boolean;
  face?: FacialExpression;
}

/** One avatar pose. Coordinates are normalised (0..1) in a 100x120 avatar viewbox. */
export interface Keyframe {
  r: [x: number, y: number, hs: Handshape];
  l: [x: number, y: number, hs: Handshape] | null;
  face: FacialExpression;
  caption?: string;
}

export interface SignEntry {
  id: string;
  gloss: string;
  region: SignRegion;
  category: string;
  descriptor: SignDescriptor;
  /** Optional local WEBP/MP4 clip (bundled asset or file:// path). Preferred over the avatar when set. */
  mediaUri?: string | null;
  /** true once validated by Deaf ZSL signers. Seed data ships unreviewed. */
  reviewed: boolean;
}

export interface TranslationEntry {
  gloss: string;
  lang: LangCode;
  text: string;
  /** Extra surface forms that map back to this gloss in speech/text input. */
  aliases: string[];
}

export interface PhraseTemplate {
  id: string;
  /** Gloss pattern; "$WORD" matches a fingerspelled word. */
  pattern: string[];
  text: Record<LangCode, string>;
}

/** Raw per-frame output of a gesture recogniser. */
export interface GesturePrediction {
  label: string;
  confidence: number;
  timestamp: number;
}

export const NO_SIGN = '_none';
export const FINGERSPELL_PREFIX = 'FS:';
export const REGION_SEPARATOR = '~';
