import { describe, it, expect } from 'vitest';
import { serializeProduct, serializeProductVariant, serializeNumber } from '../src/lib/utils/serialization';

describe('Serialization Helpers', () => {
  it('serializeNumber correctly converts numbers and Decimals, preserving 0', () => {
    expect(serializeNumber(0)).toBe(0);
    expect(serializeNumber('0')).toBe(0);
    expect(serializeNumber(150000)).toBe(150000);
    expect(serializeNumber(null)).toBeNull();
    expect(serializeNumber(undefined)).toBeNull();
  });

  it('serializeProductVariant preserves dual SKUs and Pre-Order metadata', () => {
    const rawVariant = {
      id: 'v1',
      sku: 'SKU-TEST-001',
      skuSale: 'SKU-BUY-001',
      skuRent: 'SKU-RENT-001',
      isPreOrder: true,
      preOrderShipDate: new Date('2026-10-15'),
      preOrderNote: 'Ships mid-October',
      attributes: { size: 'S' },
      priceSale: 0,
      priceRent: null,
      compareAtPrice: 500000,
      costPrice: 100000,
      purchaseCost: 80000,
      stockTotal: 10,
      stockAvailable: 2,
    };

    const serialized = serializeProductVariant(rawVariant);

    expect(serialized.priceSale).toBe(0);
    expect(serialized.priceRent).toBeNull();
    expect(serialized.skuSale).toBe('SKU-BUY-001');
    expect(serialized.skuRent).toBe('SKU-RENT-001');
    expect(serialized.isPreOrder).toBe(true);
    expect(serialized.preOrderNote).toBe('Ships mid-October');
    expect(serialized.preOrderShipDate).toBeDefined();
  });

  it('serializeProduct correctly maps variants array with dual SKUs and Pre-Order attributes', () => {
    const rawProduct = {
      id: 'p1',
      name: 'Sample Dress',
      slug: 'sample-dress',
      description: 'A sample dress',
      category: 'Evening Wear',
      images: ['/images/p1.jpg'],
      isActive: true,
      variants: [
        {
          id: 'v1',
          sku: 'SKU-001',
          skuSale: 'SKU-001-BUY',
          skuRent: 'SKU-001-RENT',
          isPreOrder: true,
          preOrderShipDate: new Date('2026-11-01'),
          preOrderNote: 'Pre-order launch',
          attributes: { size: 'M' },
          priceSale: 0,
          priceRent: 150000,
          compareAtPrice: null,
          costPrice: null,
          purchaseCost: null,
          stockTotal: 5,
          stockAvailable: 5,
        },
      ],
    };

    const serialized = serializeProduct(rawProduct);

    expect(serialized.id).toBe('p1');
    expect(serialized.variants).toHaveLength(1);
    expect(serialized.variants[0].priceSale).toBe(0);
    expect(serialized.variants[0].priceRent).toBe(150000);
    expect(serialized.variants[0].skuSale).toBe('SKU-001-BUY');
    expect(serialized.variants[0].skuRent).toBe('SKU-001-RENT');
    expect(serialized.variants[0].isPreOrder).toBe(true);
  });
});
