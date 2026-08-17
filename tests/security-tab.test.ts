import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('SecurityTab & SocialAuthButtons Disabled Link State', () => {
  it('SecurityTab passes disabled status and label when user is already linked', () => {
    const securityTabPath = path.resolve(__dirname, '../src/components/account/SecurityTab.tsx');
    const content = fs.readFileSync(securityTabPath, 'utf-8');

    expect(content).toContain('disabled={Boolean(user.firebaseUid)}');
    expect(content).toContain("label={user.firebaseUid ? 'Google Account Connected' : 'Connect Google Account'}");
  });

  it('SocialAuthButtons supports disabled property for social sign-in buttons', () => {
    const socialButtonsPath = path.resolve(__dirname, '../src/components/auth/SocialAuthButtons.tsx');
    const content = fs.readFileSync(socialButtonsPath, 'utf-8');

    expect(content).toContain('disabled?: boolean;');
    expect(content).toContain('disabled={disabled || loadingProvider !== null}');
    expect(content).toContain('if (disabled) return;');
  });
});
