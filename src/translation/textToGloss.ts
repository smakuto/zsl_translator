import { LangCode } from '../types';
import { Dictionary, normalizeText } from './dictionary';
import { toFingerspellTokens } from './fingerspelling';

/** Function words that ZSL typically drops (articles, copulas, etc.). */
const DROP_WORDS: Record<LangCode, Set<string>> = {
  en: new Set(['a', 'an', 'the', 'is', 'are', 'am', 'to', 'of', 'be', 'do', 'does']),
  sn: new Set(['na', 'kuti']),
  nd: new Set(['na', 'ukuthi']),
};

export interface TextToGlossResult {
  glosses: string[];
  /** Words that were fingerspelled because they had no sign. */
  fingerspelled: string[];
}

/**
 * Converts spoken/written English, ChiShona or isiNdebele into a ZSL gloss
 * sequence. Uses greedy longest-match over known surface forms (so multi-word
 * phrases like "thank you" or "ndine urombo" map to one sign), drops function
 * words, and fingerspells anything unknown (names, places).
 */
export function textToGlosses(dictionary: Dictionary, input: string, lang: LangCode): TextToGlossResult {
  const words = normalizeText(input).split(' ').filter(Boolean);
  const glosses: string[] = [];
  const fingerspelled: string[] = [];
  const maxN = dictionary.maxWords(lang);
  let i = 0;

  while (i < words.length) {
    let matched = false;
    for (let n = Math.min(maxN, words.length - i); n >= 1; n--) {
      const phrase = words.slice(i, i + n).join(' ');
      const hit = dictionary.lookupSurface(lang, phrase);
      if (hit) {
        glosses.push(...hit);
        i += n;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const w = words[i];
    i++;
    if (DROP_WORDS[lang].has(w)) continue;
    const spelled = toFingerspellTokens(w);
    if (spelled.length) {
      glosses.push(...spelled);
      fingerspelled.push(w);
    }
  }

  return { glosses, fingerspelled };
}
