import { GesturePrediction, NO_SIGN } from '../../types';
import { GestureRecognizer, GestureRecognizerInfo } from './types';
import { MOCK_SENTENCES } from './mockScripts';

export interface MockOptions {
  fps: number;
  holdFrames: number;
  transitionFrames: number;
  sentenceGapFrames: number;
  /** Probability of a spurious low-confidence frame (exercises the debouncer). */
  noise: number;
  seed: number;
  sentences: string[][];
}

const DEFAULTS: MockOptions = {
  fps: 15,
  holdFrames: 9,
  transitionFrames: 3,
  sentenceGapFrames: 20,
  noise: 0.12,
  seed: 42,
  sentences: MOCK_SENTENCES,
};

/** Deterministic PRNG (mulberry32) so tests and demos are reproducible. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Expands scripted sentences into a realistic noisy frame stream. */
export function* mockPredictionStream(options: Partial<MockOptions> = {}): Generator<GesturePrediction> {
  const o = { ...DEFAULTS, ...options };
  const rand = rng(o.seed);
  const frameMs = 1000 / o.fps;
  let t = 0;
  const all = o.sentences.flatMap((s) => s);
  const emit = (label: string, confidence: number): GesturePrediction => {
    t += frameMs;
    return { label, confidence, timestamp: Math.round(t) };
  };
  for (let si = 0; ; si = (si + 1) % o.sentences.length) {
    for (const gloss of o.sentences[si]) {
      for (let f = 0; f < o.holdFrames; f++) {
        if (rand() < o.noise) {
          const distractor = all[Math.floor(rand() * all.length)];
          yield emit(distractor, 0.3 + rand() * 0.25);
        } else {
          yield emit(gloss, 0.78 + rand() * 0.2);
        }
      }
      for (let f = 0; f < o.transitionFrames; f++) yield emit(NO_SIGN, 0.9);
    }
    for (let f = 0; f < o.sentenceGapFrames; f++) yield emit(NO_SIGN, 0.95);
  }
}

export class MockGestureRecognizer implements GestureRecognizer {
  readonly info: GestureRecognizerInfo;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly options: Partial<MockOptions>;

  constructor(options: Partial<MockOptions> = {}) {
    this.options = options;
    this.info = {
      id: 'mock',
      label: 'Demo recogniser (mock)',
      isMock: true,
      targetFps: options.fps ?? DEFAULTS.fps,
    };
  }

  async start(onPrediction: (p: GesturePrediction) => void): Promise<void> {
    this.stop();
    const stream = mockPredictionStream({ ...this.options, seed: Date.now() & 0xffff });
    const startedAt = Date.now();
    this.timer = setInterval(() => {
      const next = stream.next().value as GesturePrediction;
      onPrediction({ ...next, timestamp: Date.now() - startedAt });
    }, 1000 / this.info.targetFps);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
