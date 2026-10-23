import { MockGestureRecognizer } from './MockGestureRecognizer';
import { GestureRecognizer } from './types';

export * from './types';
export { MockGestureRecognizer } from './MockGestureRecognizer';

/**
 * Returns the best available recogniser. Until a trained ZSL TFLite model and
 * the VisionCamera frame-processor plugin are added (see docs/ML_MODELS.md),
 * this is the scripted mock so the full UI pipeline can be exercised.
 */
export function createGestureRecognizer(): GestureRecognizer {
  return new MockGestureRecognizer();
}
