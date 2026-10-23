import { useCallback, useEffect, useRef, useState } from 'react';

export const PLAYBACK_SPEEDS = [0.5, 1, 1.5] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

/** Base avatar frame rate; low enough for smooth SVG rendering on budget phones. */
export const BASE_FPS = 12;

/** Mount with a `key` per sequence so playback state resets when the sequence changes. */
/**
 * Frame for wall-clock playback. Frames are skipped rather than slowed down
 * when the JS thread can't tick at the target rate, so speed stays honest on
 * budget phones.
 */
export function frameAt(anchorFrame: number, elapsedMs: number, fps: number, frameCount: number): number {
  if (frameCount <= 0) return 0;
  return Math.min(frameCount - 1, anchorFrame + Math.floor((Math.max(0, elapsedMs) * fps) / 1000));
}

export function useSignPlayer(frameCount: number) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(frameCount > 0);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const frameRef = useRef(0);
  const anchorRef = useRef({ frame: 0, time: 0 });

  useEffect(() => {
    if (!playing || frameCount === 0) return;
    const fps = BASE_FPS * speed;
    anchorRef.current = { frame: frameRef.current, time: Date.now() };
    const id = setInterval(() => {
      const { frame: anchorFrame, time } = anchorRef.current;
      const next = frameAt(anchorFrame, Date.now() - time, fps, frameCount);
      if (next !== frameRef.current) {
        frameRef.current = next;
        setFrame(next);
      }
      if (next >= frameCount - 1) setPlaying(false);
    }, 1000 / fps);
    return () => clearInterval(id);
  }, [playing, speed, frameCount]);

  const seek = useCallback(
    (f: number) => {
      const clamped = Math.max(0, Math.min(frameCount - 1, Math.round(f)));
      frameRef.current = clamped;
      anchorRef.current = { frame: clamped, time: Date.now() };
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
