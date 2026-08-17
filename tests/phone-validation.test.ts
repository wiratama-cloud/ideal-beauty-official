import { expect, test, describe } from 'vitest';
import { isValidPhoneNumber } from '../src/lib/utils/phone';

describe('Phone Number Validation Utility', () => {
  test('validates standard Indonesian mobile numbers', () => {
    expect(isValidPhoneNumber('+6281234567890')).toBe(true);
    expect(isValidPhoneNumber('+62 812-3456-7890')).toBe(true);
    expect(isValidPhoneNumber('081234567890')).toBe(true);
    expect(isValidPhoneNumber('0812-3456-7890')).toBe(true);
  });

  test('validates international phone numbers', () => {
    expect(isValidPhoneNumber('+1 415 555 2671')).toBe(true);
    expect(isValidPhoneNumber('+44 (20) 1234 5678')).toBe(true);
    expect(isValidPhoneNumber('+91 98765 43210')).toBe(true);
  });

  test('rejects invalid inputs', () => {
    expect(isValidPhoneNumber('')).toBe(false);
    expect(isValidPhoneNumber('   ')).toBe(false);
    expect(isValidPhoneNumber('12345')).toBe(false); // too short
    expect(isValidPhoneNumber('abc12345678')).toBe(false); // contains letters
    expect(isValidPhoneNumber('+6281234567890123456')).toBe(false); // too long
    expect(isValidPhoneNumber(null)).toBe(false);
    expect(isValidPhoneNumber(undefined)).toBe(false);
  });
});
