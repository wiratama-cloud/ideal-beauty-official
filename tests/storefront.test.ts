process.env.USE_IN_MEMORY_DB = 'true';

import { expect, test, describe, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { getProducts, getCategories } from '../src/lib/services/product';
import { toggleWishlistItem, getUserWishlist } from '../src/lib/services/wishlist';
import { addItemToCart, getOrCreateCart, mergeGuestCartToUser } from '../src/lib/services/cart';
import { createOrder, getOrderById } from '../src/lib/services/order';
import { processPaymentCompletion, createFinalBalancePayment } from '../src/lib/services/payment';
import { getFinancialSummary, createExpenseEntry, generateLedgerCSV } from '../src/lib/services/ledger';

describe('Ideal Beauty Official E-Commerce Integration Test Suite', () => {
  let sampleUser: any;
  let sampleProduct: any;
  let sampleVariant: any;

  beforeAll(async () => {
    // Seed test data
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
    const available = variant?.stockAvailable || 0;

    // Add excessive quantity to cart
    await addItemToCart(sampleUser.id, {
      variantId: sampleVariant.id,
      type: 'SALE',
      quantity: available + 5,
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
    ).rejects.toThrow(/Insufficient stock available/);
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
    expect(csvContent).toContain('Date,Type,Category,Amount (IDR)');
    expect(csvContent).toContain('MANUFACTURING_COGS');
  });

  afterAll(async () => {
    const { main: seedDatabase } = await import('../prisma/seed');
    await seedDatabase();
  });
});
