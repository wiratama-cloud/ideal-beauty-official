import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendOrderPushNotification, sendMulticastPushNotification } from '../src/lib/services/notification';
import * as firebaseAdminModule from '../src/lib/firebase/admin';

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

  it('should handle errors gracefully when send fails', async () => {
    const mockSend = vi.fn().mockRejectedValue(new Error('FCM network failure'));
    vi.spyOn(firebaseAdminModule, 'firebaseAdminMessaging', 'get').mockReturnValue({
      send: mockSend,
    } as any);

    const res = await sendOrderPushNotification(
      'mock-device-token-123',
      'Order Failed',
      'Something failed',
      'ORD-500'
    );

    expect(res).toBeNull();
  });
});

describe('Push Notification Service - sendMulticastPushNotification', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should deduplicate tokens and attach destination url and webpush link', async () => {
    const mockSendMulticast = vi.fn().mockResolvedValue({
      successCount: 2,
      failureCount: 0,
    });

    vi.spyOn(firebaseAdminModule, 'firebaseAdminMessaging', 'get').mockReturnValue({
      sendEachForMulticast: mockSendMulticast,
    } as any);

    const tokens = ['token-1', 'token-2', 'token-1', '   ', 'token-2'];
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
      tokens: ['token-1', 'token-2'],
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
    const mockSendMulticast = vi.fn().mockResolvedValue({
      successCount: 1,
      failureCount: 0,
    });

    vi.spyOn(firebaseAdminModule, 'firebaseAdminMessaging', 'get').mockReturnValue({
      sendEachForMulticast: mockSendMulticast,
    } as any);

    const result = await sendMulticastPushNotification(
      ['token-single'],
      'Store Announcement',
      'Holiday schedule announcement',
      '   '
    );

    expect(result.success).toBe(true);
    expect(mockSendMulticast).toHaveBeenCalledWith({
      tokens: ['token-single'],
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
    const mockSendMulticast = vi.fn().mockResolvedValue({
      successCount: 500,
      failureCount: 0,
    });

    vi.spyOn(firebaseAdminModule, 'firebaseAdminMessaging', 'get').mockReturnValue({
      sendEachForMulticast: mockSendMulticast,
    } as any);

    const tokens = Array.from({ length: 1200 }, (_, i) => `device-token-${i}`);
    const result = await sendMulticastPushNotification(
      tokens,
      'Mass Broadcast',
      'Notice for all active users',
      '/announcements'
    );

    expect(result.totalRecipients).toBe(1200);
    // 1200 tokens split into chunks of 500: 500, 500, 200 -> 3 batches
    expect(mockSendMulticast).toHaveBeenCalledTimes(3);
  });
});
