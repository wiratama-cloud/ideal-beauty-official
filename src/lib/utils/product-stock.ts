export type VariantStockBadgeType = 'in-stock' | 'low-stock' | 'pre-order' | 'sold-out';

export interface VariantStockStatus {
  badgeText: string;
  badgeType: VariantStockBadgeType;
  isAvailable: boolean;
}

export interface StockVariantInput {
  stockSaleAvailable?: number;
  stockRentAvailable?: number;
  stockAvailable?: number;
  isPreOrder?: boolean | null;
  priceSale?: number | string | null;
  priceRent?: number | string | null;
  compareAtPrice?: number | string | null;
}

/**
 * Formats a numeric amount or string into Indonesian Rupiah currency format.
 */
export function formatIDR(amount?: number | string | null): string {
  if (amount === undefined || amount === null || amount === '') return 'N/A';
  const num = Number(amount);
  if (isNaN(num)) return 'N/A';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Calculates the discount percentage between compareAtPrice and current price.
 */
export function calculateDiscountPercent(
  compareAtPrice?: number | string | null,
  currentPrice?: number | string | null
): number | null {
  if (
    compareAtPrice === undefined ||
    compareAtPrice === null ||
    currentPrice === undefined ||
    currentPrice === null
  ) {
    return null;
  }
  const compare = Number(compareAtPrice);
  const current = Number(currentPrice);
  if (isNaN(compare) || isNaN(current) || compare <= 0 || current <= 0) {
    return null;
  }
  if (compare > current) {
    return Math.round(((compare - current) / compare) * 100);
  }
  return null;
}

/**
 * Resolves the real-time stock badge and availability for a product variant.
 */
export function getVariantStockStatus(
  variant: StockVariantInput | null | undefined,
  mode: 'SALE' | 'RENTAL' = 'SALE'
): VariantStockStatus {
  if (!variant) {
    return {
      badgeText: 'Unavailable',
      badgeType: 'sold-out',
      isAvailable: false,
    };
  }

  const saleStock = variant.stockSaleAvailable ?? variant.stockAvailable ?? 0;
  const rentStock = variant.stockRentAvailable ?? variant.stockAvailable ?? 0;
  const isPreOrder = Boolean(variant.isPreOrder);

  if (mode === 'RENTAL') {
    if (rentStock > 0) {
      return {
        badgeText: `${rentStock} for rent`,
        badgeType: 'in-stock',
        isAvailable: true,
      };
    }
    return {
      badgeText: 'Unavailable',
      badgeType: 'sold-out',
      isAvailable: false,
    };
  }

  // SALE mode
  if (saleStock > 0) {
    if (saleStock <= 3) {
      return {
        badgeText: `Only ${saleStock} left`,
        badgeType: 'low-stock',
        isAvailable: true,
      };
    }
    return {
      badgeText: `${saleStock} in stock`,
      badgeType: 'in-stock',
      isAvailable: true,
    };
  }

  if (isPreOrder) {
    return {
      badgeText: 'Pre-Order',
      badgeType: 'pre-order',
      isAvailable: true,
    };
  }

  return {
    badgeText: 'Sold Out',
    badgeType: 'sold-out',
    isAvailable: false,
  };
}

/**
 * Checks whether a variant is sold out for the given acquisition mode.
 */
export function isVariantSoldOut(
  variant: StockVariantInput | null | undefined,
  mode: 'SALE' | 'RENTAL' = 'SALE'
): boolean {
  if (!variant) return true;
  const saleStock = variant.stockSaleAvailable ?? variant.stockAvailable ?? 0;
  const rentStock = variant.stockRentAvailable ?? variant.stockAvailable ?? 0;
  const isPreOrder = Boolean(variant.isPreOrder);

  if (mode === 'RENTAL') {
    return rentStock <= 0;
  }
  return saleStock <= 0 && !isPreOrder;
}

/**
 * Determines if adding to cart is permissible based on stock, variant, and date parameters.
 */
export function canAddToCartValidation({
  variant,
  optionType,
  isAddingToCart = false,
  rentStartDate,
  rentEndDate,
  isRentalDatesValid = true,
}: {
  variant: StockVariantInput | null | undefined;
  optionType: 'SALE' | 'RENTAL';
  isAddingToCart?: boolean;
  rentStartDate?: string;
  rentEndDate?: string;
  isRentalDatesValid?: boolean;
}): boolean {
  if (isAddingToCart || !variant) return false;
  const saleStock = variant.stockSaleAvailable ?? variant.stockAvailable ?? 0;
  const rentStock = variant.stockRentAvailable ?? variant.stockAvailable ?? 0;
  const isSalePreOrder = saleStock <= 0 && Boolean(variant.isPreOrder);

  if (optionType === 'SALE') {
    return saleStock > 0 || isSalePreOrder;
  }
  if (optionType === 'RENTAL') {
    return rentStock > 0 && isRentalDatesValid && Boolean(rentStartDate) && Boolean(rentEndDate);
  }
  return false;
}
