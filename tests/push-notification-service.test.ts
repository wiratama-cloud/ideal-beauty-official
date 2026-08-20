import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sendOrderPushNotification,
  sendMulticastPushNotification,
  sendMulticastWithCleanup,
  sendPushToUser,
  sendOrderPushNotificationToUser,
  isInvalidTokenError,
  pruneDeadTokens,
} from '../src/lib/services/notification';
import * as firebaseAdminModule from '../src/lib/firebase/admin';
import { prisma } from '../src/lib/prisma';
import { DeviceType } from '@prisma/client';

describe('Push Notification Service - sendOrderPushNotification', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return null when firebaseAdminMessaging is not configured', async () => {
    vi.spyOn(firebaseAdminModule, 'firebaseAdminMessaging', 'get').mockReturnValue(null as any);

    const res = await sendOrderPushNotification(
      'mock-token',
      'Order Status Update',
      'Your order has shipped',
      'order-123'
    );
    expect(res).toBeNull();
  });

  it('should format order push payload with notification, data, and webpush link', async () => {
    const mockSend = vi.fn().mockResolvedValue('msg-id-123');
    vi.spyOn(firebaseAdminModule, 'firebaseAdminMessaging', 'get').mockReturnValue({
      send: mockSend,
    } as any);

    const res = await sendOrderPushNotification(
      'mock-device-token-123',
      'Order Confirmed',
      'Your order ORD-99 is confirmed!',
      'ORD-99'
    );

    expect(res).toBe('msg-id-123');
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith({
      token: 'mock-device-token-123',
      notification: {
        title: 'Order Confirmed',
        body: 'Your order ORD-99 is confirmed!',
      },
      data: {
        orderId: 'ORD-99',
        url: '/account?tab=orders',
      },
      webpush: {
        notification: {
          icon: '/icon.png',
          badge: '/icon.png',
        },
        fcmOptions: {
          link: '/account?tab=orders',
        },
      },
    });
  });

  it('should respect custom destination URL when provided', async () => {
    const mockSend = vi.fn().mockResolvedValue('msg-id-456');
    vi.spyOn(firebaseAdminModule, 'firebaseAdminMessaging', 'get').mockReturnValue({
      send: mockSend,
    } as any);

    const res = await sendOrderPushNotification(
      'mock-device-token-123',
      'Custom Alert',
      'Click here to track your package',
      'ORD-100',
      '/account/tracking?id=ORD-100'
    );

    expect(res).toBe('msg-id-456');
    expect(mockSend).toHaveBeenCalledWith({
      token: 'mock-device-token-123',
      notification: {
        title: 'Custom Alert',
        body: 'Click here to track your package',
      },
      data: {
        orderId: 'ORD-100',
        url: '/account/tracking?id=ORD-100',
      },
      webpush: {
        notification: {
          icon: '/icon.png',
          badge: '/icon.png',
        },
        fcmOptions: {
          link: '/account/tracking?id=ORD-100',
        },
      },
    });
  });

  it('should handle errors gracefully when send fails and prune invalid token', async () => {
    const ts = Date.now() + Math.floor(Math.random() * 100000);
    const deadToken = `dead-single-token-${ts}`;
    const user = await prisma.user.create({
      data: {
        email: `single-dead-${ts}@example.com`,
        name: 'Single Dead Device User',
        fcmToken: deadToken,
        devices: {
          create: {
            token: deadToken,
            deviceType: DeviceType.MOBILE,
            deviceName: 'Dead iPhone',
          },
        },
      },
    });

    const mockSend = vi.fn().mockRejectedValue({
      code: 'messaging/registration-token-not-registered',
      message: 'The registration token is not registered',
    });
    vi.spyOn(firebaseAdminModule, 'firebaseAdminMessaging', 'get').mockReturnValue({
      send: mockSend,
    } as any);

    const res = await sendOrderPushNotification(
      deadToken,
      'Order Failed',
      'Something failed',
      'ORD-500'
    );

    expect(res).toBeNull();

    // Verify token was pruned
    const device = await prisma.userDevice.findUnique({
      where: { token: deadToken },
    });
    expect(device).toBeNull();

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(updatedUser?.fcmToken).toBeNull();
  });
});

