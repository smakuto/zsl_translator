import { memo } from 'react';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Handshape, Keyframe } from '../types';

const W = 100;
const H = 120;
const SHOULDER_R: [number, number] = [64, 52];
const SHOULDER_L: [number, number] = [36, 52];

/** Finger directions (degrees, 0 = up) per handshape: [angle, length] per extended finger. */
const FINGERS: Record<Handshape, [number, number][]> = {
  flat: [[-12, 9], [-4, 10], [4, 10], [12, 9]],
  open: [[-40, 7], [-15, 9], [-3, 10], [9, 10], [22, 8]],
  fist: [],
  point: [[0, 11]],
  v: [[-14, 10], [14, 10]],
  c: [[-50, 6], [40, 7]],
  o: [],
  y: [[-50, 7], [40, 8]],
  l: [[-80, 7], [0, 10]],
  thumb: [[-10, 8]],
};

function Hand({ x, y, hs, color, stroke }: { x: number; y: number; hs: Handshape; color: string; stroke: string }) {
  const px = x * W;
  const py = y * H;
  return (
    <G>
      {FINGERS[hs].map(([deg, len], i) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <Line
            key={i}
            x1={px}
            y1={py}
            x2={px + Math.sin(rad) * len}
            y2={py - Math.cos(rad) * len}
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
        );
      })}
      <Circle cx={px} cy={py} r={hs === 'o' || hs === 'c' ? 5 : 5.5} fill={hs === 'o' ? 'none' : color} stroke={color} strokeWidth={hs === 'o' ? 3 : 0} />
      <Circle cx={px} cy={py} r={6.5} fill="none" stroke={stroke} strokeWidth={0.6} />
    </G>
  );
}

function Face({ face, fg, bg }: { face: Keyframe['face']; fg: string; bg: string }) {
  const browY = face === 'raised' ? 15 : face === 'furrowed' ? 19 : 17;
  const browTilt = face === 'furrowed' ? 1.5 : 0;
  const headX = face === 'headshake' ? 47 : 50;
  return (
    <G>
      <Circle cx={headX} cy={24} r={14} fill={bg} stroke={fg} strokeWidth={2} />
      <Line x1={headX - 8} y1={browY - browTilt} x2={headX - 3} y2={browY + browTilt} stroke={fg} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={headX + 3} y1={browY + browTilt} x2={headX + 8} y2={browY - browTilt} stroke={fg} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={headX - 5} cy={22} r={1.4} fill={fg} />
      <Circle cx={headX + 5} cy={22} r={1.4} fill={fg} />
      {face === 'smile' ? (
        <Path d={`M ${headX - 5} 29 Q ${headX} 34 ${headX + 5} 29`} stroke={fg} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      ) : face === 'furrowed' ? (
        <Path d={`M ${headX - 4} 31 Q ${headX} 28 ${headX + 4} 31`} stroke={fg} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      ) : (
        <Line x1={headX - 4} y1={30} x2={headX + 4} y2={30} stroke={fg} strokeWidth={1.6} strokeLinecap="round" />
      )}
    </G>
  );
}

/**
 * Lightweight 2D vector signer (≈20 SVG nodes per frame). Avoids video assets
 * entirely so hundreds of signs fit in a few KB of SQLite keyframe JSON.
 */
export const SignAvatar = memo(function SignAvatar({
  frame,
  fg,
  bg,
  accent,
  size = 260,
}: {
  frame: Keyframe;
  fg: string;
  bg: string;
  accent: string;
  size?: number;
}) {
  const [rx, ry, rhs] = frame.r;
  const l = frame.l;
  return (
    <Svg width={size} height={size * (H / W)} viewBox={`0 0 ${W} ${H}`} accessibilityLabel={`Sign ${frame.caption ?? ''}`}>
      <Rect x={0} y={0} width={W} height={H} fill={bg} />
      <Path d="M 28 120 L 30 58 Q 50 46 70 58 L 72 120 Z" fill={fg} opacity={0.18} />
      <Line x1={SHOULDER_L[0]} y1={SHOULDER_L[1]} x2={SHOULDER_R[0]} y2={SHOULDER_R[1]} stroke={fg} strokeWidth={3} strokeLinecap="round" />
      <Line x1={50} y1={38} x2={50} y2={50} stroke={fg} strokeWidth={3} />
      <Face face={frame.face} fg={fg} bg={bg} />
      {l && (
        <G>
          <Line x1={SHOULDER_L[0]} y1={SHOULDER_L[1]} x2={l[0] * W} y2={l[1] * H} stroke={fg} strokeWidth={3.5} strokeLinecap="round" />
          <Hand x={l[0]} y={l[1]} hs={l[2]} color={fg} stroke={fg} />
        </G>
      )}
      <Line x1={SHOULDER_R[0]} y1={SHOULDER_R[1]} x2={rx * W} y2={ry * H} stroke={accent} strokeWidth={3.5} strokeLinecap="round" />
      <Hand x={rx} y={ry} hs={rhs} color={accent} stroke={fg} />
      {frame.caption && frame.caption.length === 1 && (
        <SvgText x={86} y={18} fontSize={16} fontWeight="bold" fill={accent} textAnchor="middle">
          {frame.caption}
        </SvgText>
      )}
    </Svg>
  );
});
