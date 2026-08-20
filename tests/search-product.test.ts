import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { quickSearchProductsAction } from '../src/app/actions/product';
import { getProducts } from '../src/lib/services/product';
import { prisma } from '../src/lib/prisma';

describe('Search and Faceted Filter Catalog Suite', () => {
  let createdProductId: string;
  let preOrderProductId: string;
  let outOfStockProductId: string;
  const testPrefix = `search-test-${Date.now()}`;

  beforeAll(async () => {
    // 1. In stock product
    const product = await prisma.product.create({
      data: {
        name: `${testPrefix} Royal Silk Anarkali Gown Test`,
        slug: `${testPrefix}-royal-silk-anarkali-gown-test`,
        category: 'Anarkalis',
        description: 'Exquisite silk handcrafted anarkali gown',
        isActive: true,
        images: ['/images/products/anarkali-1.jpg'],
        variants: {
          create: {
            sku: `SKU-SEARCH-1-${Date.now()}`,
            attributes: { color: 'Royal Blue', size: 'L' },
            priceSale: 2500,
            priceRent: 500,
            stockSaleAvailable: 5,
            stockAvailable: 5,
          },
        },
      },
    });
    createdProductId = product.id;

    // 2. Pre-order product
    const preOrder = await prisma.product.create({
      data: {
        name: `${testPrefix} Bespoke Velvet Lehenga PreOrder`,
        slug: `${testPrefix}-bespoke-velvet-lehenga-preorder`,
        category: 'Lehengas',
        description: 'Handcrafted bridal velvet lehenga on waitlist',
        isActive: true,
        images: ['/images/products/lehenga-1.jpg'],
        variants: {
          create: {
            sku: `SKU-SEARCH-2-${Date.now()}`,
            attributes: { color: 'Crimson', size: 'M' },
            priceSale: 4500,
            priceRent: 800,
            stockSaleAvailable: 0,
            stockAvailable: 0,
            isPreOrder: true,
          },
        },
      },
    });
    preOrderProductId = preOrder.id;

    // 3. Out of stock product
    const outOfStock = await prisma.product.create({
      data: {
        name: `${testPrefix} Archive Vintage Saree SoldOut`,
        slug: `${testPrefix}-archive-vintage-saree-soldout`,
        category: 'Sarees',
        description: 'Archived museum edition pure gold zardozi saree',
        isActive: true,
        images: ['/images/products/saree-1.jpg'],
        variants: {
          create: {
            sku: `SKU-SEARCH-3-${Date.now()}`,
            attributes: { color: 'Gold', size: 'Free' },
            priceSale: 8000,
            stockSaleAvailable: 0,
            stockRentAvailable: 0,
            stockAvailable: 0,
            isPreOrder: false,
          },
        },
      },
    });
    outOfStockProductId = outOfStock.id;
  });

  afterAll(async () => {
    const ids = [createdProductId, preOrderProductId, outOfStockProductId].filter(Boolean);
    if (ids.length > 0) {
      await prisma.productVariant.deleteMany({ where: { productId: { in: ids } } });
      await prisma.product.deleteMany({ where: { id: { in: ids } } });
    }
  });

  describe('quickSearchProductsAction', () => {
    it('should return empty array for empty or single char query', async () => {
      const res1 = await quickSearchProductsAction('');
      const res2 = await quickSearchProductsAction('a');
      expect(res1).toEqual([]);
      expect(res2).toEqual([]);
    });

    it('should find products matching name query', async () => {
      const results = await quickSearchProductsAction(`${testPrefix} Royal Silk`);
      expect(results.length).toBeGreaterThan(0);
      const found = results.find((r) => r.id === createdProductId);
      expect(found).toBeDefined();
      expect(found?.name).toBe(`${testPrefix} Royal Silk Anarkali Gown Test`);
      expect(found?.category).toBe('Anarkalis');
      expect(found?.priceSale).toBe(2500);
    });
  });

  describe('Catalog getProducts query filtering & sorting', () => {
    it('should filter by query string matching name or description', async () => {
      const products = await getProducts({ query: testPrefix });
      expect(products.length).toBe(3);
    });

    it('should filter by inStockOnly excluding sold out items while keeping active pre-orders', async () => {
      const inStockProducts = await getProducts({ query: testPrefix, inStockOnly: true });
      const ids = inStockProducts.map((p) => p.id);
      expect(ids).toContain(createdProductId);
      expect(ids).toContain(preOrderProductId); // Pre-order is considered available for order
      expect(ids).not.toContain(outOfStockProductId);
    });

    it('should sort products by price ascending', async () => {
      const sorted = await getProducts({ query: testPrefix, sort: 'price-asc' });
      expect(sorted.length).toBe(3);
      expect(sorted[0].id).toBe(createdProductId); // 2500
      expect(sorted[1].id).toBe(preOrderProductId); // 4500
      expect(sorted[2].id).toBe(outOfStockProductId); // 8000
    });

    it('should sort products by price descending', async () => {
      const sorted = await getProducts({ query: testPrefix, sort: 'price-desc' });
      expect(sorted.length).toBe(3);
      expect(sorted[0].id).toBe(outOfStockProductId); // 8000
      expect(sorted[1].id).toBe(preOrderProductId); // 4500
      expect(sorted[2].id).toBe(createdProductId); // 2500
    });

    it('should filter by price range', async () => {
      const filtered = await getProducts({
        query: testPrefix,
        minPrice: 3000,
        maxPrice: 5000,
      });
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe(preOrderProductId);
    });
  });
});
