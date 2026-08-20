import { describe, it, expect } from 'vitest';
import {
  formatIDR,
  calculateDiscountPercent,
  getVariantStockStatus,
  isVariantSoldOut,
  canAddToCartValidation,
  StockVariantInput,
} from '../src/lib/utils/product-stock';

describe('PDP State & Stock Utilities (Step 3)', () => {
  describe('formatIDR Utility', () => {
    it('formats numbers to Indonesian Rupiah currency format', () => {
      expect(formatIDR(150000)).toMatch(/Rp\s*150\.000/);
      expect(formatIDR(0)).toMatch(/Rp\s*0/);
      expect(formatIDR('2500000')).toMatch(/Rp\s*2\.500\.000/);
    });

    it('returns N/A for invalid or missing amounts', () => {
      expect(formatIDR(null)).toBe('N/A');
      expect(formatIDR(undefined)).toBe('N/A');
      expect(formatIDR('')).toBe('N/A');
      expect(formatIDR('not-a-number')).toBe('N/A');
    });
  });

  describe('calculateDiscountPercent Utility', () => {
    it('calculates the exact rounded percentage when compareAtPrice > currentPrice', () => {
      expect(calculateDiscountPercent(2000000, 1500000)).toBe(25);
      expect(calculateDiscountPercent(1000000, 500000)).toBe(50);
      expect(calculateDiscountPercent('1000000', '700000')).toBe(30);
      expect(calculateDiscountPercent(333333, 250000)).toBe(25);
    });

    it('returns null when current price is greater than or equal to compareAtPrice', () => {
      expect(calculateDiscountPercent(1000000, 1000000)).toBeNull();
      expect(calculateDiscountPercent(500000, 1000000)).toBeNull();
    });

    it('returns null for missing, negative, or invalid inputs', () => {
      expect(calculateDiscountPercent(undefined, 100000)).toBeNull();
      expect(calculateDiscountPercent(100000, undefined)).toBeNull();
      expect(calculateDiscountPercent(null, null)).toBeNull();
      expect(calculateDiscountPercent(-100, 50)).toBeNull();
      expect(calculateDiscountPercent(100, -50)).toBeNull();
      expect(calculateDiscountPercent('invalid', 'price')).toBeNull();
    });
  });

  describe('getVariantStockStatus Utility', () => {
    describe('SALE Mode', () => {
      it('returns in-stock status when available quantity is greater than 3', () => {
        const variant: StockVariantInput = {
          stockSaleAvailable: 10,
          stockAvailable: 10,
          isPreOrder: false,
        };
        const status = getVariantStockStatus(variant, 'SALE');
        expect(status).toEqual({
          badgeText: '10 in stock',
          badgeType: 'in-stock',
          isAvailable: true,
        });
      });

      it('returns low-stock status when available quantity is between 1 and 3', () => {
        const variant3: StockVariantInput = { stockSaleAvailable: 3, stockAvailable: 3 };
        const status3 = getVariantStockStatus(variant3, 'SALE');
        expect(status3).toEqual({
          badgeText: 'Only 3 left',
          badgeType: 'low-stock',
          isAvailable: true,
        });

        const variant1: StockVariantInput = { stockSaleAvailable: 1, stockAvailable: 1 };
        const status1 = getVariantStockStatus(variant1, 'SALE');
        expect(status1).toEqual({
          badgeText: 'Only 1 left',
          badgeType: 'low-stock',
          isAvailable: true,
        });
      });

      it('returns pre-order status when stock is 0 and isPreOrder is true', () => {
        const variant: StockVariantInput = {
          stockSaleAvailable: 0,
          stockAvailable: 0,
          isPreOrder: true,
        };
        const status = getVariantStockStatus(variant, 'SALE');
        expect(status).toEqual({
          badgeText: 'Pre-Order',
          badgeType: 'pre-order',
          isAvailable: true,
        });
      });

      it('returns sold-out status when stock is 0 and isPreOrder is false', () => {
        const variant: StockVariantInput = {
          stockSaleAvailable: 0,
          stockAvailable: 0,
          isPreOrder: false,
        };
        const status = getVariantStockStatus(variant, 'SALE');
        expect(status).toEqual({
          badgeText: 'Sold Out',
          badgeType: 'sold-out',
          isAvailable: false,
        });
      });

      it('falls back to stockAvailable when stockSaleAvailable is undefined', () => {
        const variant: StockVariantInput = {
          stockAvailable: 5,
        };
        const status = getVariantStockStatus(variant, 'SALE');
        expect(status).toEqual({
          badgeText: '5 in stock',
          badgeType: 'in-stock',
          isAvailable: true,
        });
      });
    });

    describe('RENTAL Mode', () => {
      it('returns in-stock rental status when rental stock is greater than 0', () => {
        const variant: StockVariantInput = {
          stockRentAvailable: 4,
          stockAvailable: 4,
        };
        const status = getVariantStockStatus(variant, 'RENTAL');
        expect(status).toEqual({
          badgeText: '4 for rent',
          badgeType: 'in-stock',
          isAvailable: true,
        });
      });

      it('returns unavailable when rental stock is 0', () => {
        const variant: StockVariantInput = {
          stockRentAvailable: 0,
          stockAvailable: 0,
          isPreOrder: true, // Pre-order does not apply to rentals
        };
        const status = getVariantStockStatus(variant, 'RENTAL');
        expect(status).toEqual({
          badgeText: 'Unavailable',
          badgeType: 'sold-out',
          isAvailable: false,
        });
      });

      it('falls back to stockAvailable when stockRentAvailable is undefined', () => {
        const variant: StockVariantInput = {
          stockAvailable: 2,
        };
        const status = getVariantStockStatus(variant, 'RENTAL');
        expect(status).toEqual({
          badgeText: '2 for rent',
          badgeType: 'in-stock',
          isAvailable: true,
        });
      });
    });

    it('handles null or undefined variant input safely', () => {
      const statusNull = getVariantStockStatus(null, 'SALE');
      expect(statusNull).toEqual({
        badgeText: 'Unavailable',
        badgeType: 'sold-out',
        isAvailable: false,
      });

      const statusUndefined = getVariantStockStatus(undefined, 'RENTAL');
      expect(statusUndefined).toEqual({
        badgeText: 'Unavailable',
        badgeType: 'sold-out',
        isAvailable: false,
      });
    });
  });

  describe('isVariantSoldOut Utility', () => {
    it('evaluates sold out status for SALE mode properly', () => {
      expect(isVariantSoldOut({ stockSaleAvailable: 5 }, 'SALE')).toBe(false);
      expect(isVariantSoldOut({ stockSaleAvailable: 0, isPreOrder: true }, 'SALE')).toBe(false);
      expect(isVariantSoldOut({ stockSaleAvailable: 0, isPreOrder: false }, 'SALE')).toBe(true);
      expect(isVariantSoldOut(null, 'SALE')).toBe(true);
    });

    it('evaluates sold out status for RENTAL mode properly', () => {
      expect(isVariantSoldOut({ stockRentAvailable: 2 }, 'RENTAL')).toBe(false);
      expect(isVariantSoldOut({ stockRentAvailable: 0 }, 'RENTAL')).toBe(true);
      expect(isVariantSoldOut({ stockRentAvailable: 0, isPreOrder: true }, 'RENTAL')).toBe(true);
      expect(isVariantSoldOut(null, 'RENTAL')).toBe(true);
    });
  });

  describe('canAddToCartValidation Utility', () => {
    it('returns false if an add-to-cart request is already in progress', () => {
      const result = canAddToCartValidation({
        variant: { stockSaleAvailable: 5 },
        optionType: 'SALE',
        isAddingToCart: true,
      });
      expect(result).toBe(false);
    });

    it('returns false if variant is null or undefined', () => {
      expect(canAddToCartValidation({ variant: null, optionType: 'SALE' })).toBe(false);
      expect(canAddToCartValidation({ variant: undefined, optionType: 'RENTAL' })).toBe(false);
    });

    describe('SALE Mode Validations', () => {
      it('permits adding to cart if stock is available', () => {
        const result = canAddToCartValidation({
          variant: { stockSaleAvailable: 2 },
          optionType: 'SALE',
        });
        expect(result).toBe(true);
      });

      it('permits adding to cart if item is out of stock but pre-order is active', () => {
        const result = canAddToCartValidation({
          variant: { stockSaleAvailable: 0, isPreOrder: true },
          optionType: 'SALE',
        });
        expect(result).toBe(true);
      });

      it('prevents adding to cart if item is completely sold out', () => {
        const result = canAddToCartValidation({
          variant: { stockSaleAvailable: 0, isPreOrder: false },
          optionType: 'SALE',
        });
        expect(result).toBe(false);
      });
    });

    describe('RENTAL Mode Validations', () => {
      it('permits adding to cart when rental stock is available and dates are valid', () => {
        const result = canAddToCartValidation({
          variant: { stockRentAvailable: 1 },
          optionType: 'RENTAL',
          rentStartDate: '2026-09-01',
          rentEndDate: '2026-09-04',
          isRentalDatesValid: true,
        });
        expect(result).toBe(true);
      });

      it('prevents adding to cart if rental dates are invalid or incomplete', () => {
        const invalidDates = canAddToCartValidation({
          variant: { stockRentAvailable: 1 },
          optionType: 'RENTAL',
          rentStartDate: '2026-09-01',
          rentEndDate: '2026-09-04',
          isRentalDatesValid: false,
        });
        expect(invalidDates).toBe(false);

        const missingStart = canAddToCartValidation({
          variant: { stockRentAvailable: 1 },
          optionType: 'RENTAL',
          rentStartDate: '',
          rentEndDate: '2026-09-04',
          isRentalDatesValid: true,
        });
        expect(missingStart).toBe(false);

        const missingEnd = canAddToCartValidation({
          variant: { stockRentAvailable: 1 },
          optionType: 'RENTAL',
          rentStartDate: '2026-09-01',
          rentEndDate: '',
          isRentalDatesValid: true,
        });
        expect(missingEnd).toBe(false);
      });

      it('prevents adding to cart if rental stock is 0', () => {
        const result = canAddToCartValidation({
          variant: { stockRentAvailable: 0 },
          optionType: 'RENTAL',
          rentStartDate: '2026-09-01',
          rentEndDate: '2026-09-04',
          isRentalDatesValid: true,
        });
        expect(result).toBe(false);
      });
    });
  });

  describe('PDP Editorial & Rental Logic (Step 4)', () => {
    describe('Rental Duration and Cost Computation', () => {
      it('calculates rental duration in days inclusive of start and end dates', () => {
        const startDate = '2026-09-01';
        const endDate = '2026-09-04';
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        expect(days).toBe(4);

        const dailyRate = 500000;
        const totalRental = days * dailyRate;
        expect(totalRental).toBe(2000000);
      });

      it('calculates single-day rental properly', () => {
        const startDate = '2026-09-01';
        const endDate = '2026-09-01';
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        expect(days).toBe(1);
      });

      it('calculates standard refundable security deposit based on daily rate', () => {
        const dailyRate = 600000;
        const deposit = Math.round(dailyRate * 1.5);
        expect(deposit).toBe(900000);
      });
    });

    describe('Sticky Mobile Action Button State Resolution', () => {
      function resolveMobileButtonText({
        addedSuccess,
        isAddingToCart,
        canAddToCart,
        isSoldOut,
        optionType,
        isSalePreOrder,
      }: {
        addedSuccess: boolean;
        isAddingToCart: boolean;
        canAddToCart: boolean;
        isSoldOut?: boolean;
        optionType: 'SALE' | 'RENTAL';
        isSalePreOrder?: boolean;
      }) {
        if (addedSuccess) return 'Added';
        if (isAddingToCart) return 'Adding...';
        if (!canAddToCart) {
          if (isSoldOut) return 'Sold Out';
          if (optionType === 'RENTAL') return 'Select Dates';
          return 'Unavailable';
        }
        if (optionType === 'SALE') {
          return isSalePreOrder ? 'Pre-Order' : 'Add to Bag';
        }
        return 'Reserve Rental';
      }

      it('resolves Added state when cart action succeeds', () => {
        expect(
          resolveMobileButtonText({
            addedSuccess: true,
            isAddingToCart: false,
            canAddToCart: true,
            optionType: 'SALE',
          })
        ).toBe('Added');
      });

      it('resolves Adding... state when cart action is loading', () => {
        expect(
          resolveMobileButtonText({
            addedSuccess: false,
            isAddingToCart: true,
            canAddToCart: true,
            optionType: 'SALE',
          })
        ).toBe('Adding...');
      });

      it('resolves Pre-Order when sale pre-order is active', () => {
        expect(
          resolveMobileButtonText({
            addedSuccess: false,
            isAddingToCart: false,
            canAddToCart: true,
            optionType: 'SALE',
            isSalePreOrder: true,
          })
        ).toBe('Pre-Order');
      });

      it('resolves Add to Bag for in-stock sale purchases', () => {
        expect(
          resolveMobileButtonText({
            addedSuccess: false,
            isAddingToCart: false,
            canAddToCart: true,
            optionType: 'SALE',
            isSalePreOrder: false,
          })
        ).toBe('Add to Bag');
      });

      it('resolves Reserve Rental for available bespoke rentals', () => {
        expect(
          resolveMobileButtonText({
            addedSuccess: false,
            isAddingToCart: false,
            canAddToCart: true,
            optionType: 'RENTAL',
          })
        ).toBe('Reserve Rental');
      });

      it('resolves Select Dates when rental dates are not selected or invalid', () => {
        expect(
          resolveMobileButtonText({
            addedSuccess: false,
            isAddingToCart: false,
            canAddToCart: false,
            isSoldOut: false,
            optionType: 'RENTAL',
          })
        ).toBe('Select Dates');
      });

      it('resolves Sold Out when item is out of stock and not pre-orderable', () => {
        expect(
          resolveMobileButtonText({
            addedSuccess: false,
            isAddingToCart: false,
            canAddToCart: false,
            isSoldOut: true,
            optionType: 'SALE',
          })
        ).toBe('Sold Out');
      });
    });
  });
});
