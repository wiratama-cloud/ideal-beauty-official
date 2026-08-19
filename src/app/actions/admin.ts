'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { createExpenseEntry, CreateExpenseInput, generateLedgerCSV } from '@/lib/services/ledger';
import { serializeOrder, updateOrderStatus, updateOrderShippingInfo } from '@/lib/services/order';
import { createVoucher, getVouchers, toggleVoucherStatus, deleteVoucher, CreateVoucherInput } from '@/lib/services/voucher';
import { recordStockAdjustment, getInventoryTransactions, RecordStockAdjustmentInput } from '@/lib/services/inventory';
import {
  createLandingSection,
  updateLandingSection,
  deleteLandingSection,
  createLandingSectionItem,
  updateLandingSectionItem,
  deleteLandingSectionItem,
  getLandingSections,
  getHeroBannerData,
  updateHeroBannerData,
  HeroBannerData,
  CreateSectionInput,
  CreateSectionItemInput,
} from '@/lib/services/section';
import {
  getNavCategories,
  createNavCategory,
  updateNavCategory,
  deleteNavCategory,
  reorderNavCategories,
  resetDefaultNavCategories,
} from '@/lib/services/nav-category';
import { RentalStatus, OrderStatus, Prisma } from '@prisma/client';
import { recordAuditLog, getAuditLogs } from '@/lib/services/audit';
import { serializeProduct, serializeProductVariant } from '@/lib/utils/serialization';
import {
  getAdminAccessList,
  addAdminAccess,
  removeAdminAccess,
  requireAdminAccess,
} from '@/lib/services/access';
import {
  getSizeCharts,
  getSizeChartById,
  getDefaultSizeChart,
  createSizeChart,
  updateSizeChart,
  deleteSizeChart,
  linkProductsToSizeChart,
  CreateSizeChartInput,
} from '@/lib/services/size-chart';
import { sendMulticastPushNotification } from '@/lib/services/notification';
import { pruneOrphanGuestUsers } from '@/lib/services/user';

export async function logExpenseAction(data: CreateExpenseInput) {
  await requireAdminAccess();
  const result = await createExpenseEntry(data);
  await recordAuditLog({
    action: 'LOG_EXPENSE',
    entity: 'LEDGER',
    entityId: result.id,
    details: data,
  });
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/ledger');
  return {
    ...result,
    amount: result.amount ? Number(result.amount) : null,
  };
}

export async function exportLedgerCSVAction() {
  await requireAdminAccess();
  return generateLedgerCSV();
}

export async function updateRentalStatusAction(orderItemId: string, rentalStatus: 'OUT_WITH_CUSTOMER' | 'RETURNED' | 'LATE' | 'DAMAGED') {
  await requireAdminAccess();
  const updated = await prisma.orderItem.update({
    where: { id: orderItemId },
    data: {
      rentalStatus: RentalStatus[rentalStatus],
    },
    include: {
      variant: {
        include: {
          product: true,
        },
      },
      order: {
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
          payments: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          shippingAddress: true,
          user: true,
          voucher: true,
        },
      },
    },
  });

  await recordAuditLog({
    action: 'UPDATE_RENTAL_STATUS',
    entity: 'ORDER_ITEM',
    entityId: orderItemId,
    details: { rentalStatus },
  });

  safeRevalidatePath('/admin/orders');
  return {
    ...updated,
    priceAtTime: updated.priceAtTime !== undefined && updated.priceAtTime !== null ? Number(updated.priceAtTime) : null,
    variant: updated.variant
      ? {
          ...updated.variant,
          priceSale:
            updated.variant.priceSale !== undefined && updated.variant.priceSale !== null
              ? Number(updated.variant.priceSale)
              : null,
          priceRent:
            updated.variant.priceRent !== undefined && updated.variant.priceRent !== null
              ? Number(updated.variant.priceRent)
              : null,
          compareAtPrice:
            updated.variant.compareAtPrice !== undefined && updated.variant.compareAtPrice !== null
              ? Number(updated.variant.compareAtPrice)
              : null,
          costPrice:
            updated.variant.costPrice !== undefined && updated.variant.costPrice !== null
              ? Number(updated.variant.costPrice)
              : null,
          purchaseCost:
            updated.variant.purchaseCost !== undefined && updated.variant.purchaseCost !== null
              ? Number(updated.variant.purchaseCost)
              : null,
        }
      : null,
    order: updated.order ? serializeOrder(updated.order) : null,
  };
}

