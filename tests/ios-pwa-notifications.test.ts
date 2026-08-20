import { describe, it, expect, afterEach, vi } from 'vitest';
import manifest from '../src/app/manifest';
import {
  isIos,
  isStandalone,
  isNotificationSupported,
  getIosBrowserType,
  getPwaSupportState,
} from '../src/lib/utils/pwa';
import fs from 'fs';
import path from 'path';

describe('PWA Manifest & Apple Metadata Configuration', () => {
  it('returns valid Next.js App Router Web App Manifest with standalone display configuration', () => {
    const config = manifest();
    expect(config.name).toBe('Ideal Beauty Official');
    expect(config.short_name).toBe('Ideal Beauty');
    expect(config.display).toBe('standalone');
    expect(config.start_url).toBe('/');
    expect(config.background_color).toBe('#ffffff');
    expect(config.theme_color).toBe('#000000');
    expect(config.icons).toBeDefined();
    expect(config.icons?.length).toBeGreaterThan(0);
  });

  it('declares appleWebApp metadata in src/app/layout.tsx and provides App Router icon assets', () => {
    const layoutPath = path.resolve(__dirname, '../src/app/layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

    expect(layoutContent).toContain('appleWebApp');
    expect(layoutContent).toContain('capable: true');
    expect(layoutContent).toContain("statusBarStyle: 'default'");
    expect(layoutContent).toContain("title: 'Ideal Beauty'");

    // App router static metadata icon assets
    expect(
      fs.existsSync(path.resolve(__dirname, '../src/app/icon.svg')) ||
      fs.existsSync(path.resolve(__dirname, '../src/app/icon.png'))
    ).toBe(true);
    expect(fs.existsSync(path.resolve(__dirname, '../src/app/apple-icon.png'))).toBe(true);
    expect(fs.existsSync(path.resolve(__dirname, '../src/app/favicon.ico'))).toBe(true);
  });
});

describe('PWA & iOS Device Utilities (src/lib/utils/pwa.ts)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const setupMocks = (navigatorOverrides: Record<string, unknown>, windowOverrides?: Record<string, unknown>) => {
    const mockNav = {
      userAgent: '',
      vendor: '',
      platform: '',
      maxTouchPoints: 0,
      serviceWorker: {},
      ...navigatorOverrides,
    };

    const mockWin = {
      navigator: mockNav,
      matchMedia: () => ({ matches: false }),
      ...windowOverrides,
    };

    vi.stubGlobal('navigator', mockNav);
    vi.stubGlobal('window', mockWin);
  };

  describe('isIos()', () => {
    it('detects iPhone User Agent correctly', () => {
      setupMocks({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
        vendor: 'Apple Computer, Inc.',
        platform: 'iPhone',
        maxTouchPoints: 5,
      });
      expect(isIos()).toBe(true);
    });

    it('detects iPad User Agent correctly', () => {
      setupMocks({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
        vendor: 'Apple Computer, Inc.',
        platform: 'iPad',
        maxTouchPoints: 5,
      });
      expect(isIos()).toBe(true);
    });

    it('detects iPadOS reporting as MacIntel with touch points', () => {
      setupMocks({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
        vendor: 'Apple Computer, Inc.',
        platform: 'MacIntel',
        maxTouchPoints: 5,
      });
      expect(isIos()).toBe(true);
    });

    it('returns false for standard Mac desktop (no touch points)', () => {
      setupMocks({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        vendor: 'Google Inc.',
        platform: 'MacIntel',
        maxTouchPoints: 0,
      });
      expect(isIos()).toBe(false);
    });

    it('returns false for Android devices', () => {
      setupMocks({
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36',
        vendor: 'Google Inc.',
        platform: 'Linux armv8l',
        maxTouchPoints: 5,
      });
      expect(isIos()).toBe(false);
    });

    it('returns false for Windows desktop', () => {
      setupMocks({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        vendor: 'Google Inc.',
        platform: 'Win32',
        maxTouchPoints: 0,
      });
      expect(isIos()).toBe(false);
    });
  });

  describe('isStandalone()', () => {
    it('returns true when display-mode: standalone media query matches', () => {
      setupMocks(
        {},
        {
          matchMedia: (query: string) => ({
            matches: query === '(display-mode: standalone)',
          }),
        }
      );
      expect(isStandalone()).toBe(true);
    });

    it('returns true when navigator.standalone is true (iOS legacy PWA)', () => {
      setupMocks({
        standalone: true,
      });
      expect(isStandalone()).toBe(true);
    });

    it('returns false when not in standalone mode', () => {
      setupMocks({
        standalone: false,
      });
      expect(isStandalone()).toBe(false);
    });
  });

  describe('getIosBrowserType()', () => {
    it('detects Chrome on iOS (CriOS)', () => {
      setupMocks({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/122.0.6261.62 Mobile/15E148 Safari/604.1',
      });
      expect(getIosBrowserType()).toBe('chrome');
    });

    it('detects Mobile Safari on iOS', () => {
      setupMocks({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
      });
      expect(getIosBrowserType()).toBe('safari');
    });

    it('returns other for non-Safari/Chrome agents', () => {
      setupMocks({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/123.0 Mobile/15E148 Safari/605.1.15',
      });
      expect(getIosBrowserType()).toBe('other');
    });
  });

  describe('isNotificationSupported()', () => {
    it('returns true when Notification, serviceWorker, and PushManager exist', () => {
      setupMocks(
        { serviceWorker: {} },
        {
          Notification: {},
          PushManager: {},
        }
      );
      expect(isNotificationSupported()).toBe(true);
    });

    it('returns false when Notification is undefined (iOS browser tab)', () => {
      setupMocks(
        { serviceWorker: {} },
        {
          PushManager: {},
        }
      );
      expect(isNotificationSupported()).toBe(false);
    });
  });

  describe('getPwaSupportState()', () => {
    it('returns structured state snapshot', () => {
      setupMocks(
        {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
          platform: 'iPhone',
          maxTouchPoints: 5,
          serviceWorker: {},
        },
        {
          matchMedia: () => ({ matches: false }),
          Notification: {},
          PushManager: {},
        }
      );

      const state = getPwaSupportState();
      expect(state.isIos).toBe(true);
      expect(state.isStandalone).toBe(false);
      expect(state.isSupported).toBe(true);
      expect(state.browserType).toBe('safari');
    });
  });
});

describe('NotificationsTab iOS Guidance Component Content', () => {
  const componentPath = path.resolve(__dirname, '../src/components/account/NotificationsTab.tsx');
  const componentContent = fs.readFileSync(componentPath, 'utf-8');

  it('imports and integrates iOS PWA detection helpers', () => {
    expect(componentContent).toContain("import { isIos, isStandalone, isNotificationSupported, getIosBrowserType } from '@/lib/utils/pwa'");
  });

  it('renders step-by-step Home Screen guide tabs for Safari and Chrome on iPhone', () => {
    expect(componentContent).toContain('Enable Push Notifications on iPhone');
    expect(componentContent).toContain('Safari on iPhone');
    expect(componentContent).toContain('Chrome on iPhone');
    expect(componentContent).toContain('Tap the Share Button');
    expect(componentContent).toContain('Add to Home Screen');
    expect(componentContent).toContain('Launch &amp; Enable');
  });
});
