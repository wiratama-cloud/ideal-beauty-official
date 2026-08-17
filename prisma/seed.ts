import { prisma } from '../src/lib/prisma';
import { seedDefaultCategoryTree } from '../src/lib/services/nav-category';
import { seedDefaultSizeCharts } from '../src/lib/services/size-chart';

export async function main() {
  console.log('Seeding Ideal Beauty Official database with dummy data...');

  // 1. Primary Admin Account & Access Control Seeding
  const primaryAdminEmail = process.env.ADMIN_EMAIL || 'admin@idealbeautyofficial.com';
  if (primaryAdminEmail) {
    await prisma.adminAccess.upsert({
      where: { email: primaryAdminEmail },
      update: { role: 'ADMIN' },
      create: {
        email: primaryAdminEmail,
        role: 'ADMIN',
        addedBy: 'SYSTEM_SEED',
      },
    });
    console.log(`Seeded primary admin access for: ${primaryAdminEmail}`);
  }

  // 2. Create Sample Users & Addresses
  const user1 = await prisma.user.upsert({
    where: { email: 'ayu.lestari@example.com' },
    update: {
      name: 'Ayu Lestari',
      phone: '+6281234567890',
    },
    create: {
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

  const user2 = await prisma.user.upsert({
    where: { email: 'budi.santoso@example.com' },
    update: {
      name: 'Budi Santoso',
      phone: '+6281987654321',
    },
    create: {
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

  const user3 = await prisma.user.upsert({
    where: { email: 'citra.dewi@example.com' },
    update: {
      name: 'Citra Dewi',
      phone: '+6281355558888',
    },
    create: {
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

  const user4 = await prisma.user.upsert({
    where: { email: 'dian.sastro@example.com' },
    update: {
      name: 'Dian Sastrowardoyo',
      phone: '+6281122334455',
    },
    create: {
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

  // 2. Create Sample Luxury Fashion Products & Variants (16 products across 4 categories)
  const productsData = [
    // --- CATEGORY 1: KAFTANS (4 items) ---
    {
      name: 'Velvet Royal Emerald Kaftan',
      slug: 'velvet-royal-emerald-kaftan',
      description: 'An exquisite hand-embroidered velvet kaftan embellished with fine zardozi work and gold thread detailing. Designed for high-fashion evening galas.',
      category: 'Kaftans',
      images: [
        '/images/products/kaftan-1.jpg',
        '/images/products/kaftan-2.jpg',
      ],
      variants: [
        {
          sku: 'KAF-EME-S',
          attributes: { size: 'S', color: 'Emerald Green' },
          priceSale: 4500000.00,
          compareAtPrice: 6000000.00,
          priceRent: 750000.00,
          costPrice: 2100000.00,
          purchaseCost: 2100000.00,
          stockSaleTotal: 10,
          stockSaleAvailable: 9,
          stockRentTotal: 5,
          stockRentAvailable: 4,
          stockTotal: 15,
          stockAvailable: 13,
        },
        {
          sku: 'KAF-EME-M',
          attributes: { size: 'M', color: 'Emerald Green' },
          priceSale: 4500000.00,
          compareAtPrice: 6000000.00,
          priceRent: 750000.00,
          costPrice: 2100000.00,
          purchaseCost: 2100000.00,
          stockSaleTotal: 12,
          stockSaleAvailable: 12,
          stockRentTotal: 6,
          stockRentAvailable: 6,
          stockTotal: 18,
          stockAvailable: 18,
        },
        {
          sku: 'KAF-EME-L',
          attributes: { size: 'L', color: 'Emerald Green' },
          priceSale: 4500000.00,
          compareAtPrice: 6000000.00,
          priceRent: 750000.00,
          costPrice: 2100000.00,
          purchaseCost: 2100000.00,
          stockSaleTotal: 8,
          stockSaleAvailable: 8,
          stockRentTotal: 4,
          stockRentAvailable: 4,
          stockTotal: 12,
          stockAvailable: 12,
        },
      ],
    },
    {
      name: 'Silk Chiffon Rose Kaftan',
      slug: 'silk-chiffon-rose-kaftan',
      description: 'A flowing blush-pink silk chiffon kaftan features hand-applied crystal motifs and a delicate split neckline.',
      category: 'Kaftans',
      images: [
        '/images/products/kaftan-2.jpg',
        '/images/products/kaftan-1.jpg',
      ],
      variants: [
        {
          sku: 'KAF-ROS-S',
          attributes: { size: 'S', color: 'Rose Blush' },
          priceSale: 3900000.00,
          compareAtPrice: 4800000.00,
          priceRent: 650000.00,
          costPrice: 1800000.00,
          purchaseCost: 1800000.00,
          stockSaleTotal: 8,
          stockSaleAvailable: 8,
          stockRentTotal: 4,
          stockRentAvailable: 4,
          stockTotal: 12,
          stockAvailable: 12,
        },
        {
          sku: 'KAF-ROS-M',
          attributes: { size: 'M', color: 'Rose Blush' },
          priceSale: 3900000.00,
          compareAtPrice: 4800000.00,
          priceRent: 650000.00,
          costPrice: 1800000.00,
          purchaseCost: 1800000.00,
          stockSaleTotal: 10,
          stockSaleAvailable: 10,
          stockRentTotal: 5,
          stockRentAvailable: 5,
          stockTotal: 15,
          stockAvailable: 15,
        },
      ],
    },
    {
      name: 'Golden Opal Embellished Kaftan',
      slug: 'golden-opal-embellished-kaftan',
      description: 'Radiant champagne-gold kaftan with elaborate tilla embroidery and pearl lattice accents along the sleeves.',
      category: 'Kaftans',
      images: [
        '/images/products/kaftan-1.jpg',
        '/images/products/default-product.jpg',
      ],
      variants: [
        {
          sku: 'KAF-OPL-S',
          attributes: { size: 'S', color: 'Champagne Gold' },
          priceSale: 5200000.00,
          priceRent: 850000.00,
          costPrice: 2400000.00,
          purchaseCost: 2400000.00,
          stockSaleTotal: 6,
          stockSaleAvailable: 6,
          stockRentTotal: 3,
          stockRentAvailable: 3,
          stockTotal: 9,
          stockAvailable: 9,
        },
        {
          sku: 'KAF-OPL-M',
          attributes: { size: 'M', color: 'Champagne Gold' },
          priceSale: 5200000.00,
          priceRent: 850000.00,
          costPrice: 2400000.00,
          purchaseCost: 2400000.00,
          stockSaleTotal: 7,
          stockSaleAvailable: 7,
          stockRentTotal: 4,
          stockRentAvailable: 4,
          stockTotal: 11,
          stockAvailable: 11,
        },
      ],
    },
    {
      name: 'Imperial Ruby Velvet Kaftan',
      slug: 'imperial-ruby-velvet-kaftan',
      description: 'Deep ruby red plush velvet kaftan framed with opulent antique silver dabka embroidery and regal cuffs.',
      category: 'Kaftans',
      images: [
        '/images/products/kaftan-2.jpg',
        '/images/products/default-product.jpg',
      ],
      variants: [
        {
          sku: 'KAF-RBY-S',
          attributes: { size: 'S', color: 'Imperial Ruby' },
          priceSale: 4800000.00,
          priceRent: 800000.00,
          costPrice: 2200000.00,
          purchaseCost: 2200000.00,
          stockSaleTotal: 9,
          stockSaleAvailable: 9,
          stockRentTotal: 4,
          stockRentAvailable: 4,
          stockTotal: 13,
          stockAvailable: 13,
        },
        {
          sku: 'KAF-RBY-M',
          attributes: { size: 'M', color: 'Imperial Ruby' },
          priceSale: 4800000.00,
          priceRent: 800000.00,
          costPrice: 2200000.00,
          purchaseCost: 2200000.00,
          stockSaleTotal: 11,
          stockSaleAvailable: 11,
          stockRentTotal: 5,
          stockRentAvailable: 5,
          stockTotal: 16,
          stockAvailable: 16,
        },
      ],
    },

    // --- CATEGORY 2: LEHENGAS (4 items) ---
    {
      name: 'Royal Bridal Lehenga',
      slug: 'royal-bridal-lehenga',
      description: 'Timeless crimson silk lehenga intricately woven with traditional motifs, paired with a fitted blouse and net dupatta.',
      category: 'Lehengas',
      images: [
        '/images/products/lehenga-1.jpg',
        '/images/products/lehenga-2.jpg',
      ],
      variants: [
        {
          sku: 'LEH-CRM-S',
          attributes: { size: 'S', color: 'Crimson Red' },
          priceSale: 12500000.00,
          compareAtPrice: 15000000.00,
          priceRent: 2200000.00,
          costPrice: 5800000.00,
          purchaseCost: 5800000.00,
          stockSaleTotal: 5,
          stockSaleAvailable: 4,
          stockRentTotal: 3,
          stockRentAvailable: 2,
          stockTotal: 8,
          stockAvailable: 6,
        },
        {
          sku: 'LEH-CRM-M',
          attributes: { size: 'M', color: 'Crimson Red' },
          priceSale: 12500000.00,
          compareAtPrice: 15000000.00,
          priceRent: 2200000.00,
          costPrice: 5800000.00,
          purchaseCost: 5800000.00,
          stockSaleTotal: 6,
          stockSaleAvailable: 6,
          stockRentTotal: 4,
          stockRentAvailable: 4,
          stockTotal: 10,
          stockAvailable: 10,
        },
      ],
    },
    {
      name: 'Crimson Gold Zardozi Lehenga',
      slug: 'crimson-gold-zardozi-lehenga',
      description: 'Hand-crafted bridal crimson lehenga laden with heavy gold zardozi bullion work, sequence details, and embroidered dupatta.',
      category: 'Lehengas',
      images: [
        '/images/products/lehenga-2.jpg',
        '/images/products/lehenga-1.jpg',
      ],
      variants: [
        {
          sku: 'LEH-ZAR-S',
          attributes: { size: 'S', color: 'Gold Crimson' },
          priceSale: 14000000.00,
          priceRent: 2500000.00,
          costPrice: 6500000.00,
          purchaseCost: 6500000.00,
          stockSaleTotal: 4,
          stockSaleAvailable: 4,
          stockRentTotal: 2,
          stockRentAvailable: 2,
          stockTotal: 6,
          stockAvailable: 6,
        },
        {
          sku: 'LEH-ZAR-M',
          attributes: { size: 'M', color: 'Gold Crimson' },
          priceSale: 14000000.00,
          priceRent: 2500000.00,
          costPrice: 6500000.00,
          purchaseCost: 6500000.00,
          stockSaleTotal: 5,
          stockSaleAvailable: 5,
          stockRentTotal: 3,
          stockRentAvailable: 3,
          stockTotal: 8,
          stockAvailable: 8,
        },
      ],
    },
    {
      name: 'Pastel Floral Organza Lehenga',
      slug: 'pastel-floral-organza-lehenga',
      description: 'Lightweight mint green and blush organza lehenga with delicate threadwork flora and pearl beaded border.',
      category: 'Lehengas',
      images: [
        '/images/products/lehenga-1.jpg',
        '/images/products/default-product.jpg',
      ],
      variants: [
        {
          sku: 'LEH-PST-S',
          attributes: { size: 'S', color: 'Mint Pastel' },
          priceSale: 8900000.00,
          priceRent: 1500000.00,
          costPrice: 4000000.00,
          purchaseCost: 4000000.00,
          stockSaleTotal: 7,
          stockSaleAvailable: 7,
          stockRentTotal: 4,
          stockRentAvailable: 4,
          stockTotal: 11,
          stockAvailable: 11,
        },
        {
          sku: 'LEH-PST-M',
          attributes: { size: 'M', color: 'Mint Pastel' },
          priceSale: 8900000.00,
          priceRent: 1500000.00,
          costPrice: 4000000.00,
          purchaseCost: 4000000.00,
          stockSaleTotal: 8,
          stockSaleAvailable: 8,
          stockRentTotal: 4,
          stockRentAvailable: 4,
          stockTotal: 12,
          stockAvailable: 12,
        },
      ],
    },
    {
      name: 'Midnight Velvet Bridal Lehenga',
      slug: 'midnight-velvet-bridal-lehenga',
      description: 'Opulent midnight blue velvet skirt with ornate gold zari embroidery, matching blouse, and sheer tulle dupatta.',
      category: 'Lehengas',
      images: [
        '/images/products/lehenga-2.jpg',
        '/images/products/default-product.jpg',
      ],
      variants: [
        {
          sku: 'LEH-MNV-S',
          attributes: { size: 'S', color: 'Midnight Blue' },
          priceSale: 11800000.00,
          priceRent: 2000000.00,
          costPrice: 5200000.00,
          purchaseCost: 5200000.00,
          stockSaleTotal: 6,
          stockSaleAvailable: 6,
          stockRentTotal: 3,
          stockRentAvailable: 3,
          stockTotal: 9,
          stockAvailable: 9,
        },
        {
          sku: 'LEH-MNV-M',
          attributes: { size: 'M', color: 'Midnight Blue' },
          priceSale: 11800000.00,
          priceRent: 2000000.00,
          costPrice: 5200000.00,
          purchaseCost: 5200000.00,
          stockSaleTotal: 6,
          stockSaleAvailable: 6,
          stockRentTotal: 3,
          stockRentAvailable: 3,
          stockTotal: 9,
          stockAvailable: 9,
        },
      ],
    },

    // --- CATEGORY 3: ANARKALIS (4 items) ---
    {
      name: 'Embroidered Pearl Anarkali Gown',
      slug: 'embroidered-pearl-anarkali-gown',
      description: 'Ethereal ivory chiffon Anarkali silhouette studded with hand-sewn pearls and delicate silver tilla embroidery.',
      category: 'Anarkalis',
      images: [
        '/images/products/anarkali-1.jpg',
        '/images/products/anarkali-2.jpg',
      ],
      variants: [
        {
          sku: 'ANA-IVR-S',
          attributes: { size: 'S', color: 'Ivory Pearl' },
          priceSale: 3200000.00,
          priceRent: 550000.00,
          costPrice: 1400000.00,
          purchaseCost: 1400000.00,
          stockSaleTotal: 15,
          stockSaleAvailable: 14,
          stockRentTotal: 8,
          stockRentAvailable: 8,
          stockTotal: 23,
          stockAvailable: 22,
        },
        {
          sku: 'ANA-IVR-M',
          attributes: { size: 'M', color: 'Ivory Pearl' },
          priceSale: 3200000.00,
          priceRent: 550000.00,
          costPrice: 1400000.00,
          purchaseCost: 1400000.00,
          stockSaleTotal: 15,
          stockSaleAvailable: 15,
          stockRentTotal: 8,
          stockRentAvailable: 8,
          stockTotal: 23,
          stockAvailable: 23,
        },
      ],
    },
    {
      name: 'Midnight Navy Georgette Anarkali',
      slug: 'midnight-navy-georgette-anarkali',
      description: 'Deep navy floor-length Anarkali with mirror-work borders, silver wire detail, and lightweight embroidered scarf.',
      category: 'Anarkalis',
      images: [
        '/images/products/anarkali-2.jpg',
        '/images/products/anarkali-1.jpg',
      ],
      variants: [
        {
          sku: 'ANA-NVY-S',
          attributes: { size: 'S', color: 'Navy Silver' },
          priceSale: 3500000.00,
          priceRent: 600000.00,
          costPrice: 1500000.00,
          purchaseCost: 1500000.00,
          stockSaleTotal: 10,
          stockSaleAvailable: 10,
          stockRentTotal: 5,
          stockRentAvailable: 5,
          stockTotal: 15,
          stockAvailable: 15,
        },
        {
          sku: 'ANA-NVY-M',
          attributes: { size: 'M', color: 'Navy Silver' },
          priceSale: 3500000.00,
          priceRent: 600000.00,
          costPrice: 1500000.00,
          purchaseCost: 1500000.00,
          stockSaleTotal: 12,
          stockSaleAvailable: 12,
          stockRentTotal: 6,
          stockRentAvailable: 6,
          stockTotal: 18,
          stockAvailable: 18,
        },
      ],
    },
    {
      name: 'Golden Zari Silk Anarkali',
      slug: 'golden-zari-silk-anarkali',
      description: 'Regal golden yellow raw silk Anarkali highlighted with zari embroidered neckline and pleated flare.',
      category: 'Anarkalis',
      images: [
        '/images/products/anarkali-1.jpg',
        '/images/products/default-product.jpg',
      ],
      variants: [
        {
          sku: 'ANA-GLD-S',
          attributes: { size: 'S', color: 'Gold Silk' },
          priceSale: 4100000.00,
          priceRent: 700000.00,
          costPrice: 1900000.00,
          purchaseCost: 1900000.00,
          stockSaleTotal: 8,
          stockSaleAvailable: 8,
          stockRentTotal: 4,
          stockRentAvailable: 4,
          stockTotal: 12,
          stockAvailable: 12,
        },
        {
          sku: 'ANA-GLD-M',
          attributes: { size: 'M', color: 'Gold Silk' },
          priceSale: 4100000.00,
          priceRent: 700000.00,
          costPrice: 1900000.00,
          purchaseCost: 1900000.00,
          stockSaleTotal: 9,
          stockSaleAvailable: 9,
          stockRentTotal: 4,
          stockRentAvailable: 4,
          stockTotal: 13,
          stockAvailable: 13,
        },
      ],
    },
    {
      name: 'Rose Dust Chiffon Anarkali',
      slug: 'rose-dust-chiffon-anarkali',
      description: 'Graceful dusty rose chiffon ensemble featuring delicate sequin sprays and soft silk lining.',
      category: 'Anarkalis',
      images: [
        '/images/products/anarkali-2.jpg',
        '/images/products/default-product.jpg',
      ],
      variants: [
        {
          sku: 'ANA-RST-S',
          attributes: { size: 'S', color: 'Dusty Rose' },
          priceSale: 3600000.00,
          priceRent: 620000.00,
          costPrice: 1600000.00,
          purchaseCost: 1600000.00,
          stockSaleTotal: 11,
          stockSaleAvailable: 11,
          stockRentTotal: 5,
          stockRentAvailable: 5,
          stockTotal: 16,
          stockAvailable: 16,
        },
        {
          sku: 'ANA-RST-M',
          attributes: { size: 'M', color: 'Dusty Rose' },
          priceSale: 3600000.00,
          priceRent: 620000.00,
          costPrice: 1600000.00,
          purchaseCost: 1600000.00,
          stockSaleTotal: 11,
          stockSaleAvailable: 11,
          stockRentTotal: 5,
          stockRentAvailable: 5,
          stockTotal: 16,
          stockAvailable: 16,
        },
      ],
    },

    // --- CATEGORY 4: SAREES (4 items) ---
    {
      name: 'Rose Gold Metallic Draped Saree',
      slug: 'rose-gold-metallic-draped-saree',
      description: 'Modern pre-stitched draped saree in shimmering rose gold metallic fabric with structured pleats and corset bodice.',
      category: 'Sarees',
      images: [
        '/images/products/saree-1.jpg',
        '/images/products/saree-2.jpg',
      ],
      variants: [
        {
          sku: 'SAR-RSG-S',
          attributes: { size: 'S', color: 'Rose Gold' },
          priceSale: 3800000.00,
          priceRent: 650000.00,
          costPrice: 1700000.00,
          purchaseCost: 1700000.00,
          stockSaleTotal: 7,
          stockSaleAvailable: 7,
          stockRentTotal: 4,
          stockRentAvailable: 4,
          stockTotal: 11,
          stockAvailable: 11,
        },
        {
          sku: 'SAR-RSG-M',
          attributes: { size: 'M', color: 'Rose Gold' },
          priceSale: 3800000.00,
          priceRent: 650000.00,
          costPrice: 1700000.00,
          purchaseCost: 1700000.00,
          stockSaleTotal: 9,
          stockSaleAvailable: 9,
          stockRentTotal: 5,
          stockRentAvailable: 5,
          stockTotal: 14,
          stockAvailable: 14,
        },
      ],
    },
    {
      name: 'Sapphire Handwoven Silk Saree',
      slug: 'sapphire-handwoven-silk-saree',
      description: 'Luxe royal blue handwoven pure silk saree with opulent gold zari borders and matching unstitched blouse piece.',
      category: 'Sarees',
      images: [
        '/images/products/saree-2.jpg',
        '/images/products/saree-1.jpg',
      ],
      variants: [
        {
          sku: 'SAR-SPH-S',
          attributes: { size: 'S', color: 'Sapphire Blue' },
          priceSale: 4600000.00,
          priceRent: 780000.00,
          costPrice: 2100000.00,
          purchaseCost: 2100000.00,
          stockSaleTotal: 8,
          stockSaleAvailable: 8,
          stockRentTotal: 4,
          stockRentAvailable: 4,
          stockTotal: 12,
          stockAvailable: 12,
        },
        {
          sku: 'SAR-SPH-M',
          attributes: { size: 'M', color: 'Sapphire Blue' },
          priceSale: 4600000.00,
          priceRent: 780000.00,
          costPrice: 2100000.00,
          purchaseCost: 2100000.00,
          stockSaleTotal: 8,
          stockSaleAvailable: 8,
          stockRentTotal: 4,
          stockRentAvailable: 4,
          stockTotal: 12,
          stockAvailable: 12,
        },
      ],
    },
    {
      name: 'Emerald Green Tissue Saree',
      slug: 'emerald-green-tissue-saree',
      description: 'Translucent metallic emerald tissue saree with gold scalloped embroidery and sequin highlights.',
      category: 'Sarees',
      images: [
        '/images/products/saree-1.jpg',
        '/images/products/default-product.jpg',
      ],
      variants: [
        {
          sku: 'SAR-EME-S',
          attributes: { size: 'S', color: 'Emerald Green' },
          priceSale: 4200000.00,
          priceRent: 720000.00,
          costPrice: 1950000.00,
          purchaseCost: 1950000.00,
          stockSaleTotal: 10,
          stockSaleAvailable: 10,
          stockRentTotal: 5,
          stockRentAvailable: 5,
          stockTotal: 15,
          stockAvailable: 15,
        },
        {
          sku: 'SAR-EME-M',
          attributes: { size: 'M', color: 'Emerald Green' },
          priceSale: 4200000.00,
          priceRent: 720000.00,
          costPrice: 1950000.00,
          purchaseCost: 1950000.00,
          stockSaleTotal: 10,
          stockSaleAvailable: 10,
          stockRentTotal: 5,
          stockRentAvailable: 5,
          stockTotal: 15,
          stockAvailable: 15,
        },
      ],
    },
    {
      name: 'Champagne Gold Sequin Saree',
      slug: 'champagne-gold-sequin-saree',
      description: 'Glamorous champagne gold saree drenched in shimmering micro-sequins with a fitted designer blouse.',
      category: 'Sarees',
      images: [
        '/images/products/saree-2.jpg',
        '/images/products/default-product.jpg',
      ],
      variants: [
        {
          sku: 'SAR-CMP-S',
          attributes: { size: 'S', color: 'Champagne Gold' },
          priceSale: 4900000.00,
          priceRent: 820000.00,
          costPrice: 2300000.00,
          purchaseCost: 2300000.00,
          stockSaleTotal: 7,
          stockSaleAvailable: 7,
          stockRentTotal: 4,
          stockRentAvailable: 4,
          stockTotal: 11,
          stockAvailable: 11,
        },
        {
          sku: 'SAR-CMP-M',
          attributes: { size: 'M', color: 'Champagne Gold' },
          priceSale: 4900000.00,
          priceRent: 820000.00,
          costPrice: 2300000.00,
          purchaseCost: 2300000.00,
          stockSaleTotal: 8,
          stockSaleAvailable: 8,
          stockRentTotal: 4,
          stockRentAvailable: 4,
          stockTotal: 12,
          stockAvailable: 12,
        },
      ],
    },
    {
      name: 'Haute Couture Celestial Pre-Order Gown',
      slug: 'haute-couture-celestial-gown',
      description: 'An exclusive runway piece crafted with silver metallic thread and hand-beaded Swarovski crystals. Available strictly on Pre-Order.',
      category: 'Haute Couture',
      images: [
        '/images/products/lehenga-1.jpg',
        '/images/products/default-product.jpg',
      ],
      variants: [
        {
          sku: 'HC-CEL-S',
          skuSale: 'HC-CEL-S-BUY',
          skuRent: 'HC-CEL-S-RENT',
          isPreOrder: true,
          preOrderShipDate: new Date('2026-10-15'),
          preOrderNote: 'Hand-crafted in Jakarta atelier. Ships within 6 weeks of order.',
          attributes: { size: 'S', color: 'Celestial Silver' },
          priceSale: 12500000.00,
          priceRent: 2100000.00,
          costPrice: 5000000.00,
          purchaseCost: 5000000.00,
          stockSaleTotal: 0,
          stockSaleAvailable: 0,
          stockRentTotal: 2,
          stockRentAvailable: 2,
          stockTotal: 2,
          stockAvailable: 2,
        },
      ],
    },
  ];

  const createdProducts = [];
  for (const productInfo of productsData) {
    const { variants, ...prod } = productInfo;
    const createdProduct = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        name: prod.name,
        description: prod.description,
        category: prod.category,
        images: prod.images,
      },
      create: {
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        category: prod.category,
        images: prod.images,
      },
    });

    for (const variantData of variants) {
      const vData = variantData as any;
      const skuSale = vData.skuSale || vData.sku;
      const skuRent = vData.skuRent || `${vData.sku}-RENT`;
      const isPreOrder = vData.isPreOrder ?? false;
      const preOrderShipDate = vData.preOrderShipDate ?? null;
      const preOrderNote = vData.preOrderNote ?? null;
      const compareAtPrice = vData.compareAtPrice ?? null;

      await prisma.productVariant.upsert({
        where: { sku: vData.sku },
        update: {
          attributes: vData.attributes,
          priceSale: vData.priceSale,
          compareAtPrice,
          priceRent: vData.priceRent,
          costPrice: vData.costPrice,
          purchaseCost: vData.purchaseCost,
          stockSaleTotal: vData.stockSaleTotal,
          stockSaleAvailable: vData.stockSaleAvailable,
          stockRentTotal: vData.stockRentTotal,
          stockRentAvailable: vData.stockRentAvailable,
          stockTotal: vData.stockTotal,
          stockAvailable: vData.stockAvailable,
          skuSale,
          skuRent,
          isPreOrder,
          preOrderShipDate,
          preOrderNote,
        },
        create: {
          ...vData,
          productId: createdProduct.id,
          skuSale,
          skuRent,
          isPreOrder,
          preOrderShipDate,
          preOrderNote,
        },
      });
    }

    const fullProduct = await prisma.product.findUniqueOrThrow({
      where: { id: createdProduct.id },
      include: {
        variants: true,
      },
    });

    createdProducts.push(fullProduct);
    console.log(`Upserted product: ${fullProduct.name} (${fullProduct.variants.length} variants)`);

    // Log initial R&D / COGS expense entries into Ledger if not present
    const existingLedger = await prisma.ledgerEntry.findFirst({
      where: {
        description: `R&D and Haute Couture Design for ${fullProduct.name}`,
        productId: fullProduct.id,
      },
    });
    if (!existingLedger) {
      await prisma.ledgerEntry.create({
        data: {
          type: 'EXPENSE',
          amount: 5000000.00,
          description: `R&D and Haute Couture Design for ${fullProduct.name}`,
          expenseCategory: 'DESIGN_RND',
          productId: fullProduct.id,
        },
      });
    }

    // Create initial InventoryTransaction entries for variant stock allocations if not present
    for (const v of fullProduct.variants) {
      const existingTx = await prisma.inventoryTransaction.findFirst({
        where: {
          variantId: v.id,
          reason: 'INITIAL_CATALOG_SEEDED_STOCK',
        },
      });
      if (!existingTx) {
        await prisma.inventoryTransaction.create({
          data: {
            variantId: v.id,
            type: 'ADD',
            quantity: v.stockTotal,
            reason: 'INITIAL_CATALOG_SEEDED_STOCK',
            cost: v.costPrice,
            purchaseCost: v.purchaseCost,
            notes: `Initial stock allocation: ${v.stockSaleTotal} sale units, ${v.stockRentTotal} rent units`,
          },
        });
      }
    }
  }

  // Helper shortcuts for variants
  const kaftanVariantS = createdProducts[0].variants[0];
  const lehengaVariantS = createdProducts[4].variants[0];
  const anarkaliVariantS = createdProducts[8].variants[0];
  const sherwaniVariant40 = createdProducts[1].variants[0];
  const sareeVariantS = createdProducts[12].variants[0];
  const capeVariant = createdProducts[13].variants[0];

  // 3. Wishlist Items
  await prisma.wishlistItem.createMany({
    data: [
      { userId: user1.id, productId: createdProducts[4].id, variantId: lehengaVariantS.id },
      { userId: user1.id, productId: createdProducts[12].id, variantId: sareeVariantS.id },
      { userId: user3.id, productId: createdProducts[0].id, variantId: kaftanVariantS.id },
    ],
    skipDuplicates: true,
  });
  console.log('Created sample wishlist items');

  // 4. Cart & CartItems
  await prisma.cart.deleteMany({
    where: {
      OR: [
        { userId: { in: [user1.id, user2.id, user3.id, user4.id].filter(Boolean) } },
        { sessionId: 'guest_demo_session_99' },
      ],
    },
  });

  await prisma.cart.create({
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

  await prisma.cart.create({
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
  const existingOrdersCount = await prisma.order.count({
    where: {
      userId: { in: [user1.id, user2.id, user3.id, user4.id].filter(Boolean) },
    },
  });

  if (existingOrdersCount === 0) {

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
      productId: createdProducts[4].id,
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
      productId: createdProducts[13].id,
      variantId: capeVariant.id,
    },
  });

  console.log('Created sample orders, payments, and revenue ledger entries');
  } else {
    console.log('Sample orders already present, skipping sample order creation');
  }

  // 6. General Operational & Marketing Expense Ledger Entries
  const existingOpExpense = await prisma.ledgerEntry.findFirst({
    where: {
      description: 'Sourcing Pure Italian Silk & French Lace Fabrics for Bridal Collection',
    },
  });
  if (!existingOpExpense) {
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
  }

  // 7. Landing Page Configurable Sections
  // Clean up existing landing sections to ensure idempotent section seeding
  await prisma.landingSectionItem.deleteMany({});
  await prisma.landingSection.deleteMany({});

  // Hero Banner Section
  await prisma.landingSection.create({
    data: {
      title: 'Elegance Woven in Gold & Velvet',
      subtitle: 'AUTUMN / WINTER HAUTE COUTURE 2026',
      type: 'HERO_BANNER',
      viewAllUrl: 'Discover hand-crafted bridal ensembles, imperial kaftans, and couture rentals for life’s grandest celebrations.',
      displayOrder: -1,
      isActive: true,
      items: {
        create: [
          {
            title: 'Explore Collections',
            linkUrl: '/products',
            subtitle: 'Rent Luxury Wear',
            categoryTab: '/products?type=RENTAL',
            imageUrl: '/images/hero/hero-banner.jpg',
            displayOrder: 1,
          },
        ],
      },
    },
  });

  // New Arrivals Section
  await prisma.landingSection.create({
    data: {
      title: 'New Arrivals',
      subtitle: 'Explore the latest runway releases curated for every wardrobe',
      type: 'NEW_ARRIVALS',
      viewAllUrl: '/products',
      displayOrder: 1,
      isActive: true,
      tabs: ['Women', 'Men', 'Kids'],
      items: {
        create: [
          {
            title: createdProducts[0].name,
            subtitle: createdProducts[0].category || 'Haute Couture',
            imageUrl: createdProducts[0].images[0],
            linkUrl: `/products/${createdProducts[0].slug}`,
            categoryTab: 'Women',
            productId: createdProducts[0].id,
            displayOrder: 1,
          },
          {
            title: createdProducts[1].name,
            subtitle: createdProducts[1].category || 'Bridal Wear',
            imageUrl: createdProducts[1].images[0],
            linkUrl: `/products/${createdProducts[1].slug}`,
            categoryTab: 'Women',
            productId: createdProducts[1].id,
            displayOrder: 2,
          },
          {
            title: createdProducts[2].name,
            subtitle: createdProducts[2].category || 'Ready To Wear',
            imageUrl: createdProducts[2].images[0],
            linkUrl: `/products/${createdProducts[2].slug}`,
            categoryTab: 'Women',
            productId: createdProducts[2].id,
            displayOrder: 3,
          },
          {
            title: createdProducts[3].name,
            subtitle: createdProducts[3].category || 'Men',
            imageUrl: createdProducts[3].images[0],
            linkUrl: `/products/${createdProducts[3].slug}`,
            categoryTab: 'Men',
            productId: createdProducts[3].id,
            displayOrder: 4,
          },
          {
            title: createdProducts[4].name,
            subtitle: createdProducts[4].category || 'Haute Couture',
            imageUrl: createdProducts[4].images[0],
            linkUrl: `/products/${createdProducts[4].slug}`,
            categoryTab: 'Women',
            productId: createdProducts[4].id,
            displayOrder: 5,
          },
          {
            title: createdProducts[5].name,
            subtitle: createdProducts[5].category || 'Bridal Wear',
            imageUrl: createdProducts[5].images[0],
            linkUrl: `/products/${createdProducts[5].slug}`,
            categoryTab: 'Women',
            productId: createdProducts[5].id,
            displayOrder: 6,
          },
        ],
      },
    },
  });

  // Featured Brands Section
  await prisma.landingSection.create({
    data: {
      title: 'Featured Brands',
      subtitle: 'World-renowned luxury ateliers and haute couture design houses',
      type: 'FEATURED_BRANDS',
      viewAllUrl: '/products',
      displayOrder: 2,
      isActive: true,
      tabs: [],
      items: {
        create: [
          {
            title: 'Atelier Ideal',
            subtitle: 'Parisian High Fashion',
            imageUrl: '/images/sections/brand-atelier.jpg',
            linkUrl: '/products?search=Atelier',
            displayOrder: 1,
          },
          {
            title: 'Royal Velvet',
            subtitle: 'Heritage Kaftans & Robes',
            imageUrl: '/images/sections/brand-kaftan.jpg',
            linkUrl: '/products?category=Haute%20Couture',
            displayOrder: 2,
          },
          {
            title: 'Maison Silk',
            subtitle: 'Handwoven Bridal Lehengas',
            imageUrl: '/images/sections/brand-silk.jpg',
            linkUrl: '/products?category=Bridal%20Wear',
            displayOrder: 3,
          },
          {
            title: 'Imperial Groom',
            subtitle: 'Bespoke Menswear & Sherwanis',
            imageUrl: '/images/sections/brand-groom.jpg',
            linkUrl: '/products?category=Men',
            displayOrder: 4,
          },
        ],
      },
    },
  });

  // Editor's Picks Section
  await prisma.landingSection.create({
    data: {
      title: "Editor's Picks",
      subtitle: 'Masterpieces handpicked by our creative directors for statement elegance',
      type: 'EDITORS_PICKS',
      viewAllUrl: '/products?type=SALE',
      displayOrder: 3,
      isActive: true,
      tabs: [],
      items: {
        create: [
          {
            title: createdProducts[0].name,
            subtitle: createdProducts[0].category || 'Kaftans',
            imageUrl: createdProducts[0].images[0],
            linkUrl: `/products/${createdProducts[0].slug}`,
            productId: createdProducts[0].id,
            displayOrder: 1,
          },
          {
            title: createdProducts[4].name,
            subtitle: createdProducts[4].category || 'Lehengas',
            imageUrl: createdProducts[4].images[0],
            linkUrl: `/products/${createdProducts[4].slug}`,
            productId: createdProducts[4].id,
            displayOrder: 2,
          },
          {
            title: createdProducts[8].name,
            subtitle: createdProducts[8].category || 'Anarkalis',
            imageUrl: createdProducts[8].images[0],
            linkUrl: `/products/${createdProducts[8].slug}`,
            productId: createdProducts[8].id,
            displayOrder: 3,
          },
          {
            title: createdProducts[12].name,
            subtitle: createdProducts[12].category || 'Sarees',
            imageUrl: createdProducts[12].images[0],
            linkUrl: `/products/${createdProducts[12].slug}`,
            productId: createdProducts[12].id,
            displayOrder: 4,
          },
        ],
      },
    },
  });

  console.log('Created landing page configurable sections');

  // 8. Seed Default Navigation Categories
  await seedDefaultCategoryTree();
  console.log('Created default navigation categories');

  // 9. Seed Vouchers
  const vouchersData = [
    {
      code: 'WELCOME2026',
      description: 'Welcome discount for new patrons',
      discountType: 'PERCENTAGE' as const,
      discountValue: 10.00,
      minPurchase: 1000000.00,
      maxDiscount: 500000.00,
      usageLimit: 100,
      isActive: true,
      targetType: 'EVENT' as const,
    },
    {
      code: 'ATELIER500K',
      description: 'IDR 500,000 off on Haute Couture & Bridal Wear',
      discountType: 'FIXED_AMOUNT' as const,
      discountValue: 500000.00,
      minPurchase: 3000000.00,
      usageLimit: 50,
      isActive: true,
      targetType: 'EVENT' as const,
    },
    {
      code: 'VIPLUXURY',
      description: 'Exclusive 15% VIP discount',
      discountType: 'PERCENTAGE' as const,
      discountValue: 15.00,
      minPurchase: 5000000.00,
      maxDiscount: 1500000.00,
      usageLimit: 20,
      isActive: true,
      targetType: 'CUSTOMER' as const,
      userId: user1.id,
    },
  ];

  for (const v of vouchersData) {
    await prisma.voucher.upsert({
      where: { code: v.code },
      update: {
        description: v.description,
        discountType: v.discountType,
        discountValue: v.discountValue,
        minPurchase: v.minPurchase,
        maxDiscount: v.maxDiscount,
        usageLimit: v.usageLimit,
        isActive: v.isActive,
        targetType: v.targetType,
        userId: v.userId,
      },
      create: v,
    });
  }
  console.log('Created sample vouchers');

  // 10. Seed Rental Maintenance Blocks
  const existingRentalBlock = await prisma.rentalBlock.findFirst({
    where: {
      variantId: sherwaniVariant40.id,
      reason: 'DRY_CLEANING',
    },
  });
  if (!existingRentalBlock) {
    await prisma.rentalBlock.createMany({
      data: [
        {
          variantId: sherwaniVariant40.id,
          startDate: new Date('2026-09-10'),
          endDate: new Date('2026-09-14'),
          reason: 'DRY_CLEANING',
          notes: 'Routine professional dry cleaning post-event rental',
        },
        {
          variantId: kaftanVariantS.id,
          startDate: new Date('2026-09-15'),
          endDate: new Date('2026-09-18'),
          reason: 'MAINTENANCE',
          notes: 'Haute couture embroidery inspection and bead tightening',
        },
      ],
    });
    console.log('Created sample rental blocks');
  }

  // 11. Audit Log Entry
  const existingAuditLog = await prisma.auditLog.findFirst({
    where: { action: 'SEED_DATABASE', entityId: 'seed_init' },
  });
  if (!existingAuditLog) {
    await prisma.auditLog.create({
      data: {
        userId: user1.id,
        userEmail: user1.email || 'system@idealbeauty.com',
        userName: user1.name || 'System Administrator',
        action: 'SEED_DATABASE',
        entity: 'SYSTEM',
        entityId: 'seed_init',
        details: { message: 'Database successfully seeded with luxury haute couture catalog, separated stock pools, and sample orders.' },
      },
    });
    console.log('Created initial audit log entry');
  }

  // 12. Seed Default Size Charts
  const defaultSizeChart = await seedDefaultSizeCharts();
  if (defaultSizeChart) {
    // Link all existing products without size chart to default chart
    await prisma.product.updateMany({
      where: { sizeChartId: null },
      data: { sizeChartId: defaultSizeChart.id },
    });
    console.log('Seeded default size charts and linked existing products');
  }

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
