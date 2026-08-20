import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { cookieStoreMap } = vi.hoisted(() => {
  const cookieStoreMap = new Map<string, string>();
  return { cookieStoreMap };
});

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockImplementation(async () => ({
    get: (name: string) => {
      const val = cookieStoreMap.get(name);
      return val ? { name, value: val } : undefined;
    },
    set: (name: string, value: string) => {
      cookieStoreMap.set(name, value);
    },
    delete: (name: string) => {
      cookieStoreMap.delete(name);
    },
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { parseDeviceMetadata, getDeviceMetadata } from '../src/lib/utils/device';
import {
  registerUserDevice,
  getUserDevices,
  revokeUserDevice,
  revokeAllOtherUserDevices,
  touchDeviceHeartbeat,
} from '../src/lib/services/device';
import {
  registerDeviceTokenAction as accountRegisterAction,
  getUserDevicesAction as accountGetDevicesAction,
  revokeDeviceAction as accountRevokeAction,
  revokeAllOtherDevicesAction as accountRevokeAllOtherAction,
  touchDeviceHeartbeatAction as accountTouchAction,
} from '../src/app/actions/account';
import {
  registerDeviceTokenAction as authRegisterAction,
  getUserDevicesAction as authGetDevicesAction,
  revokeDeviceAction as authRevokeAction,
  revokeAllOtherDevicesAction as authRevokeAllOtherAction,
  touchDeviceHeartbeatAction as authTouchAction,
} from '../src/app/actions/auth';
import { prisma } from '../src/lib/prisma';
import { DeviceType } from '@prisma/client';
import { setLoggedInUserId, clearLoggedInUserId } from '../src/lib/session';

describe('Device Detection Utility (src/lib/utils/device.ts)', () => {
  it('should parse iPhone Safari UA correctly', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
    const metadata = parseDeviceMetadata(ua, 5);

    expect(metadata.deviceType).toBe('MOBILE');
    expect(metadata.os).toBe('iOS');
    expect(metadata.browser).toBe('Safari');
    expect(metadata.deviceName).toBe('iPhone (Safari)');
  });

  it('should parse iPhone Chrome (CriOS) UA correctly', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/114.0.5735.99 Mobile/15E148 Safari/604.1';
    const metadata = parseDeviceMetadata(ua, 5);

    expect(metadata.deviceType).toBe('MOBILE');
    expect(metadata.os).toBe('iOS');
    expect(metadata.browser).toBe('Chrome');
    expect(metadata.deviceName).toBe('iPhone (Chrome)');
  });

  it('should parse iPad Safari UA correctly', () => {
    const ua =
      'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';
    const metadata = parseDeviceMetadata(ua, 5);

    expect(metadata.deviceType).toBe('TABLET');
    expect(metadata.os).toBe('iOS');
    expect(metadata.browser).toBe('Safari');
    expect(metadata.deviceName).toBe('iPad (Safari)');
  });

  it('should parse iPadOS with MacIntel UA and touch points correctly', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15';
    // Max touch points > 1 indicates iPad on iPadOS
    const metadata = parseDeviceMetadata(ua, 5);

    expect(metadata.deviceType).toBe('TABLET');
    expect(metadata.os).toBe('iOS');
    expect(metadata.browser).toBe('Safari');
    expect(metadata.deviceName).toBe('iPad (Safari)');
  });

  it('should parse Android Mobile Phone (Chrome) correctly', () => {
    const ua =
      'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.119 Mobile Safari/537.36';
    const metadata = parseDeviceMetadata(ua, 5);

    expect(metadata.deviceType).toBe('MOBILE');
    expect(metadata.os).toBe('Android');
    expect(metadata.browser).toBe('Chrome');
    expect(metadata.deviceName).toBe('Android Phone (Chrome)');
  });

  it('should parse Android Tablet (Samsung Internet) correctly', () => {
    const ua =
      'Mozilla/5.0 (Linux; Android 13; SM-X906N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Safari/537.36';
    // Non-mobile Android is a Tablet
    const metadata = parseDeviceMetadata(ua, 5);

    expect(metadata.deviceType).toBe('TABLET');
    expect(metadata.os).toBe('Android');
    expect(metadata.browser).toBe('Samsung Internet');
    expect(metadata.deviceName).toBe('Android Tablet (Samsung Internet)');
  });

  it('should parse macOS Chrome Desktop correctly', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    const metadata = parseDeviceMetadata(ua, 0);

    expect(metadata.deviceType).toBe('DESKTOP');
    expect(metadata.os).toBe('macOS');
    expect(metadata.browser).toBe('Chrome');
    expect(metadata.deviceName).toBe('Mac (Chrome)');
  });

  it('should parse Windows Edge Desktop correctly', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.2365.92';
    const metadata = parseDeviceMetadata(ua, 0);

    expect(metadata.deviceType).toBe('DESKTOP');
    expect(metadata.os).toBe('Windows');
    expect(metadata.browser).toBe('Edge');
    expect(metadata.deviceName).toBe('Windows PC (Edge)');
  });

  it('should parse Linux Firefox Desktop correctly', () => {
    const ua = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0';
    const metadata = parseDeviceMetadata(ua, 0);

    expect(metadata.deviceType).toBe('DESKTOP');
    expect(metadata.os).toBe('Linux');
    expect(metadata.browser).toBe('Firefox');
    expect(metadata.deviceName).toBe('Linux PC (Firefox)');
  });

  it('should parse Chrome OS Chromebook correctly', () => {
    const ua =
      'Mozilla/5.0 (X11; CrOS x86_64 15329.44.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.5563.71 Safari/537.36';
    const metadata = parseDeviceMetadata(ua, 0);

    expect(metadata.deviceType).toBe('DESKTOP');
    expect(metadata.os).toBe('Chrome OS');
    expect(metadata.browser).toBe('Chrome');
    expect(metadata.deviceName).toBe('Chromebook (Chrome)');
  });

  it('should return fallback for unknown or empty user agent', () => {
    const metadata = parseDeviceMetadata('', 0);

    expect(metadata.deviceType).toBe('OTHER');
    expect(metadata.os).toBe('Unknown');
    expect(metadata.browser).toBe('Browser');
    expect(metadata.deviceName).toBe('Unknown Device (Browser)');
  });

  it('should getDeviceMetadata with override or environment defaults', () => {
    const metadata = getDeviceMetadata('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    expect(metadata.os).toBe('Windows');
    expect(metadata.deviceType).toBe('DESKTOP');
  });
});

