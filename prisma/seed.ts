import { prisma } from '../src/lib/prisma';

export async function main() {
  console.log('Seeding Ideal Beauty Official database with dummy data...');

  // Clean existing data
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

  // 1. Create Sample Users & Addresses
  const user1 = await prisma.user.create({
    data: {
      email: 'ayu.lestari@example.com',
      name: 'Ayu Lestari',
      phone: '+6281234567890',
      addresses: {
        create: [
          {
            label: 'Home',
            recipientName: 'Ayu Lestari',
            phone: '+6281234567890',
            addressLine1: 'Jl. Senopati No. 45, Kebayoran Baru',
            city: 'Jakarta Selatan',
            province: 'DKI Jakarta',
            postalCode: '12190',
            isDefault: true,
          },
          {
            label: 'Office',
            recipientName: 'Ayu Lestari (Pacific Place)',
            phone: '+6281234567890',
            addressLine1: 'Pacific Place Tower 2, Lt. 15, SCBD',
            city: 'Jakarta Selatan',
            province: 'DKI Jakarta',
            postalCode: '12190',
            isDefault: false,
          },
        ],
      },
    },
    include: { addresses: true },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'budi.santoso@example.com',
      name: 'Budi Santoso',
      phone: '+6281987654321',
      addresses: {
        create: {
          label: 'Apartment',
          recipientName: 'Budi Santoso',
          phone: '+6281987654321',
          addressLine1: 'Menteng Park Residence Tower Emerald Lt. 22',
          city: 'Jakarta Pusat',
          province: 'DKI Jakarta',
          postalCode: '10330',
          isDefault: true,
        },
      },
    },
    include: { addresses: true },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'citra.dewi@example.com',
      name: 'Citra Dewi',
      phone: '+6281355558888',
      addresses: {
        create: {
          label: 'Villa',
          recipientName: 'Citra Dewi',
          phone: '+6281355558888',
          addressLine1: 'Jl. Raya Dharmawangsa No. 12',
          city: 'Surabaya',
          province: 'Jawa Timur',
          postalCode: '60286',
          isDefault: true,
        },
      },
    },
    include: { addresses: true },
  });

  const user4 = await prisma.user.create({
    data: {
      email: 'dian.sastro@example.com',
      name: 'Dian Sastrowardoyo',
      phone: '+6281122334455',
      addresses: {
        create: {
          label: 'Residence',
          recipientName: 'Dian Sastro',
          phone: '+6281122334455',
          addressLine1: 'Jl. Kemang Raya No. 88',
          city: 'Jakarta Selatan',
          province: 'DKI Jakarta',
          postalCode: '12730',
          isDefault: true,
        },
      },
    },
    include: { addresses: true },
  });

  console.log(`Created 4 sample users (${user1.name}, ${user2.name}, ${user3.name}, ${user4.name})`);

  // 2. Create Sample Luxury Fashion Products & Variants
  const productsData = [
    {
      name: 'Velvet Royal Emerald Kaftan',
      slug: 'velvet-royal-emerald-kaftan',
      description: 'An exquisite hand-embroidered velvet kaftan embellished with fine zardozi work and gold thread detailing. Designed for high-fashion evening galas.',
      category: 'Haute Couture',
      images: [
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1200&auto=format&fit=crop',
      ],
      variants: [
        {
          sku: 'KAF-EME-S',
          attributes: { size: 'S', color: 'Emerald Green' },
          priceSale: 4500000.00,
          priceRent: 750000.00,
          costPrice: 2100000.00,
          stockTotal: 10,
          stockAvailable: 9,
        },
        {
          sku: 'KAF-EME-M',
          attributes: { size: 'M', color: 'Emerald Green' },
          priceSale: 4500000.00,
          priceRent: 750000.00,
          costPrice: 2100000.00,
          stockTotal: 12,
          stockAvailable: 12,
        },
        {
          sku: 'KAF-EME-L',
          attributes: { size: 'L', color: 'Emerald Green' },
          priceSale: 4500000.00,
          priceRent: 750000.00,
          costPrice: 2100000.00,
          stockTotal: 8,
          stockAvailable: 8,
        },
      ],
    },
    {
      name: 'Artisanal Silk Bridal Lehenga',
      slug: 'artisanal-silk-bridal-lehenga',
      description: 'Timeless crimson silk lehenga intricately woven with traditional motifs, paired with a fitted blouse and net dupatta.',
      category: 'Bridal Wear',
      images: [
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200&auto=format&fit=crop',
      ],
      variants: [
        {
          sku: 'LEH-CRM-S',
          attributes: { size: 'S', color: 'Crimson Red' },
          priceSale: 12500000.00,
          priceRent: 2200000.00,
          costPrice: 5800000.00,
          stockTotal: 5,
          stockAvailable: 4,
        },
        {
          sku: 'LEH-CRM-M',
          attributes: { size: 'M', color: 'Crimson Red' },
          priceSale: 12500000.00,
          priceRent: 2200000.00,
          costPrice: 5800000.00,
          stockTotal: 6,
          stockAvailable: 6,
        },
      ],
    },
    {
      name: 'Embroidered Pearl Anarkali Gown',
      slug: 'embroidered-pearl-anarkali-gown',
      description: 'Ethereal ivory chiffon Anarkali silhouette studded with hand-sewn pearls and delicate silver tilla embroidery.',
      category: 'Ready To Wear',
      images: [
        'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop',
      ],
      variants: [
        {
          sku: 'ANA-IVR-S',
          attributes: { size: 'S', color: 'Ivory Pearl' },
          priceSale: 3200000.00,
          priceRent: 550000.00,
          costPrice: 1400000.00,
          stockTotal: 15,
          stockAvailable: 14,
        },
        {
          sku: 'ANA-IVR-M',
          attributes: { size: 'M', color: 'Ivory Pearl' },
          priceSale: 3200000.00,
          priceRent: 550000.00,
          costPrice: 1400000.00,
          stockTotal: 15,
          stockAvailable: 15,
        },
      ],
    },
    {
      name: 'Midnight Black Jacquard Sherwani',
      slug: 'midnight-black-jacquard-sherwani',
      description: 'Sophisticated men’s tailored jacquard sherwani jacket with antique gold buttons and sleek mandarin collar.',
      category: 'Menswear',
      images: [
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1200&auto=format&fit=crop',
      ],
      variants: [
        {
          sku: 'SHE-BLK-40',
          attributes: { size: '40', color: 'Midnight Black' },
          priceSale: 5800000.00,
          priceRent: 950000.00,
          costPrice: 2600000.00,
          stockTotal: 8,
          stockAvailable: 8,
        },
        {
          sku: 'SHE-BLK-42',
          attributes: { size: '42', color: 'Midnight Black' },
          priceSale: 5800000.00,
          priceRent: 950000.00,
          costPrice: 2600000.00,
          stockTotal: 10,
          stockAvailable: 10,
        },
      ],
    },
    {
      name: 'Rose Gold Metallic Draped Saree',
      slug: 'rose-gold-metallic-draped-saree',
      description: 'Modern pre-stitched draped saree in shimmering rose gold metallic fabric with structured pleats and corset bodice.',
      category: 'Haute Couture',
      images: [
        'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop',
      ],
      variants: [
        {
          sku: 'SAR-RSG-S',
          attributes: { size: 'S', color: 'Rose Gold' },
          priceSale: 3800000.00,
          priceRent: 650000.00,
          costPrice: 1700000.00,
          stockTotal: 7,
          stockAvailable: 7,
        },
        {
          sku: 'SAR-RSG-M',
          attributes: { size: 'M', color: 'Rose Gold' },
          priceSale: 3800000.00,
          priceRent: 650000.00,
          costPrice: 1700000.00,
          stockTotal: 9,
          stockAvailable: 9,
        },
      ],
    },
    {
      name: 'Sapphire Blue Zardozi Sharara Set',
      slug: 'sapphire-blue-zardozi-sharara-set',
      description: 'Royal sapphire blue silk short kurta featuring elaborate zardozi gold bullion embroidery, paired with flared sharara pants.',
      category: 'Bridal Wear',
      images: [
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop',
      ],
      variants: [
        {
          sku: 'SHA-BLU-S',
          attributes: { size: 'S', color: 'Sapphire Blue' },
          priceSale: 6200000.00,
          priceRent: 1100000.00,
          costPrice: 2800000.00,
          stockTotal: 6,
          stockAvailable: 6,
        },
        {
          sku: 'SHA-BLU-M',
          attributes: { size: 'M', color: 'Sapphire Blue' },
          priceSale: 6200000.00,
          priceRent: 1100000.00,
          costPrice: 2800000.00,
          stockTotal: 8,
          stockAvailable: 8,
        },
      ],
    },
    {
      name: 'Champagne Gold Sequin Evening Cape',
      slug: 'champagne-gold-sequin-evening-cape',
      description: 'Glamorous floor-length sheer cape drenched in champagne gold sequins and glass beads.',
      category: 'Eveningwear',
      images: [
        'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&auto=format&fit=crop',
      ],
      variants: [
        {
          sku: 'CAP-GLD-OS',
          attributes: { size: 'Free Size', color: 'Champagne Gold' },
          priceSale: 2900000.00,
          priceRent: 500000.00,
          costPrice: 1200000.00,
          stockTotal: 12,
          stockAvailable: 11,
        },
      ],
    },
    {
      name: 'Handcrafted Pearl Tulle Veil & Crown',
      slug: 'handcrafted-pearl-tulle-veil-crown',
      description: 'Bespoke cathedral length bridal veil adorned with scattered freshwater pearls and hand-carved silver tiara.',
      category: 'Accessories',
      images: [
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200&auto=format&fit=crop',
      ],
      variants: [
        {
          sku: 'ACC-PRL-OS',
          attributes: { size: 'One Size', color: 'Ivory/Silver' },
          priceSale: 1800000.00,
          priceRent: 350000.00,
          costPrice: 750000.00,
          stockTotal: 20,
          stockAvailable: 20,
        },
      ],
    },
  ];

  const createdProducts = [];
  for (const productInfo of productsData) {
    const { variants, ...prod } = productInfo;
    const createdProduct = await prisma.product.create({
      data: {
        ...prod,
        variants: {
          create: variants,
        },
      },
      include: {
        variants: true,
      },
    });

    createdProducts.push(createdProduct);
    console.log(`Created product: ${createdProduct.name} (${createdProduct.variants.length} variants)`);

    // Log initial R&D / COGS expense entries into Ledger for realistic financial accounting demo
    await prisma.ledgerEntry.create({
      data: {
        type: 'EXPENSE',
        amount: 5000000.00,
        description: `R&D and Haute Couture Design for ${createdProduct.name}`,
        expenseCategory: 'DESIGN_RND',
        productId: createdProduct.id,
      },
    });
  }

  // Helper shortcuts for variants
  const kaftanVariantS = createdProducts[0].variants[0];
  const lehengaVariantS = createdProducts[1].variants[0];
  const anarkaliVariantS = createdProducts[2].variants[0];
  const sherwaniVariant40 = createdProducts[3].variants[0];
  const sareeVariantS = createdProducts[4].variants[0];
  const capeVariant = createdProducts[6].variants[0];

  // 3. Wishlist Items
  await prisma.wishlistItem.createMany({
    data: [
      { userId: user1.id, productId: createdProducts[1].id, variantId: lehengaVariantS.id },
      { userId: user1.id, productId: createdProducts[4].id, variantId: sareeVariantS.id },
      { userId: user3.id, productId: createdProducts[0].id, variantId: kaftanVariantS.id },
    ],
  });
  console.log('Created sample wishlist items');

  // 4. Cart & CartItems
  const user1Cart = await prisma.cart.create({
    data: {
      userId: user1.id,
      items: {
        create: [
          {
            variantId: sareeVariantS.id,
            type: 'SALE',
            quantity: 1,
          },
        ],
      },
    },
  });

  const guestCart = await prisma.cart.create({
    data: {
      sessionId: 'guest_demo_session_99',
      items: {
        create: [
          {
            variantId: sherwaniVariant40.id,
            type: 'RENTAL',
            quantity: 1,
            rentStartDate: new Date('2026-09-01'),
            rentEndDate: new Date('2026-09-05'),
          },
        ],
      },
    },
  });
  console.log('Created user and guest carts');

  // 5. Orders, Payments, & Income Ledger Entries

  // Order 1: Completed Full Payment Sale Order (Ayu Lestari)
  const order1 = await prisma.order.create({
    data: {
      userId: user1.id,
      shippingAddressId: user1.addresses[0].id,
      totalAmount: 4550000.00,
      shippingCost: 50000.00,
      status: 'COMPLETED',
      courierName: 'JNE Express',
      trackingNumber: 'JNE-882391023',
      items: {
        create: [
          {
            variantId: kaftanVariantS.id,
            type: 'SALE',
            quantity: 1,
            priceAtTime: 4500000.00,
            rentalStatus: 'NOT_APPLICABLE',
          },
        ],
      },
    },
  });

  const payment1 = await prisma.payment.create({
    data: {
      orderId: order1.id,
      amount: 4550000.00,
      type: 'FULL_PAYMENT',
      status: 'COMPLETED',
      providerTxId: 'MIDTRANS-QRIS-99012',
    },
  });

  await prisma.ledgerEntry.create({
    data: {
      type: 'INCOME',
      amount: 4550000.00,
      description: `Payment received for Order #${order1.id.slice(0, 8)} (Full Payment)`,
      incomeCategory: 'SALES_REVENUE',
      paymentId: payment1.id,
      productId: createdProducts[0].id,
      variantId: kaftanVariantS.id,
    },
  });

  // Order 2: Partially Paid Rental Order with Down Payment (Budi Santoso)
  const order2 = await prisma.order.create({
    data: {
      userId: user2.id,
      shippingAddressId: user2.addresses[0].id,
      totalAmount: 2300000.00,
      shippingCost: 100000.00,
      status: 'PARTIALLY_PAID',
      courierName: 'Paxel Instant',
      trackingNumber: 'PXL-99120401',
      items: {
        create: [
          {
            variantId: lehengaVariantS.id,
            type: 'RENTAL',
            quantity: 1,
            priceAtTime: 2200000.00,
            rentStartDate: new Date('2026-08-20'),
            rentEndDate: new Date('2026-08-25'),
            rentalStatus: 'OUT_WITH_CUSTOMER',
          },
        ],
      },
    },
  });

  const payment2 = await prisma.payment.create({
    data: {
      orderId: order2.id,
      amount: 1000000.00,
      type: 'DOWN_PAYMENT',
      status: 'COMPLETED',
      providerTxId: 'XENDIT-VA-BCA-3391',
    },
  });

  await prisma.ledgerEntry.create({
    data: {
      type: 'INCOME',
      amount: 1000000.00,
      description: `Down Payment received for Order #${order2.id.slice(0, 8)} (Bridal Lehenga Rental)`,
      incomeCategory: 'RENTAL_REVENUE',
      paymentId: payment2.id,
      productId: createdProducts[1].id,
      variantId: lehengaVariantS.id,
    },
  });

  // Order 3: Pending Order awaiting QRIS Scan (Citra Dewi)
  const order3 = await prisma.order.create({
    data: {
      userId: user3.id,
      shippingAddressId: user3.addresses[0].id,
      totalAmount: 3230000.00,
      shippingCost: 30000.00,
      status: 'PENDING',
      items: {
        create: [
          {
            variantId: anarkaliVariantS.id,
            type: 'SALE',
            quantity: 1,
            priceAtTime: 3200000.00,
            rentalStatus: 'NOT_APPLICABLE',
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order3.id,
      amount: 1500000.00,
      type: 'DOWN_PAYMENT',
      status: 'PENDING',
      providerTxId: 'QRIS-TX-100234',
    },
  });

  // Order 4: Returned Rental Order (Dian Sastrowardoyo)
  const order4 = await prisma.order.create({
    data: {
      userId: user4.id,
      shippingAddressId: user4.addresses[0].id,
      totalAmount: 525000.00,
      shippingCost: 25000.00,
      status: 'PAID',
      courierName: 'Sicepat BEST',
      trackingNumber: 'SI-44201928',
      items: {
        create: [
          {
            variantId: capeVariant.id,
            type: 'RENTAL',
            quantity: 1,
            priceAtTime: 500000.00,
            rentStartDate: new Date('2026-08-01'),
            rentEndDate: new Date('2026-08-05'),
            rentalStatus: 'RETURNED',
          },
        ],
      },
    },
  });

  const payment4 = await prisma.payment.create({
    data: {
      orderId: order4.id,
      amount: 525000.00,
      type: 'FULL_PAYMENT',
      status: 'COMPLETED',
      providerTxId: 'MIDTRANS-VA-MANDIRI-1029',
    },
  });

  await prisma.ledgerEntry.create({
    data: {
      type: 'INCOME',
      amount: 525000.00,
      description: `Full payment received for Order #${order4.id.slice(0, 8)} (Evening Cape Rental)`,
      incomeCategory: 'RENTAL_REVENUE',
      paymentId: payment4.id,
      productId: createdProducts[6].id,
      variantId: capeVariant.id,
    },
  });

  console.log('Created sample orders, payments, and revenue ledger entries');

  // 6. General Operational & Marketing Expense Ledger Entries
  await prisma.ledgerEntry.createMany({
    data: [
      {
        type: 'EXPENSE',
        amount: 8500000.00,
        description: 'Sourcing Pure Italian Silk & French Lace Fabrics for Bridal Collection',
        expenseCategory: 'MANUFACTURING_COGS',
      },
      {
        type: 'EXPENSE',
        amount: 12000000.00,
        description: 'Jakarta Fashion Week Runway Showcase & Editorial Photography',
        expenseCategory: 'MARKETING',
      },
      {
        type: 'EXPENSE',
        amount: 4500000.00,
        description: 'Senopati Flagship Boutique Studio Maintenance & Dry Cleaning Services',
        expenseCategory: 'OPERATIONAL',
      },
    ],
  });

  console.log('Created operational expense ledger entries');
  console.log('Seeding completed successfully!');
}

if (process.argv[1]?.includes('seed')) {
  main()
    .catch((e) => {
      console.error('Error during seeding:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
