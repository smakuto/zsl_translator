import { LangCode } from '../types';
import { Dictionary } from './dictionary';
import { isFingerspellToken, letterOf } from './fingerspelling';

export interface TranslationResult {
  text: string;
  glosses: string[];
  /** Tokens that had no translation (rendered as-is). */
  unknown: string[];
  /** Phrase template ids that matched, useful for debugging/QA. */
  matchedPhrases: string[];
}

const QUESTION_GLOSSES = new Set(['WHERE', 'WHAT', 'HOW', 'WHO', 'WHEN', 'WHY']);

function titleCaseWord(w: string): string {
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

function capitalise(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/**
 * Converts committed ZSL gloss tokens into a natural-ish sentence in the target
 * language. Longest phrase templates win (they encode ZSL→spoken word order,
 * e.g. "ME UNDERSTAND NO" → "I don't understand."); remaining glosses are
 * translated word-by-word.
 */
export function glossesToText(dictionary: Dictionary, glosses: string[], lang: LangCode): TranslationResult {
  const parts: string[] = [];
  const unknown: string[] = [];
  const matchedPhrases: string[] = [];
  let i = 0;
  let endsWithTemplatePunct = false;

  while (i < glosses.length) {
    const match = matchPhrase(dictionary, glosses, i);
    if (match) {
      let out = match.template.text[lang] ?? match.template.text.en;
      if (match.word) out = out.replace('{word}', match.word);
      parts.push(out);
      matchedPhrases.push(match.template.id);
      i += match.length;
      endsWithTemplatePunct = /[.?!]$/.test(out);
      continue;
    }

    const token = glosses[i];
    endsWithTemplatePunct = false;
    if (isFingerspellToken(token)) {
      parts.push(titleCaseWord(letterOf(token)));
    } else {
      const text = dictionary.text(token, lang);
      if (text) parts.push(text);
      else {
        parts.push(token.toLowerCase());
        unknown.push(token);
      }
    }
    i++;
  }

  let text = parts
    .map((p, idx) => (idx === 0 ? p : /^[A-Z]/.test(p) && isProperNoun(p, glosses) ? p : lowerFirst(p)))
    .join(' ')
    .replace(/\s+([,.?!])/g, '$1')
    .trim();
  text = capitalise(text);
  if (text && !endsWithTemplatePunct && !/[.?!]$/.test(text)) {
    text += glosses.some((g) => QUESTION_GLOSSES.has(g)) ? '?' : '.';
  }

  return { text, glosses, unknown, matchedPhrases };
}

function lowerFirst(s: string): string {
  if (/^[A-Z][a-z]/.test(s) && !/^I\b/.test(s)) return s.charAt(0).toLowerCase() + s.slice(1);
  return s;
}

function isProperNoun(word: string, glosses: string[]): boolean {
  return glosses.some((g) => isFingerspellToken(g) && titleCaseWord(letterOf(g)) === word);
}

function matchPhrase(dictionary: Dictionary, glosses: string[], start: number) {
  for (const template of dictionary.phrases) {
    const { pattern } = template;
    if (start + pattern.length > glosses.length) continue;
    let word: string | undefined;
    let ok = true;
    for (let k = 0; k < pattern.length; k++) {
      const g = glosses[start + k];
      if (pattern[k] === '$WORD') {
        if (!isFingerspellToken(g)) {
          ok = false;
          break;
        }
        word = titleCaseWord(letterOf(g));
      } else if (pattern[k] !== g) {
        ok = false;
        break;
      }
    }
    if (ok) return { template, length: pattern.length, word };
  }
  return null;
}
