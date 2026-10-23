import { BodyLocation, Handshape, Keyframe, SignDescriptor } from '../types';

const LOCATIONS: Record<BodyLocation, [number, number]> = {
  forehead: [0.56, 0.17],
  eyes: [0.58, 0.22],
  mouth: [0.55, 0.3],
  chin: [0.55, 0.34],
  chest: [0.55, 0.5],
  belly: [0.55, 0.64],
  neutral: [0.62, 0.56],
  side: [0.78, 0.5],
};

const REST_RIGHT: [number, number] = [0.72, 0.8];
const REST_LEFT: [number, number] = [0.28, 0.8];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mirrorX(x: number) {
  return 1 - x;
}

/**
 * Procedurally generates a short avatar animation from a sign's phonological
 * descriptor: approach → movement → hold → release. Stored in SQLite so a real
 * motion-capture or artist-made sequence can later replace it per sign.
 */
export function generateKeyframes(d: SignDescriptor, frames = 18): Keyframe[] {
  const [lx, ly] = LOCATIONS[d.loc];
  const out: Keyframe[] = [];
  const approach = 4;
  const release = 3;
  const moveFrames = frames - approach - release;
  const face = d.face ?? 'neutral';
  const leftShape: Handshape = d.twoHanded ? d.hs : 'flat';

  const push = (x: number, y: number, phaseFace = face) => {
    const right: [number, number, Handshape] = [x, y, d.hs];
    const left: Keyframe['l'] = d.twoHanded ? [mirrorX(x), y, leftShape] : [REST_LEFT[0], REST_LEFT[1], 'flat'];
    out.push({ r: right, l: left, face: phaseFace });
  };

  for (let i = 0; i < approach; i++) {
    const t = (i + 1) / approach;
    push(lerp(REST_RIGHT[0], lx, t), lerp(REST_RIGHT[1], ly, t), 'neutral');
  }
  for (let i = 0; i < moveFrames; i++) {
    const t = i / Math.max(1, moveFrames - 1);
    const [dx, dy] = movementOffset(d.move, t);
    push(lx + dx, ly + dy);
  }
  for (let i = 0; i < release; i++) {
    const t = (i + 1) / release;
    const last = out[out.length - 1].r;
    push(lerp(last[0], REST_RIGHT[0], t), lerp(last[1], REST_RIGHT[1], t), 'neutral');
  }
  return out;
}

function movementOffset(move: SignDescriptor['move'], t: number): [number, number] {
  const A = 0.06;
  switch (move) {
    case 'tap':
      return [0, -Math.abs(Math.sin(t * Math.PI * 2)) * A * 0.6];
    case 'circle':
      return [Math.cos(t * Math.PI * 2) * A, Math.sin(t * Math.PI * 2) * A];
    case 'outward':
      return [t * A * 2, t * A * 0.5];
    case 'inward':
      return [-t * A * 1.5, 0];
    case 'down':
      return [0, t * A * 2];
    case 'up':
      return [0, -t * A * 2];
    case 'wave':
      return [Math.sin(t * Math.PI * 4) * A, 0];
    case 'twist':
      return [Math.sin(t * Math.PI * 3) * A * 0.4, Math.cos(t * Math.PI * 3) * A * 0.2];
    default:
      return [0, 0];
  }
}

export function restKeyframe(): Keyframe {
  return { r: [REST_RIGHT[0], REST_RIGHT[1], 'flat'], l: [REST_LEFT[0], REST_LEFT[1], 'flat'], face: 'neutral' };
}