describe('Multi-Device Management Service & Actions', () => {
  let user1: any;
  let user2: any;

  beforeEach(async () => {
    cookieStoreMap.clear();
    const timestamp = Date.now() + Math.random().toString(36).substring(2, 7);
    user1 = await prisma.user.create({
      data: {
        email: `user1-${timestamp}@example.com`,
        name: 'Alice Dev',
      },
    });

    user2 = await prisma.user.create({
      data: {
        email: `user2-${timestamp}@example.com`,
        name: 'Bob Dev',
      },
    });
  });

  afterEach(async () => {
    cookieStoreMap.clear();
    if (user1?.id || user2?.id) {
      await prisma.user.deleteMany({
        where: {
          id: { in: [user1.id, user2.id].filter(Boolean) },
        },
      });
    }
  });

  it('should register a device and update user.fcmToken for backward compatibility', async () => {
    const token = `fcm-token-alice-iphone-${Date.now()}`;
    const device = await registerUserDevice({
      userId: user1.id,
      token,
      deviceType: DeviceType.MOBILE,
      deviceName: 'iPhone (Safari)',
      browser: 'Safari',
      os: 'iOS',
    });

    expect(device.id).toBeDefined();
    expect(device.userId).toBe(user1.id);
    expect(device.token).toBe(token);
    expect(device.deviceType).toBe(DeviceType.MOBILE);
    expect(device.deviceName).toBe('iPhone (Safari)');
    expect(device.isActive).toBe(true);

    const updatedUser = await prisma.user.findUnique({
      where: { id: user1.id },
    });
    expect(updatedUser?.fcmToken).toBe(token);
  });

  it('should gracefully handle token ownership transfers between users', async () => {
    const sharedToken = `shared-device-token-${Date.now()}`;

    // 1. User 1 registers the token first
    const deviceUser1 = await registerUserDevice({
      userId: user1.id,
      token: sharedToken,
      deviceType: DeviceType.DESKTOP,
      deviceName: 'Mac (Chrome)',
      browser: 'Chrome',
      os: 'macOS',
    });

    expect(deviceUser1.userId).toBe(user1.id);

    // 2. User 2 logs into the same browser and registers the same token
    const deviceUser2 = await registerUserDevice({
      userId: user2.id,
      token: sharedToken,
      deviceType: DeviceType.DESKTOP,
      deviceName: 'Mac (Chrome)',
      browser: 'Chrome',
      os: 'macOS',
    });

    expect(deviceUser2.id).toBe(deviceUser1.id);
    expect(deviceUser2.userId).toBe(user2.id);
    expect(deviceUser2.isActive).toBe(true);

    // Ensure total device count for this token is still 1
    const count = await prisma.userDevice.count({
      where: { token: sharedToken },
    });
    expect(count).toBe(1);

    // Verify User 2's devices list includes the device and User 1 does not
    const user1Devices = await getUserDevices(user1.id);
    const user2Devices = await getUserDevices(user2.id);

    expect(user1Devices.find((d) => d.token === sharedToken)).toBeUndefined();
    expect(user2Devices.find((d) => d.token === sharedToken)).toBeDefined();
  });

  it('should list user devices sorted by lastActiveAt descending', async () => {
    const token1 = `token-device-1-${Date.now()}`;
    const token2 = `token-device-2-${Date.now()}`;

    await registerUserDevice({
      userId: user1.id,
      token: token1,
      deviceType: DeviceType.MOBILE,
      deviceName: 'Device 1',
    });

    // Short delay to ensure distinct timestamp
    await new Promise((r) => setTimeout(r, 20));

    await registerUserDevice({
      userId: user1.id,
      token: token2,
      deviceType: DeviceType.DESKTOP,
      deviceName: 'Device 2',
    });

    const devices = await getUserDevices(user1.id);
    expect(devices.length).toBe(2);
    expect(devices[0].token).toBe(token2);
    expect(devices[1].token).toBe(token1);
  });

  it('should revoke a single device and reassign primary fcmToken to next active device', async () => {
    const token1 = `token-primary-${Date.now()}`;
    const token2 = `token-secondary-${Date.now()}`;

    const dev1 = await registerUserDevice({
      userId: user1.id,
      token: token1,
      deviceType: DeviceType.MOBILE,
      deviceName: 'Primary iPhone',
    });

    await registerUserDevice({
      userId: user1.id,
      token: token2,
      deviceType: DeviceType.DESKTOP,
      deviceName: 'Secondary Mac',
    });

    // Make token1 the primary fcmToken
    await prisma.user.update({
      where: { id: user1.id },
      data: { fcmToken: token1 },
    });

    // Revoke device 1
    const revokeResult = await revokeUserDevice(user1.id, dev1.id);
    expect(revokeResult.success).toBe(true);

    const remainingDevices = await getUserDevices(user1.id);
    expect(remainingDevices.length).toBe(1);
    expect(remainingDevices[0].token).toBe(token2);

    const user = await prisma.user.findUnique({
      where: { id: user1.id },
    });
    // fcmToken should have fallen back to dev2
    expect(user?.fcmToken).toBe(token2);
  });

  it('should prevent revoking a device belonging to another user', async () => {
    const token = `token-foreign-${Date.now()}`;
    const foreignDevice = await registerUserDevice({
      userId: user2.id,
      token,
      deviceType: DeviceType.MOBILE,
    });

    await expect(revokeUserDevice(user1.id, foreignDevice.id)).rejects.toThrow(
      /Device not found or not authorized/
    );
  });

  it('should revoke all other devices except current active token', async () => {
    const tokenKeep = `token-keep-${Date.now()}`;
    const tokenDrop1 = `token-drop-1-${Date.now()}`;
    const tokenDrop2 = `token-drop-2-${Date.now()}`;

    await registerUserDevice({ userId: user1.id, token: tokenDrop1 });
    await registerUserDevice({ userId: user1.id, token: tokenKeep });
    await registerUserDevice({ userId: user1.id, token: tokenDrop2 });

    const result = await revokeAllOtherUserDevices(user1.id, tokenKeep);
    expect(result.success).toBe(true);
    expect(result.revokedCount).toBe(2);

    const remaining = await getUserDevices(user1.id);
    expect(remaining.length).toBe(1);
    expect(remaining[0].token).toBe(tokenKeep);

    const user = await prisma.user.findUnique({ where: { id: user1.id } });
    expect(user?.fcmToken).toBe(tokenKeep);
  });

  it('should update device heartbeat timestamp via touchDeviceHeartbeat', async () => {
    const token = `token-heartbeat-${Date.now()}`;
    const device = await registerUserDevice({
      userId: user1.id,
      token,
      deviceType: DeviceType.MOBILE,
    });

    const initialActiveAt = device.lastActiveAt;

    await new Promise((r) => setTimeout(r, 20));

    const touchedDevice = await touchDeviceHeartbeat(token, user1.id);
    expect(touchedDevice).not.toBeNull();
    expect(touchedDevice?.lastActiveAt.getTime()).toBeGreaterThan(initialActiveAt.getTime());
    expect(touchedDevice?.isActive).toBe(true);
  });

  it('should execute account server actions correctly with session', async () => {
    await setLoggedInUserId(user1.id);

    const token = `token-action-account-${Date.now()}`;

    // 1. Register Action
    const regResult = await accountRegisterAction({
      token,
      deviceType: DeviceType.MOBILE,
      deviceName: 'iPhone 15 Pro',
      browser: 'Safari',
      os: 'iOS',
    });
    expect(regResult.success).toBe(true);
    expect(regResult.data?.token).toBe(token);

    // 2. Get Devices Action
    const listResult = await accountGetDevicesAction();
    expect(listResult.success).toBe(true);
    expect(listResult.data?.length).toBeGreaterThanOrEqual(1);
    expect(listResult.data?.find((d: any) => d.token === token)).toBeDefined();

    // 3. Touch Heartbeat Action
    const touchResult = await accountTouchAction(token);
    expect(touchResult.success).toBe(true);

    // 4. Revoke Action
    const deviceId = regResult.data?.id!;
    const revokeResult = await accountRevokeAction(deviceId);
    expect(revokeResult.success).toBe(true);

    const listAfterRevoke = await accountGetDevicesAction();
    expect(listAfterRevoke.data?.find((d: any) => d.id === deviceId)).toBeUndefined();
  });

  it('should execute auth server actions correctly with session', async () => {
    await setLoggedInUserId(user2.id);

    const token1 = `token-action-auth-1-${Date.now()}`;
    const token2 = `token-action-auth-2-${Date.now()}`;

    // 1. Register Action
    const dev1 = await authRegisterAction({
      token: token1,
      deviceType: DeviceType.DESKTOP,
      deviceName: 'MacBook Air',
    });
    expect(dev1.token).toBe(token1);

    const dev2 = await authRegisterAction({
      token: token2,
      deviceType: DeviceType.MOBILE,
      deviceName: 'Pixel 8',
    });
    expect(dev2.token).toBe(token2);

    // 2. Get Devices Action
    const devices = await authGetDevicesAction();
    expect(devices.length).toBe(2);

    // 3. Revoke All Other Devices Action keeping token2
    const revokeAllOthers = await authRevokeAllOtherAction(token2);
    expect(revokeAllOthers.success).toBe(true);

    const remainingDevices = await authGetDevicesAction();
    expect(remainingDevices.length).toBe(1);
    expect(remainingDevices[0].token).toBe(token2);

    // 4. Revoke Device Action
    await authRevokeAction(dev2.id);
    const finalDevices = await authGetDevicesAction();
    expect(finalDevices.length).toBe(0);
  });
});
