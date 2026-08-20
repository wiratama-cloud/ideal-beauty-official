process.env.USE_IN_MEMORY_DB = 'true';

import { expect, test, describe, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  createVoucher,
  getUserVouchers,
  getUserVoucherHistory,
  checkVoucher,
  validateVoucherForCart,
} from '../src/lib/services/voucher';
import { getUserAccount } from '../src/lib/services/account';
import {
  getUserVouchersAction,
  checkVoucherAction,
  claimOrCheckVoucherAction,
} from '../src/app/actions/account';

describe('Storefront Patron Vouchers & Account Integration', () => {
  let patronUser: any;
  let otherUser: any;

  const testCodes = [
    'TST_EVENT_ACTIVE',
    'TST_EVENT_EXPIRED',
    'TST_EVENT_FUTURE',
    'TST_EVENT_LIMIT',
    'TST_VIP_PATRON',
    'TST_VIP_OTHER',
    'TST_INACTIVE_CODE',
  ];

  beforeAll(async () => {
    // Cleanup prior test run state if any
    const existingUsers = await prisma.user.findMany({
      where: {
        email: { in: ['patron.voucher.test@idealbeautyofficial.com', 'other.patron.test@idealbeautyofficial.com'] },
      },
      select: { id: true },
    });
    const userIds = existingUsers.map((u) => u.id);

    if (userIds.length > 0) {
      await prisma.voucherUsage.deleteMany({
        where: {
          OR: [{ userId: { in: userIds } }, { voucher: { code: { in: testCodes } } }],
        },
      });
      await prisma.order.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }

    await prisma.voucher.deleteMany({
      where: { code: { in: testCodes } },
    });

    // Create test patron user
    patronUser = await prisma.user.create({
      data: {
        email: 'patron.voucher.test@idealbeautyofficial.com',
        name: 'Madame V. Test Patron',
        phone: '+6281299990001',
      },
    });

    otherUser = await prisma.user.create({
      data: {
        email: 'other.patron.test@idealbeautyofficial.com',
        name: 'Sir Other Patron',
        phone: '+6281299990002',
      },
    });
  });

  afterAll(async () => {
    // Cleanup usages
    await prisma.voucherUsage.deleteMany({
      where: {
        OR: [
          { userId: patronUser.id },
          { userId: otherUser.id },
          { voucher: { code: { in: testCodes } } },
        ],
      },
    });

    // Cleanup vouchers
    await prisma.voucher.deleteMany({
      where: {
        code: { in: testCodes },
      },
    });

    // Cleanup orders & users
    await prisma.order.deleteMany({
      where: {
        userId: { in: [patronUser.id, otherUser.id] },
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: { in: [patronUser.id, otherUser.id] },
      },
    });
  });

  test('1. getUserVouchers returns active event vouchers and user-bound VIP vouchers, excluding other users vouchers', async () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Active event voucher
    await createVoucher({
      code: 'TST_EVENT_ACTIVE',
      description: 'Active 15% Storewide Promo',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      targetType: 'EVENT',
      startDate: pastDate,
      endDate: futureDate,
    });

    // Expired event voucher
    await createVoucher({
      code: 'TST_EVENT_EXPIRED',
      description: 'Expired Event Voucher',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      targetType: 'EVENT',
      startDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      endDate: pastDate,
    });

    // Future event voucher
    await createVoucher({
      code: 'TST_EVENT_FUTURE',
      description: 'Future Event Voucher',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      targetType: 'EVENT',
      startDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
    });

    // Limit reached voucher
    await prisma.voucher.create({
      data: {
        code: 'TST_EVENT_LIMIT',
        description: 'Limit Reached Voucher',
        discountType: 'FIXED_AMOUNT',
        discountValue: 100000,
        targetType: 'EVENT',
        usageLimit: 5,
        usageCount: 5,
        isActive: true,
      },
    });

    // VIP Customer voucher for patronUser
    await createVoucher({
      code: 'TST_VIP_PATRON',
      description: 'Exclusive IDR 500,000 for Patron',
      discountType: 'FIXED_AMOUNT',
      discountValue: 500000,
      targetType: 'CUSTOMER',
      userId: patronUser.id,
      startDate: pastDate,
      endDate: futureDate,
    });

    // VIP Customer voucher for otherUser
    await createVoucher({
      code: 'TST_VIP_OTHER',
      description: 'Exclusive IDR 300,000 for Other Patron',
      discountType: 'FIXED_AMOUNT',
      discountValue: 300000,
      targetType: 'CUSTOMER',
      userId: otherUser.id,
      startDate: pastDate,
      endDate: futureDate,
    });

    const patronVouchers = await getUserVouchers(patronUser.id);
    const codes = patronVouchers.map((v) => v.code);

    // Should include patron's own VIP voucher and active event vouchers
    expect(codes).toContain('TST_VIP_PATRON');
    expect(codes).toContain('TST_EVENT_ACTIVE');
    expect(codes).toContain('TST_EVENT_FUTURE');
    expect(codes).toContain('TST_EVENT_LIMIT');

    // Should NOT include otherUser's customer voucher
    expect(codes).not.toContain('TST_VIP_OTHER');

    // Check availability flags
    const activeEvent = patronVouchers.find((v) => v.code === 'TST_EVENT_ACTIVE');
    expect(activeEvent?.isAvailable).toBe(true);
    expect(activeEvent?.isExpired).toBe(false);
    expect(activeEvent?.isStarted).toBe(true);
    expect(activeEvent?.isLimitReached).toBe(false);

    const vipPatron = patronVouchers.find((v) => v.code === 'TST_VIP_PATRON');
    expect(vipPatron?.isAvailable).toBe(true);
    expect(vipPatron?.discountValue).toBe(500000);

    const limitEvent = patronVouchers.find((v) => v.code === 'TST_EVENT_LIMIT');
    expect(limitEvent?.isLimitReached).toBe(true);
    expect(limitEvent?.isAvailable).toBe(false);

    const futureEvent = patronVouchers.find((v) => v.code === 'TST_EVENT_FUTURE');
    expect(futureEvent?.isStarted).toBe(false);
    expect(futureEvent?.isAvailable).toBe(false);
  });

  test('2. Redemption marking and getUserVoucherHistory functionality', async () => {
    // Create an order for patron
    const order = await prisma.order.create({
      data: {
        userId: patronUser.id,
        totalAmount: 1500000,
        discountAmount: 225000,
        status: 'PAID',
      },
    });

    const activeVoucher = await prisma.voucher.findUnique({
      where: { code: 'TST_EVENT_ACTIVE' },
    });

    // Record voucher usage
    await prisma.voucherUsage.create({
      data: {
        voucherId: activeVoucher!.id,
        orderId: order.id,
        userId: patronUser.id,
        discountAmount: 225000,
      },
    });

    // Re-query vouchers for patron
    const vouchersAfterUsage = await getUserVouchers(patronUser.id);
    const usedVoucher = vouchersAfterUsage.find((v) => v.code === 'TST_EVENT_ACTIVE');

    expect(usedVoucher?.isUsed).toBe(true);
    expect(usedVoucher?.userUsageCount).toBe(1);
    expect(usedVoucher?.isAvailable).toBe(false);

    // Query redemption history
    const history = await getUserVoucherHistory(patronUser.id);
    expect(history.length).toBeGreaterThanOrEqual(1);

    const historyRecord = history.find((h) => h.voucher?.code === 'TST_EVENT_ACTIVE');
    expect(historyRecord).toBeDefined();
    expect(historyRecord?.discountAmount).toBe(225000);
    expect(historyRecord?.order?.id).toBe(order.id);
    expect(historyRecord?.order?.status).toBe('PAID');
  });

  test('3. checkVoucher validates codes, status, dates, customer assignment, and past usage', async () => {
    // 1. Inactive voucher check
    await createVoucher({
      code: 'TST_INACTIVE_CODE',
      description: 'Inactive Voucher',
      discountType: 'PERCENTAGE',
      discountValue: 10,
    });
    const inactiveDb = await prisma.voucher.update({
      where: { code: 'TST_INACTIVE_CODE' },
      data: { isActive: false },
    });

    const inactiveCheck = await checkVoucher('TST_INACTIVE_CODE', patronUser.id);
    expect(inactiveCheck.valid).toBe(false);
    expect(inactiveCheck.message).toContain('inactive');

    // 2. Non-existent code
    const nonExistentCheck = await checkVoucher('DOES_NOT_EXIST_CODE', patronUser.id);
    expect(nonExistentCheck.valid).toBe(false);
    expect(nonExistentCheck.message).toContain('Invalid voucher code');

    // 3. Customer mismatch
    const customerMismatch = await checkVoucher('TST_VIP_OTHER', patronUser.id);
    expect(customerMismatch.valid).toBe(false);
    expect(customerMismatch.message).toContain('reserved for a specific customer account');

    // 4. Already redeemed voucher
    const alreadyRedeemed = await checkVoucher('TST_EVENT_ACTIVE', patronUser.id);
    expect(alreadyRedeemed.valid).toBe(false);
    expect(alreadyRedeemed.message).toContain('already redeemed');

    // 5. Valid unredeemed VIP voucher
    const validVipCheck = await checkVoucher('TST_VIP_PATRON', patronUser.id);
    expect(validVipCheck.valid).toBe(true);
    expect(validVipCheck.voucher?.code).toBe('TST_VIP_PATRON');
  });

  test('4. getUserAccount includes accurate available vouchers count in _count and top-level fields', async () => {
    const userVouchers = await getUserVouchers(patronUser.id);
    const expectedAvailableCount = userVouchers.filter((v) => v.isAvailable).length;

    const account = await getUserAccount(patronUser.id);
    expect(account).toBeDefined();
    expect(account?._count.vouchers).toBeDefined();
    expect(typeof account?._count.vouchers).toBe('number');
    expect(account?._count.vouchers).toBe(expectedAvailableCount);
    expect(account?.vouchersCount).toBe(expectedAvailableCount);
    expect(account?.availableVouchersCount).toBe(expectedAvailableCount);
  });

  test('5. Server Actions: getUserVouchersAction and checkVoucherAction execute correctly', async () => {
    // Check voucher action on non-existent code
    const invalidRes = await checkVoucherAction('NON_EXISTENT_CODE');
    expect(invalidRes.success).toBe(true);
    expect(invalidRes.data?.valid).toBe(false);
    expect(invalidRes.data?.message).toContain('Invalid voucher code');

    // Check voucher action on limit-reached voucher
    const limitRes = await checkVoucherAction('TST_EVENT_LIMIT');
    expect(limitRes.success).toBe(true);
    expect(limitRes.data?.valid).toBe(false);
    expect(limitRes.data?.message).toContain('maximum usage limit');

    // Claim or check voucher action
    const claimRes = await claimOrCheckVoucherAction('NON_EXISTENT_CODE');
    expect(claimRes.success).toBe(true);
    expect(claimRes.data?.valid).toBe(false);

    // Get vouchers action
    const vouchersRes = await getUserVouchersAction();
    expect(vouchersRes.success).toBe(true);
    expect(vouchersRes.data).toBeDefined();
    expect(Array.isArray(vouchersRes.data?.vouchers)).toBe(true);
    expect(Array.isArray(vouchersRes.data?.history)).toBe(true);
  });

  test('6. validateVoucherForCart calculates percentage and fixed discounts, enforces minPurchase and maxDiscount caps', async () => {
    // Create a voucher with minPurchase and maxDiscount
    await createVoucher({
      code: 'TST_PERCENT_CAP',
      description: '20% off with IDR 200,000 min spend and IDR 50,000 cap',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minPurchase: 200000,
      maxDiscount: 50000,
      targetType: 'EVENT',
    });

    // 1. Below minPurchase
    const belowMin = await validateVoucherForCart('TST_PERCENT_CAP', 150000, patronUser.id);
    expect(belowMin.valid).toBe(false);
    expect(belowMin.message).toContain('Minimum purchase amount');

    // 2. Above minPurchase, discount under cap (subtotal = 200,000 -> 20% = 40,000)
    const normalDiscount = await validateVoucherForCart('TST_PERCENT_CAP', 200000, patronUser.id);
    expect(normalDiscount.valid).toBe(true);
    expect(normalDiscount.discountAmount).toBe(40000);
    expect(normalDiscount.finalTotal).toBe(160000);

    // 3. Above minPurchase, discount capped (subtotal = 500,000 -> 20% = 100,000 capped to 50,000)
    const cappedDiscount = await validateVoucherForCart('TST_PERCENT_CAP', 500000, patronUser.id);
    expect(cappedDiscount.valid).toBe(true);
    expect(cappedDiscount.discountAmount).toBe(50000);
    expect(cappedDiscount.finalTotal).toBe(450000);

    // Clean up
    await prisma.voucher.deleteMany({
      where: { code: 'TST_PERCENT_CAP' },
    });
  });

  test('7. Storefront Vouchers UI components and metadata are properly exported and configured', async () => {
    const { metadata } = await import('../src/app/(storefront)/account/vouchers/page');
    expect(metadata.title).toContain('My Vouchers');
    expect(metadata.description).toBeDefined();

    const VouchersListClient = (await import('../src/components/account/VouchersListClient')).default;
    expect(typeof VouchersListClient).toBe('function');

    const AccountNavigationHeader = (await import('../src/components/account/AccountNavigationHeader')).default;
    expect(typeof AccountNavigationHeader).toBe('function');
  });
});
