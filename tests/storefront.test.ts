process.env.USE_IN_MEMORY_DB = 'true';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-bucket';

import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { sendOrderPushNotification } from '../src/lib/services/notification';

const { mockSendMessage } = vi.hoisted(() => {
  const mockSendMessage = vi.fn().mockImplementation(async (message: any) => {
    return 'projects/test-project/messages/mock-msg-id-123';
  });

  return { mockSendMessage };
});

vi.mock('@/lib/firebase/admin', () => ({
  firebaseAdmin: {},
  firebaseAdminAuth: {
    verifyIdToken: vi.fn(),
  },
  firebaseAdminMessaging: {
    send: (msg: any) => mockSendMessage(msg),
  },
  firebaseAdminStorage: {
    bucket: vi.fn().mockReturnValue({
      file: vi.fn().mockReturnValue({
        save: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
  verifyIdToken: vi.fn(),
}));

vi.mock('firebase-admin/storage', () => ({
  getDownloadURL: vi.fn().mockResolvedValue('https://storage.googleapis.com/test-bucket/uploads/test-image.jpg'),
}));
import { getProducts, getCategories } from '../src/lib/services/product';
import { toggleWishlistItem, getUserWishlist } from '../src/lib/services/wishlist';
import { addItemToCart, getOrCreateCart, mergeGuestCartToUser } from '../src/lib/services/cart';
import { createOrder, getOrderById, updateOrderStatus, updateOrderShippingInfo } from '../src/lib/services/order';
import { createVoucher, getVouchers, validateVoucherForCart } from '../src/lib/services/voucher';
import { processPaymentCompletion, createFinalBalancePayment } from '../src/lib/services/payment';
import { getFinancialSummary, createExpenseEntry, generateLedgerCSV, getLedgerEntries } from '../src/lib/services/ledger';
import { recordStockAdjustment, getInventoryTransactions } from '../src/lib/services/inventory';
import {
  createLandingSection,
  getLandingSections,
  updateLandingSection,
  deleteLandingSection,
  createLandingSectionItem,
  deleteLandingSectionItem,
} from '../src/lib/services/section';
import {
  getNavCategories,
  createNavCategory,
  updateNavCategory,
  deleteNavCategory,
  reorderNavCategories,
  resetDefaultNavCategories,
} from '../src/lib/services/nav-category';
import {
  createRentalBlockAction,
  deleteRentalBlockAction,
  getVariantRentalAvailabilityAction,
  getAdminRentalCalendarDataAction,
} from '../src/app/actions/rental';

describe('Ideal Beauty Official E-Commerce Integration Test Suite', () => {
  let sampleUser: any;
  let sampleProduct: any;
  let sampleVariant: any;

  beforeAll(async () => {
    // Seed test data
    await prisma.navCategory.deleteMany();
    await prisma.voucherUsage.deleteMany();
    await prisma.voucher.deleteMany();
    await prisma.ledgerEntry.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.wishlistItem.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    sampleUser = await prisma.user.create({
      data: {
        email: 'test.patron@idealbeautyofficial.com',
        name: 'Test Patron',
        phone: '+628111111111',
      },
    });

    sampleProduct = await prisma.product.create({
      data: {
        name: 'Royal Velvet Emerald Kaftan Test',
        slug: 'royal-velvet-emerald-kaftan-test',
        description: 'Test luxury kaftan',
        category: 'Haute Couture',
        images: ['https://example.com/test1.jpg'],
        variants: {
          create: [
            {
              sku: 'TEST-KAF-01',
              attributes: { size: 'M', color: 'Emerald' },
              priceSale: 5000000.0,
              priceRent: 1000000.0,
              costPrice: 2000000.0,
              stockTotal: 10,
              stockAvailable: 10,
              stockSaleTotal: 10,
              stockSaleAvailable: 10,
              stockRentTotal: 10,
              stockRentAvailable: 10,
            },
          ],
        },
      },
      include: {
        variants: true,
      },
    });

    sampleVariant = sampleProduct.variants[0];
  });

  test('1. Catalog Search & Category Filtering', async () => {
    const products = await getProducts({ category: 'Haute Couture' });
    expect(products.length).toBeGreaterThan(0);
    expect(products[0].name).toContain('Royal Velvet Emerald Kaftan');

    const categories = await getCategories();
    expect(categories).toContain('Haute Couture');
  });

  test('2. Wishlist Toggle & Persistence', async () => {
    const toggleRes1 = await toggleWishlistItem(sampleUser.id, sampleProduct.id, sampleVariant.id);
    expect(toggleRes1.wishlisted).toBe(true);

    const wishlist = await getUserWishlist(sampleUser.id);
    expect(wishlist.length).toBe(1);
    expect(wishlist[0].productId).toBe(sampleProduct.id);

    const toggleRes2 = await toggleWishlistItem(sampleUser.id, sampleProduct.id, sampleVariant.id);
    expect(toggleRes2.wishlisted).toBe(false);
  });

  test('3. Guest Cart & User Login Sync', async () => {
    const guestSessionId = 'guest_session_12345';
    await addItemToCart(guestSessionId, {
      variantId: sampleVariant.id,
      type: 'SALE',
      quantity: 2,
    });

    const guestCart = await getOrCreateCart(guestSessionId);
    expect(guestCart.items.length).toBe(1);
    expect(guestCart.items[0].quantity).toBe(2);

    // Merge to logged-in user
    const mergedCart = await mergeGuestCartToUser(guestSessionId, sampleUser.id);
    expect(mergedCart.items.length).toBe(1);
    expect(mergedCart.items[0].quantity).toBe(2);
  });

  test('4. Atomic Checkout with Down Payment & Stock Deduction', async () => {
    const initialVariant = await prisma.productVariant.findUnique({ where: { id: sampleVariant.id } });
    const initialStock = initialVariant?.stockAvailable || 0;

    const checkoutRes = await createOrder({
      userId: sampleUser.id,
      shippingAddress: {
        recipientName: 'Test Patron',
        phone: '+628111111111',
        addressLine1: 'Jl. Senopati 45',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '12190',
      },
      paymentType: 'DOWN_PAYMENT',
      paymentMethod: 'QRIS',
      downPaymentPercentage: 50,
    });

    expect(checkoutRes.order.status).toBe('PENDING');
    expect(Number(checkoutRes.payment.amount)).toBe(5000000.0); // 50% of 2 * 5,000,000 = 5,000,000

    // Verify stock is decremented atomically
    const updatedVariant = await prisma.productVariant.findUnique({ where: { id: sampleVariant.id } });
    expect(updatedVariant?.stockAvailable).toBe(initialStock - 2);
  });

  test('5. High Concurrency Stock Protection', async () => {
    // Attempt to order quantity exceeding remaining stock
    const variant = await prisma.productVariant.findUnique({ where: { id: sampleVariant.id } });
    const available = variant?.stockSaleAvailable || variant?.stockAvailable || 0;

    // Directly insert into cart to bypass cart level check and test atomic transaction protection in createOrder
    const userCart = await getOrCreateCart(sampleUser.id);
    await prisma.cartItem.create({
      data: {
        cartId: userCart.id,
        variantId: sampleVariant.id,
        type: 'SALE',
        quantity: available + 5,
      },
    });

    await expect(
      createOrder({
        userId: sampleUser.id,
        shippingAddress: {
          recipientName: 'Overbuy Test',
          phone: '+628111111111',
          addressLine1: 'Jl. Senopati 45',
          city: 'Jakarta',
          province: 'DKI Jakarta',
          postalCode: '12190',
        },
        paymentType: 'FULL_PAYMENT',
        paymentMethod: 'QRIS',
      })
    ).rejects.toThrow(/Insufficient.*stock available/);
  });

  test('6. Payment Webhook Verification & Ledger Income Creation', async () => {
    const orders = await prisma.order.findMany({ where: { userId: sampleUser.id } });
    const order = orders[0];
    const pendingPayment = await prisma.payment.findFirst({
      where: { orderId: order.id, status: 'PENDING' },
    });

    expect(pendingPayment).not.toBeNull();

    // Complete Down Payment
    await processPaymentCompletion(pendingPayment!.id, 'PROVIDER-TX-1001');

    const updatedOrder = await getOrderById(order.id);
    expect(updatedOrder?.status).toBe('PARTIALLY_PAID');

    // Verify Ledger INCOME Entry
    const summary = await getFinancialSummary();
    expect(summary.totalIncome).toBeGreaterThan(0);
    expect(summary.incomeByCategory['SALES_REVENUE']).toBeGreaterThan(0);
  });

  test('7. Pay Final Balance & Order Complete Transition', async () => {
    const orders = await prisma.order.findMany({ where: { userId: sampleUser.id, status: 'PARTIALLY_PAID' } });
    const order = orders[0];

    const finalPayment = await createFinalBalancePayment(order.id, 'BANK_TRANSFER', 'BCA');
    expect(finalPayment.type).toBe('FINAL_BALANCE');

    // Complete Final Balance Payment
    await processPaymentCompletion(finalPayment.id, 'PROVIDER-TX-1002');

    const completedOrder = await getOrderById(order.id);
    expect(completedOrder?.status).toBe('PAID');
  });

  test('8. Double-Entry Ledger Expense Logging & CSV Export', async () => {
    await createExpenseEntry({
      amount: 1500000,
      description: 'Zardozi Embroidery Thread Procurement',
      expenseCategory: 'MANUFACTURING_COGS',
    });

    const summary = await getFinancialSummary();
    expect(summary.totalExpense).toBeGreaterThan(0);
    expect(summary.expenseByCategory['MANUFACTURING_COGS']).toBe(1500000);

    const csvContent = await generateLedgerCSV();
    expect(csvContent).toContain('Sequence,ID,Date,Type,Dr/Cr,TranCode,TranSeq,Category,Amount (IDR)');
    expect(csvContent).toContain('MANUFACTURING_COGS');
  });

  test('9. Rental Items Require 100% Full Payment Enforcement', async () => {
    // Clear user cart
    const userCart = await getOrCreateCart(sampleUser.id);
    await prisma.cartItem.deleteMany({ where: { cartId: userCart.id } });

    // Add rental item to cart
    await addItemToCart(sampleUser.id, {
      variantId: sampleVariant.id,
      type: 'RENTAL',
      quantity: 1,
    });

    // Attempting DOWN_PAYMENT for rental item must be rejected
    await expect(
      createOrder({
        userId: sampleUser.id,
        shippingAddress: {
          recipientName: 'Rental Patron',
          phone: '+628111111111',
          addressLine1: 'Jl. Senopati 45',
          city: 'Jakarta',
          province: 'DKI Jakarta',
          postalCode: '12190',
        },
        paymentType: 'DOWN_PAYMENT',
        paymentMethod: 'QRIS',
      })
    ).rejects.toThrow(/Rental items require 100% full payment/);

    // FULL_PAYMENT for rental item succeeds
    const rentalOrderRes = await createOrder({
      userId: sampleUser.id,
      shippingAddress: {
        recipientName: 'Rental Patron',
        phone: '+628111111111',
        addressLine1: 'Jl. Senopati 45',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '12190',
      },
      paymentType: 'FULL_PAYMENT',
      paymentMethod: 'QRIS',
    });

    expect(rentalOrderRes.order.status).toBe('PENDING');
    expect(Number(rentalOrderRes.payment.amount)).toBe(1000000.0);
  });

  test('10. Landing Page Configurable Sections & Admin Console Management', async () => {
    // Create new landing section with subcategory tabs
    const createdSection = await createLandingSection({
      title: 'New Arrivals Test Section',
      subtitle: 'Curated test releases',
      type: 'NEW_ARRIVALS',
      viewAllUrl: '/products',
      displayOrder: 1,
      isActive: true,
      tabs: ['Women', 'Men', 'Kids'],
    });

    expect(createdSection.title).toBe('New Arrivals Test Section');
    expect(createdSection.tabs).toEqual(['Women', 'Men', 'Kids']);

    // Add item to Women tab
    const createdItem = await createLandingSectionItem({
      sectionId: createdSection.id,
      title: 'Emerald Kaftan',
      categoryTab: 'Women',
      productId: sampleProduct.id,
      displayOrder: 1,
    });

    expect(createdItem.categoryTab).toBe('Women');

    // Retrieve active landing sections
    const activeSections = await getLandingSections(true);
    const foundSection = activeSections.find((s) => s.id === createdSection.id);
    expect(foundSection).toBeDefined();
    expect(foundSection?.items.length).toBe(1);

    // Update section active state
    await updateLandingSection(createdSection.id, { isActive: false });
    const inactiveCheck = await getLandingSections(true);
    expect(inactiveCheck.some((s) => s.id === createdSection.id)).toBe(false);

    // Clean up test section
    await deleteLandingSectionItem(createdItem.id);
    await deleteLandingSection(createdSection.id);
  });

  test('11. Separate Sale and Rent Stock Pools', async () => {
    // Create a new test variant with stockSaleAvailable = 5 and stockRentAvailable = 2
    const testVariant = await prisma.productVariant.create({
      data: {
        productId: sampleProduct.id,
        sku: 'TEST-STOCK-SPLIT-01',
        attributes: { size: 'XL', color: 'Gold' },
        priceSale: 2000000,
        priceRent: 500000,
        stockSaleTotal: 5,
        stockSaleAvailable: 5,
        stockRentTotal: 2,
        stockRentAvailable: 2,
      },
    });

    // 1. Add SALE item and order it
    const userCart = await getOrCreateCart(sampleUser.id);
    await prisma.cartItem.deleteMany({ where: { cartId: userCart.id } });

    await addItemToCart(sampleUser.id, {
      variantId: testVariant.id,
      type: 'SALE',
      quantity: 1,
    });

    await createOrder({
      userId: sampleUser.id,
      shippingAddress: {
        recipientName: 'Sale Patron',
        phone: '+628111111111',
        addressLine1: 'Jl. Senopati 45',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '12190',
      },
      paymentType: 'FULL_PAYMENT',
      paymentMethod: 'QRIS',
    });

    const updatedVariant1 = await prisma.productVariant.findUnique({ where: { id: testVariant.id } });
    expect(updatedVariant1?.stockSaleAvailable).toBe(4);
    expect(updatedVariant1?.stockRentAvailable).toBe(2);

    // 2. Add RENTAL item and order it
    await addItemToCart(sampleUser.id, {
      variantId: testVariant.id,
      type: 'RENTAL',
      quantity: 1,
      rentStartDate: '2026-09-01',
      rentEndDate: '2026-09-05',
    });

    await createOrder({
      userId: sampleUser.id,
      shippingAddress: {
        recipientName: 'Rental Patron',
        phone: '+628111111111',
        addressLine1: 'Jl. Senopati 45',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '12190',
      },
      paymentType: 'FULL_PAYMENT',
      paymentMethod: 'QRIS',
    });

    const updatedVariant2 = await prisma.productVariant.findUnique({ where: { id: testVariant.id } });
    expect(updatedVariant2?.stockSaleAvailable).toBe(4);
    expect(updatedVariant2?.stockRentAvailable).toBe(1);
  });

  test('12. Admin Rental Maintenance Blocking & Calendar Availability Actions', async () => {
    // 1. Create a maintenance block
    const block = await createRentalBlockAction({
      variantId: sampleVariant.id,
      startDate: '2026-10-10',
      endDate: '2026-10-15',
      reason: 'DRY_CLEANING',
      notes: 'Post-gala dry cleaning',
    });

    expect(block.reason).toBe('DRY_CLEANING');

    // 2. Query availability for variant
    const availability = await getVariantRentalAvailabilityAction(sampleVariant.id);
    expect(availability.maintenanceRanges.some((m) => m.id === block.id)).toBe(true);

    // 3. Query admin calendar data
    const calendarData = await getAdminRentalCalendarDataAction();
    expect(calendarData.length).toBeGreaterThan(0);

    // 4. Delete maintenance block
    await deleteRentalBlockAction(block.id);
    const availabilityAfter = await getVariantRentalAvailabilityAction(sampleVariant.id);
    expect(availabilityAfter.maintenanceRanges.some((m) => m.id === block.id)).toBe(false);
  });

  test('13. Multi-Unit Rental Capacity Availability', async () => {
    // Create variant with stockRentTotal = 4
    const multiUnitVariant = await prisma.productVariant.create({
      data: {
        productId: sampleProduct.id,
        sku: 'TEST-CAPACITY-4',
        attributes: { size: 'M', color: 'Burgundy' },
        priceRent: 750000,
        stockRentTotal: 4,
        stockRentAvailable: 4,
      },
    });

    const availabilityBefore = await getVariantRentalAvailabilityAction(multiUnitVariant.id);
    expect(availabilityBefore.stockRentTotal).toBe(4);
    expect(availabilityBefore.bookedRanges.length).toBe(0);

    // Create 1 booking for date range 2026-11-01 -> 2026-11-05
    await addItemToCart(sampleUser.id, {
      variantId: multiUnitVariant.id,
      type: 'RENTAL',
      quantity: 1,
      rentStartDate: '2026-11-01',
      rentEndDate: '2026-11-05',
    });

    await createOrder({
      userId: sampleUser.id,
      shippingAddress: {
        recipientName: 'Patron 1',
        phone: '+628111111111',
        addressLine1: 'Jl. Senopati 45',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '12190',
      },
      paymentType: 'FULL_PAYMENT',
      paymentMethod: 'QRIS',
    });

    const availabilityAfter1 = await getVariantRentalAvailabilityAction(multiUnitVariant.id);
    expect(availabilityAfter1.bookedRanges.length).toBe(1);
    expect(availabilityAfter1.stockRentTotal).toBe(4);
    // 1 booking out of 4 total capacity -> date is still available (1 < 4)
  });

  test('14. Core Banking Ledger Fields and Inventory Adjustment Reason/Cost Tracking', async () => {
    // 1. Record stock adjustment with reason and purchase cost
    const adjResult = await recordStockAdjustment({
      variantId: sampleVariant.id,
      type: 'ADD',
      quantity: 5,
      reason: 'NEW_STOCK_PURCHASE',
      cost: 2500000,
      stockPool: 'SALE',
      notes: 'Procured 5 units from atelier supplier',
    });

    expect(adjResult.variant.purchaseCost).toBe(2500000);
    expect(adjResult.inventoryTransaction.reason).toBe('NEW_STOCK_PURCHASE');
    expect(adjResult.inventoryTransaction.cost).toBe(2500000);

    // 2. Verify automated ledger entry creation
    const ledgerEntries = await getLedgerEntries();
    const purchaseLedger = ledgerEntries.find((e) => e.tranCode === 'STOCK_PURCHASE');

    expect(purchaseLedger).toBeDefined();
    expect(purchaseLedger?.dcType).toBe('DEBIT');
    expect(purchaseLedger?.amount).toBe(12500000); // 5 units * 2,500,000 cost
    expect(purchaseLedger?.sequence).toBeGreaterThan(0);

    // 3. Verify core banking fields on payment income ledger entry
    const incomeLedger = ledgerEntries.find((e) => e.tranCode === 'PAYMENT_INCOME');
    expect(incomeLedger).toBeDefined();
    expect(incomeLedger?.dcType).toBe('CREDIT');
    expect(incomeLedger?.tranSequence).toBe(1);

    // 4. Retrieve inventory transaction logs
    const logs = await getInventoryTransactions(sampleVariant.id);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some((l) => l.reason === 'NEW_STOCK_PURCHASE')).toBe(true);
  });

  test('15. Voucher System Creation, Validation, Usage, and Admin Order Controls', async () => {
    // 1. Create Event Voucher (PERCENTAGE 20%, max discount IDR 500,000, min spend IDR 1,000,000)
    const eventVoucher = await createVoucher({
      code: 'ATELIER20',
      description: '20% Event Discount',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minPurchase: 1000000,
      maxDiscount: 500000,
      targetType: 'EVENT',
    });

    expect(eventVoucher.code).toBe('ATELIER20');

    // 2. Validate voucher for cart subtotal 5,000,000 IDR -> 20% of 5M is 1,000,000, capped at 500,000 IDR
    const valRes = await validateVoucherForCart('ATELIER20', 5000000, sampleUser.id);
    expect(valRes.valid).toBe(true);
    expect(valRes.discountAmount).toBe(500000);
    expect(valRes.finalTotal).toBe(4500000);

    // 3. Create Customer-Bound VIP Voucher
    const customerVoucher = await createVoucher({
      code: 'VIP500K',
      description: 'VIP Customer Voucher',
      discountType: 'FIXED_AMOUNT',
      discountValue: 500000,
      targetType: 'CUSTOMER',
      userId: sampleUser.id,
    });

    // Validate for matching customer
    const vipValRes = await validateVoucherForCart('VIP500K', 2000000, sampleUser.id);
    expect(vipValRes.valid).toBe(true);
    expect(vipValRes.discountAmount).toBe(500000);

    // Validate for non-matching customer ID
    const vipWrongUserRes = await validateVoucherForCart('VIP500K', 2000000, 'wrong_user_id');
    expect(vipWrongUserRes.valid).toBe(false);
    expect(vipWrongUserRes.message).toContain('reserved for a specific customer account');

    // 4. Checkout order with voucher
    await addItemToCart(sampleUser.id, {
      variantId: sampleVariant.id,
      type: 'SALE',
      quantity: 1,
    });

    const orderResult = await createOrder({
      userId: sampleUser.id,
      shippingAddress: {
        recipientName: 'Patron VIP',
        phone: '+628111111111',
        addressLine1: 'Jl. Senopati 45',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '12190',
      },
      paymentType: 'FULL_PAYMENT',
      paymentMethod: 'QRIS',
      voucherCode: 'ATELIER20',
    });

    expect(orderResult.order.voucher?.code).toBe('ATELIER20');
    expect(orderResult.order.discountAmount).toBe(500000);
    expect(orderResult.order.totalAmount).toBe(4500000);

    // 5. Test Admin Order Management Controls
    const updatedStatusOrder = await updateOrderStatus(orderResult.order.id, 'PROCESSING');
    expect(updatedStatusOrder?.status).toBe('PROCESSING');

    const updatedShippingOrder = await updateOrderShippingInfo(
      orderResult.order.id,
      'JNE Express Atelier',
      'JNE9988776655'
    );
    expect(updatedShippingOrder?.courierName).toBe('JNE Express Atelier');
    expect(updatedShippingOrder?.trackingNumber).toBe('JNE9988776655');
  });

  test('16. Customizable Header & Search Sidebar Navigation Collections', async () => {
    await resetDefaultNavCategories();
    // 1. Fetch navigation categories (should auto-seed default category tree if empty)
    const initialNavs = await getNavCategories(false);
    expect(initialNavs.length).toBe(39);
    const rootNavs = initialNavs.filter((n) => !n.parentId);
    expect(rootNavs.map((n) => n.name)).toEqual([
      'All Collections',
      'Women',
      'Men',
      'Jewelry & Accessories',
      'Rentals',
    ]);

    // 2. Create custom navigation item
    const customNav = await createNavCategory({
      name: 'Bespoke Kaftans',
      href: '/products?category=Kaftans',
      isActive: true,
    });
    expect(customNav.name).toBe('Bespoke Kaftans');

    const updatedNavs = await getNavCategories(true);
    expect(updatedNavs.length).toBe(40);

    // 3. Update navigation item
    const editedNav = await updateNavCategory(customNav.id, {
      name: 'Imperial Kaftans',
    });
    expect(editedNav.name).toBe('Imperial Kaftans');

    // 4. Reorder navigation items
    const navIds = updatedNavs.map((n) => n.id);
    const reorderedIds = [navIds[1], navIds[0], ...navIds.slice(2)];
    await reorderNavCategories(reorderedIds);

    const reorderedNavs = await getNavCategories(true);
    expect(reorderedNavs[0].id).toBe(navIds[1]);

    // 5. Delete custom navigation item
    await deleteNavCategory(customNav.id);

    // 6. Reset defaults
    const resetList = await resetDefaultNavCategories();
    expect(resetList.length).toBe(39);
    expect(resetList[0].name).toBe('All Collections');
  });

  test('17. Firebase Cloud Messaging Push Notification & Order Status Dispatch', async () => {
    // 1. Test direct sendOrderPushNotification function
    const res = await sendOrderPushNotification(
      'test_fcm_token_123',
      'Order Shipped',
      'Your order has been shipped via JNE Express',
      'order_test_id'
    );
    expect(res).toBe('projects/test-project/messages/mock-msg-id-123');
    expect(mockSendMessage).toHaveBeenCalledWith({
      token: 'test_fcm_token_123',
      notification: {
        title: 'Order Shipped',
        body: 'Your order has been shipped via JNE Express',
      },
      data: {
        orderId: 'order_test_id',
      },
    });

    // 2. Test order status change triggers FCM notification when user has fcmToken
    const userWithFcm = await prisma.user.create({
      data: {
        email: 'fcm.storefront.patron@idealbeautyofficial.com',
        name: 'FCM Storefront Patron',
        phone: '+628777777777',
        fcmToken: 'patron_fcm_token_456',
      },
    });

    // Add item to cart and create order
    await addItemToCart(userWithFcm.id, {
      variantId: sampleVariant.id,
      type: 'SALE',
      quantity: 1,
    });

    const orderRes = await createOrder({
      userId: userWithFcm.id,
      shippingAddress: {
        recipientName: 'FCM Storefront Patron',
        phone: '+628777777777',
        addressLine1: 'Jl. Senopati 45',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '12190',
      },
      paymentType: 'FULL_PAYMENT',
      paymentMethod: 'QRIS',
    });

    mockSendMessage.mockClear();

    // Update order status to PROCESSING (should trigger push notification)
    await updateOrderStatus(orderRes.order.id, 'PROCESSING');

    expect(mockSendMessage).toHaveBeenCalled();
    const lastCallArg = mockSendMessage.mock.calls[0][0];
    expect(lastCallArg.token).toBe('patron_fcm_token_456');
    expect(lastCallArg.notification.title).toBe('Order Update');
    expect(lastCallArg.notification.body).toContain('PROCESSING');
  });

  afterAll(async () => {
    const { main: seedDatabase } = await import('../prisma/seed');
    await seedDatabase();
  });
});
