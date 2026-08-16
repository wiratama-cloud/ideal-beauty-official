/**
 * Centralized serialization utilities for Decimal values and model objects.
 * Prevents truthy conversion issues (e.g., converting $0 or 0 to null).
 */

export function serializeNumber(val: any): number | null {
  if (val !== undefined && val !== null) {
    const num = Number(val);
    return isNaN(num) ? null : num;
  }
  return null;
}

export type SerializedVariant<T> = Omit<T, 'priceSale' | 'priceRent' | 'compareAtPrice' | 'costPrice' | 'purchaseCost' | 'attributes'> & {
  priceSale: number | null;
  priceRent: number | null;
  compareAtPrice: number | null;
  costPrice: number | null;
  purchaseCost: number | null;
  attributes: any;
};

export type SerializedProduct<T> = Omit<T, 'variants'> & {
  variants: T extends { variants: (infer V)[] } ? SerializedVariant<V>[] : any[];
};

export function serializeProductVariant<T extends Record<string, any>>(variant: T): SerializedVariant<T> {
  if (!variant) return variant as any;
  return {
    ...variant,
    priceSale: serializeNumber(variant.priceSale),
    priceRent: serializeNumber(variant.priceRent),
    compareAtPrice: serializeNumber(variant.compareAtPrice),
    costPrice: serializeNumber(variant.costPrice),
    purchaseCost: serializeNumber(variant.purchaseCost),
    attributes: variant.attributes ?? {},
  };
}

export function serializeProduct<T extends Record<string, any>>(product: T): SerializedProduct<T> {
  if (!product) return product as any;
  return {
    ...product,
    variants: Array.isArray(product.variants)
      ? product.variants.map((v) => serializeProductVariant(v))
      : product.variants,
  } as any;
}