describe('Push Notification Service - Helper Functions', () => {
  it('should recognize invalid FCM error codes and messages', () => {
    expect(isInvalidTokenError('messaging/registration-token-not-registered')).toBe(true);
    expect(isInvalidTokenError('messaging/invalid-registration-token')).toBe(true);
    expect(isInvalidTokenError('messaging/invalid-argument')).toBe(true);
    expect(isInvalidTokenError('messaging/mismatched-credential')).toBe(true);
    expect(isInvalidTokenError('The registration token is not a valid FCM registration token')).toBe(true);
    expect(isInvalidTokenError('Requested entity was not found')).toBe(true);
    expect(isInvalidTokenError('NotRegistered')).toBe(true);
    expect(isInvalidTokenError('messaging/server-unavailable')).toBe(false);
    expect(isInvalidTokenError('messaging/quota-exceeded')).toBe(false);
    expect(isInvalidTokenError(undefined)).toBe(false);
  });

  it('should prune dead tokens from database cleanly', async () => {
    const ts = Date.now() + Math.floor(Math.random() * 100000);
    const token1 = `prunable-token-1-${ts}`;
    const token2 = `prunable-token-2-${ts}`;
    const keepToken = `keep-token-1-${ts}`;

    const user = await prisma.user.create({
      data: {
        email: `prune-test-${ts}@example.com`,
        name: 'Prune Tester',
        fcmToken: token1,
        devices: {
          createMany: {
            data: [
              { token: token1, deviceName: 'Old Phone' },
              { token: token2, deviceName: 'Old Laptop' },
              { token: keepToken, deviceName: 'Active Phone' },
            ],
          },
        },
      },
    });

    const result = await pruneDeadTokens([token1, token2]);
    expect(result.prunedDevicesCount).toBe(2);
    expect(result.clearedUsersCount).toBe(1);

    const remainingDevices = await prisma.userDevice.findMany({
      where: { userId: user.id },
    });
    expect(remainingDevices.length).toBe(1);
    expect(remainingDevices[0].token).toBe(keepToken);

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(updatedUser?.fcmToken).toBeNull();
  });
});

describe('Push Notification Service - sendMulticastPushNotification', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should deduplicate tokens and attach destination url and webpush link', async () => {
    const ts = Date.now() + Math.floor(Math.random() * 100000);
    const t1 = `token-1-${ts}`;
    const t2 = `token-2-${ts}`;
    const mockSendMulticast = vi.fn().mockResolvedValue({
      successCount: 2,
      failureCount: 0,
      responses: [{ success: true }, { success: true }],
    });

    vi.spyOn(firebaseAdminModule, 'firebaseAdminMessaging', 'get').mockReturnValue({
      sendEachForMulticast: mockSendMulticast,
    } as any);

    const tokens = [t1, t2, t1, '   ', t2];
    const result = await sendMulticastPushNotification(
      tokens,
      'Flash Sale Alert',
      '50% off new luxury evening gowns!',
      '/products?category=gowns'
    );

    expect(result.success).toBe(true);
    expect(result.totalRecipients).toBe(2);
    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(0);

    expect(mockSendMulticast).toHaveBeenCalledTimes(1);
    expect(mockSendMulticast).toHaveBeenCalledWith({
      tokens: [t1, t2],
      notification: {
        title: 'Flash Sale Alert',
        body: '50% off new luxury evening gowns!',
      },
      data: {
        url: '/products?category=gowns',
      },
      webpush: {
        notification: {
          icon: '/icon.png',
          badge: '/icon.png',
        },
        fcmOptions: {
          link: '/products?category=gowns',
        },
      },
    });
  });

  it('should default url to / when no url or empty url is provided', async () => {
    const ts = Date.now() + Math.floor(Math.random() * 100000);
    const singleTok = `token-single-${ts}`;
    const mockSendMulticast = vi.fn().mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      responses: [{ success: true }],
    });

    vi.spyOn(firebaseAdminModule, 'firebaseAdminMessaging', 'get').mockReturnValue({
      sendEachForMulticast: mockSendMulticast,
    } as any);

    const result = await sendMulticastPushNotification(
      [singleTok],
      'Store Announcement',
      'Holiday schedule announcement',
      '   '
    );

    expect(result.success).toBe(true);
    expect(mockSendMulticast).toHaveBeenCalledWith({
      tokens: [singleTok],
      notification: {
        title: 'Store Announcement',
        body: 'Holiday schedule announcement',
      },
      data: {
        url: '/',
      },
      webpush: {
        notification: {
          icon: '/icon.png',
          badge: '/icon.png',
        },
        fcmOptions: {
          link: '/',
        },
      },
    });
  });

  it('should chunk tokens in batches of 500 when more than 500 tokens provided', async () => {
    const ts = Date.now() + Math.floor(Math.random() * 100000);
    const mockSendMulticast = vi.fn().mockResolvedValue({
      successCount: 500,
      failureCount: 0,
      responses: Array.from({ length: 500 }, () => ({ success: true })),
    });

    vi.spyOn(firebaseAdminModule, 'firebaseAdminMessaging', 'get').mockReturnValue({
      sendEachForMulticast: mockSendMulticast,
    } as any);

    const tokens = Array.from({ length: 1200 }, (_, i) => `device-token-${ts}-${i}`);
    const result = await sendMulticastPushNotification(
      tokens,
      'Mass Broadcast',
      'Notice for all active users',
      '/announcements'
    );

    expect(result.totalRecipients).toBe(1200);
    expect(mockSendMulticast).toHaveBeenCalledTimes(3);
  });

  it('should automatically detect dead tokens in response and prune them from database', async () => {
    const ts = Date.now() + Math.floor(Math.random() * 100000);
    const liveToken = `valid-live-token-${ts}`;
    const deadToken = `dead-unregistered-token-${ts}`;

    const user = await prisma.user.create({
      data: {
        email: `dead-multicast-${ts}@example.com`,
        name: 'Dead Multicast Tester',
        devices: {
          createMany: {
            data: [
              { token: liveToken, deviceName: 'Live Device' },
              { token: deadToken, deviceName: 'Dead Device' },
            ],
          },
        },
      },
    });

    const mockSendMulticast = vi.fn().mockResolvedValue({
      successCount: 1,
      failureCount: 1,
      responses: [
        { success: true },
        {
          success: false,
          error: {
            code: 'messaging/registration-token-not-registered',
            message: 'Requested entity was not found.',
          },
        },
      ],
    });

    vi.spyOn(firebaseAdminModule, 'firebaseAdminMessaging', 'get').mockReturnValue({
      sendEachForMulticast: mockSendMulticast,
    } as any);

    const result = await sendMulticastPushNotification(
      [liveToken, deadToken],
      'Promotion Alert',
      'Special discount available',
      '/sale'
    );

    expect(result.success).toBe(true);
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(1);
    expect(result.prunedTokensCount).toBe(1);
    expect(result.prunedTokens).toContain(deadToken);

    const deadDevice = await prisma.userDevice.findUnique({
      where: { token: deadToken },
    });
    expect(deadDevice).toBeNull();

    const liveDevice = await prisma.userDevice.findUnique({
      where: { token: liveToken },
    });
    expect(liveDevice).not.toBeNull();
  });
});

