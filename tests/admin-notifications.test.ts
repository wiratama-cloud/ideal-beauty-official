import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  getAdminNotificationRecipientsAction,
  sendAdminPushNotificationAction,
  getAdminNotificationAudienceEstimateAction,
} from '../src/app/actions/admin';
import { sendMulticastPushNotification } from '../src/lib/services/notification';
import * as firebaseAdminModule from '../src/lib/firebase/admin';
import { DeviceType } from '@prisma/client';

interface AuditLogRecord {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: {
    title: string;
    url?: string;
    targetType: string;
    targetedUserCount?: number;
    platformFilter?: string;
    activityFilter?: string;
    [key: string]: unknown;
  };
}

describe('Admin Push Notifications System', () => {
  let createdUserIds: string[] = [];

  beforeEach(async () => {
    // Create sample users with and without FCM tokens and devices
    const userWithToken = await prisma.user.create({
      data: {
        email: `fcm-user-1-${Date.now()}@example.com`,
        name: 'Notification Test User 1',
        phone: `+6281111111${Date.now().toString().slice(-4)}`,
        fcmToken: 'mock-fcm-token-1',
        devices: {
          create: [
            {
              token: `mock-device-mobile-${Date.now()}`,
              deviceType: DeviceType.MOBILE,
              deviceName: 'Apple iPhone 15',
              browser: 'Safari',
              os: 'iOS',
              lastActiveAt: new Date(),
              isActive: true,
            },
            {
              token: `mock-device-desktop-${Date.now()}`,
              deviceType: DeviceType.DESKTOP,
              deviceName: 'MacBook Pro',
              browser: 'Chrome',
              os: 'macOS',
              lastActiveAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
              isActive: true,
            },
            {
              token: `mock-device-old-${Date.now()}`,
              deviceType: DeviceType.MOBILE,
              deviceName: 'Old Android',
              browser: 'Chrome',
              os: 'Android',
              lastActiveAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
              isActive: true,
            },
          ],
        },
      },
    });

    const userWithoutToken = await prisma.user.create({
      data: {
        email: `fcm-user-2-${Date.now()}@example.com`,
        name: 'Notification Test User 2',
        phone: `+6282222222${Date.now().toString().slice(-4)}`,
        fcmToken: null,
      },
    });

    createdUserIds = [userWithToken.id, userWithoutToken.id];
  });

  afterEach(async () => {
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
      createdUserIds = [];
    }
  });

  describe('sendMulticastPushNotification service', () => {
    it('should return graceful success when token list is empty', async () => {
      const res = await sendMulticastPushNotification([], 'Test Title', 'Test Body');
      expect(res.success).toBe(true);
      expect(res.totalRecipients).toBe(0);
      expect(res.successCount).toBe(0);
      expect(res.failureCount).toBe(0);
    });

    it('should filter out empty or whitespace-only tokens', async () => {
      const res = await sendMulticastPushNotification(
        ['', '   '],
        'Test Title',
        'Test Body'
      );
      expect(res.success).toBe(true);
      expect(res.totalRecipients).toBe(0);
    });

    it('should report unconfigured Firebase Admin Messaging gracefully', async () => {
      // In default test environment without FIREBASE_SERVICE_ACCOUNT_KEY
      const res = await sendMulticastPushNotification(
        ['fake-token-123'],
        'Test Title',
        'Test Body',
        '/products'
      );
      // In test env firebaseAdminMessaging is null
      if (!firebaseAdminModule.firebaseAdminMessaging) {
        expect(res.success).toBe(false);
        expect(res.totalRecipients).toBe(1);
        expect(res.message).toContain('Firebase Admin Messaging is not configured');
      }
    });
  });

  describe('getAdminNotificationRecipientsAction', () => {
    it('should return all users with hasFcmToken flag and device metadata correctly set', async () => {
      const recipients = await getAdminNotificationRecipientsAction();
      expect(Array.isArray(recipients)).toBe(true);
      expect(recipients.length).toBeGreaterThanOrEqual(2);

      const user1 = recipients.find((r) => r.id === createdUserIds[0]);
      const user2 = recipients.find((r) => r.id === createdUserIds[1]);

      expect(user1).toBeDefined();
      expect(user1?.hasFcmToken).toBe(true);
      expect(user1?.deviceCount).toBe(3);
      expect(user1?.devices?.length).toBe(3);
      expect(user1?.name).toBe('Notification Test User 1');

      expect(user2).toBeDefined();
      expect(user2?.hasFcmToken).toBe(false);
      expect(user2?.deviceCount).toBe(0);
      expect(user2?.devices?.length).toBe(0);
      expect(user2?.name).toBe('Notification Test User 2');
    });
  });

  describe('sendAdminPushNotificationAction with Multi-Device Filters', () => {
    it('should validate required title and body fields', async () => {
      await expect(
        sendAdminPushNotificationAction({
          title: '',
          body: 'Some body',
          targetType: 'ALL',
        })
      ).rejects.toThrow('Notification title is required');

      await expect(
        sendAdminPushNotificationAction({
          title: 'Some Title',
          body: '   ',
          targetType: 'ALL',
        })
      ).rejects.toThrow('Notification message body is required');
    });

    it('should validate selected users when targetType is SELECTED', async () => {
      await expect(
        sendAdminPushNotificationAction({
          title: 'Special Event',
          body: 'Exclusive preview invitation',
          targetType: 'SELECTED',
          userIds: [],
        })
      ).rejects.toThrow('Please select at least one recipient user');
    });

    it('should handle broadcast to ALL users and record audit log with device filters', async () => {
      const result = await sendAdminPushNotificationAction({
        title: '🌟 Flash Weekend Sale',
        body: 'Enjoy 20% off all gown rentals this weekend!',
        url: '/products',
        targetType: 'ALL',
        platformFilter: 'ALL',
        activityFilter: 'ALL_ACTIVE',
      });

      expect(result).toBeDefined();
      expect(typeof result.targetedUserCount).toBe('number');
      expect(typeof result.eligibleTokensCount).toBe('number');
      expect(result.eligibleTokensCount).toBeGreaterThanOrEqual(3);

      // Verify audit log entry
      const auditLog = await (prisma as unknown as { auditLog: { findFirst: (query: unknown) => Promise<AuditLogRecord | null> } }).auditLog.findFirst({
        where: {
          action: 'SEND_PUSH_NOTIFICATION',
          entity: 'NOTIFICATION',
          entityId: 'ALL',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.details.title).toBe('🌟 Flash Weekend Sale');
      expect(auditLog?.details.url).toBe('/products');
      expect(auditLog?.details.targetType).toBe('ALL');
      expect(auditLog?.details.platformFilter).toBe('ALL');
      expect(auditLog?.details.activityFilter).toBe('ALL_ACTIVE');
    });

    it('should filter by MOBILE_ONLY devices for selected user', async () => {
      const result = await sendAdminPushNotificationAction({
        title: '📱 Mobile Exclusive Promo',
        body: 'Special offer for our mobile app customers',
        targetType: 'SELECTED',
        userIds: [createdUserIds[0]],
        platformFilter: 'MOBILE_ONLY',
      });

      expect(result).toBeDefined();
      expect(result.targetedUserCount).toBe(1);
      // Should include 2 mobile devices (iPhone, Old Android) and exclude MacBook desktop
      expect(result.eligibleTokensCount).toBe(2);
    });

    it('should filter by DESKTOP_ONLY devices for selected user', async () => {
      const result = await sendAdminPushNotificationAction({
        title: '💻 Desktop Atelier Lookbook',
        body: 'Experience our high-resolution couture catalog on your computer',
        targetType: 'SELECTED',
        userIds: [createdUserIds[0]],
        platformFilter: 'DESKTOP_ONLY',
      });

      expect(result).toBeDefined();
      expect(result.targetedUserCount).toBe(1);
      // Should include only the MacBook Pro desktop device
      expect(result.eligibleTokensCount).toBe(1);
    });

    it('should filter by LAST_ACTIVE_ONLY device per user', async () => {
      const result = await sendAdminPushNotificationAction({
        title: '⚡ Instant Alert',
        body: 'One message to your most active device',
        targetType: 'SELECTED',
        userIds: [createdUserIds[0]],
        activityFilter: 'LAST_ACTIVE_ONLY',
      });

      expect(result).toBeDefined();
      expect(result.targetedUserCount).toBe(1);
      // Only the most recently active device (iPhone) should be targeted
      expect(result.eligibleTokensCount).toBe(1);
    });

    it('should filter by ACTIVE_7D recency timeframe', async () => {
      const result = await sendAdminPushNotificationAction({
        title: '⏰ Recent Customers Alert',
        body: 'Message to recently active devices',
        targetType: 'SELECTED',
        userIds: [createdUserIds[0]],
        activityFilter: 'ACTIVE_7D',
      });

      expect(result).toBeDefined();
      expect(result.targetedUserCount).toBe(1);
      // iPhone (now) and MacBook (2 days ago) are within 7 days; Old Android (40 days ago) is excluded
      expect(result.eligibleTokensCount).toBe(2);
    });

    it('should correctly report 0 eligible tokens when selected user has no FCM token', async () => {
      const result = await sendAdminPushNotificationAction({
        title: 'General Notice',
        body: 'Notice for user without push token',
        targetType: 'SELECTED',
        userIds: [createdUserIds[1]], // user without token
      });

      expect(result).toBeDefined();
      expect(result.targetedUserCount).toBe(0);
      expect(result.eligibleTokensCount).toBe(0);
      expect(result.totalRecipients).toBe(0);
    });

    it('should calculate audience estimate accurately via getAdminNotificationAudienceEstimateAction', async () => {
      const allEstimate = await getAdminNotificationAudienceEstimateAction({
        targetType: 'SELECTED',
        userIds: [createdUserIds[0], createdUserIds[1]],
        platformFilter: 'ALL',
        activityFilter: 'ALL_ACTIVE',
      });
      expect(allEstimate.targetedUserCount).toBe(1);
      expect(allEstimate.targetedDeviceCount).toBe(3);

      const mobileEstimate = await getAdminNotificationAudienceEstimateAction({
        targetType: 'SELECTED',
        userIds: [createdUserIds[0], createdUserIds[1]],
        platformFilter: 'MOBILE_ONLY',
        activityFilter: 'ALL_ACTIVE',
      });
      expect(mobileEstimate.targetedUserCount).toBe(1);
      expect(mobileEstimate.targetedDeviceCount).toBe(2);

      const lastActiveEstimate = await getAdminNotificationAudienceEstimateAction({
        targetType: 'SELECTED',
        userIds: [createdUserIds[0], createdUserIds[1]],
        platformFilter: 'ALL',
        activityFilter: 'LAST_ACTIVE_ONLY',
      });
      expect(lastActiveEstimate.targetedUserCount).toBe(1);
      expect(lastActiveEstimate.targetedDeviceCount).toBe(1);
    });

    it('should support Product Spotlight preset broadcast payload and link', async () => {
      const productSlug = 'velvet-evening-gown';
      const result = await sendAdminPushNotificationAction({
        title: '✨ Featured Couture: Velvet Evening Gown',
        body: 'Discover our Velvet Evening Gown from the Atelier collection. Tap to explore fitting & rental options.',
        url: `/products/${productSlug}`,
        targetType: 'ALL',
      });

      expect(result).toBeDefined();
      expect(result.eligibleTokensCount).toBeGreaterThanOrEqual(1);

      const auditLog = await (prisma as unknown as { auditLog: { findFirst: (query: unknown) => Promise<AuditLogRecord | null> } }).auditLog.findFirst({
        where: {
          action: 'SEND_PUSH_NOTIFICATION',
          entity: 'NOTIFICATION',
          entityId: 'ALL',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog?.details.title).toContain('Velvet Evening Gown');
      expect(auditLog?.details.url).toBe('/products/velvet-evening-gown');
    });

    it('should support Promo Code preset broadcast payload and link', async () => {
      const result = await sendAdminPushNotificationAction({
        title: '🎟️ Exclusive Voucher: ATELIERVIP',
        body: 'Use code ATELIERVIP to enjoy 25% off your next order! Tap to claim your voucher.',
        url: '/account/vouchers',
        targetType: 'ALL',
      });

      expect(result).toBeDefined();
      expect(result.eligibleTokensCount).toBeGreaterThanOrEqual(1);

      const auditLog = await (prisma as unknown as { auditLog: { findFirst: (query: unknown) => Promise<AuditLogRecord | null> } }).auditLog.findFirst({
        where: {
          action: 'SEND_PUSH_NOTIFICATION',
          entity: 'NOTIFICATION',
          entityId: 'ALL',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog?.details.title).toContain('ATELIERVIP');
      expect(auditLog?.details.url).toBe('/account/vouchers');
    });
  });
});
