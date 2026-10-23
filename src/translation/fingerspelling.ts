import { FINGERSPELL_PREFIX, Handshape, Keyframe } from '../types';

export function isFingerspellToken(token: string): boolean {
  return token.startsWith(FINGERSPELL_PREFIX) && token.length > FINGERSPELL_PREFIX.length;
}

export function letterOf(token: string): string {
  return token.slice(FINGERSPELL_PREFIX.length).toUpperCase();
}

export function toFingerspellTokens(word: string): string[] {
  return word
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .split('')
    .map((ch) => `${FINGERSPELL_PREFIX}${ch}`);
}

/**
 * Placeholder handshape per letter. ZSL's manual alphabet must be validated with
 * Deaf signers; the avatar always captions the letter so meaning is never lost.
 */
const LETTER_SHAPES: Record<string, Handshape> = {
  A: 'fist', B: 'flat', C: 'c', D: 'point', E: 'fist', F: 'o', G: 'point', H: 'v', I: 'y',
  J: 'y', K: 'v', L: 'l', M: 'flat', N: 'v', O: 'o', P: 'v', Q: 'point', R: 'v', S: 'fist',
  T: 'thumb', U: 'v', V: 'v', W: 'open', X: 'point', Y: 'y', Z: 'point',
};

export function fingerspellKeyframes(letter: string, framesPerLetter = 6): Keyframe[] {
  const hs = LETTER_SHAPES[letter] ?? 'open';
  const frames: Keyframe[] = [];
  for (let i = 0; i < framesPerLetter; i++) {
    const bob = Math.sin((i / framesPerLetter) * Math.PI) * 0.015;
    frames.push({ r: [0.66, 0.58 - bob, hs], l: null, face: 'neutral', caption: letter });
  }
  return frames;
}
