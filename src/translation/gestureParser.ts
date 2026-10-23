import { GesturePrediction, NO_SIGN } from '../types';
import { Dictionary } from './dictionary';
import { isFingerspellToken, letterOf } from './fingerspelling';

export interface StreamParserOptions {
  /** Predictions below this confidence are treated as "no sign". */
  minConfidence: number;
  /** Consecutive frames a label must hold before it is committed (≈270ms at 15 FPS). */
  minStableFrames: number;
  /** Consecutive "no sign" frames that close the current sentence (≈1s at 15 FPS). */
  sentenceGapFrames: number;
  /** Maximum tokens per sentence before forcing a flush. */
  maxTokens: number;
  /** Isolated outlier frames tolerated inside a hold without resetting it. */
  maxDropoutFrames: number;
}

export const DEFAULT_PARSER_OPTIONS: StreamParserOptions = {
  minConfidence: 0.6,
  minStableFrames: 4,
  sentenceGapFrames: 15,
  maxTokens: 24,
  maxDropoutFrames: 1,
};

export type ParserEvent =
  | { type: 'token'; token: string; tokens: string[] }
  | { type: 'sentence'; tokens: string[] };

/**
 * Turns a noisy per-frame prediction stream into committed gloss tokens and
 * sentences. Debounces flicker, collapses holds, merges fingerspelled letters
 * into a single "FS:WORD" token, and maps regional variants to canonical glosses.
 */
export class GestureStreamParser {
  private readonly opts: StreamParserOptions;
  private candidate: string = NO_SIGN;
  private candidateFrames = 0;
  private dropoutFrames = 0;
  private lastCommitted: string = NO_SIGN;
  private gapFrames = 0;
  private tokens: string[] = [];
  private spelling = '';

  constructor(
    private readonly dictionary: Dictionary,
    options: Partial<StreamParserOptions> = {},
  ) {
    this.opts = { ...DEFAULT_PARSER_OPTIONS, ...options };
  }

  get currentTokens(): string[] {
    return this.spelling ? [...this.tokens, `FS:${this.spelling}`] : [...this.tokens];
  }

  reset(): void {
    this.candidate = NO_SIGN;
    this.candidateFrames = 0;
    this.dropoutFrames = 0;
    this.lastCommitted = NO_SIGN;
    this.gapFrames = 0;
    this.tokens = [];
    this.spelling = '';
  }

  push(prediction: GesturePrediction): ParserEvent[] {
    const label = this.normalizeLabel(prediction);
    const events: ParserEvent[] = [];

    if (label === this.candidate) {
      this.candidateFrames++;
      this.dropoutFrames = 0;
    } else if (this.candidateFrames > 0 && this.dropoutFrames < this.opts.maxDropoutFrames) {
      this.dropoutFrames++;
    } else {
      this.candidate = label;
      this.candidateFrames = 1;
      this.dropoutFrames = 0;
    }

    if (label === NO_SIGN) {
      this.gapFrames++;
      if (this.gapFrames === this.opts.sentenceGapFrames) {
        const sentence = this.flush();
        if (sentence) events.push(sentence);
      }
    } else {
      this.gapFrames = 0;
    }

    if (this.candidateFrames !== this.opts.minStableFrames || label !== this.candidate) return events;
    if (this.candidate === NO_SIGN) {
      this.lastCommitted = NO_SIGN;
      return events;
    }
    if (this.candidate === this.lastCommitted) return events;

    this.lastCommitted = this.candidate;
    this.commit(this.candidate);
    events.push({ type: 'token', token: this.candidate, tokens: this.currentTokens });
    if (this.currentTokens.length >= this.opts.maxTokens) {
      const sentence = this.flush();
      if (sentence) events.push(sentence);
    }
    return events;
  }

  /** Force-close the current sentence (e.g. user taps "Done"). */
  flush(): ParserEvent | null {
    this.closeSpelling();
    if (!this.tokens.length) return null;
    const tokens = this.tokens;
    this.tokens = [];
    this.lastCommitted = NO_SIGN;
    return { type: 'sentence', tokens };
  }

  private normalizeLabel(p: GesturePrediction): string {
    if (!p.label || p.label === NO_SIGN || p.confidence < this.opts.minConfidence) return NO_SIGN;
    if (isFingerspellToken(p.label)) return `FS:${letterOf(p.label)}`;
    const gloss = this.dictionary.canonicalGloss(p.label);
    return this.dictionary.hasGloss(gloss) ? gloss : NO_SIGN;
  }

  private commit(label: string): void {
    if (isFingerspellToken(label)) {
      this.spelling += letterOf(label);
      return;
    }
    this.closeSpelling();
    this.tokens.push(label);
  }

  private closeSpelling(): void {
    if (!this.spelling) return;
    this.tokens.push(`FS:${this.spelling}`);
    this.spelling = '';
  }
}

/** Convenience: run a whole recorded prediction sequence through the parser. */
export function parsePredictionSequence(
  dictionary: Dictionary,
  predictions: GesturePrediction[],
  options?: Partial<StreamParserOptions>,
): string[][] {
  const parser = new GestureStreamParser(dictionary, options);
  const sentences: string[][] = [];
  for (const p of predictions) {
    for (const e of parser.push(p)) if (e.type === 'sentence') sentences.push(e.tokens);
  }
  const last = parser.flush();
  if (last && last.type === 'sentence') sentences.push(last.tokens);
  return sentences;
}
