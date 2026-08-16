import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { quickSearchProductsAction } from '../src/app/actions/product';
import { prisma } from '../src/lib/prisma';

describe('quickSearchProductsAction', () => {
  let createdProductId: string;

  beforeAll(async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Royal Silk Anarkali Gown Test',
        slug: `royal-silk-anarkali-gown-test-${Date.now()}`,
        category: 'Anarkalis',
        description: 'Exquisite silk handcrafted anarkali gown',
        isActive: true,
        images: ['/images/products/anarkali-1.jpg'],
        variants: {
          create: {
            sku: `SKU-SEARCH-${Date.now()}`,
            attributes: { color: 'Royal Blue', size: 'L' },
            priceSale: 2500,
            priceRent: 500,
            stockAvailable: 5,
          },
        },
      },
    });
    createdProductId = product.id;
  });

  afterAll(async () => {
    if (createdProductId) {
      await prisma.productVariant.deleteMany({ where: { productId: createdProductId } });
      await prisma.product.delete({ where: { id: createdProductId } });
    }
  });

  it('should return empty array for empty or single char query', async () => {
    const res1 = await quickSearchProductsAction('');
    const res2 = await quickSearchProductsAction('a');
    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  it('should find products matching name query', async () => {
    const results = await quickSearchProductsAction('Royal Silk');
    expect(results.length).toBeGreaterThan(0);
    const found = results.find((r) => r.id === createdProductId);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Royal Silk Anarkali Gown Test');
    expect(found?.category).toBe('Anarkalis');
    expect(found?.priceSale).toBe(2500);
  });
});