export async function getAllOrdersAdminAction() {
  await requireAdminAccess();
  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
      payments: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      shippingAddress: true,
      user: true,
      voucher: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return orders.map((order) => serializeOrder(order));
}

export async function updateOrderStatusAction(orderId: string, status: OrderStatus) {
  await requireAdminAccess();
  const order = await updateOrderStatus(orderId, status);
  await recordAuditLog({
    action: 'UPDATE_ORDER_STATUS',
    entity: 'ORDER',
    entityId: orderId,
    details: { status },
  });
  safeRevalidatePath('/admin/orders');
  return order;
}

export async function updateOrderShippingInfoAction(orderId: string, courierName?: string, trackingNumber?: string) {
  await requireAdminAccess();
  const order = await updateOrderShippingInfo(orderId, courierName, trackingNumber);
  await recordAuditLog({
    action: 'UPDATE_ORDER_SHIPPING_INFO',
    entity: 'ORDER',
    entityId: orderId,
    details: { courierName, trackingNumber },
  });
  safeRevalidatePath('/admin/orders');
  return order;
}

// Landing Section Actions
export async function getHeroBannerAction() {
  await requireAdminAccess();
  return getHeroBannerData();
}

export async function updateHeroBannerAction(data: HeroBannerData) {
  await requireAdminAccess();
  const res = await updateHeroBannerData(data);
  await recordAuditLog({
    action: 'UPDATE_HERO_BANNER',
    entity: 'LANDING_SECTION',
    entityId: res.id,
    details: data,
  });
  safeRevalidatePath('/');
  safeRevalidatePath('/admin/sections');
  return res;
}

export async function getAdminLandingSectionsAction() {
  await requireAdminAccess();
  return getLandingSections(false);
}

