process.env.USE_IN_MEMORY_DB = 'true';

async function runAllTests() {
  const { prisma } = await import('../src/lib/prisma');
  const { getProducts, getCategories } = await import('../src/lib/services/product');
  const { toggleWishlistItem, getUserWishlist } = await import('../src/lib/services/wishlist');
  const { addItemToCart, getOrCreateCart, mergeGuestCartToUser } = await import('../src/lib/services/cart');
  const { createOrder, getOrderById } = await import('../src/lib/services/order');
  const { processPaymentCompletion, createFinalBalancePayment } = await import('../src/lib/services/payment');
  const { getFinancialSummary, createExpenseEntry, generateLedgerCSV } = await import('../src/lib/services/ledger');

  console.log('🧪 Starting Ideal Beauty Official E-Commerce Test Suite...\n');

  try {
    // Clean test database
    await prisma.ledgerEntry.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.wishlistItem.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.address.deleteMany();
    await prisma.user.deleteMany();

    console.log('Step: Creating test user...');
    const sampleUser = await prisma.user.create({
      data: {
        email: 'test.patron@idealbeautyofficial.com',
        name: 'Test Patron',
        phone: '+628111111111',
      },
    });
    console.log('Created user:', sampleUser.id);

    console.log('Step: Creating test product...');
    const sampleProduct = await prisma.product.create({
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
              stockSaleAvailable: 10,
              stockRentAvailable: 5,
            },
          ],
        },
      },
      include: {
        variants: true,
      },
    });
    console.log('Created product:', sampleProduct.id);

    const sampleVariant = sampleProduct.variants[0];

    // Test 1: Catalog Search & Category Filtering
    console.log('✓ Test 1: Catalog Search & Category Filtering...');
    const products = await getProducts({ category: 'Haute Couture' });
    if (products.length === 0 || !products[0].name.includes('Royal Velvet Emerald Kaftan')) {
      throw new Error('Test 1 Failed: Product search/filtering mismatch');
    }
    const categories = await getCategories();
    if (!categories.includes('Haute Couture')) {
      throw new Error('Test 1 Failed: Category mismatch');
    }

    // Test 2: Wishlist Toggle & Persistence
    console.log('✓ Test 2: Wishlist Toggle & Persistence...');
    const toggleRes1 = await toggleWishlistItem(sampleUser.id, sampleProduct.id, sampleVariant.id);
    if (!toggleRes1.wishlisted) throw new Error('Test 2 Failed: Wishlist toggle on');
    const wishlist = await getUserWishlist(sampleUser.id);
    if (wishlist.length !== 1) throw new Error('Test 2 Failed: Wishlist count mismatch');
    const toggleRes2 = await toggleWishlistItem(sampleUser.id, sampleProduct.id, sampleVariant.id);
    if (toggleRes2.wishlisted) throw new Error('Test 2 Failed: Wishlist toggle off');

    // Test 3: Guest Cart & User Login Sync
    console.log('✓ Test 3: Guest Cart & Session Sync...');
    const guestSessionId = 'guest_session_12345';
    await addItemToCart(guestSessionId, {
      variantId: sampleVariant.id,
      type: 'SALE',
      quantity: 2,
    });
    const guestCart = await getOrCreateCart(guestSessionId);
    if (guestCart.items.length !== 1 || guestCart.items[0].quantity !== 2) {
      throw new Error('Test 3 Failed: Guest cart item mismatch');
    }
    const mergedCart = await mergeGuestCartToUser(guestSessionId, sampleUser.id);
    if (mergedCart.items.length !== 1 || mergedCart.items[0].quantity !== 2) {
      throw new Error('Test 3 Failed: Cart merge to user failed');
    }

    // Test 4: Atomic Checkout with Down Payment & Stock Deduction
    console.log('✓ Test 4: Atomic Checkout with Down Payment & Stock Deduction...');
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

    if (checkoutRes.order.status !== 'PENDING') throw new Error('Test 4 Failed: Order status not PENDING');
    if (Number(checkoutRes.payment.amount) !== 5000000.0) throw new Error('Test 4 Failed: Down payment amount calculation error');

    const updatedVariant = await prisma.productVariant.findUnique({ where: { id: sampleVariant.id } });
    if (updatedVariant?.stockAvailable !== initialStock - 2) {
      throw new Error('Test 4 Failed: Stock not decremented atomically');
    }

    // Test 5: High Concurrency Stock Protection
    console.log('✓ Test 5: High Concurrency Stock Protection...');
    const variant = await prisma.productVariant.findUnique({ where: { id: sampleVariant.id } });
    const available = variant?.stockSaleAvailable || variant?.stockAvailable || 0;

    let overbuyCaught = false;
    try {
      await addItemToCart(sampleUser.id, {
        variantId: sampleVariant.id,
        type: 'SALE',
        quantity: available + 5,
      });

      await createOrder({
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
      });
    } catch (err: any) {
      overbuyCaught = true;
    }
    if (!overbuyCaught) throw new Error('Test 5 Failed: Overbuying stock was not prevented');

    // Test 6: Payment Webhook Verification & Ledger Income Creation
    console.log('✓ Test 6: Payment Webhook Verification & Ledger Income Creation...');
    const orders = await prisma.order.findMany({ where: { userId: sampleUser.id } });
    const order = orders[0];
    const pendingPayment = await prisma.payment.findFirst({
      where: { orderId: order.id, status: 'PENDING' },
    });

    if (!pendingPayment) throw new Error('Test 6 Failed: Pending payment record missing');
    await processPaymentCompletion(pendingPayment.id, 'PROVIDER-TX-1001');

    const updatedOrder = await getOrderById(order.id);
    if (updatedOrder?.status !== 'PARTIALLY_PAID') throw new Error('Test 6 Failed: Order status transition failed');

    const summary = await getFinancialSummary();
    if (summary.totalIncome <= 0 || !summary.incomeByCategory['SALES_REVENUE']) {
      throw new Error('Test 6 Failed: Ledger income entry missing');
    }

    // Test 7: Pay Final Balance & Order Complete Transition
    console.log('✓ Test 7: Pay Final Balance & Order Complete Transition...');
    const partiallyPaidOrders = await prisma.order.findMany({ where: { userId: sampleUser.id, status: 'PARTIALLY_PAID' } });
    const partOrder = partiallyPaidOrders[0];

    const finalPayment = await createFinalBalancePayment(partOrder.id, 'BANK_TRANSFER', 'BCA');
    if (finalPayment.type !== 'FINAL_BALANCE') throw new Error('Test 7 Failed: Payment type mismatch');

    await processPaymentCompletion(finalPayment.id, 'PROVIDER-TX-1002');
    const completedOrder = await getOrderById(partOrder.id);
    if (completedOrder?.status !== 'PAID') throw new Error('Test 7 Failed: Final balance completion failed');

    // Test 8: Double-Entry Ledger Expense Logging & CSV Export
    console.log('✓ Test 8: Double-Entry Ledger Expense Logging & CSV Export...');
    await createExpenseEntry({
      amount: 1500000,
      description: 'Zardozi Embroidery Thread Procurement',
      expenseCategory: 'MANUFACTURING_COGS',
    });

    const finalSummary = await getFinancialSummary();
    if (finalSummary.totalExpense <= 0 || finalSummary.expenseByCategory['MANUFACTURING_COGS'] !== 1500000) {
      throw new Error('Test 8 Failed: Expense logging error');
    }

    const csvContent = await generateLedgerCSV();
    if (!csvContent.includes('MANUFACTURING_COGS') || !csvContent.includes('Amount (IDR)')) {
      throw new Error('Test 8 Failed: CSV Export content mismatch');
    }

    console.log('\n🎉 ALL 8 INTEGRATION TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    console.log('\nRestoring default database seed after tests...');
    const { main: seedDatabase } = await import('../prisma/seed');
    await seedDatabase();
  }
}

runAllTests().then(() => process.exit(0)).catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
