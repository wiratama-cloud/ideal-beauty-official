export interface AddToCartInput {
  variantId: string;
  type: 'SALE' | 'RENTAL';
  quantity: number;
  rentStartDate?: string;
  rentEndDate?: string;
}
