import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { getProducts, getRelatedProducts } from '../src/lib/services/product';

describe('Product Data Services (getProducts and getRelatedProducts)', () => {
  const testPrefix = `test-svc-${Date.now()}`;
  let catAProductId1: string;
  let catAProductId2: string;
  let catBProductId1: string;
  let outOfStockProductId: string;
  let preOrderProductId: string;
  let rentalOnlyProductId: string;
  let popularProductId: string;
  let multiVariantProductId: string;

  beforeAll(async () => {
    // 1. Cat A Product 1: Price 100000, Stock 5, Cat: 'Bridal Wear'
    const p1 = await prisma.product.create({
      data: {
        name: `${testPrefix} Cat A Prod 1`,
        slug: `${testPrefix}-cat-a-prod-1`,
        category: 'Bridal Wear',
        isActive: true,
        images: ['/images/products/test1.jpg'],
        createdAt: new Date(Date.now() - 10000),
        variants: {
          create: {
            sku: `SKU-${testPrefix}-1`,
            attributes: { size: 'M' },
            priceSale: 100000,
            priceRent: 20000,
            stockSaleAvailable: 5,
            stockAvailable: 5,
          },
        },
      },
    });
    catAProductId1 = p1.id;

    // 2. Cat A Product 2: Price 300000, Stock 2, Cat: 'Bridal Wear'
    const p2 = await prisma.product.create({
      data: {
        name: `${testPrefix} Cat A Prod 2`,
        slug: `${testPrefix}-cat-a-prod-2`,
        category: 'Bridal Wear',
        isActive: true,
        images: ['/images/products/test2.jpg'],
        createdAt: new Date(Date.now() - 5000),
        variants: {
          create: {
            sku: `SKU-${testPrefix}-2`,
            attributes: { size: 'L' },
            priceSale: 300000,
            priceRent: 50000,
            stockSaleAvailable: 2,
            stockAvailable: 2,
          },
        },
      },
    });
    catAProductId2 = p2.id;

    // 3. Cat B Product 1: Price 200000, Stock 10, Cat: 'Haute Couture'
    const p3 = await prisma.product.create({
      data: {
        name: `${testPrefix} Cat B Prod 1`,
        slug: `${testPrefix}-cat-b-prod-1`,
        category: 'Haute Couture',
        isActive: true,
        images: ['/images/products/test3.jpg'],
        createdAt: new Date(Date.now() - 20000),
        variants: {
          create: {
            sku: `SKU-${testPrefix}-3`,
            attributes: { size: 'S' },
            priceSale: 200000,
            priceRent: 35000,
            stockSaleAvailable: 10,
            stockAvailable: 10,
          },
        },
      },
    });
    catBProductId1 = p3.id;

    // 4. Out of Stock Product: Price 500000, Stock 0, isPreOrder: false
    const p4 = await prisma.product.create({
      data: {
        name: `${testPrefix} Out Of Stock`,
        slug: `${testPrefix}-out-of-stock`,
        category: 'Bridal Wear',
        isActive: true,
        images: ['/images/products/test4.jpg'],
        createdAt: new Date(Date.now() - 30000),
        variants: {
          create: {
            sku: `SKU-${testPrefix}-4`,
            attributes: { size: 'XL' },
            priceSale: 500000,
            stockSaleAvailable: 0,
            stockRentAvailable: 0,
            stockAvailable: 0,
            isPreOrder: false,
          },
        },
      },
    });
    outOfStockProductId = p4.id;

    // 5. Pre-Order Product: Price 400000, Stock 0, isPreOrder: true
    const p5 = await prisma.product.create({
      data: {
        name: `${testPrefix} Pre-Order`,
        slug: `${testPrefix}-pre-order`,
        category: 'Haute Couture',
        isActive: true,
        images: ['/images/products/test5.jpg'],
        createdAt: new Date(Date.now() - 15000),
        variants: {
          create: {
            sku: `SKU-${testPrefix}-5`,
            attributes: { size: 'M' },
            priceSale: 400000,
            stockSaleAvailable: 0,
            stockAvailable: 0,
            isPreOrder: true,
          },
        },
      },
    });
    preOrderProductId = p5.id;

    // 6. Rental Only Product: Price Rent 60000, Price Sale null, StockRent 3
    const p6 = await prisma.product.create({
      data: {
        name: `${testPrefix} Rental Only`,
        slug: `${testPrefix}-rental-only`,
        category: 'Bridal Wear',
        isActive: true,
        images: ['/images/products/test6.jpg'],
        createdAt: new Date(Date.now() - 25000),
        variants: {
          create: {
            sku: `SKU-${testPrefix}-6`,
            attributes: { size: 'M' },
            priceRent: 60000,
            stockRentAvailable: 3,
            stockSaleAvailable: 0,
            stockAvailable: 3,
          },
        },
      },
    });
    rentalOnlyProductId = p6.id;

    // 7. Popular Product: Price 150000, Stock 5, with Wishlist items
    const p7 = await prisma.product.create({
      data: {
        name: `${testPrefix} Popular Product`,
        slug: `${testPrefix}-popular-prod`,
        category: 'Ready To Wear',
        isActive: true,
        images: ['/images/products/test7.jpg'],
        createdAt: new Date(Date.now() - 40000),
        variants: {
          create: {
            sku: `SKU-${testPrefix}-7`,
            attributes: { size: 'S' },
            priceSale: 150000,
            stockSaleAvailable: 5,
            stockAvailable: 5,
          },
        },
      },
    });
    popularProductId = p7.id;

    // 8. Multi-Variant Product: One variant out of stock, one in stock
    const p8 = await prisma.product.create({
      data: {
        name: `${testPrefix} Multi-Variant Product`,
        slug: `${testPrefix}-multi-variant-prod`,
        category: 'Ready To Wear',
        isActive: true,
        images: ['/images/products/test8.jpg'],
        createdAt: new Date(Date.now() - 35000),
        variants: {
          create: [
            {
              sku: `SKU-${testPrefix}-8-OOS`,
              attributes: { size: 'S' },
              priceSale: 250000,
              stockSaleAvailable: 0,
              stockAvailable: 0,
              isPreOrder: false,
            },
            {
              sku: `SKU-${testPrefix}-8-IN`,
              attributes: { size: 'M' },
              priceSale: 275000,
              stockSaleAvailable: 4,
              stockAvailable: 4,
              isPreOrder: false,
            },
          ],
        },
      },
    });
    multiVariantProductId = p8.id;

    // Create a user and wishlist item for popular product to boost popularity score
    const testUser = await prisma.user.create({
      data: {
        email: `${testPrefix}-user@idealbeautyofficial.com`,
        phone: `+62819${Math.floor(10000000 + Math.random() * 90000000)}`,
        name: 'Test User',
      },
    });

    await prisma.wishlistItem.create({
      data: {
        userId: testUser.id,
        productId: popularProductId,
      },
    });
  });

  afterAll(async () => {
    const allIds = [
      catAProductId1,
      catAProductId2,
      catBProductId1,
      outOfStockProductId,
      preOrderProductId,
      rentalOnlyProductId,
      popularProductId,
      multiVariantProductId,
    ].filter(Boolean);

    await prisma.wishlistItem.deleteMany({ where: { productId: { in: allIds } } });
    await prisma.productVariant.deleteMany({ where: { productId: { in: allIds } } });
    await prisma.product.deleteMany({ where: { id: { in: allIds } } });
    await prisma.user.deleteMany({ where: { email: { contains: testPrefix } } });
  });

  describe('Sorting query options', () => {
    it('should sort products by newest (createdAt desc) by default', async () => {
      const results = await getProducts({ query: testPrefix });
      expect(results.length).toBeGreaterThanOrEqual(5);

      for (let i = 0; i < results.length - 1; i++) {
        const dateA = new Date(results[i].createdAt).getTime();
        const dateB = new Date(results[i + 1].createdAt).getTime();
        expect(dateA).toBeGreaterThanOrEqual(dateB);
      }
    });

    it('should sort products by price ascending (price-asc)', async () => {
      const results = await getProducts({ query: testPrefix, type: 'SALE', sort: 'price-asc' });
      expect(results.length).toBeGreaterThanOrEqual(4);

      const prices = results.map((p) => p.variants[0]?.priceSale).filter((p): p is number => p !== null);
      for (let i = 0; i < prices.length - 1; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i + 1]);
      }
    });

    it('should sort products by price descending (price-desc)', async () => {
      const results = await getProducts({ query: testPrefix, type: 'SALE', sort: 'price-desc' });
      expect(results.length).toBeGreaterThanOrEqual(4);

      const prices = results.map((p) => p.variants[0]?.priceSale).filter((p): p is number => p !== null);
      for (let i = 0; i < prices.length - 1; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i + 1]);
      }
    });

    it('should sort products by popularity (popular)', async () => {
      const results = await getProducts({ query: testPrefix, sort: 'popular' });
      expect(results.length).toBeGreaterThanOrEqual(1);

      // The popular product with a wishlist item should be at the top
      expect(results[0].id).toBe(popularProductId);
    });

    it('should combine price filtering and sorting correctly', async () => {
      const results = await getProducts({
        query: testPrefix,
        type: 'SALE',
        minPrice: 150000,
        maxPrice: 350000,
        sort: 'price-asc',
      });

      expect(results.length).toBeGreaterThanOrEqual(2);
      for (const prod of results) {
        const salePrices = prod.variants.map((v) => v.priceSale).filter((p): p is number => p !== null);
        const minP = Math.min(...salePrices);
        expect(minP).toBeGreaterThanOrEqual(150000);
        expect(minP).toBeLessThanOrEqual(350000);
      }
    });
  });

  describe('Stock availability filtering (inStockOnly)', () => {
    it('should exclude out-of-stock non-preorder products when inStockOnly is true', async () => {
      const allResults = await getProducts({ query: testPrefix });
      const inStockResults = await getProducts({ query: testPrefix, inStockOnly: true });

      const foundOutOfStockInAll = allResults.find((p) => p.id === outOfStockProductId);
      expect(foundOutOfStockInAll).toBeDefined();

      const foundOutOfStockInFiltered = inStockResults.find((p) => p.id === outOfStockProductId);
      expect(foundOutOfStockInFiltered).toBeUndefined();
    });

    it('should include multi-variant products if at least one variant is in stock', async () => {
      const inStockResults = await getProducts({ query: testPrefix, inStockOnly: true });
      const foundMultiVariant = inStockResults.find((p) => p.id === multiVariantProductId);
      expect(foundMultiVariant).toBeDefined();
    });

    it('should include pre-order products when inStockOnly is true', async () => {
      const inStockResults = await getProducts({ query: testPrefix, inStockOnly: true });
      const foundPreOrder = inStockResults.find((p) => p.id === preOrderProductId);
      expect(foundPreOrder).toBeDefined();
    });

    it('should filter rental in-stock products when type is RENTAL and inStockOnly is true', async () => {
      const rentalResults = await getProducts({ query: testPrefix, type: 'RENTAL', inStockOnly: true });
      const foundRentalOnly = rentalResults.find((p) => p.id === rentalOnlyProductId);
      expect(foundRentalOnly).toBeDefined();

      const foundOutOfStock = rentalResults.find((p) => p.id === outOfStockProductId);
      expect(foundOutOfStock).toBeUndefined();
    });
  });

  describe('getRelatedProducts', () => {
    it('should return complementary products in the same category excluding the current product', async () => {
      const related = await getRelatedProducts(catAProductId1, 'Bridal Wear', 4);
      expect(related.length).toBeGreaterThan(0);

      // Current product should NOT be included
      expect(related.find((p) => p.id === catAProductId1)).toBeUndefined();

      // catAProductId2 is in Bridal Wear and should be present
      const foundCatA2 = related.find((p) => p.id === catAProductId2);
      expect(foundCatA2).toBeDefined();
    });

    it('should fallback to latest active items when category has fewer items than limit', async () => {
      // Cat B only has 1 other product (catBProductId1), requesting limit of 3
      const related = await getRelatedProducts(preOrderProductId, 'Haute Couture', 3);
      expect(related.length).toBe(3);

      // Current product should NOT be in results
      expect(related.find((p) => p.id === preOrderProductId)).toBeUndefined();

      // Unique product IDs returned
      const ids = related.map((p) => p.id);
      expect(new Set(ids).size).toBe(3);
    });

    it('should handle null or undefined category by returning latest active products excluding productId', async () => {
      const related = await getRelatedProducts(catAProductId1, null, 2);
      expect(related.length).toBe(2);
      expect(related.find((p) => p.id === catAProductId1)).toBeUndefined();
    });

    it('should handle non-existent category gracefully with fallback items', async () => {
      const related = await getRelatedProducts(catAProductId1, 'NonExistentCategoryXYZ', 2);
      expect(related.length).toBe(2);
      expect(related.find((p) => p.id === catAProductId1)).toBeUndefined();
    });
  });
});
