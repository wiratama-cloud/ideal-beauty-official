import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { FCM_PROMPT_DISMISSED_KEY } from '../src/components/common/FcmNotificationPrompt';

describe('FCM Notification Prompt Component & Dismiss Logic', () => {
  const componentPath = path.resolve(__dirname, '../src/components/common/FcmNotificationPrompt.tsx');
  const componentContent = fs.readFileSync(componentPath, 'utf-8');

  it('exports FCM_PROMPT_DISMISSED_KEY with expected storage key name', () => {
    expect(FCM_PROMPT_DISMISSED_KEY).toBe('fcm_prompt_dismissed');
  });

  it('handles localStorage for prompt dismissal on mount and when dismissed', () => {
    // Reads localStorage on mount
    expect(componentContent).toContain('localStorage.getItem(FCM_PROMPT_DISMISSED_KEY)');
    expect(componentContent).toContain('setDismissed(true)');

    // Sets localStorage item on dismiss
    expect(componentContent).toContain('localStorage.setItem(FCM_PROMPT_DISMISSED_KEY, \'true\')');

    // Wrapped in try/catch to handle privacy mode / disabled localStorage
    expect(componentContent).toContain('try {');
    expect(componentContent).toContain('catch {');
  });

  it('contains dismiss action triggers: X close button and secondary Later button', () => {
    // Close "X" button with accessible aria-label
    expect(componentContent).toContain('aria-label="Dismiss notification prompt"');
    expect(componentContent).toContain('<X className="w-4 h-4"');
    expect(componentContent).toContain('onClick={handleDismiss}');

    // Secondary "Later" action button
    expect(componentContent).toMatch(/<button[^>]*onClick=\{handleDismiss\}[^>]*>[\s\S]*?Later[\s\S]*?<\/button>/);
  });

  it('includes primary Enable button with requesting loader indicator', () => {
    expect(componentContent).toContain('requestPermission');
    expect(componentContent).toMatch(/<button[^>]*onClick=\{requestPermission\}[^>]*>[\s\S]*?Enable[\s\S]*?<\/button>/);
    expect(componentContent).toContain('isRequesting && <Loader2');
    expect(componentContent).toContain('disabled={isRequesting}');
  });

  it('applies mobile-first responsive layout and positioning class names', () => {
    // Fixed positioning with responsive bottom and side margins
    expect(componentContent).toContain('fixed');
    expect(componentContent).toContain('bottom-4');
    expect(componentContent).toContain('left-4');
    expect(componentContent).toContain('right-4');
    expect(componentContent).toContain('sm:left-auto');
    expect(componentContent).toContain('sm:right-6');
    expect(componentContent).toContain('sm:bottom-6');
    expect(componentContent).toContain('sm:max-w-sm');
    expect(componentContent).toContain('sm:w-full');
    expect(componentContent).toContain('z-50');

    // Aesthetic luxury card classes
    expect(componentContent).toContain('bg-white/95');
    expect(componentContent).toContain('backdrop-blur-md');
    expect(componentContent).toContain('border border-neutral-200/80');
    expect(componentContent).toContain('shadow-xl');
    expect(componentContent).toContain('rounded-2xl');
  });

  it('ensures touch-friendly accessible button dimensions (min 44px height)', () => {
    // Action buttons must have min-h-[44px]
    expect(componentContent).toContain('min-h-[44px]');
  });

  it('features Bell icon badge and concise copy', () => {
    expect(componentContent).toContain('<Bell className="w-5 h-5 text-neutral-800" />');
    expect(componentContent).toContain('Stay Updated');
    expect(componentContent).toContain('Enable notifications to stay updated on your order status.');
  });

  it('conditionally hides prompt when user is not logged in, dismissed, enabled, or permission is not default', () => {
    expect(componentContent).toContain('isLoggedIn?: boolean');
    expect(componentContent).toContain('if (!isLoggedIn) return;');
    expect(componentContent).toContain('if (!isLoggedIn || !isFirebaseConfigured || permission !== \'default\' || enabled || dismissed) return null;');
  });

  it('includes iOS PWA installation guide modal for iPhone Safari and Chrome users', () => {
    expect(componentContent).toContain('Add to Home Screen');
    expect(componentContent).toContain('Safari on iPhone');
    expect(componentContent).toContain('Chrome on iPhone');
    expect(componentContent).toContain('isIos');
    expect(componentContent).toContain('isStandalone');
  });

  it('is rendered in storefront layout only for logged in users', () => {
    const layoutPath = path.resolve(__dirname, '../src/app/(storefront)/layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

    expect(layoutContent).toContain('FcmNotificationPrompt');
    expect(layoutContent).toContain('<FcmNotificationPrompt isLoggedIn={!!userId} />');
  });
});

describe('Account Page Notification Settings & NotificationsTab', () => {
  const notificationsTabPath = path.resolve(
    __dirname,
    '../src/components/account/NotificationsTab.tsx'
  );
  const notificationsTabContent = fs.readFileSync(notificationsTabPath, 'utf-8');

  const accountViewPath = path.resolve(
    __dirname,
    '../src/components/account/AccountView.tsx'
  );
  const accountViewContent = fs.readFileSync(accountViewPath, 'utf-8');

  it('includes NotificationsTab in AccountView horizontal sub-tabs and active panels', () => {
    expect(accountViewContent).toContain("import NotificationsTab from './NotificationsTab'");
    expect(accountViewContent).toContain("setActiveTab('notifications')");
    expect(accountViewContent).toContain('<span>Notifications</span>');
    expect(accountViewContent).toContain("<NotificationsTab");
    expect(accountViewContent).toContain("fcmToken: account.fcmToken");
  });

  it('supports turning off notifications via deleteFcmTokenAction and persists dismissal', () => {
    expect(notificationsTabContent).toContain('deleteFcmTokenAction()');
    expect(notificationsTabContent).toContain('setIsEnabled(false)');
    expect(notificationsTabContent).toContain("localStorage.setItem(FCM_PROMPT_DISMISSED_KEY, 'true')");
    expect(notificationsTabContent).toContain('Push notifications have been disabled for your account.');
  });

  it('supports turning on notifications via requestPermission and saveFcmTokenAction', () => {
    expect(notificationsTabContent).toContain('Notification.requestPermission()');
    expect(notificationsTabContent).toContain('saveFcmTokenAction(token');
    expect(notificationsTabContent).toContain('setIsEnabled(true)');
    expect(notificationsTabContent).toContain('localStorage.removeItem(FCM_PROMPT_DISMISSED_KEY)');
  });

  it('includes accessible switch and explicit toggle buttons with loading indicators', () => {
    expect(notificationsTabContent).toContain('role="switch"');
    expect(notificationsTabContent).toContain('aria-checked={isEnabled}');
    expect(notificationsTabContent).toContain('Turn Off Notifications');
    expect(notificationsTabContent).toContain('Turn On Notifications');
    expect(notificationsTabContent).toContain('Loader2');
  });

  it('handles browser permission denied warning and unsupported environment alerts', () => {
    expect(notificationsTabContent).toContain('Browser Notifications Blocked');
    expect(notificationsTabContent).toContain("permission === 'denied'");
    expect(notificationsTabContent).toContain('isFirebaseConfigured');
  });
});