export async function getAdminProductsAction() {
  await requireAdminAccess();
  return prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      category: true,
      slug: true,
      images: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function createLandingSectionAction(data: CreateSectionInput) {
  await requireAdminAccess();
  const res = await createLandingSection(data);
  if (res) {
    await recordAuditLog({
      action: 'CREATE_LANDING_SECTION',
      entity: 'LANDING_SECTION',
      entityId: res.id,
      details: data,
    });
  }
  safeRevalidatePath('/');
  safeRevalidatePath('/admin/sections');
  return res;
}

export async function updateLandingSectionAction(id: string, data: Partial<CreateSectionInput>) {
  await requireAdminAccess();
  const res = await updateLandingSection(id, data);
  if (res) {
    await recordAuditLog({
      action: 'UPDATE_LANDING_SECTION',
      entity: 'LANDING_SECTION',
      entityId: id,
      details: data,
    });
  }
  safeRevalidatePath('/');
  safeRevalidatePath('/admin/sections');
  return res;
}

export async function deleteLandingSectionAction(id: string) {
  await requireAdminAccess();
  const res = await deleteLandingSection(id);
  if (res) {
    await recordAuditLog({
      action: 'DELETE_LANDING_SECTION',
      entity: 'LANDING_SECTION',
      entityId: id,
    });
  }
  safeRevalidatePath('/');
  safeRevalidatePath('/admin/sections');
  return res;
}

export async function createLandingSectionItemAction(data: CreateSectionItemInput) {
  await requireAdminAccess();
  const res = await createLandingSectionItem(data);
  if (res) {
    await recordAuditLog({
      action: 'CREATE_LANDING_SECTION_ITEM',
      entity: 'LANDING_SECTION_ITEM',
      entityId: res.id,
      details: data,
    });
  }
  safeRevalidatePath('/');
  safeRevalidatePath('/admin/sections');
  return res;
}

export async function updateLandingSectionItemAction(id: string, data: Partial<CreateSectionItemInput>) {
  await requireAdminAccess();
  const res = await updateLandingSectionItem(id, data);
  if (res) {
    await recordAuditLog({
      action: 'UPDATE_LANDING_SECTION_ITEM',
      entity: 'LANDING_SECTION_ITEM',
      entityId: res.id || id,
      details: data,
    });
  }
  safeRevalidatePath('/');
  safeRevalidatePath('/admin/sections');
  return res;
}

export async function deleteLandingSectionItemAction(id: string) {
  await requireAdminAccess();
  const res = await deleteLandingSectionItem(id);
  if (res) {
    await recordAuditLog({
      action: 'DELETE_LANDING_SECTION_ITEM',
      entity: 'LANDING_SECTION_ITEM',
      entityId: id,
    });
  }
  safeRevalidatePath('/');
  safeRevalidatePath('/admin/sections');
  return res;
}

// Inventory Management Actions
export async function getAdminInventoryAction() {
  await requireAdminAccess();
  const products = await prisma.product.findMany({
    include: {
      variants: {
        orderBy: { sku: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return products.map((product) => serializeProduct(product));
}

export async function adjustInventoryStockAction(data: RecordStockAdjustmentInput) {
  await requireAdminAccess();
  const result = await recordStockAdjustment(data);
  await recordAuditLog({
    action: 'ADJUST_INVENTORY_STOCK',
    entity: 'INVENTORY',
    entityId: data.variantId,
    details: data,
  });
  revalidatePath('/admin/inventory');
  revalidatePath('/admin/products');
  revalidatePath('/admin/ledger');
  revalidatePath('/products');
  revalidatePath('/');
  return result;
}

export async function getInventoryTransactionsAction(variantId?: string) {
  await requireAdminAccess();
  return getInventoryTransactions(variantId);
}

export async function updateVariantStockAction(
  variantId: string,
  stockSaleTotal: number,
  stockSaleAvailable: number,
  stockRentTotal: number = 0,
  stockRentAvailable: number = 0,
  reason?: string,
  cost?: number | null
) {
  await requireAdminAccess();
  const saleTotal = Math.max(0, Number(stockSaleTotal) || 0);
  const saleAvailable = Math.max(0, Number(stockSaleAvailable) || 0);
  const rentTotal = Math.max(0, Number(stockRentTotal) || 0);
  const rentAvailable = Math.max(0, Number(stockRentAvailable) || 0);

  const legacyTotal = saleTotal + rentTotal;
  const legacyAvailable = saleAvailable + rentAvailable;

  const costVal = cost !== undefined && cost !== null ? Number(cost) : undefined;

  const updated = await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      stockSaleTotal: saleTotal,
      stockSaleAvailable: saleAvailable,
      stockRentTotal: rentTotal,
      stockRentAvailable: rentAvailable,
      stockTotal: legacyTotal,
      stockAvailable: legacyAvailable,
      ...(costVal !== undefined ? { purchaseCost: costVal, costPrice: costVal } : {}),
    },
    include: {
      product: true,
    },
  });

  if (reason) {
    await prisma.inventoryTransaction.create({
      data: {
        variantId,
        type: 'ADJUSTMENT',
        quantity: legacyTotal,
        reason,
        cost: costVal ?? null,
        purchaseCost: costVal ?? null,
      },
    });
  }

  await recordAuditLog({
    action: 'UPDATE_VARIANT_STOCK',
    entity: 'PRODUCT_VARIANT',
    entityId: variantId,
    details: { stockSaleTotal, stockSaleAvailable, stockRentTotal, stockRentAvailable, reason, cost },
  });

  revalidatePath('/admin/inventory');
  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/');

  return serializeProductVariant(updated);
}

// Full Product & Variant Management Actions
export interface VariantInput {
  id?: string;
  sku: string;
  skuSale?: string | null;
  skuRent?: string | null;
  isPreOrder?: boolean;
  preOrderShipDate?: Date | string | null;
  preOrderDays?: number | null;
  preOrderNote?: string | null;
  attributes: Prisma.InputJsonObject;
  priceSale?: number | null;
  priceRent?: number | null;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  purchaseCost?: number | null;
  stockSaleTotal?: number;
  stockSaleAvailable?: number;
  stockRentTotal?: number;
  stockRentAvailable?: number;
  stockTotal?: number;
  stockAvailable?: number;
}

export interface CreateProductInput {
  name: string;
  slug: string;
  description?: string;
  category?: string;
  images: string[];
  isActive?: boolean;
  sizeChartId?: string | null;
  variants: VariantInput[];
}

export async function getFullAdminProductsAction() {
  await requireAdminAccess();
  const products = await prisma.product.findMany({
    include: {
      sizeChart: true,
      variants: {
        orderBy: { sku: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return products.map((product) => serializeProduct(product));
}

export async function createProductAction(data: CreateProductInput) {
  await requireAdminAccess();
  const cleanSlug = data.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const existingSlug = await prisma.product.findUnique({ where: { slug: cleanSlug } });
  const finalSlug = existingSlug ? `${cleanSlug}-${Date.now().toString().slice(-4)}` : cleanSlug;

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: finalSlug,
      description: data.description || null,
      category: data.category || 'Ready To Wear',
      images: data.images && data.images.length > 0 ? data.images : ['/images/products/default-product.jpg'],
      isActive: data.isActive ?? true,
      sizeChartId: data.sizeChartId || null,
      variants: {
        create: data.variants.map((v) => {
          const saleTotal = Math.max(0, Number(v.stockSaleTotal ?? v.stockTotal) || 0);
          const saleAvailable = Math.max(0, Number(v.stockSaleAvailable ?? v.stockAvailable) || 0);
          const rentTotal = Math.max(0, Number(v.stockRentTotal) || 0);
          const rentAvailable = Math.max(0, Number(v.stockRentAvailable) || 0);
          const shipDate = v.preOrderShipDate ? new Date(v.preOrderShipDate) : null;
          const validShipDate = shipDate && !isNaN(shipDate.getTime()) ? shipDate : null;
          return {
            sku: v.sku.trim(),
            skuSale: v.skuSale ? v.skuSale.trim() : null,
            skuRent: v.skuRent ? v.skuRent.trim() : null,
            isPreOrder: Boolean(v.isPreOrder),
            preOrderShipDate: validShipDate,
            preOrderDays: v.preOrderDays !== undefined && v.preOrderDays !== null ? Math.max(0, Math.round(Number(v.preOrderDays))) : null,
            preOrderNote: v.preOrderNote ? v.preOrderNote.trim() : null,
            attributes: (v.attributes || { size: 'Free Size' }) as Prisma.InputJsonObject,
            priceSale: v.priceSale !== undefined && v.priceSale !== null ? v.priceSale : null,
            priceRent: v.priceRent !== undefined && v.priceRent !== null ? v.priceRent : null,
            compareAtPrice: v.compareAtPrice !== undefined && v.compareAtPrice !== null ? v.compareAtPrice : null,
            costPrice: v.costPrice !== undefined && v.costPrice !== null ? v.costPrice : null,
            purchaseCost: v.purchaseCost !== undefined && v.purchaseCost !== null ? v.purchaseCost : null,
            stockSaleTotal: saleTotal,
            stockSaleAvailable: saleAvailable,
            stockRentTotal: rentTotal,
            stockRentAvailable: rentAvailable,
            stockTotal: saleTotal + rentTotal,
            stockAvailable: saleAvailable + rentAvailable,
          };
        }),
      },
    },
    include: { variants: true },
  });

  safeRevalidatePath('/admin/products');
  safeRevalidatePath('/admin/inventory');
  safeRevalidatePath('/products');
  safeRevalidatePath('/');

  await recordAuditLog({
    action: 'CREATE_PRODUCT',
    entity: 'PRODUCT',
    entityId: product.id,
    details: { name: data.name, slug: data.slug, category: data.category },
  });

  return serializeProduct(product);
}

export async function updateProductAction(productId: string, data: CreateProductInput) {
  await requireAdminAccess();
  const cleanSlug = data.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const existingWithSlug = await prisma.product.findUnique({ where: { slug: cleanSlug } });
  const finalSlug = existingWithSlug && existingWithSlug.id !== productId
    ? `${cleanSlug}-${Date.now().toString().slice(-4)}`
    : cleanSlug;

  // Perform inside $transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Update product main info
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        slug: finalSlug,
        description: data.description || null,
        category: data.category || 'Ready To Wear',
        images: data.images,
        isActive: data.isActive ?? true,
        sizeChartId: data.sizeChartId !== undefined ? data.sizeChartId : undefined,
      },
    });

    // 2. Fetch existing variants
    const existingVariants = await tx.productVariant.findMany({
      where: { productId },
    });
    const existingIds = new Set(existingVariants.map((v) => v.id));

    const incomingIds = new Set(data.variants.filter((v) => v.id).map((v) => v.id as string));

    // 3. Upsert variants
    for (const v of data.variants) {
      const saleTotal = Math.max(0, Number(v.stockSaleTotal ?? v.stockTotal) || 0);
      const saleAvailable = Math.max(0, Number(v.stockSaleAvailable ?? v.stockAvailable) || 0);
      const rentTotal = Math.max(0, Number(v.stockRentTotal) || 0);
      const rentAvailable = Math.max(0, Number(v.stockRentAvailable) || 0);
      const shipDate = v.preOrderShipDate ? new Date(v.preOrderShipDate) : null;
      const validShipDate = shipDate && !isNaN(shipDate.getTime()) ? shipDate : null;

      const variantPayload = {
        sku: v.sku.trim(),
        skuSale: v.skuSale ? v.skuSale.trim() : null,
        skuRent: v.skuRent ? v.skuRent.trim() : null,
        isPreOrder: Boolean(v.isPreOrder),
        preOrderShipDate: validShipDate,
        preOrderDays: v.preOrderDays !== undefined && v.preOrderDays !== null ? Math.max(0, Math.round(Number(v.preOrderDays))) : null,
        preOrderNote: v.preOrderNote ? v.preOrderNote.trim() : null,
        attributes: (v.attributes || { size: 'Free Size' }) as Prisma.InputJsonObject,
        priceSale: v.priceSale !== undefined && v.priceSale !== null ? v.priceSale : null,
        priceRent: v.priceRent !== undefined && v.priceRent !== null ? v.priceRent : null,
        compareAtPrice: v.compareAtPrice !== undefined && v.compareAtPrice !== null ? v.compareAtPrice : null,
        costPrice: v.costPrice !== undefined && v.costPrice !== null ? v.costPrice : null,
        purchaseCost: v.purchaseCost !== undefined && v.purchaseCost !== null ? v.purchaseCost : null,
        stockSaleTotal: saleTotal,
        stockSaleAvailable: saleAvailable,
        stockRentTotal: rentTotal,
        stockRentAvailable: rentAvailable,
        stockTotal: saleTotal + rentTotal,
        stockAvailable: saleAvailable + rentAvailable,
      };

      if (v.id && existingIds.has(v.id)) {
        await tx.productVariant.update({
          where: { id: v.id },
          data: variantPayload,
        });
      } else {
        await tx.productVariant.create({
          data: {
            productId,
            ...variantPayload,
          },
        });
      }
    }

    // 4. Delete removed variants if safe
    for (const existingId of existingIds) {
      if (!incomingIds.has(existingId)) {
        try {
          await tx.productVariant.delete({ where: { id: existingId } });
        } catch {
          // If referenced by order or cart, mark stock as 0
          await tx.productVariant.update({
            where: { id: existingId },
            data: {
              stockSaleTotal: 0,
              stockSaleAvailable: 0,
              stockRentTotal: 0,
              stockRentAvailable: 0,
              stockTotal: 0,
              stockAvailable: 0,
            },
          });
        }
      }
    }

    return updatedProduct;
  });

  safeRevalidatePath('/admin/products');
  safeRevalidatePath('/admin/inventory');
  safeRevalidatePath('/products');
  safeRevalidatePath('/');

  await recordAuditLog({
    action: 'UPDATE_PRODUCT',
    entity: 'PRODUCT',
    entityId: productId,
    details: { name: data.name, slug: data.slug, category: data.category },
  });

  const fullProduct = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: { orderBy: { sku: 'asc' } } },
  });

  return fullProduct ? serializeProduct(fullProduct) : result;
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // revalidatePath is ignored outside Next.js request context (e.g. in unit tests)
  }
}

