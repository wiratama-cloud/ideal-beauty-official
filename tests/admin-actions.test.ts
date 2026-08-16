import { describe, it, expect } from 'vitest';
import {
  bulkToggleProductActiveAction,
  bulkDeleteProductsAction,
  updateOrderStatusAction,
  updateOrderShippingInfoAction,
  updateRentalStatusAction,
  createProductAction,
  updateProductAction,
} from '../src/app/actions/admin';
import { prisma } from '../src/lib/prisma';

describe('Admin Server Actions - Bulk Operations & Order Updates', () => {
  describe('bulkToggleProductActiveAction', () => {
    it('should toggle active status for multiple products', async () => {
      const p1 = await prisma.product.create({
        data: {
          name: 'Bulk Test Product 1',
          slug: `bulk-test-prod-1-${Date.now()}`,
          category: 'Ready To Wear',
          isActive: true,
        },
      });
      const p2 = await prisma.product.create({
        data: {
          name: 'Bulk Test Product 2',
          slug: `bulk-test-prod-2-${Date.now()}`,
          category: 'Ready To Wear',
          isActive: true,
        },
      });

      // Deactivate products
      const deactivateRes = await bulkToggleProductActiveAction([p1.id, p2.id], false);
      expect(deactivateRes.success).toBe(true);
      expect(deactivateRes.count).toBe(2);

      const checkP1 = await prisma.product.findUnique({ where: { id: p1.id } });
      const checkP2 = await prisma.product.findUnique({ where: { id: p2.id } });
      expect(checkP1?.isActive).toBe(false);
      expect(checkP2?.isActive).toBe(false);

      // Reactivate products
      const activateRes = await bulkToggleProductActiveAction([p1.id, p2.id], true);
      expect(activateRes.success).toBe(true);
      expect(activateRes.count).toBe(2);

      const checkP1Active = await prisma.product.findUnique({ where: { id: p1.id } });
      expect(checkP1Active?.isActive).toBe(true);

      // Cleanup
      await prisma.product.deleteMany({
        where: { id: { in: [p1.id, p2.id] } },
      });
    });

    it('should handle empty product list gracefully', async () => {
      const res = await bulkToggleProductActiveAction([], false);
      expect(res.success).toBe(true);
      expect(res.count).toBe(0);
    });
  });

  describe('bulkDeleteProductsAction', () => {
    it('should delete products without relations and deactivate products with order relations', async () => {
      // Product 1: No relations
      const p1 = await prisma.product.create({
        data: {
          name: 'Bulk Delete Product 1',
          slug: `bulk-del-1-${Date.now()}`,
          category: 'Ready To Wear',
          isActive: true,
        },
      });

      // Product 2: With Order relations
      const p2 = await prisma.product.create({
        data: {
          name: 'Bulk Delete Product 2 (With Order)',
          slug: `bulk-del-2-${Date.now()}`,
          category: 'Ready To Wear',
          isActive: true,
          variants: {
            create: {
              sku: `SKU-BULK-DEL-${Date.now()}`,
              attributes: { size: 'S' },
              priceSale: 500000,
            },
          },
        },
        include: { variants: true },
      });

      const order = await prisma.order.create({
        data: {
          totalAmount: 500000,
          status: 'PENDING',
          items: {
            create: {
              variantId: p2.variants[0].id,
              quantity: 1,
              priceAtTime: 500000,
              type: 'SALE',
            },
          },
        },
      });

      const result = await bulkDeleteProductsAction([p1.id, p2.id]);
      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(1);
      expect(result.deactivatedCount).toBe(1);

      const checkP1 = await prisma.product.findUnique({ where: { id: p1.id } });
      expect(checkP1).toBeNull();

      const checkP2 = await prisma.product.findUnique({ where: { id: p2.id } });
      expect(checkP2).not.toBeNull();
      expect(checkP2?.isActive).toBe(false);

      // Cleanup
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
      await prisma.order.delete({ where: { id: order.id } });
      await prisma.productVariant.deleteMany({ where: { productId: p2.id } });
      await prisma.product.delete({ where: { id: p2.id } });
    });

    it('should handle empty list gracefully', async () => {
      const res = await bulkDeleteProductsAction([]);
      expect(res.success).toBe(true);
      expect(res.deletedCount).toBe(0);
      expect(res.deactivatedCount).toBe(0);
    });
  });

  describe('updateOrderStatusAction', () => {
    it('should update order status and return serialized order', async () => {
      const order = await prisma.order.create({
        data: {
          totalAmount: 250000,
          status: 'PENDING',
        },
      });

      const updated = await updateOrderStatusAction(order.id, 'PROCESSING');
      expect(updated.id).toBe(order.id);
      expect(updated.status).toBe('PROCESSING');
      expect(updated.totalAmount).toBe(250000);
      expect(Array.isArray(updated.items)).toBe(true);

      // Cleanup
      await prisma.order.delete({ where: { id: order.id } });
    });
  });

  describe('updateOrderShippingInfoAction', () => {
    it('should update shipping courier and tracking number', async () => {
      const order = await prisma.order.create({
        data: {
          totalAmount: 300000,
          status: 'PROCESSING',
        },
      });

      const updated = await updateOrderShippingInfoAction(order.id, 'JNE Express', 'JNE12345678');
      expect(updated.id).toBe(order.id);
      expect(updated.courierName).toBe('JNE Express');
      expect(updated.trackingNumber).toBe('JNE12345678');

      // Cleanup
      await prisma.order.delete({ where: { id: order.id } });
    });
  });

  describe('updateRentalStatusAction', () => {
    it('should update rental item status and return complete serialized item with variant and order', async () => {
      const product = await prisma.product.create({
        data: {
          name: 'Rental Test Garment',
          slug: `rental-garment-${Date.now()}`,
          category: 'Rental',
          variants: {
            create: {
              sku: `SKU-RENT-${Date.now()}`,
              attributes: { size: 'M' },
              priceSale: 2000000,
              priceRent: 1500000,
              compareAtPrice: 2500000,
              costPrice: 1000000,
              purchaseCost: 900000,
            },
          },
        },
        include: { variants: true },
      });

      const order = await prisma.order.create({
        data: {
          totalAmount: 1500000,
          status: 'PROCESSING',
          items: {
            create: {
              variantId: product.variants[0].id,
              quantity: 1,
              priceAtTime: 1500000,
              type: 'RENTAL',
              rentalStatus: 'OUT_WITH_CUSTOMER',
            },
          },
        },
        include: { items: true },
      });

      const orderItemId = order.items[0].id;

      const updatedItem = await updateRentalStatusAction(orderItemId, 'RETURNED');
      expect(updatedItem.id).toBe(orderItemId);
      expect(updatedItem.rentalStatus).toBe('RETURNED');
      expect(typeof updatedItem.priceAtTime).toBe('number');
      expect(updatedItem.priceAtTime).toBe(1500000);
      expect(updatedItem.variant).not.toBeNull();
      expect(updatedItem.variant?.product?.name).toBe('Rental Test Garment');
      expect(typeof updatedItem.variant?.priceRent).toBe('number');
      expect(updatedItem.variant?.priceRent).toBe(1500000);
      expect(typeof updatedItem.variant?.priceSale).toBe('number');
      expect(updatedItem.variant?.priceSale).toBe(2000000);
      expect(updatedItem.variant?.compareAtPrice).toBe(2500000);
      expect(updatedItem.variant?.costPrice).toBe(1000000);
      expect(updatedItem.variant?.purchaseCost).toBe(900000);
      expect(updatedItem.order).not.toBeNull();
      expect(updatedItem.order?.id).toBe(order.id);

      // Cleanup
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
      await prisma.order.delete({ where: { id: order.id } });
      await prisma.productVariant.deleteMany({ where: { productId: product.id } });
      await prisma.product.delete({ where: { id: product.id } });
    });

    it('should correctly preserve zero-value prices as 0 number instead of null', async () => {
      const product = await prisma.product.create({
        data: {
          name: 'Zero Price Test Garment',
          slug: `zero-price-garment-${Date.now()}`,
          category: 'Rental',
          variants: {
            create: {
              sku: `SKU-ZERO-${Date.now()}`,
              attributes: { size: 'S' },
              priceSale: 0,
              priceRent: 0,
            },
          },
        },
        include: { variants: true },
      });

      const order = await prisma.order.create({
        data: {
          totalAmount: 0,
          status: 'PROCESSING',
          items: {
            create: {
              variantId: product.variants[0].id,
              quantity: 1,
              priceAtTime: 0,
              type: 'RENTAL',
              rentalStatus: 'OUT_WITH_CUSTOMER',
            },
          },
        },
        include: { items: true },
      });

      const orderItemId = order.items[0].id;
      const updatedItem = await updateRentalStatusAction(orderItemId, 'RETURNED');

      expect(updatedItem.priceAtTime).toBe(0);
      expect(updatedItem.variant?.priceRent).toBe(0);
      expect(updatedItem.variant?.priceSale).toBe(0);

      // Cleanup
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
      await prisma.order.delete({ where: { id: order.id } });
      await prisma.productVariant.deleteMany({ where: { productId: product.id } });
      await prisma.product.delete({ where: { id: product.id } });
    });
  });

  describe('createProductAction & updateProductAction with Dual SKUs and Pre-Order', () => {
    it('should create a product with dual SKUs and Pre-Order metadata', async () => {
      const created = await createProductAction({
        name: 'Dual SKU PreOrder Dress',
        slug: `dual-sku-preorder-${Date.now()}`,
        category: 'Evening Wear',
        description: 'Test description',
        images: ['/images/test.jpg'],
        isActive: true,
        variants: [
          {
            sku: `SKU-BASE-${Date.now()}`,
            skuSale: `SKU-SALE-${Date.now()}`,
            skuRent: `SKU-RENT-${Date.now()}`,
            isPreOrder: true,
            preOrderShipDate: '2026-09-01',
            preOrderNote: 'Ships early September',
            attributes: { size: 'M' },
            priceSale: 1500000,
            priceRent: 500000,
            stockSaleTotal: 0,
            stockSaleAvailable: 0,
          },
        ],
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe('Dual SKU PreOrder Dress');
      expect(created.variants).toHaveLength(1);

      const variant = created.variants[0];
      expect(variant.skuSale).toContain('SKU-SALE-');
      expect(variant.skuRent).toContain('SKU-RENT-');
      expect(variant.isPreOrder).toBe(true);
      expect(variant.preOrderNote).toBe('Ships early September');

      // Test updateProductAction
      const updated = await updateProductAction(created.id, {
        name: 'Updated Dual SKU Dress',
        slug: created.slug,
        category: created.category || 'Evening Wear',
        description: created.description || '',
        images: created.images,
        isActive: created.isActive,
        variants: [
          {
            id: variant.id,
            sku: variant.sku,
            skuSale: `${variant.skuSale}-UPDATED`,
            skuRent: `${variant.skuRent}-UPDATED`,
            isPreOrder: false,
            preOrderShipDate: null,
            preOrderNote: null,
            attributes: { size: 'L' },
            priceSale: 1800000,
            priceRent: 600000,
            stockSaleTotal: 5,
            stockSaleAvailable: 5,
          },
        ],
      });

      expect(updated.name).toBe('Updated Dual SKU Dress');
      expect((updated as any).variants[0].skuSale).toContain('-UPDATED');
      expect((updated as any).variants[0].isPreOrder).toBe(false);

      // Cleanup
      await prisma.productVariant.deleteMany({ where: { productId: created.id } });
      await prisma.product.delete({ where: { id: created.id } });
    });
  });
});
