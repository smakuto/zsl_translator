import { Keyframe, Region } from '../types';
import { Dictionary } from './dictionary';
import { fingerspellKeyframes, isFingerspellToken, letterOf } from './fingerspelling';
import { generateKeyframes, restKeyframe } from './keyframes';

export interface SignClip {
  gloss: string;
  label: string;
  startFrame: number;
  frameCount: number;
  mediaUri?: string | null;
}

export interface SignSequence {
  frames: Keyframe[];
  clips: SignClip[];
}

const GAP_FRAMES = 2;

/** Concatenates per-sign animations (region-aware) into one scrubbable timeline. */
export function buildSignSequence(
  dictionary: Dictionary,
  keyframes: Map<string, Keyframe[]>,
  glosses: string[],
  region: Region,
): SignSequence {
  const frames: Keyframe[] = [];
  const clips: SignClip[] = [];
  for (const gloss of glosses) {
    let clipFrames: Keyframe[];
    let label = gloss;
    let mediaUri: string | null | undefined;
    if (isFingerspellToken(gloss)) {
      const letters = letterOf(gloss).split('');
      clipFrames = letters.flatMap((l) => fingerspellKeyframes(l));
      label = `✋ ${letterOf(gloss)}`;
    } else {
      const sign = dictionary.sign(gloss, region);
      if (!sign) continue;
      clipFrames = keyframes.get(sign.id) ?? generateKeyframes(sign.descriptor);
      mediaUri = sign.mediaUri;
      if (sign.region !== 'common') label = `${gloss} (${sign.region === 'bulawayo' ? 'Bulawayo' : 'Harare'})`;
    }
    clips.push({ gloss, label, startFrame: frames.length, frameCount: clipFrames.length, mediaUri });
    frames.push(...clipFrames.map((f) => ({ ...f, caption: f.caption ?? gloss })));
    for (let i = 0; i < GAP_FRAMES; i++) frames.push(restKeyframe());
  }
  return { frames, clips };
}

export function clipAt(seq: SignSequence, frame: number): SignClip | undefined {
  return seq.clips.find((c) => frame >= c.startFrame && frame < c.startFrame + c.frameCount + GAP_FRAMES);
}