export async function deleteProductAction(productId: string) {
  await requireAdminAccess();
  if (!productId) {
    return { success: false, error: 'Product ID is required' };
  }

  const existingProduct = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!existingProduct) {
    safeRevalidatePath('/admin/products');
    safeRevalidatePath('/admin/inventory');
    safeRevalidatePath('/products');
    safeRevalidatePath('/');
    return { success: true, deleted: true, deactivated: false };
  }

  let deleted = false;
  let deactivated = false;

  try {
    await prisma.product.delete({
      where: { id: productId },
    });
    deleted = true;
  } catch {
    // If delete fails due to relations (e.g. past orders), deactivate
    try {
      await prisma.product.update({
        where: { id: productId },
        data: { isActive: false },
      });
      deactivated = true;
    } catch (updateErr) {
      console.error('Failed to deactivate product after delete failed:', updateErr);
      return { success: false, error: 'Failed to delete or deactivate product' };
    }
  }

  await recordAuditLog({
    action: deleted ? 'DELETE_PRODUCT' : 'DEACTIVATE_PRODUCT',
    entity: 'PRODUCT',
    entityId: productId,
    details: {
      productName: existingProduct.name,
      deleted,
      deactivated,
    },
  });

  safeRevalidatePath('/admin/products');
  safeRevalidatePath('/admin/inventory');
  safeRevalidatePath('/products');
  safeRevalidatePath('/');

  return { success: true, deleted, deactivated };
}

