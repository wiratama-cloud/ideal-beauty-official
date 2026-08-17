import { describe, it, expect } from 'vitest';
import { formatOtp, cleanOtp } from '../src/lib/utils/phone';

describe('OTP Formatting Utility', () => {
  describe('formatOtp', () => {
    it('returns empty string for empty or null inputs', () => {
      expect(formatOtp('')).toBe('');
      expect(formatOtp(null)).toBe('');
      expect(formatOtp(undefined)).toBe('');
    });

    it('formats 1-3 digits without hyphen', () => {
      expect(formatOtp('1')).toBe('1');
      expect(formatOtp('12')).toBe('12');
      expect(formatOtp('123')).toBe('123');
    });

    it('formats 4-6 digits into 3-3 grouped format with hyphen', () => {
      expect(formatOtp('1234')).toBe('123-4');
      expect(formatOtp('12345')).toBe('123-45');
      expect(formatOtp('123456')).toBe('123-456');
    });

    it('strips non-digit characters and truncates to 6 digits', () => {
      expect(formatOtp('123-456')).toBe('123-456');
      expect(formatOtp('123 456')).toBe('123-456');
      expect(formatOtp('a1b2c3d4e5f6g7')).toBe('123-456');
    });
  });

  describe('cleanOtp', () => {
    it('returns empty string for empty or null inputs', () => {
      expect(cleanOtp('')).toBe('');
      expect(cleanOtp(null)).toBe('');
      expect(cleanOtp(undefined)).toBe('');
    });

    it('extracts clean 6-digit numeric string from formatted OTP', () => {
      expect(cleanOtp('123-456')).toBe('123456');
      expect(cleanOtp('123 456')).toBe('123456');
      expect(cleanOtp('123456789')).toBe('123456');
    });
  });
});
