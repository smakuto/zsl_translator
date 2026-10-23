import { GestureStreamParser, parsePredictionSequence } from '../gestureParser';
import { glossesToText } from '../glossToText';
import { mockPredictionStream } from '../../engines/gesture/MockGestureRecognizer';
import { dict, frames, pause } from './helpers';

describe('GestureStreamParser', () => {
  it('commits a held sign exactly once', () => {
    const [sentence] = parsePredictionSequence(dict(), frames(['HELLO'], 20));
    expect(sentence).toEqual(['HELLO']);
  });

  it('ignores flicker shorter than minStableFrames', () => {
    const preds = [...frames(['WATER'], 2, 0), ...frames(['HELLO'], 6)];
    expect(parsePredictionSequence(dict(), preds)).toEqual([['HELLO']]);
  });

  it('ignores low-confidence frames', () => {
    const preds = [...frames(['POLICE'], 10, 0, 0.4), ...frames(['HELP'], 6)];
    expect(parsePredictionSequence(dict(), preds)).toEqual([['HELP']]);
  });

  it('ignores labels that are not in the dictionary', () => {
    expect(parsePredictionSequence(dict(), frames(['UNKNOWN-SIGN', 'YES']))).toEqual([['YES']]);
  });

  it('allows the same sign twice when separated by a pause', () => {
    expect(parsePredictionSequence(dict(), frames(['YES', 'YES'], 6, 5))).toEqual([['YES', 'YES']]);
  });

  it('does not double-commit across a short dropout shorter than minStableFrames', () => {
    expect(parsePredictionSequence(dict(), frames(['YES', 'YES'], 6, 1))).toEqual([['YES']]);
  });

  it('maps regional variants (Bulawayo/Harare) to the canonical gloss', () => {
    expect(parsePredictionSequence(dict(), frames(['HELLO~BYO', 'WATER~HRE']))).toEqual([['HELLO', 'WATER']]);
  });

  it('merges fingerspelled letters into one word token', () => {
    const preds = frames(['ME', 'NAME', 'FS:R', 'FS:U', 'FS:D', 'FS:O']);
    expect(parsePredictionSequence(dict(), preds)).toEqual([['ME', 'NAME', 'FS:RUDO']]);
  });

  it('splits sentences on a long pause', () => {
    const preds = [...frames(['HELLO']), ...pause(20), ...frames(['THANK-YOU'])];
    expect(parsePredictionSequence(dict(), preds)).toEqual([['HELLO'], ['THANK-YOU']]);
  });

  it('emits token events with the running sentence', () => {
    const parser = new GestureStreamParser(dict());
    const events = frames(['ME', 'FS:A', 'FS:B']).flatMap((p) => parser.push(p));
    const tokenEvents = events.filter((e) => e.type === 'token');
    expect(tokenEvents.map((e) => e.tokens)).toEqual([['ME'], ['ME', 'FS:A'], ['ME', 'FS:AB']]);
  });

  it('forces a flush at maxTokens', () => {
    const parser = new GestureStreamParser(dict(), { maxTokens: 2 });
    const events = frames(['YES', 'NO', 'GOOD']).flatMap((p) => parser.push(p));
    expect(events.filter((e) => e.type === 'sentence').map((e) => e.tokens)).toEqual([['YES', 'NO']]);
  });

  it('recovers the scripted sentences from the noisy mock stream', () => {
    const it = mockPredictionStream({ seed: 7, noise: 0.15 });
    const preds = Array.from({ length: 600 }, () => it.next().value!);
    const sentences = parsePredictionSequence(dict(), preds);
    expect(sentences[0]).toEqual(['HELLO', 'HOW', 'YOU']);
    expect(sentences[1]).toEqual(['ME', 'NAME', 'FS:TATENDA']);
    expect(sentences[2]).toEqual(['ME', 'NEED', 'HELP']);
  });
});

describe('glossesToText', () => {
  const d = dict();

  it('uses phrase templates per language', () => {
    expect(glossesToText(d, ['HELLO', 'HOW', 'YOU'], 'en').text).toBe('Hello, how are you?');
    expect(glossesToText(d, ['HELLO', 'HOW', 'YOU'], 'sn').text).toBe('Mhoro, makadii?');
    expect(glossesToText(d, ['HELLO', 'HOW', 'YOU'], 'nd').text).toBe('Sawubona, unjani?');
  });

  it('fills fingerspelled names into templates', () => {
    const g = ['ME', 'NAME', 'FS:TATENDA'];
    expect(glossesToText(d, g, 'en').text).toBe('My name is Tatenda.');
    expect(glossesToText(d, g, 'sn').text).toBe('Zita rangu ndiTatenda.');
    expect(glossesToText(d, g, 'nd').text).toBe('Ibizo lami nguTatenda.');
  });

  it('handles ZSL topic-comment order and negation via templates', () => {
    expect(glossesToText(d, ['HOSPITAL', 'WHERE'], 'en').text).toBe('Where is the hospital?');
    expect(glossesToText(d, ['ME', 'UNDERSTAND', 'NO'], 'sn').text).toBe('Handinzwisise.');
  });

  it('falls back to word-by-word translation and question marks', () => {
    const r = glossesToText(d, ['WHERE', 'MOTHER'], 'nd');
    expect(r.text).toBe('Ngaphi umama?');
    expect(r.matchedPhrases).toEqual([]);
  });

  it('combines a template with trailing words', () => {
    expect(glossesToText(d, ['THANK-YOU', 'FRIEND'], 'sn').text).toBe('Ndatenda shamwari.');
  });

  it('reports unknown glosses', () => {
    const r = glossesToText(d, ['YES', 'ZZZ'], 'en');
    expect(r.unknown).toEqual(['ZZZ']);
  });

  it('returns empty text for no glosses', () => {
    expect(glossesToText(d, [], 'en').text).toBe('');
  });
});