export async function toggleProductActiveAction(productId: string, isActive: boolean) {
  await requireAdminAccess();
  const updated = await prisma.product.update({
    where: { id: productId },
    data: { isActive },
  });

  await recordAuditLog({
    action: 'TOGGLE_PRODUCT_ACTIVE',
    entity: 'PRODUCT',
    entityId: productId,
    details: { isActive },
  });

  safeRevalidatePath('/admin/products');
  safeRevalidatePath('/admin/inventory');
  safeRevalidatePath('/products');
  safeRevalidatePath('/');

  return updated;
}

export async function bulkToggleProductActiveAction(productIds: string[], isActive: boolean) {
  await requireAdminAccess();
  if (!productIds || productIds.length === 0) {
    return { success: true, count: 0 };
  }

  const result = await prisma.product.updateMany({
    where: { id: { in: productIds } },
    data: { isActive },
  });

  await recordAuditLog({
    action: 'BULK_TOGGLE_PRODUCT_ACTIVE',
    entity: 'PRODUCT',
    entityId: productIds.join(','),
    details: { productIds, isActive, count: result.count },
  });

  safeRevalidatePath('/admin/products');
  safeRevalidatePath('/admin/inventory');
  safeRevalidatePath('/products');
  safeRevalidatePath('/');

  return { success: true, count: result.count };
}

