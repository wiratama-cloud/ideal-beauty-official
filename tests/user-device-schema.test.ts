import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { backfillUserDeviceTokens } from '../src/lib/services/device';
import { DeviceType } from '@prisma/client';

describe('UserDevice Schema and Backfill Service', () => {
  it('should define DeviceType enum values correctly', () => {
    expect(DeviceType.MOBILE).toBe('MOBILE');
    expect(DeviceType.TABLET).toBe('TABLET');
    expect(DeviceType.DESKTOP).toBe('DESKTOP');
    expect(DeviceType.OTHER).toBe('OTHER');
  });

  it('should backfill existing non-null User.fcmToken entries to UserDevice table', async () => {
    const testEmail = `test-backfill-${Date.now()}@example.com`;
    const testToken = `test-fcm-token-${Date.now()}`;

    // Create a test user with fcmToken
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Test Backfill User',
        fcmToken: testToken,
      },
    });

    try {
      // Run backfill
      const result = await backfillUserDeviceTokens();
      expect(result.migratedCount).toBeGreaterThanOrEqual(1);

      // Verify UserDevice record exists
      const device = await prisma.userDevice.findUnique({
        where: { token: testToken },
      });

      expect(device).not.toBeNull();
      expect(device?.userId).toBe(user.id);
      expect(device?.token).toBe(testToken);
      expect(device?.deviceType).toBe(DeviceType.OTHER);
      expect(device?.isActive).toBe(true);

      // Running backfill again should not duplicate
      const secondResult = await backfillUserDeviceTokens();
      const count = await prisma.userDevice.count({
        where: { token: testToken },
      });
      expect(count).toBe(1);
    } finally {
      // Cleanup
      await prisma.user.delete({
        where: { id: user.id },
      });

      // Verify cascade delete
      const deviceAfterDelete = await prisma.userDevice.findUnique({
        where: { token: testToken },
      });
      expect(deviceAfterDelete).toBeNull();
    }
  });

  it('should transfer token ownership if an existing token is backfilled for another user', async () => {
    const email1 = `user1-${Date.now()}@example.com`;
    const email2 = `user2-${Date.now()}@example.com`;
    const sharedToken = `shared-token-${Date.now()}`;

    const user1 = await prisma.user.create({
      data: {
        email: email1,
        name: 'Original Token Owner',
      },
    });

    const user2 = await prisma.user.create({
      data: {
        email: email2,
        name: 'New Token Owner',
        fcmToken: sharedToken,
      },
    });

    try {
      // Create initial device under user1
      await prisma.userDevice.create({
        data: {
          userId: user1.id,
          token: sharedToken,
          deviceType: DeviceType.MOBILE,
          deviceName: 'Mobile Device',
        },
      });

      // Backfill should reassign token to user2
      const result = await backfillUserDeviceTokens();
      expect(result.migratedCount).toBeGreaterThanOrEqual(1);

      const device = await prisma.userDevice.findUnique({
        where: { token: sharedToken },
      });
      expect(device?.userId).toBe(user2.id);
    } finally {
      await prisma.user.deleteMany({
        where: {
          id: { in: [user1.id, user2.id] },
        },
      });
    }
  });
});
