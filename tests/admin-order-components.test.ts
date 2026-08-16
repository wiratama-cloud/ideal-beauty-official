import { describe, it, expect } from 'vitest';
import {
  formatIDR,
  isItemOverdue,
  getOverdueDays,
  calculateCompletedPayments,
  calculateRemainingBalance,
  OrderItemSerialized,
  PaymentSerialized,
} from '../src/components/admin/orders/types';

describe('Admin Order Component Helpers', () => {
  it('formatIDR formats currency numbers correctly', () => {
    const formatted = formatIDR(1500000);
    expect(formatted).toContain('1.500.000');
    expect(formatIDR(0)).toContain('0');
  });

  it('isItemOverdue accurately identifies overdue rental items', () => {
    const pastDate = new Date(Date.now() - 86400000 * 3).toISOString();
    const futureDate = new Date(Date.now() + 86400000 * 3).toISOString();

    const overdueItem: OrderItemSerialized = {
      id: 'item-1',
      orderId: 'order-1',
      variantId: 'var-1',
      type: 'RENTAL',
      quantity: 1,
      priceAtTime: 500000,
      rentStartDate: pastDate,
      rentEndDate: pastDate,
      rentalStatus: 'OUT_WITH_CUSTOMER',
      variant: null,
    };

    const returnedItem: OrderItemSerialized = {
      ...overdueItem,
      rentalStatus: 'RETURNED',
    };

    const activeItem: OrderItemSerialized = {
      ...overdueItem,
      rentEndDate: futureDate,
    };

    const saleItem: OrderItemSerialized = {
      ...overdueItem,
      type: 'SALE',
    };

    expect(isItemOverdue(overdueItem)).toBe(true);
    expect(isItemOverdue(returnedItem)).toBe(false);
    expect(isItemOverdue(activeItem)).toBe(false);
    expect(isItemOverdue(saleItem)).toBe(false);
  });

  it('getOverdueDays calculates late day count correctly', () => {
    const threeDaysAgo = new Date(Date.now() - 86400000 * 3).toISOString();
    const overdueDays = getOverdueDays(threeDaysAgo);
    expect(overdueDays).toBeGreaterThanOrEqual(3);
  });

  it('calculateCompletedPayments sums only COMPLETED payments', () => {
    const payments: PaymentSerialized[] = [
      {
        id: 'p1',
        orderId: 'o1',
        type: 'DOWN_PAYMENT',
        status: 'COMPLETED',
        amount: 250000,
        paymentMethod: 'QRIS',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'p2',
        orderId: 'o1',
        type: 'FULL_PAYMENT',
        status: 'PENDING',
        amount: 250000,
        paymentMethod: 'BANK_TRANSFER',
        createdAt: new Date().toISOString(),
      },
    ];

    expect(calculateCompletedPayments(payments)).toBe(250000);
  });

  it('calculateRemainingBalance calculates total minus completed payments', () => {
    const payments: PaymentSerialized[] = [
      {
        id: 'p1',
        orderId: 'o1',
        type: 'DOWN_PAYMENT',
        status: 'COMPLETED',
        amount: 300000,
        paymentMethod: 'QRIS',
        createdAt: new Date().toISOString(),
      },
    ];

    expect(calculateRemainingBalance(1000000, payments)).toBe(700000);
    expect(calculateRemainingBalance(300000, payments)).toBe(0);
  });

  it('supports pre-order attributes on OrderItemSerialized', () => {
    const preOrderItem: OrderItemSerialized = {
      id: 'po-1',
      orderId: 'order-po',
      variantId: 'var-po',
      type: 'SALE',
      quantity: 1,
      priceAtTime: 1200000,
      isPreOrder: true,
      preOrderShipDate: '2026-09-01T00:00:00.000Z',
      rentStartDate: null,
      rentEndDate: null,
      rentalStatus: 'NOT_APPLICABLE',
      variant: {
        id: 'var-po',
        sku: 'SKU-PO-1',
        isPreOrder: true,
        preOrderShipDate: '2026-09-01T00:00:00.000Z',
        attributes: { size: 'M' },
        priceSale: 1200000,
        priceRent: null,
        product: {
          id: 'prod-po',
          name: 'Pre-Order Silk Gown',
          slug: 'pre-order-silk-gown',
          images: [],
        },
      },
    };

    expect(preOrderItem.isPreOrder).toBe(true);
    expect(preOrderItem.preOrderShipDate).toBe('2026-09-01T00:00:00.000Z');
    expect(preOrderItem.variant?.isPreOrder).toBe(true);
  });
});