export async function bulkDeleteProductsAction(productIds: string[]) {
  await requireAdminAccess();
  if (!productIds || productIds.length === 0) {
    return { success: true, deletedCount: 0, deactivatedCount: 0 };
  }

  let deletedCount = 0;
  let deactivatedCount = 0;

  for (const id of productIds) {
    if (!id) continue;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) continue;

    try {
      await prisma.product.delete({ where: { id } });
      deletedCount++;
    } catch {
      try {
        await prisma.product.update({
          where: { id },
          data: { isActive: false },
        });
        deactivatedCount++;
      } catch (updateErr) {
        console.error(`Failed to deactivate product ${id} after delete failed:`, updateErr);
      }
    }
  }

  await recordAuditLog({
    action: 'BULK_DELETE_PRODUCTS',
    entity: 'PRODUCT',
    entityId: productIds.join(','),
    details: { productIds, deletedCount, deactivatedCount },
  });

  safeRevalidatePath('/admin/products');
  safeRevalidatePath('/admin/inventory');
  safeRevalidatePath('/products');
  safeRevalidatePath('/');

  return { success: true, deletedCount, deactivatedCount };
}

// Voucher Actions
export async function createVoucherAction(data: CreateVoucherInput) {
  await requireAdminAccess();
  const result = await createVoucher(data);
  await recordAuditLog({
    action: 'CREATE_VOUCHER',
    entity: 'VOUCHER',
    entityId: result.id,
    details: { code: data.code, discountType: data.discountType, discountValue: data.discountValue },
  });
  revalidatePath('/admin/vouchers');
  return result;
}

export async function getVouchersAction() {
  await requireAdminAccess();
  return getVouchers();
}

export async function toggleVoucherStatusAction(id: string) {
  await requireAdminAccess();
  const result = await toggleVoucherStatus(id);
  await recordAuditLog({
    action: 'TOGGLE_VOUCHER_STATUS',
    entity: 'VOUCHER',
    entityId: id,
  });
  revalidatePath('/admin/vouchers');
  return result;
}

export async function deleteVoucherAction(id: string) {
  await requireAdminAccess();
  const result = await deleteVoucher(id);
  await recordAuditLog({
    action: 'DELETE_VOUCHER',
    entity: 'VOUCHER',
    entityId: id,
  });
  revalidatePath('/admin/vouchers');
  return result;
}

