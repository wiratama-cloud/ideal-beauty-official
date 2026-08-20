export type DeviceType = 'MOBILE' | 'TABLET' | 'DESKTOP' | 'OTHER';

export interface DeviceMetadata {
  deviceType: DeviceType;
  deviceName: string;
  browser: string;
  os: string;
  userAgent?: string;
}

/**
 * Parses user agent string and touch points to extract device classification,
 * operating system, browser name, and a human-friendly device label.
 */
export function parseDeviceMetadata(
  userAgent: string = '',
  maxTouchPoints: number = 0
): DeviceMetadata {
  const ua = userAgent.trim();

  // 1. Detect Operating System
  let os = 'Unknown';
  const isIosDevice = /iPhone|iPod/.test(ua);
  const isExplicitIpad = /iPad/.test(ua);
  const isIpadOsMac = /Macintosh/.test(ua) && !/iPhone|iPod/.test(ua) && maxTouchPoints > 1;

  if (isIosDevice || isExplicitIpad || isIpadOsMac) {
    os = 'iOS';
  } else if (/Android/.test(ua)) {
    os = 'Android';
  } else if (/Macintosh|Mac OS X/.test(ua)) {
    os = 'macOS';
  } else if (/Windows|WinNT|Win32|Win64/.test(ua)) {
    os = 'Windows';
  } else if (/CrOS/.test(ua)) {
    os = 'Chrome OS';
  } else if (/Linux/.test(ua)) {
    os = 'Linux';
  }

  // 2. Detect Browser Name
  let browser = 'Browser';
  if (/Edg(e|A|iOS)?\//i.test(ua)) {
    browser = 'Edge';
  } else if (/SamsungBrowser\//i.test(ua)) {
    browser = 'Samsung Internet';
  } else if (/OPR\/|Opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/CriOS\/|Chrome\//i.test(ua)) {
    browser = 'Chrome';
  } else if (/FxiOS\/|Firefox\//i.test(ua)) {
    browser = 'Firefox';
  } else if (/Safari\//i.test(ua) && !/Chrome\/|CriOS\/|Android/i.test(ua)) {
    browser = 'Safari';
  } else if (/MSIE|Trident/i.test(ua)) {
    browser = 'Internet Explorer';
  }

  // 3. Detect Device Type Classification
  let deviceType: DeviceType = 'OTHER';
  const isTabletUa =
    isExplicitIpad ||
    isIpadOsMac ||
    (/Android/i.test(ua) && !/Mobile/i.test(ua)) ||
    /Tablet|PlayBook|Silk|Kindle/i.test(ua);

  const isMobileUa =
    isIosDevice ||
    (/Android/i.test(ua) && /Mobile/i.test(ua)) ||
    /Mobile|iPhone|iPod|Windows Phone|BlackBerry|BB10/i.test(ua);

  if (isTabletUa) {
    deviceType = 'TABLET';
  } else if (isMobileUa) {
    deviceType = 'MOBILE';
  } else if (os === 'macOS' || os === 'Windows' || os === 'Linux' || os === 'Chrome OS') {
    deviceType = 'DESKTOP';
  } else if (ua.length > 0) {
    deviceType = 'OTHER';
  }

  // 4. Generate Human-Friendly Device Name
  let deviceName = `${os} (${browser})`;
  if (isExplicitIpad || isIpadOsMac) {
    deviceName = `iPad (${browser})`;
  } else if (/iPhone/i.test(ua)) {
    deviceName = `iPhone (${browser})`;
  } else if (/iPod/i.test(ua)) {
    deviceName = `iPod (${browser})`;
  } else if (os === 'Android') {
    deviceName = deviceType === 'TABLET' ? `Android Tablet (${browser})` : `Android Phone (${browser})`;
  } else if (os === 'macOS') {
    deviceName = `Mac (${browser})`;
  } else if (os === 'Windows') {
    deviceName = `Windows PC (${browser})`;
  } else if (os === 'Chrome OS') {
    deviceName = `Chromebook (${browser})`;
  } else if (os === 'Linux') {
    deviceName = `Linux PC (${browser})`;
  } else if (os === 'Unknown') {
    deviceName = `${deviceType !== 'OTHER' ? deviceType.charAt(0) + deviceType.slice(1).toLowerCase() : 'Unknown Device'} (${browser})`;
  }

  return {
    deviceType,
    deviceName,
    browser,
    os,
    userAgent: ua || undefined,
  };
}

/**
 * Retrieves client device metadata from the current browser environment or fallback.
 */
export function getDeviceMetadata(userAgentOverride?: string): DeviceMetadata {
  if (typeof userAgentOverride === 'string' && userAgentOverride.trim().length > 0) {
    return parseDeviceMetadata(userAgentOverride);
  }

  if (typeof window === 'undefined' && typeof navigator === 'undefined') {
    return {
      deviceType: 'OTHER',
      deviceName: 'Unknown Device',
      browser: 'Unknown',
      os: 'Unknown',
    };
  }

  const nav = typeof navigator !== 'undefined' ? navigator : window.navigator;
  const userAgent = nav?.userAgent || '';
  const maxTouchPoints = nav?.maxTouchPoints || 0;

  return parseDeviceMetadata(userAgent, maxTouchPoints);
}
