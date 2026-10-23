import { useCallback, useEffect, useRef, useState } from 'react';

export const PLAYBACK_SPEEDS = [0.5, 1, 1.5] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

/** Base avatar frame rate; low enough for smooth SVG rendering on budget phones. */
export const BASE_FPS = 12;

/** Mount with a `key` per sequence so playback state resets when the sequence changes. */
export function useSignPlayer(frameCount: number) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(frameCount > 0);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!playing || frameCount === 0) return;
    const id = setInterval(() => {
      const next = frameRef.current + 1;
      if (next >= frameCount) {
        setPlaying(false);
        return;
      }
      frameRef.current = next;
      setFrame(next);
    }, 1000 / (BASE_FPS * speed));
    return () => clearInterval(id);
  }, [playing, speed, frameCount]);

  const seek = useCallback(
    (f: number) => {
      const clamped = Math.max(0, Math.min(frameCount - 1, Math.round(f)));
      frameRef.current = clamped;
      setFrame(clamped);
    },
    [frameCount],
  );

  const toggle = useCallback(() => {
    if (frameCount === 0) return;
    if (!playing && frameRef.current >= frameCount - 1) seek(0);
    setPlaying((p) => !p);
  }, [playing, frameCount, seek]);

  const step = useCallback(
    (delta: number) => {
      setPlaying(false);
      seek(frameRef.current + delta);
    },
    [seek],
  );

  return { frame, playing, speed, setSpeed, seek, toggle, step, setPlaying };
}