export async function getCustomersAction() {
  await requireAdminAccess();
  return prisma.user.findMany({
    where: {
      name: { not: 'Guest Customer' },
      email: { not: { startsWith: 'guest_' } },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

// Navigation Category Actions
export async function getAdminNavCategoriesAction(activeOnly = false) {
  await requireAdminAccess();
  return getNavCategories(activeOnly);
}

export async function createNavCategoryAction(data: {
  name: string;
  href: string;
  displayOrder?: number;
  isActive?: boolean;
  parentId?: string | null;
  imageUrl?: string | null;
}) {
  await requireAdminAccess();
  const result = await createNavCategory(data);
  await recordAuditLog({
    action: 'CREATE_NAV_CATEGORY',
    entity: 'NAV_CATEGORY',
    entityId: result.id,
    details: data,
  });
  revalidatePath('/', 'layout');
  revalidatePath('/products');
  revalidatePath('/admin/navigation');
  revalidatePath('/admin/collection');
  return result;
}

export async function updateNavCategoryAction(
  id: string,
  data: Partial<{
    name: string;
    href: string;
    displayOrder: number;
    isActive: boolean;
    parentId: string | null;
    imageUrl: string | null;
  }>
) {
  await requireAdminAccess();
  const result = await updateNavCategory(id, data);
  await recordAuditLog({
    action: 'UPDATE_NAV_CATEGORY',
    entity: 'NAV_CATEGORY',
    entityId: id,
    details: data,
  });
  revalidatePath('/', 'layout');
  revalidatePath('/products');
  revalidatePath('/admin/navigation');
  revalidatePath('/admin/collection');
  return result;
}

export async function deleteNavCategoryAction(id: string) {
  await requireAdminAccess();
  const result = await deleteNavCategory(id);
  await recordAuditLog({
    action: 'DELETE_NAV_CATEGORY',
    entity: 'NAV_CATEGORY',
    entityId: id,
  });
  revalidatePath('/', 'layout');
  revalidatePath('/products');
  revalidatePath('/admin/navigation');
  revalidatePath('/admin/collection');
  return result;
}

export async function reorderNavCategoriesAction(orderedIds: string[]) {
  await requireAdminAccess();
  await reorderNavCategories(orderedIds);
  await recordAuditLog({
    action: 'REORDER_NAV_CATEGORIES',
    entity: 'NAV_CATEGORY',
    entityId: 'ALL',
    details: { orderedIds },
  });
  revalidatePath('/', 'layout');
  revalidatePath('/products');
  revalidatePath('/admin/navigation');
  revalidatePath('/admin/collection');
  return { success: true };
}

export async function resetDefaultNavCategoriesAction() {
  await requireAdminAccess();
  const result = await resetDefaultNavCategories();
  await recordAuditLog({
    action: 'RESET_NAV_CATEGORIES',
    entity: 'NAV_CATEGORY',
    entityId: 'ALL',
  });
  revalidatePath('/', 'layout');
  revalidatePath('/products');
  revalidatePath('/admin/navigation');
  revalidatePath('/admin/collection');
  return result;
}

export async function getAuditLogsAction(params?: {
  search?: string;
  entity?: string;
  limit?: number;
  offset?: number;
}) {
  await requireAdminAccess();
  return getAuditLogs(params);
}

// Admin Access Control Actions
export async function getAdminAccessListAction() {
  await requireAdminAccess();
  return getAdminAccessList();
}

export async function addAdminAccessAction(email: string) {
  const adminUser = await requireAdminAccess();
  const result = await addAdminAccess(email, adminUser.email || 'ADMIN');
  await recordAuditLog({
    action: 'ADD_ADMIN_ACCESS',
    entity: 'ADMIN_ACCESS',
    entityId: result.id,
    details: { email, addedBy: adminUser.email },
  });
  safeRevalidatePath('/admin/access');
  return result;
}

export async function removeAdminAccessAction(idOrEmail: string) {
  const adminUser = await requireAdminAccess();
  const result = await removeAdminAccess(idOrEmail, adminUser.email || undefined);
  await recordAuditLog({
    action: 'REMOVE_ADMIN_ACCESS',
    entity: 'ADMIN_ACCESS',
    entityId: idOrEmail,
    details: { removedEmail: result.email, removedBy: adminUser.email },
  });
  safeRevalidatePath('/admin/access');
  return result;
}

// Size Chart Management Actions
export async function getSizeChartsAction() {
  await requireAdminAccess();
  return await getSizeCharts();
}

export async function getSizeChartByIdAction(id: string) {
  await requireAdminAccess();
  return await getSizeChartById(id);
}

export async function createSizeChartAction(data: CreateSizeChartInput) {
  await requireAdminAccess();
  const chart = await createSizeChart(data);
  safeRevalidatePath('/admin/size-charts');
  safeRevalidatePath('/admin/products');
  safeRevalidatePath('/products');

  await recordAuditLog({
    action: 'CREATE_SIZE_CHART',
    entity: 'SIZE_CHART',
    entityId: chart.id,
    details: { name: chart.name },
  });

  return chart;
}

export async function updateSizeChartAction(id: string, data: CreateSizeChartInput) {
  await requireAdminAccess();
  const chart = await updateSizeChart(id, data);
  safeRevalidatePath('/admin/size-charts');
  safeRevalidatePath('/admin/products');
  safeRevalidatePath('/products');

  await recordAuditLog({
    action: 'UPDATE_SIZE_CHART',
    entity: 'SIZE_CHART',
    entityId: chart.id,
    details: { name: chart.name },
  });

  return chart;
}

export async function deleteSizeChartAction(id: string) {
  await requireAdminAccess();
  const deleted = await deleteSizeChart(id);
  safeRevalidatePath('/admin/size-charts');
  safeRevalidatePath('/admin/products');
  safeRevalidatePath('/products');

  await recordAuditLog({
    action: 'DELETE_SIZE_CHART',
    entity: 'SIZE_CHART',
    entityId: id,
    details: { name: deleted.name },
  });

  return deleted;
}

export async function linkProductsToSizeChartAction(sizeChartId: string | null, productIds: string[]) {
  await requireAdminAccess();
  const res = await linkProductsToSizeChart(sizeChartId, productIds);
  safeRevalidatePath('/admin/size-charts');
  safeRevalidatePath('/admin/products');
  safeRevalidatePath('/products');

  await recordAuditLog({
    action: 'LINK_PRODUCTS_SIZE_CHART',
    entity: 'SIZE_CHART',
    entityId: sizeChartId || 'UNLINK',
    details: { productCount: res.count, productIds },
  });

  return res;
}

// Push Notification Actions
export async function getAdminNotificationRecipientsAction() {
  await requireAdminAccess();
  const users = await prisma.user.findMany({
    where: {
      name: { not: 'Guest Customer' },
      email: { not: { startsWith: 'guest_' } },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      fcmToken: true,
      createdAt: true,
    },
    orderBy: [
      { createdAt: 'desc' },
    ],
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name || 'Unnamed Customer',
    email: user.email,
    phone: user.phone,
    hasFcmToken: !!(user.fcmToken && user.fcmToken.trim().length > 0),
    createdAt: user.createdAt,
  }));
}

export interface SendAdminPushNotificationInput {
  title: string;
  body: string;
  url?: string;
  targetType: 'ALL' | 'SELECTED';
  userIds?: string[];
}

export async function sendAdminPushNotificationAction(data: SendAdminPushNotificationInput) {
  const adminUser = await requireAdminAccess();

  if (!data.title || !data.title.trim()) {
    throw new Error('Notification title is required.');
  }

  if (!data.body || !data.body.trim()) {
    throw new Error('Notification message body is required.');
  }

  let tokens: string[] = [];
  let targetedUserCount = 0;

  if (data.targetType === 'ALL') {
    const usersWithToken = await prisma.user.findMany({
      where: {
        fcmToken: {
          not: null,
        },
        name: { not: 'Guest Customer' },
        email: { not: { startsWith: 'guest_' } },
      },
      select: {
        id: true,
        fcmToken: true,
      },
    });

    tokens = usersWithToken
      .map((u) => u.fcmToken)
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0);
    targetedUserCount = usersWithToken.length;
  } else if (data.targetType === 'SELECTED') {
    if (!data.userIds || data.userIds.length === 0) {
      throw new Error('Please select at least one recipient user.');
    }

    const usersWithToken = await prisma.user.findMany({
      where: {
        id: {
          in: data.userIds,
        },
        fcmToken: {
          not: null,
        },
      },
      select: {
        id: true,
        fcmToken: true,
      },
    });

    tokens = usersWithToken
      .map((u) => u.fcmToken)
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0);
    targetedUserCount = data.userIds.length;
  } else {
    throw new Error('Invalid target type specified.');
  }

  const result = await sendMulticastPushNotification(
    tokens,
    data.title.trim(),
    data.body.trim(),
    data.url?.trim()
  );

  // Record audit log for tracking
  await recordAuditLog({
    action: 'SEND_PUSH_NOTIFICATION',
    entity: 'NOTIFICATION',
    entityId: data.targetType,
    details: {
      title: data.title.trim(),
      body: data.body.trim(),
      url: data.url?.trim() || null,
      targetType: data.targetType,
      targetedUserCount,
      eligibleTokensCount: tokens.length,
      sentSuccessCount: result.successCount,
      sentFailureCount: result.failureCount,
      sentByAdmin: adminUser.email,
    },
  });

  return {
    ...result,
    targetedUserCount,
    eligibleTokensCount: tokens.length,
  };
}

export async function pruneGuestUsersAction(daysOld: number = 7) {
  const adminUser = await requireAdminAccess();
  const result = await pruneOrphanGuestUsers(daysOld);
  await recordAuditLog({
    action: 'PRUNE_GUEST_USERS',
    entity: 'USER',
    entityId: 'SYSTEM',
    details: {
      daysOld,
      prunedCount: result.count,
      prunedUserIds: result.prunedUserIds,
      executedBy: adminUser.email,
    },
  });
  return { success: true, count: result.count, prunedUserIds: result.prunedUserIds };
}
