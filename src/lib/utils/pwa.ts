export interface PwaSupportState {
  isIos: boolean;
  isStandalone: boolean;
  isSupported: boolean;
  browserType: 'safari' | 'chrome' | 'other';
}

/**
 * Detects if the current client is running on an iOS device (iPhone, iPad, iPod, or iPadOS on Mac platform).
 */
export function isIos(): boolean {
  if (typeof window === 'undefined' && typeof navigator === 'undefined') return false;
  const nav = typeof navigator !== 'undefined' ? navigator : typeof window !== 'undefined' ? window.navigator : undefined;
  if (!nav) return false;

  const userAgent = nav.userAgent || nav.vendor || '';
  const isIosDevice = /iPad|iPhone|iPod/.test(userAgent);
  const isMacWithTouch = nav.platform === 'MacIntel' && (nav.maxTouchPoints || 0) > 1;
  return isIosDevice || isMacWithTouch;
}

/**
 * Detects if the web app is running in Standalone PWA mode (e.g. launched from iOS Home Screen).
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined' && typeof navigator === 'undefined') return false;

  const isDisplayStandalone =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? Boolean(window.matchMedia('(display-mode: standalone)')?.matches)
      : false;

  const nav = typeof navigator !== 'undefined' ? navigator : typeof window !== 'undefined' ? window.navigator : undefined;
  const isNavigatorStandalone = Boolean((nav as unknown as { standalone?: boolean })?.standalone);

  return isDisplayStandalone || isNavigatorStandalone;
}

/**
 * Detects if Web Push Notification APIs (Notification, ServiceWorker, PushManager) are supported by the browser.
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = typeof navigator !== 'undefined' ? navigator : window.navigator;
  return (
    'Notification' in window &&
    Boolean(nav && 'serviceWorker' in nav) &&
    'PushManager' in window
  );
}

/**
 * Identifies the iOS browser variant (Safari vs Chrome for iOS CriOS).
 */
export function getIosBrowserType(): 'safari' | 'chrome' | 'other' {
  if (typeof window === 'undefined' && typeof navigator === 'undefined') return 'other';
  const nav = typeof navigator !== 'undefined' ? navigator : typeof window !== 'undefined' ? window.navigator : undefined;
  if (!nav) return 'other';

  const ua = nav.userAgent || '';
  if (/CriOS/i.test(ua)) {
    return 'chrome';
  }
  if (/Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua)) {
    return 'safari';
  }
  return 'other';
}

/**
 * Gets a snapshot of the current PWA and notification capabilities.
 */
export function getPwaSupportState(): PwaSupportState {
  return {
    isIos: isIos(),
    isStandalone: isStandalone(),
    isSupported: isNotificationSupported(),
    browserType: getIosBrowserType(),
  };
}
