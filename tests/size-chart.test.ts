import { describe, it, expect } from 'vitest';
import { SIZE_CHART_DATA } from '../src/components/product/SizeChartModal';
import { DEFAULT_WEIGHT_HEIGHT_MEASUREMENTS } from '../src/lib/types/size-chart';

describe('SizeChartModal Data & Logic', () => {
  it('should contain full body measurement chart dataset in cm', () => {
    expect(SIZE_CHART_DATA.length).toBeGreaterThanOrEqual(6);

    const sizes = SIZE_CHART_DATA.map((d) => d.size);
    expect(sizes).toContain('XS');
    expect(sizes).toContain('S');
    expect(sizes).toContain('M');
    expect(sizes).toContain('L');
    expect(sizes).toContain('XL');
    expect(sizes).toContain('2XL');

    SIZE_CHART_DATA.forEach((row) => {
      expect(row.bustCm).toBeDefined();
      expect(row.waistCm).toBeDefined();
      expect(row.hipsCm).toBeDefined();
      expect(row.shoulderCm).toBeDefined();
    });
  });

  it('should contain full weight (kg) & height (cm) chart dataset', () => {
    expect(DEFAULT_WEIGHT_HEIGHT_MEASUREMENTS.length).toBeGreaterThanOrEqual(6);

    DEFAULT_WEIGHT_HEIGHT_MEASUREMENTS.forEach((row) => {
      expect(row.heightCm).toBeDefined();
      expect(row.weightKg).toBeDefined();
    });
  });

  it('should calculate size recommendation correctly based on bust measurement in cm', () => {
    const calculateRecommendedSize = (bustCm: number) => {
      if (bustCm < 82) return 'XS';
      if (bustCm <= 89) return 'S';
      if (bustCm <= 94) return 'M';
      if (bustCm <= 101) return 'L';
      if (bustCm <= 109) return 'XL';
      if (bustCm <= 117) return '2XL';
      return '3XL';
    };

    expect(calculateRecommendedSize(80)).toBe('XS');
    expect(calculateRecommendedSize(87)).toBe('S');
    expect(calculateRecommendedSize(92)).toBe('M');
    expect(calculateRecommendedSize(98)).toBe('L');
    expect(calculateRecommendedSize(105)).toBe('XL');
    expect(calculateRecommendedSize(115)).toBe('2XL');
    expect(calculateRecommendedSize(122)).toBe('3XL');
  });

  it('should calculate size recommendation correctly based on weight in kg', () => {
    const calculateRecommendedSizeFromWeight = (weightKg: number) => {
      if (weightKg < 45) return 'XS';
      if (weightKg <= 52) return 'S';
      if (weightKg <= 62) return 'M';
      if (weightKg <= 72) return 'L';
      if (weightKg <= 82) return 'XL';
      if (weightKg <= 92) return '2XL';
      return '3XL';
    };

    expect(calculateRecommendedSizeFromWeight(42)).toBe('XS');
    expect(calculateRecommendedSizeFromWeight(50)).toBe('S');
    expect(calculateRecommendedSizeFromWeight(60)).toBe('M');
    expect(calculateRecommendedSizeFromWeight(70)).toBe('L');
    expect(calculateRecommendedSizeFromWeight(80)).toBe('XL');
    expect(calculateRecommendedSizeFromWeight(90)).toBe('2XL');
    expect(calculateRecommendedSizeFromWeight(98)).toBe('3XL');
  });
});
