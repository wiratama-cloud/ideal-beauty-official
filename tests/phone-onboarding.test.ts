import { describe, it, expect } from 'vitest';
import { isValidPhoneNumber, formatPhoneNumber } from '../src/lib/utils/phone';
import fs from 'fs';
import path from 'path';

describe('Phone Number Formatting & Onboarding', () => {
  describe('formatPhoneNumber utility', () => {
    it('formats local Indonesian numbers starting with 0 into +62 format', () => {
      expect(formatPhoneNumber('081234567890')).toBe('+62 812-3456-7890');
    });

    it('formats numbers without leading 0 or + by adding +62', () => {
      expect(formatPhoneNumber('81234567890')).toBe('+62 812-3456-7890');
    });

    it('formats raw +62 numbers into spaced and hypenated groups', () => {
      expect(formatPhoneNumber('+6281234567890')).toBe('+62 812-3456-7890');
    });

    it('returns default +62  prefix for null or empty inputs', () => {
      expect(formatPhoneNumber('')).toBe('+62 ');
      expect(formatPhoneNumber(null)).toBe('+62 ');
      expect(formatPhoneNumber(undefined)).toBe('+62 ');
    });

    it('preserves foreign international prefixes', () => {
      expect(formatPhoneNumber('+12025550123')).toBe('+12 025550123');
    });
  });

  describe('ProfileTab Onboarding Integration', () => {
    it('disables the phone input and provides Change Phone Number button with verification dialog', () => {
      const profileTabPath = path.resolve(__dirname, '../src/components/account/ProfileTab.tsx');
      const content = fs.readFileSync(profileTabPath, 'utf-8');

      expect(content).toContain('disabled');
      expect(content).toContain('readOnly');
      expect(content).toContain('Change Phone Number');
      expect(content).toContain('setIsChangePhoneModalOpen(true)');
      expect(content).toContain('Change & Verify Phone Number');
      expect(content).toContain('initialPhoneNumber={formData.phone}');
      expect(content).toContain('formatPhoneNumber');
    });

    it('PhoneAuthForm accepts initialPhoneNumber and applies live input formatting', () => {
      const phoneAuthPath = path.resolve(__dirname, '../src/components/auth/PhoneAuthForm.tsx');
      const content = fs.readFileSync(phoneAuthPath, 'utf-8');

      expect(content).toContain('initialPhoneNumber?: string;');
      expect(content).toContain('onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}');
    });
  });

  describe('Server Action Robustness for Phone Linking', () => {
    it('linkPhoneToUserAction handles stale user session by falling back to token verification', async () => {
      const authActionsPath = path.resolve(__dirname, '../src/app/actions/auth.ts');
      const content = fs.readFileSync(authActionsPath, 'utf-8');

      expect(content).toContain('if (!currentUser) {');
      expect(content).toContain('return await verifyFirebaseTokenAction(token);');
      expect(content).toContain('error.code === \'P2025\'');
    });
  });
});
