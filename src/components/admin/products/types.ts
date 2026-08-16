import { Prisma } from '@prisma/client';

export interface ProductVariantSerialized {
  id: string;
  sku: string;
  skuSale?: string | null;
  skuRent?: string | null;
  isPreOrder?: boolean;
  preOrderShipDate?: string | Date | null;
  preOrderNote?: string | null;
  attributes: Record<string, Prisma.InputJsonValue> | null;
  priceSale: number | null;
  priceRent: number | null;
  compareAtPrice: number | null;
  costPrice: number | null;
  purchaseCost?: number | null;
  stockSaleTotal?: number;
  stockSaleAvailable?: number;
  stockRentTotal?: number;
  stockRentAvailable?: number;
  stockTotal: number;
  stockAvailable: number;
}

export interface ProductSerialized {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  images: string[];
  isActive: boolean;
  variants: ProductVariantSerialized[];
}

export type StockFilterType = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type ModeFilterType = 'All' | 'BUY_ONLY' | 'RENT_ONLY' | 'BOTH';
export type StatusFilterType = 'All' | 'ACTIVE' | 'INACTIVE';
