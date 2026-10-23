/**
 * Feature extraction for a landmark-based ZSL classifier.
 *
 * Pipeline on device: camera frame → MediaPipe Hand/Pose Landmarker (TFLite) →
 * 2×21 hand landmarks (+ optional face/pose) → normalise() → sliding window of
 * N frames → INT8/FP16 TFLite sequence classifier → softmax → decode().
 * Landmark models are ~5–10MB; a gloss classifier over landmarks is typically
 * <2MB, which keeps the whole model package far below the 200MB budget and
 * runs at 15–20 FPS on entry-level ARM CPUs.
 */
export type Landmark = [x: number, y: number, z: number];
export const HAND_LANDMARKS = 21;
export const FEATURES_PER_HAND = HAND_LANDMARKS * 3;

/** Wrist-centred, palm-size-scaled, handedness-mirrored features for one hand. */
export function normalizeHand(points: Landmark[] | null, isLeft: boolean): Float32Array {
  const out = new Float32Array(FEATURES_PER_HAND);
  if (!points || points.length < HAND_LANDMARKS) return out;
  const [wx, wy, wz] = points[0];
  const [mx, my] = points[9];
  const scale = Math.hypot(mx - wx, my - wy) || 1;
  for (let i = 0; i < HAND_LANDMARKS; i++) {
    const [x, y, z] = points[i];
    const nx = (x - wx) / scale;
    out[i * 3] = isLeft ? -nx : nx;
    out[i * 3 + 1] = (y - wy) / scale;
    out[i * 3 + 2] = (z - wz) / scale;
  }
  return out;
}

export function frameFeatures(right: Landmark[] | null, left: Landmark[] | null): Float32Array {
  const f = new Float32Array(FEATURES_PER_HAND * 2);
  f.set(normalizeHand(right, false), 0);
  f.set(normalizeHand(left, true), FEATURES_PER_HAND);
  return f;
}

/** Fixed-length sliding window of per-frame features (model input [1, window, features]). */
export class FeatureWindow {
  private readonly buf: Float32Array[] = [];
  constructor(readonly size: number) {}
  push(f: Float32Array): void {
    this.buf.push(f);
    if (this.buf.length > this.size) this.buf.shift();
  }
  get ready(): boolean {
    return this.buf.length === this.size;
  }
  toTensor(): Float32Array {
    const width = this.buf[0]?.length ?? 0;
    const out = new Float32Array(this.size * width);
    this.buf.forEach((f, i) => out.set(f, i * width));
    return out;
  }
}

/** Argmax over model logits/probabilities → (label, confidence). */
export function decode(output: ArrayLike<number>, labels: string[], isLogits = true): { label: string; confidence: number } {
  let max = -Infinity;
  for (let i = 0; i < output.length; i++) max = Math.max(max, output[i]);
  let sum = 0;
  const probs = new Array<number>(output.length);
  for (let i = 0; i < output.length; i++) {
    probs[i] = isLogits ? Math.exp(output[i] - max) : output[i];
    sum += probs[i];
  }
  let best = 0;
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[best]) best = i;
  return { label: labels[best] ?? '_none', confidence: sum ? probs[best] / sum : 0 };
}
