import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { updateOrderStatus } from '../src/lib/services/order';
import * as firebaseAdminModule from '../src/lib/firebase/admin';
import { DeviceType, OrderStatus } from '@prisma/client';
import {
  sendPushToUser,
  sendOrderPushNotificationToUser,
  sendMulticastPushNotification,
  pruneDeadTokens,
} from '../src/lib/services/notification';

describe('Multi-Device Push Notifications & Order Status Dispatch Integration', () => {
  let testUser: any;
  let testOrder: any;
  let iphoneToken: string;
  let macbookToken: string;
  let androidToken: string;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 100000);
    iphoneToken = `iphone-token-${timestamp}-101`;
    macbookToken = `macbook-token-${timestamp}-202`;
    androidToken = `android-token-${timestamp}-303`;

    // Create test patron user with multiple devices
    testUser = await prisma.user.create({
      data: {
        email: `multi-order-patron-${timestamp}@example.com`,
        name: 'Multi-Device Patron',
        phone: '+6281122334455',
        fcmToken: `primary-token-${timestamp}`,
        devices: {
          createMany: {
            data: [
              {
                token: iphoneToken,
                deviceType: DeviceType.MOBILE,
                deviceName: 'iPhone 15 Pro',
                browser: 'Safari',
                os: 'iOS',
                isActive: true,
              },
              {
                token: macbookToken,
                deviceType: DeviceType.DESKTOP,
                deviceName: 'MacBook Air',
                browser: 'Chrome',
                os: 'macOS',
                isActive: true,
              },
              {
                token: androidToken,
                deviceType: DeviceType.MOBILE,
                deviceName: 'Samsung S24',
                browser: 'Chrome',
                os: 'Android',
                isActive: false, // Inactive device
              },
            ],
          },
        },
      },
    });

    const product = await prisma.product.create({
      data: {
        name: `Test Multi Gown ${timestamp}`,
        slug: `test-multi-gown-${timestamp}`,
        description: 'Luxury gown for multi-device testing',
        category: 'Evening Wear',
        images: ['https://example.com/test.jpg'],
        variants: {
          create: [
            {
              sku: `SKU-MULTI-${timestamp}`,
              attributes: { size: 'M', color: 'Gold' },
              priceSale: 5000000,
              stockSaleTotal: 10,
              stockSaleAvailable: 10,
              stockAvailable: 10,
            },
          ],
        },
      },
      include: { variants: true },
    });

    testOrder = await prisma.order.create({
      data: {
        user: { connect: { id: testUser.id } },
        totalAmount: 5000000,
        status: OrderStatus.PENDING,
        shippingAddress: {
          create: {
            user: { connect: { id: testUser.id } },
            recipientName: 'Multi-Device Patron',
            phone: '+6281122334455',
            addressLine1: 'Jl. Sudirman 100',
            city: 'Jakarta Pusat',
            province: 'DKI Jakarta',
            postalCode: '10220',
          },
        },
        items: {
          create: [
            {
              variantId: product.variants[0].id,
              quantity: 1,
              priceAtTime: 5000000,
              type: 'SALE',
            },
          ],
        },
      },
    });
  });

  it('should broadcast order status changes to all active user devices concurrently', async () => {
    const mockSendMulticast = vi.fn().mockResolvedValue({
      successCount: 2,
      failureCount: 0,
      responses: [{ success: true }, { success: true }],
    });

    vi.spyOn(firebaseAdminModule, 'firebaseAdminMessaging', 'get').mockReturnValue({
      sendEachForMulticast: mockSendMulticast,
    } as any);

    const updated = await updateOrderStatus(testOrder.id, OrderStatus.SHIPPED);
    expect(updated.status).toBe(OrderStatus.SHIPPED);

    expect(mockSendMulticast).toHaveBeenCalledTimes(1);
    const multicastArg = mockSendMulticast.mock.calls[0][0];

    // Verify both active devices were targeted and inactive device was excluded
    expect(multicastArg.tokens).toHaveLength(2);
    expect(multicastArg.tokens).toContain(iphoneToken);
    expect(multicastArg.tokens).toContain(macbookToken);
    expect(multicastArg.tokens).not.toContain(androidToken);

    // Verify message payload formatting
    expect(multicastArg.notification.title).toBe('Order Update');
    expect(multicastArg.notification.body).toContain(testOrder.id);
    expect(multicastArg.notification.body).toContain('SHIPPED');
    expect(multicastArg.data.orderId).toBe(testOrder.id);
    expect(multicastArg.webpush.fcmOptions.link).toBe('/account?tab=orders');
  });

  it('should prune dead tokens automatically when Firebase returns invalid token errors during order updates', async () => {
    const mockSendMulticast = vi.fn().mockImplementation(async (msg: any) => {
      // Find index of macbookToken
      const macbookIdx = msg.tokens.indexOf(macbookToken);
      const responses = msg.tokens.map((tok: string, idx: number) => {
        if (idx === macbookIdx) {
          return {
            success: false,
            error: {
              code: 'messaging/registration-token-not-registered',
              message: 'Requested entity was not found.',
            },
          };
        }
        return { success: true };
      });

      return {
        successCount: 1,
        failureCount: 1,
        responses,
      };
    });

    vi.spyOn(firebaseAdminModule, 'firebaseAdminMessaging', 'get').mockReturnValue({
      sendEachForMulticast: mockSendMulticast,
    } as any);

    await updateOrderStatus(testOrder.id, OrderStatus.PROCESSING);

    // Verify dead device (macbookToken) was pruned from database
    const macbookDevice = await prisma.userDevice.findUnique({
      where: { token: macbookToken },
    });
    expect(macbookDevice).toBeNull();

    // Verify active healthy device remains in database
    const iphoneDevice = await prisma.userDevice.findUnique({
      where: { token: iphoneToken },
    });
    expect(iphoneDevice).not.toBeNull();
  });

  it('should fall back to User.fcmToken when no UserDevice records exist for user', async () => {
    const legacyTimestamp = Date.now() + Math.floor(Math.random() * 100000);
    const legacyUser = await prisma.user.create({
      data: {
        email: `legacy-order-patron-${legacyTimestamp}@example.com`,
        name: 'Legacy Single Token Patron',
        fcmToken: `legacy-token-solo-${legacyTimestamp}`,
      },
    });

    const legacyOrder = await prisma.order.create({
      data: {
        user: { connect: { id: legacyUser.id } },
        totalAmount: 1000000,
        status: OrderStatus.PENDING,
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

    await updateOrderStatus(legacyOrder.id, OrderStatus.COMPLETED);

    expect(mockSendMulticast).toHaveBeenCalledTimes(1);
    const multicastArg = mockSendMulticast.mock.calls[0][0];
    expect(multicastArg.tokens).toEqual([`legacy-token-solo-${legacyTimestamp}`]);
  });

  it('should dispatch to fallback send method when sendEachForMulticast is not present', async () => {
    const mockSend = vi.fn().mockResolvedValue('single-msg-id-123');

    vi.spyOn(firebaseAdminModule, 'firebaseAdminMessaging', 'get').mockReturnValue({
      send: mockSend,
    } as any);

    const result = await sendPushToUser(testUser.id, {
      title: 'Voucher Gift Alert',
      body: 'You received a 20% discount voucher!',
      url: '/account?tab=vouchers',
    });

    expect(result.success).toBe(true);
    expect(result.totalRecipients).toBe(2);
    expect(mockSend).toHaveBeenCalledTimes(2);

    const tokensSent = mockSend.mock.calls.map((c) => c[0].token);
    expect(tokensSent).toContain(iphoneToken);
    expect(tokensSent).toContain(macbookToken);
  });
});
