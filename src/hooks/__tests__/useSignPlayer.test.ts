import { BASE_FPS, frameAt } from '../useSignPlayer';

describe('frameAt', () => {
  it('advances proportionally to wall-clock time and speed', () => {
    expect(frameAt(0, 1000, BASE_FPS * 1, 100)).toBe(BASE_FPS);
    expect(frameAt(0, 1000, BASE_FPS * 1.5, 100)).toBe(BASE_FPS * 1.5);
    expect(frameAt(0, 1000, BASE_FPS * 0.5, 100)).toBe(BASE_FPS * 0.5);
  });

  it('skips frames when ticks arrive late instead of slowing down', () => {
    expect(frameAt(10, 500, 24, 100)).toBe(22);
  });

  it('clamps to the last frame and handles empty sequences', () => {
    expect(frameAt(0, 60_000, 18, 50)).toBe(49);
    expect(frameAt(0, 1000, 12, 0)).toBe(0);
    expect(frameAt(5, -20, 12, 50)).toBe(5);
  });
});
