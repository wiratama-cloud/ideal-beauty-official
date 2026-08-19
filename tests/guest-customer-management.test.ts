process.env.USE_IN_MEMORY_DB = 'true';

import { expect, test, describe, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { pruneOrphanGuestUsers } from '../src/lib/services/user';
import { getWishlistedProductIds } from '../src/lib/services/wishlist';
import {
  pruneGuestUsersAction,
  getAdminNotificationRecipientsAction,
  getCustomersAction,
} from '../src/app/actions/admin';
import { getPrimaryAdminEmail } from '../src/lib/services/access';

describe('Guest Customer Management & Pruning Services', () => {
  const testProductSlug = 'guest-prune-test-product';
  let sampleVariantId: string;
  const runId = Date.now();

  const cleanupGuestUsers = async () => {
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'guest_sess_' } },
          { email: { contains: 'registered.patron.old' } },
        ],
      },
      include: {
        cart: true,
        orders: true,
      },
    });

    const userIds = testUsers.map((u) => u.id);
    const cartIds = testUsers.map((u) => u.cart?.id).filter(Boolean) as string[];
    const orderIds = testUsers.flatMap((u) => u.orders.map((o) => o.id));

    if (cartIds.length > 0) {
      await prisma.cartItem.deleteMany({
        where: { cartId: { in: cartIds } },
      });
      await prisma.cart.deleteMany({
        where: { id: { in: cartIds } },
      });
    }

    if (orderIds.length > 0) {
      await prisma.orderItem.deleteMany({
        where: { orderId: { in: orderIds } },
      });
      await prisma.payment.deleteMany({
        where: { orderId: { in: orderIds } },
      });
      await prisma.order.deleteMany({
        where: { id: { in: orderIds } },
      });
    }

    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }
  };

  beforeAll(async () => {
    await cleanupGuestUsers();

    // Ensure primary admin exists
    const primaryEmail = getPrimaryAdminEmail();
    await prisma.adminAccess.upsert({
      where: { email: primaryEmail },
      update: {},
      create: {
        email: primaryEmail,
        role: 'SUPER_ADMIN',
      },
    });

    // Create dummy product variant for cart tests
    const product = await prisma.product.create({
      data: {
        name: 'Prune Test Gown',
        slug: `${testProductSlug}-${runId}`,
        isActive: true,
        variants: {
          create: {
            sku: `PRUNE-TEST-SKU-${runId}`,
            attributes: { color: 'Black', size: 'M' },
            priceSale: 1000000,
            stockSaleTotal: 10,
            stockSaleAvailable: 10,
          },
        },
      },
      include: {
        variants: true,
      },
    });

    sampleVariantId = product.variants[0].id;
  });

  afterAll(async () => {
    await cleanupGuestUsers();

    // Cleanup products and test variants
    await prisma.cartItem.deleteMany({
      where: { variantId: sampleVariantId },
    });
    await prisma.productVariant.deleteMany({
      where: { id: sampleVariantId },
    });
    await prisma.product.deleteMany({
      where: { slug: `${testProductSlug}-${runId}` },
    });
  });

  test('1. pruneOrphanGuestUsers removes stale empty guests but preserves active/recent guests and patrons', async () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    // 1. Stale orphan guest (should be pruned)
    const staleOrphanGuest = await prisma.user.create({
      data: {
        email: `guest_sess_orphan_stale_${runId}_1@idealbeautyofficial.com`,
        name: 'Guest Customer',
        createdAt: tenDaysAgo,
      },
    });

    // 2. Recent orphan guest (< 7 days, should NOT be pruned)
    const recentOrphanGuest = await prisma.user.create({
      data: {
        email: `guest_sess_orphan_recent_${runId}_2@idealbeautyofficial.com`,
        name: 'Guest Customer',
        createdAt: twoDaysAgo,
      },
    });

    // 3. Stale guest with an order (should NOT be pruned)
    const staleGuestWithOrder = await prisma.user.create({
      data: {
        email: `guest_sess_with_order_${runId}_3@idealbeautyofficial.com`,
        name: 'Guest Customer',
        createdAt: tenDaysAgo,
      },
    });

    const order = await prisma.order.create({
      data: {
        userId: staleGuestWithOrder.id,
        totalAmount: 1000000,
        status: 'PAID',
      },
    });

    // 4. Stale guest with active cart item (should NOT be pruned)
    const staleGuestWithCart = await prisma.user.create({
      data: {
        email: `guest_sess_with_cart_${runId}_4@idealbeautyofficial.com`,
        name: 'Guest Customer',
        createdAt: tenDaysAgo,
        cart: {
          create: {
            items: {
              create: {
                variantId: sampleVariantId,
                type: 'SALE',
                quantity: 1,
              },
            },
          },
        },
      },
    });

    // 5. Registered customer account (even old without orders, should NOT be pruned)
    const registeredPatron = await prisma.user.create({
      data: {
        email: `registered.patron.old.${runId}@idealbeautyofficial.com`,
        name: 'Lady Beatrice Regular',
        createdAt: tenDaysAgo,
      },
    });

    // Run pruning for guests older than 7 days
    const pruneResult = await pruneOrphanGuestUsers(7);

    expect(pruneResult.count).toBeGreaterThanOrEqual(1);
    expect(pruneResult.prunedUserIds).toContain(staleOrphanGuest.id);

    // Verify stale orphan guest was deleted
    const staleDeleted = await prisma.user.findUnique({
      where: { id: staleOrphanGuest.id },
    });
    expect(staleDeleted).toBeNull();

    // Verify recent guest was preserved
    const recentPreserved = await prisma.user.findUnique({
      where: { id: recentOrphanGuest.id },
    });
    expect(recentPreserved).not.toBeNull();

    // Verify guest with order was preserved
    const guestWithOrderPreserved = await prisma.user.findUnique({
      where: { id: staleGuestWithOrder.id },
    });
    expect(guestWithOrderPreserved).not.toBeNull();

    // Verify guest with cart was preserved
    const guestWithCartPreserved = await prisma.user.findUnique({
      where: { id: staleGuestWithCart.id },
    });
    expect(guestWithCartPreserved).not.toBeNull();

    // Verify registered patron was preserved
    const registeredPreserved = await prisma.user.findUnique({
      where: { id: registeredPatron.id },
    });
    expect(registeredPreserved).not.toBeNull();

    // Cleanup created test records
    await prisma.cartItem.deleteMany({
      where: { cart: { userId: staleGuestWithCart.id } },
    });
    await prisma.cart.deleteMany({
      where: { userId: staleGuestWithCart.id },
    });
    await prisma.order.deleteMany({
      where: { id: order.id },
    });
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [
            recentOrphanGuest.id,
            staleGuestWithOrder.id,
            staleGuestWithCart.id,
            registeredPatron.id,
          ],
        },
      },
    });
  });

  test('2. pruneGuestUsersAction executes with admin access and writes audit log', async () => {
    const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);

    const testGuestToPrune = await prisma.user.create({
      data: {
        email: 'guest_sess_action_test_5@idealbeautyofficial.com',
        name: 'Guest Customer',
        createdAt: twentyDaysAgo,
      },
    });

    const actionResult = await pruneGuestUsersAction(14);
    expect(actionResult.success).toBe(true);
    expect(actionResult.count).toBeGreaterThanOrEqual(1);
    expect(actionResult.prunedUserIds).toContain(testGuestToPrune.id);

    // Verify audit log
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'PRUNE_GUEST_USERS',
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(auditLog).not.toBeNull();
    expect(auditLog?.entity).toBe('USER');
    expect((auditLog?.details as any)?.daysOld).toBe(14);
  });

  test('3. getAdminNotificationRecipientsAction excludes guest customers', async () => {
    // Create a registered customer
    const registeredUser = await prisma.user.create({
      data: {
        email: `registered.recipient.${runId}@idealbeautyofficial.com`,
        name: 'Lady Genevieve Recipient',
        phone: '+6281234567890',
        fcmToken: 'mock_fcm_token_123',
      },
    });

    // Create a guest customer with default name
    const guestUserByName = await prisma.user.create({
      data: {
        email: `notguest_email_${runId}@idealbeautyofficial.com`,
        name: 'Guest Customer',
      },
    });

    // Create a guest customer with guest_ email prefix
    const guestUserByEmail = await prisma.user.create({
      data: {
        email: `guest_custom_${runId}@idealbeautyofficial.com`,
        name: 'Custom Named Guest',
      },
    });

    const recipients = await getAdminNotificationRecipientsAction();

    const recipientIds = recipients.map((r) => r.id);
    expect(recipientIds).toContain(registeredUser.id);
    expect(recipientIds).not.toContain(guestUserByName.id);
    expect(recipientIds).not.toContain(guestUserByEmail.id);

    // Verify properties
    const found = recipients.find((r) => r.id === registeredUser.id);
    expect(found).toBeDefined();
    expect(found?.hasFcmToken).toBe(true);
    expect(found?.name).toBe('Lady Genevieve Recipient');

    // Cleanup
    await prisma.user.deleteMany({
      where: {
        id: { in: [registeredUser.id, guestUserByName.id, guestUserByEmail.id] },
      },
    });
  });

  test('4. getCustomersAction excludes guest customers', async () => {
    // Create a registered customer
    const registeredCustomer = await prisma.user.create({
      data: {
        email: `registered.customer.${runId}@idealbeautyofficial.com`,
        name: 'Baroness Charlotte Customer',
        phone: '+6281234567891',
      },
    });

    // Create guest customers
    const guestUser1 = await prisma.user.create({
      data: {
        email: `someuser_${runId}@idealbeautyofficial.com`,
        name: 'Guest Customer',
      },
    });

    const guestUser2 = await prisma.user.create({
      data: {
        email: `guest_sess_picker_${runId}@idealbeautyofficial.com`,
        name: 'Picker Guest',
      },
    });

    const customers = await getCustomersAction();
    const customerIds = customers.map((c) => c.id);

    expect(customerIds).toContain(registeredCustomer.id);
    expect(customerIds).not.toContain(guestUser1.id);
    expect(customerIds).not.toContain(guestUser2.id);

    // Cleanup
    await prisma.user.deleteMany({
      where: {
        id: { in: [registeredCustomer.id, guestUser1.id, guestUser2.id] },
      },
    });
  });

  test('5. getWishlistedProductIds safely returns empty array for null or undefined user', async () => {
    const idsNull = await getWishlistedProductIds(null);
    expect(idsNull).toEqual([]);

    const idsUndefined = await getWishlistedProductIds(undefined);
    expect(idsUndefined).toEqual([]);

    const idsEmpty = await getWishlistedProductIds('');
    expect(idsEmpty).toEqual([]);
  });
});
