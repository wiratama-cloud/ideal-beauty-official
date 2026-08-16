import { describe, it, expect } from 'vitest';
import { getPreOrderDays, formatEstimatedArrival } from '../src/lib/utils/preorder';

function getActivePreOrderPreset(daysVal?: number | null, noteVal?: string | null): '15' | '30' | '45' | 'custom' {
  if (daysVal === 15) return '15';
  if (daysVal === 30) return '30';
  if (daysVal === 45) return '45';
  const note = (noteVal || '').toLowerCase();
  if (note.includes('15 days') || note.includes('15 day')) return '15';
  if (note.includes('30 days') || note.includes('30 day')) return '30';
  if (note.includes('45 days') || note.includes('45 day')) return '45';

  return 'custom';
}

function formatPreOrderWaitDuration(days: number): string {
  return `Ships in ${days} Days`;
}

describe('Pre-Order Wait Duration Option Presets', () => {
  it('formats wait duration correctly for 15, 30, and 45 days', () => {
    expect(formatPreOrderWaitDuration(15)).toBe('Ships in 15 Days');
    expect(formatPreOrderWaitDuration(30)).toBe('Ships in 30 Days');
    expect(formatPreOrderWaitDuration(45)).toBe('Ships in 45 Days');
  });

  it('matches preset duration from integer days and note string', () => {
    expect(getActivePreOrderPreset(15, 'Ships in 15 Days')).toBe('15');
    expect(getActivePreOrderPreset(30, 'Ships in 30 Days')).toBe('30');
    expect(getActivePreOrderPreset(45, 'Ships in 45 Days')).toBe('45');
    expect(getActivePreOrderPreset(null, 'Custom wait duration')).toBe('custom');
  });

  it('calculates integer pre-order lead time days and arrival date', () => {
    expect(getPreOrderDays({ preOrderDays: 21, preOrderNote: 'Ships in 21 Days' })).toBe(21);
    expect(getPreOrderDays({ preOrderDays: null, preOrderNote: 'Ships in 30 Days' })).toBe(30);

    const baseDate = new Date('2026-09-01T00:00:00Z');
    expect(formatEstimatedArrival(15, baseDate)).toBe('Sep 16, 2026');
  });
});
