import { describe, it, expect } from 'vitest';
import { deleteProductAction } from '../src/app/actions/admin';
import { prisma } from '../src/lib/prisma';

describe('deleteProductAction', () => {
  it('should handle non-existent product gracefully without throwing', async () => {
    const fakeId = 'non-existent-product-id-12345';
    const result = await deleteProductAction(fakeId);

    expect(result.success).toBe(true);
    expect(result.deleted).toBe(true);
    expect(result.deactivated).toBe(false);
  });

  it('should delete a product without order relations', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Test Temp Delete Product',
        slug: `test-temp-delete-product-${Date.now()}`,
        category: 'Ready To Wear',
        isActive: true,
      },
    });

    const result = await deleteProductAction(product.id);

    expect(result.success).toBe(true);
    expect(result.deleted).toBe(true);
    expect(result.deactivated).toBe(false);

    const check = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(check).toBeNull();
  });

  it('should deactivate a product if it has order item relations', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Test Order Relation Product',
        slug: `test-order-relation-product-${Date.now()}`,
        category: 'Ready To Wear',
        isActive: true,
        variants: {
          create: {
            sku: `SKU-REL-${Date.now()}`,
            attributes: { size: 'M', color: 'Gold' },
            priceSale: 100000,
          },
        },
      },
      include: {
        variants: true,
      },
    });

    const variant = product.variants[0];

    const order = await prisma.order.create({
      data: {
        totalAmount: 100000,
        status: 'PENDING',
        items: {
          create: {
            variantId: variant.id,
            quantity: 1,
            priceAtTime: 100000,
            type: 'SALE',
          },
        },
      },
    });

    const result = await deleteProductAction(product.id);

    expect(result.success).toBe(true);
    expect(result.deleted).toBe(false);
    expect(result.deactivated).toBe(true);

    const check = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(check).not.toBeNull();
    expect(check?.isActive).toBe(false);

    // Clean up test order & product
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    await prisma.product.delete({ where: { id: product.id } });
  });
});