describe('Push Notification Service - sendPushToUser & sendOrderPushNotificationToUser', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch all active devices for a user and broadcast via multicast', async () => {
    const ts = Date.now() + Math.floor(Math.random() * 100000);
    const iphoneTok = `user-iphone-token-${ts}`;
    const macbookTok = `user-macbook-token-${ts}`;
    const inactiveTok = `user-inactive-token-${ts}`;

    const user = await prisma.user.create({
      data: {
        email: `multi-device-${ts}@example.com`,
        name: 'Multi-Device Patron',
        devices: {
          createMany: {
            data: [
              { token: iphoneTok, deviceType: DeviceType.MOBILE, deviceName: 'iPhone 15', isActive: true },
              { token: macbookTok, deviceType: DeviceType.DESKTOP, deviceName: 'MacBook Pro', isActive: true },
              { token: inactiveTok, deviceType: DeviceType.TABLET, deviceName: 'Old iPad', isActive: false },
            ],
          },
        },
      },
    });

    const mockSendMulticast = vi.fn().mockResolvedValue({
      successCount: 2,
      failureCount: 0,
      responses: [{ success: true }, { success: true }],
    });

    vi.spyOn(firebaseAdminModule, 'firebaseAdminMessaging', 'get').mockReturnValue({
      sendEachForMulticast: mockSendMulticast,
    } as any);

    const result = await sendPushToUser(user.id, {
      title: 'Order Status Update',
      body: 'Your order is being prepared',
      orderId: 'ORD-MULTI-1',
      url: '/account?tab=orders',
    });

    expect(result.success).toBe(true);
    expect(result.totalRecipients).toBe(2);
    expect(mockSendMulticast).toHaveBeenCalledTimes(1);

    const callArgs = mockSendMulticast.mock.calls[0][0];
    expect(callArgs.tokens).toContain(iphoneTok);
    expect(callArgs.tokens).toContain(macbookTok);
    expect(callArgs.tokens).not.toContain(inactiveTok);
    expect(callArgs.data.orderId).toBe('ORD-MULTI-1');
  });

  it('should fall back to User.fcmToken when no active UserDevice records exist', async () => {
    const ts = Date.now() + Math.floor(Math.random() * 100000);
    const legacyTok = `legacy-fcm-token-${ts}`;
    const user = await prisma.user.create({
      data: {
        email: `fallback-token-${ts}@example.com`,
        name: 'Legacy Token Patron',
        fcmToken: legacyTok,
      },
    });

    const mockSendMulticast = vi.fn().mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      responses: [{ success: true }],
    });

    vi.spyOn(firebaseAdminModule, 'firebaseAdminMessaging', 'get').mockReturnValue({
      sendEachForMulticast: mockSendMulticast,
    } as any);

    const result = await sendOrderPushNotificationToUser(
      user.id,
      'Order Confirmed',
      'Thank you for your order',
      'ORD-LEGACY-1'
    );

    expect(result.success).toBe(true);
    expect(result.totalRecipients).toBe(1);
    const callArgs = mockSendMulticast.mock.calls[0][0];
    expect(callArgs.tokens).toEqual([legacyTok]);
    expect(callArgs.data.orderId).toBe('ORD-LEGACY-1');
  });

  it('should handle users with no devices gracefully', async () => {
    const ts = Date.now() + Math.floor(Math.random() * 100000);
    const user = await prisma.user.create({
      data: {
        email: `no-devices-${ts}@example.com`,
        name: 'No Device Patron',
      },
    });

    const result = await sendPushToUser(user.id, {
      title: 'Order Status',
      body: 'Status update',
    });

    expect(result.success).toBe(true);
    expect(result.totalRecipients).toBe(0);
    expect(result.message).toContain('No active device tokens found');
  });
});
