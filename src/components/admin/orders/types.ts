import { OrderStatus, RentalStatus, PaymentType, PaymentStatus } from '@prisma/client';

export type OrderFilterTab = 'ALL' | 'SALES' | 'PREORDERS' | 'RENTALS' | 'OVERDUE' | 'UNPAID';

export interface OrderItemSerialized {
  id: string;
  orderId: string;
  variantId: string;
  type: 'SALE' | 'RENTAL';
  quantity: number;
  priceAtTime: number;
  isPreOrder?: boolean;
  preOrderShipDate?: string | null;
  preOrderNote?: string | null;
  rentStartDate: string | null;
  rentEndDate: string | null;
  rentalStatus: RentalStatus;
  variant: {
    id: string;
    sku: string;
    isPreOrder?: boolean;
    preOrderShipDate?: string | null;
    preOrderNote?: string | null;
    attributes: Record<string, unknown> | null;
    priceSale: number | null;
    priceRent: number | null;
    product: {
      id: string;
      name: string;
      slug: string;
      images: string[];
    };
  } | null;
}

export interface PaymentSerialized {
  id: string;
  orderId: string;
  type: PaymentType;
  status: PaymentStatus;
  amount: number;
  paymentMethod: string;
  transactionId?: string | null;
  createdAt: string;
}

export interface AddressSerialized {
  id?: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface OrderSerialized {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  discountAmount: number;
  shippingCost: number | null;
  courierName: string | null;
  trackingNumber: string | null;
  createdAt: string;
  user: {
    id?: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  shippingAddress: AddressSerialized | null;
  voucher?: {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
  } | null;
  items: OrderItemSerialized[];
  payments: PaymentSerialized[];
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function isItemOverdue(item: OrderItemSerialized): boolean {
  if (item.type !== 'RENTAL' || !item.rentEndDate) return false;
  if (item.rentalStatus === 'RETURNED') return false;
  const endDate = new Date(item.rentEndDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return endDate < today;
}

export function getOverdueDays(rentEndDate: string): number {
  const endDate = new Date(rentEndDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(today.getTime() - endDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateCompletedPayments(payments: PaymentSerialized[]): number {
  if (!payments || !Array.isArray(payments)) return 0;
  return payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
}

export function calculateRemainingBalance(totalAmount: number, payments: PaymentSerialized[]): number {
  const completed = calculateCompletedPayments(payments);
  return Math.max(0, Number(totalAmount || 0) - completed);
}
