import { GesturePrediction } from '../../types';

export interface GestureRecognizerInfo {
  id: string;
  label: string;
  isMock: boolean;
  /** Target inference rate in frames per second. */
  targetFps: number;
}

/**
 * Pluggable on-device sign recogniser. Implementations: MockGestureRecognizer
 * (scripted, for dev/testing) and LandmarkTfliteRecognizer (MediaPipe hand/pose
 * landmarks → quantised TFLite classifier) once a trained ZSL model is bundled.
 */
export interface GestureRecognizer {
  readonly info: GestureRecognizerInfo;
  start(onPrediction: (p: GesturePrediction) => void): Promise<void>;
  stop(): void;
}
