import { SEED_DATA } from '../../db/seed';
import { Dictionary } from '../dictionary';
import { GesturePrediction, NO_SIGN } from '../../types';

export const dict = () => new Dictionary(SEED_DATA);

/** Build a clean frame stream: each label held `hold` frames, separated by `gap` no-sign frames. */
export function frames(labels: string[], hold = 6, gap = 2, confidence = 0.9): GesturePrediction[] {
  const out: GesturePrediction[] = [];
  let t = 0;
  for (const label of labels) {
    for (let i = 0; i < hold; i++) out.push({ label, confidence, timestamp: (t += 66) });
    for (let i = 0; i < gap; i++) out.push({ label: NO_SIGN, confidence: 0.95, timestamp: (t += 66) });
  }
  return out;
}

export function pause(n: number): GesturePrediction[] {
  return Array.from({ length: n }, (_, i) => ({ label: NO_SIGN, confidence: 0.95, timestamp: i }));
}
