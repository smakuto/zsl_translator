import { decode, FeatureWindow, normalizeHand, Landmark } from '../gesture/landmarks';
import { pickVoice } from '../speech/tts';
import { parseVoskPayload } from '../speech/VoskSpeechRecognizer';

describe('landmark features', () => {
  const hand: Landmark[] = Array.from({ length: 21 }, (_, i) => [0.5 + i * 0.01, 0.5 + i * 0.02, 0]);
  it('is wrist-centred and mirrored for left hands', () => {
    const r = normalizeHand(hand, false);
    const l = normalizeHand(hand, true);
    expect(r[0]).toBeCloseTo(0);
    expect(r[3]).toBeCloseTo(-l[3]);
  });
  it('windows features into a flat tensor', () => {
    const w = new FeatureWindow(2);
    w.push(new Float32Array([1, 2]));
    expect(w.ready).toBe(false);
    w.push(new Float32Array([3, 4]));
    w.push(new Float32Array([5, 6]));
    expect(Array.from(w.toTensor())).toEqual([3, 4, 5, 6]);
  });
  it('decodes logits with softmax confidence', () => {
    const r = decode([0, 5, 0], ['A', 'B', 'C']);
    expect(r.label).toBe('B');
    expect(r.confidence).toBeGreaterThan(0.9);
  });
});

describe('tts voice selection', () => {
  const voices = [
    { identifier: 'en-gb-x', language: 'en-GB' },
    { identifier: 'zu-za-x', language: 'zu-ZA' },
  ];
  it('prefers related Zulu voice for Ndebele', () => {
    expect(pickVoice(voices, 'nd')).toEqual({ language: 'zu-ZA', voice: 'zu-za-x', fallback: false });
  });
  it('falls back to English for Shona when no voice exists', () => {
    expect(pickVoice(voices, 'sn')).toMatchObject({ language: 'en-GB', fallback: true });
  });
});

describe('vosk payloads', () => {
  it('parses JSON and plain text', () => {
    expect(parseVoskPayload('{"text":"mhoro"}')).toBe('mhoro');
    expect(parseVoskPayload('{"partial":"sawu"}')).toBe('sawu');
    expect(parseVoskPayload('hello')).toBe('hello');
  });
});
