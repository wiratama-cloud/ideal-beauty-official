import { describe, it, expect } from 'vitest';

describe('Pull to Refresh Gesture Calculations & Thresholds', () => {
  const PULL_THRESHOLD = 65;
  const MAX_PULL = 90;

  const calculatePullDistance = (deltaY: number): number => {
    if (deltaY <= 0) return 0;
    return Math.min(MAX_PULL, Math.pow(deltaY, 0.8) * 1.5);
  };

  const shouldTriggerRefresh = (distance: number): boolean => {
    return distance >= PULL_THRESHOLD;
  };

  const isHorizontalSwipe = (deltaX: number, deltaY: number): boolean => {
    return Math.abs(deltaX) > Math.abs(deltaY);
  };

  it('calculates dampened resistance distance from touch deltaY', () => {
    expect(calculatePullDistance(0)).toBe(0);
    expect(calculatePullDistance(-20)).toBe(0);

    const pullAt30 = calculatePullDistance(30);
    expect(pullAt30).toBeGreaterThan(0);
    expect(pullAt30).toBeLessThan(30); // Dampening effect

    const pullAt120 = calculatePullDistance(120);
    expect(pullAt120).toBeGreaterThan(PULL_THRESHOLD);
    expect(pullAt120).toBeLessThanOrEqual(MAX_PULL);

    // Extreme pull should be capped at MAX_PULL
    const pullAt400 = calculatePullDistance(400);
    expect(pullAt400).toBe(MAX_PULL);
  });

  it('triggers refresh only when threshold (65px) is reached', () => {
    expect(shouldTriggerRefresh(0)).toBe(false);
    expect(shouldTriggerRefresh(30)).toBe(false);
    expect(shouldTriggerRefresh(64.9)).toBe(false);
    expect(shouldTriggerRefresh(65)).toBe(true);
    expect(shouldTriggerRefresh(80)).toBe(true);
  });

  it('cancels vertical pull gesture if horizontal movement dominates', () => {
    // Horizontal swipe (e.g. browsing account tabs or photo gallery)
    expect(isHorizontalSwipe(80, 20)).toBe(true);
    expect(isHorizontalSwipe(-60, 10)).toBe(true);

    // Vertical pull-down gesture
    expect(isHorizontalSwipe(10, 80)).toBe(false);
    expect(isHorizontalSwipe(0, 50)).toBe(false);
  });
});
