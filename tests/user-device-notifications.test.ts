import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  registerUserDevice,
  getUserDevices,
  revokeUserDevice,
  revokeAllOtherUserDevices,
  touchDeviceHeartbeat,
} from '../src/lib/services/device';
import {
  sendPushToUser,
  sendMulticastWithCleanup,
  pruneDeadTokens,
  isInvalidTokenError,
} from '../src/lib/services/notification';
import { DeviceType } from '@prisma/client';
import * as firebaseAdminModule from '../src/lib/firebase/admin';

describe('User Device Multi-Device & Push Lifecycle', () => {
  let createdUserIds: string[] = [];

  beforeEach(async () => {
    // Create test user
    const user1 = await prisma.user.create({
      data: {
        email: `dev-user-1-${Date.now()}@example.com`,
        name: 'Device Test User 1',
        phone: `+6283333333${Date.now().toString().slice(-4)}`,
      },
    });

    const user2 = await prisma.user.create({
      data: {
        email: `dev-user-2-${Date.now()}@example.com`,
        name: 'Device Test User 2',
        phone: `+6284444444${Date.now().toString().slice(-4)}`,
      },
    });

    createdUserIds = [user1.id, user2.id];
  });

  afterEach(async () => {
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
      createdUserIds = [];
    }
  });

  describe('Device Registration and Ownership', () => {
    it('should register a new device token with device metadata', async () => {
      const token = `device-token-${Date.now()}`;
      const device = await registerUserDevice({
        userId: createdUserIds[0],
        token,
        deviceType: DeviceType.MOBILE,
        deviceName: 'iPhone 15 Pro (Safari)',
        browser: 'Safari',
        os: 'iOS',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      });

      expect(device).toBeDefined();
      expect(device.userId).toBe(createdUserIds[0]);
      expect(device.token).toBe(token);
      expect(device.deviceType).toBe(DeviceType.MOBILE);
      expect(device.browser).toBe('Safari');
      expect(device.os).toBe('iOS');
      expect(device.isActive).toBe(true);

      // Verify User.fcmToken was also updated for compatibility
      const updatedUser = await prisma.user.findUnique({
        where: { id: createdUserIds[0] },
      });
      expect(updatedUser?.fcmToken).toBe(token);
    });

    it('should update metadata and touch heartbeat when registering an existing token', async () => {
      const token = `device-token-${Date.now()}`;
      await registerUserDevice({
        userId: createdUserIds[0],
        token,
        deviceType: DeviceType.DESKTOP,
        deviceName: 'Chrome on macOS',
        browser: 'Chrome',
        os: 'macOS',
      });

      const updatedDevice = await registerUserDevice({
        userId: createdUserIds[0],
        token,
        deviceType: DeviceType.DESKTOP,
        deviceName: 'Chrome 125 on macOS',
        browser: 'Chrome',
        os: 'macOS',
      });

      expect(updatedDevice.deviceName).toBe('Chrome 125 on macOS');
      const allDevices = await getUserDevices(createdUserIds[0]);
      expect(allDevices.length).toBe(1);
    });

    it('should transfer token ownership when registered by a different user', async () => {
      const sharedToken = `shared-device-${Date.now()}`;

      // User 1 registers token
      await registerUserDevice({
        userId: createdUserIds[0],
        token: sharedToken,
        deviceType: DeviceType.MOBILE,
        deviceName: 'Shared Tablet',
      });

      // User 2 logs in on the same device and registers
      const transferredDevice = await registerUserDevice({
        userId: createdUserIds[1],
        token: sharedToken,
        deviceType: DeviceType.TABLET,
        deviceName: 'Shared Tablet (User 2)',
      });

      expect(transferredDevice.userId).toBe(createdUserIds[1]);

      const user1Devices = await getUserDevices(createdUserIds[0]);
      const user2Devices = await getUserDevices(createdUserIds[1]);

      expect(user1Devices.length).toBe(0);
      expect(user2Devices.length).toBe(1);
      expect(user2Devices[0].token).toBe(sharedToken);
    });
  });

  describe('Device Listing and Heartbeat', () => {
    it('should list devices ordered by lastActiveAt descending', async () => {
      const token1 = `tok-1-${Date.now()}`;
      const token2 = `tok-2-${Date.now()}`;

      await registerUserDevice({
        userId: createdUserIds[0],
        token: token1,
        deviceType: DeviceType.MOBILE,
        deviceName: 'First Device',
      });

      // Artificial small pause to ensure distinct timestamp
      await new Promise((r) => setTimeout(r, 10));

      await registerUserDevice({
        userId: createdUserIds[0],
        token: token2,
        deviceType: DeviceType.DESKTOP,
        deviceName: 'Second Device',
      });

      const devices = await getUserDevices(createdUserIds[0]);
      expect(devices.length).toBe(2);
      expect(devices[0].token).toBe(token2);
      expect(devices[1].token).toBe(token1);
    });

    it('should update lastActiveAt timestamp on touchDeviceHeartbeat', async () => {
      const token = `heartbeat-token-${Date.now()}`;
      const device = await registerUserDevice({
        userId: createdUserIds[0],
        token,
        deviceType: DeviceType.MOBILE,
      });

      const initialActiveAt = device.lastActiveAt;
      await new Promise((r) => setTimeout(r, 20));

      const touched = await touchDeviceHeartbeat(token, createdUserIds[0]);
      expect(touched).toBeDefined();
      expect(new Date(touched!.lastActiveAt).getTime()).toBeGreaterThanOrEqual(
        new Date(initialActiveAt).getTime()
      );
    });
  });

  describe('Device Revocation', () => {
    it('should revoke a single device by ID', async () => {
      const token1 = `tok-revoke-1-${Date.now()}`;
      const token2 = `tok-revoke-2-${Date.now()}`;

      const dev1 = await registerUserDevice({
        userId: createdUserIds[0],
        token: token1,
      });
      await registerUserDevice({
        userId: createdUserIds[0],
        token: token2,
      });

      await revokeUserDevice(createdUserIds[0], dev1.id);

      const remaining = await getUserDevices(createdUserIds[0]);
      expect(remaining.length).toBe(1);
      expect(remaining[0].token).toBe(token2);
    });

    it('should revoke all other devices except current active token', async () => {
      const tokenCurrent = `tok-current-${Date.now()}`;
      const tokenOld1 = `tok-old-1-${Date.now()}`;
      const tokenOld2 = `tok-old-2-${Date.now()}`;

      await registerUserDevice({
        userId: createdUserIds[0],
        token: tokenOld1,
      });
      await registerUserDevice({
        userId: createdUserIds[0],
        token: tokenOld2,
      });
      await registerUserDevice({
        userId: createdUserIds[0],
        token: tokenCurrent,
      });

      const result = await revokeAllOtherUserDevices(createdUserIds[0], tokenCurrent);
      expect(result.revokedCount).toBe(2);

      const remaining = await getUserDevices(createdUserIds[0]);
      expect(remaining.length).toBe(1);
      expect(remaining[0].token).toBe(tokenCurrent);
    });
  });

  describe('Push Dispatch and Dead Token Pruning', () => {
    it('should identify invalid Firebase token errors', () => {
      expect(isInvalidTokenError({ code: 'messaging/registration-token-not-registered' })).toBe(true);
      expect(isInvalidTokenError({ code: 'messaging/invalid-registration-token' })).toBe(true);
      expect(isInvalidTokenError({ message: 'Requested entity was not found' })).toBe(true);
      expect(isInvalidTokenError({ message: 'Internal server error' })).toBe(false);
    });

    it('should prune dead tokens from database', async () => {
      const deadToken = `dead-token-${Date.now()}`;
      const liveToken = `live-token-${Date.now()}`;

      await registerUserDevice({
        userId: createdUserIds[0],
        token: deadToken,
      });
      await registerUserDevice({
        userId: createdUserIds[0],
        token: liveToken,
      });

      await pruneDeadTokens([deadToken]);

      const remaining = await getUserDevices(createdUserIds[0]);
      expect(remaining.length).toBe(1);
      expect(remaining[0].token).toBe(liveToken);
    });

    it('should send multicast push across all user devices', async () => {
      const token1 = `tok-push-1-${Date.now()}`;
      const token2 = `tok-push-2-${Date.now()}`;

      await registerUserDevice({
        userId: createdUserIds[0],
        token: token1,
        deviceType: DeviceType.MOBILE,
      });
      await registerUserDevice({
        userId: createdUserIds[0],
        token: token2,
        deviceType: DeviceType.DESKTOP,
      });

      const res = await sendPushToUser(createdUserIds[0], {
        title: 'New Collection',
        body: 'Check out our new bridal gown collection',
        url: '/products',
      });

      expect(res).toBeDefined();
      expect(res.totalRecipients).toBe(2);
    });
  });
});
