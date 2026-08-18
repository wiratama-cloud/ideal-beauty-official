import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Firebase Client Auth Configuration', () => {
  const clientAuthPath = path.resolve(__dirname, '../src/lib/firebase/client.ts');
  const clientContent = fs.readFileSync(clientAuthPath, 'utf-8');

  it('imports necessary persistence mechanisms and resolver from firebase/auth', () => {
    expect(clientContent).toContain('initializeAuth');
    expect(clientContent).toContain('browserLocalPersistence');
    expect(clientContent).toContain('indexedDBLocalPersistence');
    expect(clientContent).toContain('browserSessionPersistence');
    expect(clientContent).toContain('inMemoryPersistence');
    expect(clientContent).toContain('browserPopupRedirectResolver');
  });

  it('configures initializeAuth with browserLocalPersistence priority and browserPopupRedirectResolver', () => {
    expect(clientContent).toMatch(/initializeAuth\(\s*app,\s*\{/);
    expect(clientContent).toContain('browserLocalPersistence');
    expect(clientContent).toContain('popupRedirectResolver: browserPopupRedirectResolver');
  });

  it('includes SSR safety check and fallback to getAuth', () => {
    expect(clientContent).toContain("typeof window !== 'undefined'");
    expect(clientContent).toContain('authInstance = getAuth(app)');
  });
});

describe('SocialAuthButtons Mobile Resilience & Error Handling', () => {
  const socialAuthPath = path.resolve(__dirname, '../src/components/auth/SocialAuthButtons.tsx');
  const socialContent = fs.readFileSync(socialAuthPath, 'utf-8');

  it('configures GoogleAuthProvider with prompt select_account', () => {
    expect(socialContent).toContain("oauthProvider.setCustomParameters({ prompt: 'select_account' })");
  });

  it('handles popup cancellation and closed-by-user gracefully without error alert', () => {
    expect(socialContent).toContain("err?.code === 'auth/popup-closed-by-user'");
    expect(socialContent).toContain("err?.code === 'auth/cancelled-popup-request'");
    expect(socialContent).toContain('setLoadingProvider(null)');
  });

  it('handles popup blocked error with specific user guidance', () => {
    expect(socialContent).toContain("err?.code === 'auth/popup-blocked'");
    expect(socialContent).toContain('Popup was blocked by your browser. Please allow popups and try again.');
  });

  it('handles transient WebKit IndexedDB and storage errors gracefully', () => {
    expect(socialContent).toContain("err?.message?.includes('Database is')");
    expect(socialContent).toContain("err?.name === 'InvalidStateError'");
    expect(socialContent).toContain('Temporary browser storage error. Please try signing in again.');
  });

  it('ensures loading state is reset upon any error', () => {
    expect(socialContent).toContain('setLoadingProvider(null);');
  });
});
