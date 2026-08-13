'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { createExpenseEntry, CreateExpenseInput, generateLedgerCSV } from '@/lib/services/ledger';
import { serializeOrder } from '@/lib/services/order';
import {
  createLandingSection,
  updateLandingSection,
  deleteLandingSection,
  createLandingSectionItem,
  updateLandingSectionItem,
  deleteLandingSectionItem,
  getLandingSections,
  CreateSectionInput,
  CreateSectionItemInput,
} from '@/lib/services/section';
import { RentalStatus } from '@prisma/client';

export async function logExpenseAction(data: CreateExpenseInput) {
  const result = await createExpenseEntry(data);
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/ledger');
  return {
    ...result,
    amount: result.amount ? Number(result.amount) : null,
  };
}

export async function exportLedgerCSVAction() {
  return generateLedgerCSV();
}

export async function updateRentalStatusAction(orderItemId: string, rentalStatus: 'OUT_WITH_CUSTOMER' | 'RETURNED' | 'LATE' | 'DAMAGED') {
  const updated = await prisma.orderItem.update({
    where: { id: orderItemId },
    data: {
      rentalStatus: RentalStatus[rentalStatus],
    },
  });

  revalidatePath('/admin/orders');
  return {
    ...updated,
    priceAtTime: updated.priceAtTime ? Number(updated.priceAtTime) : null,
  };
}

export async function getAllOrdersAdminAction() {
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
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return orders.map((order) => serializeOrder(order));
}

// Landing Section Actions
export async function getAdminLandingSectionsAction() {
  return getLandingSections(false);
}

export async function getAdminProductsAction() {
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
  const res = await createLandingSection(data);
  revalidatePath('/');
  revalidatePath('/admin/sections');
  return res;
}

export async function updateLandingSectionAction(id: string, data: Partial<CreateSectionInput>) {
  const res = await updateLandingSection(id, data);
  revalidatePath('/');
  revalidatePath('/admin/sections');
  return res;
}

export async function deleteLandingSectionAction(id: string) {
  const res = await deleteLandingSection(id);
  revalidatePath('/');
  revalidatePath('/admin/sections');
  return res;
}

export async function createLandingSectionItemAction(data: CreateSectionItemInput) {
  const res = await createLandingSectionItem(data);
  revalidatePath('/');
  revalidatePath('/admin/sections');
  return res;
}

export async function updateLandingSectionItemAction(id: string, data: Partial<CreateSectionItemInput>) {
  const res = await updateLandingSectionItem(id, data);
  revalidatePath('/');
  revalidatePath('/admin/sections');
  return res;
}

export async function deleteLandingSectionItemAction(id: string) {
  const res = await deleteLandingSectionItem(id);
  revalidatePath('/');
  revalidatePath('/admin/sections');
  return res;
}

// Inventory Management Actions
export async function getAdminInventoryAction() {
  const products = await prisma.product.findMany({
    include: {
      variants: {
        orderBy: { sku: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return products.map((product) => ({
    ...product,
    variants: product.variants.map((variant) => ({
      ...variant,
      priceSale: variant.priceSale ? Number(variant.priceSale) : null,
      priceRent: variant.priceRent ? Number(variant.priceRent) : null,
      compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
      costPrice: variant.costPrice ? Number(variant.costPrice) : null,
    })),
  }));
}

export async function updateVariantStockAction(
  variantId: string,
  stockTotal: number,
  stockAvailable: number
) {
  const updated = await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      stockTotal: Math.max(0, stockTotal),
      stockAvailable: Math.max(0, stockAvailable),
    },
    include: {
      product: true,
    },
  });

  revalidatePath('/admin/inventory');
  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/');

  return {
    ...updated,
    priceSale: updated.priceSale ? Number(updated.priceSale) : null,
    priceRent: updated.priceRent ? Number(updated.priceRent) : null,
    compareAtPrice: updated.compareAtPrice ? Number(updated.compareAtPrice) : null,
    costPrice: updated.costPrice ? Number(updated.costPrice) : null,
  };
}

// Full Product & Variant Management Actions
export interface VariantInput {
  id?: string;
  sku: string;
  attributes: Record<string, any>;
  priceSale?: number | null;
  priceRent?: number | null;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  stockTotal: number;
  stockAvailable: number;
}

export interface CreateProductInput {
  name: string;
  slug: string;
  description?: string;
  category?: string;
  images: string[];
  isActive?: boolean;
  variants: VariantInput[];
}

export async function getFullAdminProductsAction() {
  const products = await prisma.product.findMany({
    include: {
      variants: {
        orderBy: { sku: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return products.map((product) => ({
    ...product,
    variants: product.variants.map((variant) => ({
      ...variant,
      priceSale: variant.priceSale ? Number(variant.priceSale) : null,
      priceRent: variant.priceRent ? Number(variant.priceRent) : null,
      compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
      costPrice: variant.costPrice ? Number(variant.costPrice) : null,
    })),
  }));
}

export async function createProductAction(data: CreateProductInput) {
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
      variants: {
        create: data.variants.map((v) => ({
          sku: v.sku.trim(),
          attributes: v.attributes || { size: 'Free Size' },
          priceSale: v.priceSale !== undefined && v.priceSale !== null ? v.priceSale : null,
          priceRent: v.priceRent !== undefined && v.priceRent !== null ? v.priceRent : null,
          compareAtPrice: v.compareAtPrice !== undefined && v.compareAtPrice !== null ? v.compareAtPrice : null,
          costPrice: v.costPrice !== undefined && v.costPrice !== null ? v.costPrice : null,
          stockTotal: Math.max(0, Number(v.stockTotal) || 0),
          stockAvailable: Math.max(0, Number(v.stockAvailable) || 0),
        })),
      },
    },
    include: { variants: true },
  });

  revalidatePath('/admin/products');
  revalidatePath('/admin/inventory');
  revalidatePath('/products');
  revalidatePath('/');

  return {
    ...product,
    variants: product.variants.map((v) => ({
      ...v,
      priceSale: v.priceSale ? Number(v.priceSale) : null,
      priceRent: v.priceRent ? Number(v.priceRent) : null,
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
      costPrice: v.costPrice ? Number(v.costPrice) : null,
    })),
  };
}

export async function updateProductAction(productId: string, data: CreateProductInput) {
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
      if (v.id && existingIds.has(v.id)) {
        await tx.productVariant.update({
          where: { id: v.id },
          data: {
            sku: v.sku.trim(),
            attributes: v.attributes || { size: 'Free Size' },
            priceSale: v.priceSale !== undefined && v.priceSale !== null ? v.priceSale : null,
            priceRent: v.priceRent !== undefined && v.priceRent !== null ? v.priceRent : null,
            compareAtPrice: v.compareAtPrice !== undefined && v.compareAtPrice !== null ? v.compareAtPrice : null,
            costPrice: v.costPrice !== undefined && v.costPrice !== null ? v.costPrice : null,
            stockTotal: Math.max(0, Number(v.stockTotal) || 0),
            stockAvailable: Math.max(0, Number(v.stockAvailable) || 0),
          },
        });
      } else {
        await tx.productVariant.create({
          data: {
            productId,
            sku: v.sku.trim(),
            attributes: v.attributes || { size: 'Free Size' },
            priceSale: v.priceSale !== undefined && v.priceSale !== null ? v.priceSale : null,
            priceRent: v.priceRent !== undefined && v.priceRent !== null ? v.priceRent : null,
            compareAtPrice: v.compareAtPrice !== undefined && v.compareAtPrice !== null ? v.compareAtPrice : null,
            costPrice: v.costPrice !== undefined && v.costPrice !== null ? v.costPrice : null,
            stockTotal: Math.max(0, Number(v.stockTotal) || 0),
            stockAvailable: Math.max(0, Number(v.stockAvailable) || 0),
          },
        });
      }
    }

    // 4. Delete removed variants if safe
    for (const existingId of existingIds) {
      if (!incomingIds.has(existingId)) {
        try {
          await tx.productVariant.delete({ where: { id: existingId } });
        } catch (e) {
          // If referenced by order or cart, mark stock as 0
          await tx.productVariant.update({
            where: { id: existingId },
            data: { stockTotal: 0, stockAvailable: 0 },
          });
        }
      }
    }

    return updatedProduct;
  });

  revalidatePath('/admin/products');
  revalidatePath('/admin/inventory');
  revalidatePath('/products');
  revalidatePath('/');

  return result;
}

export async function deleteProductAction(productId: string) {
  try {
    await prisma.product.delete({
      where: { id: productId },
    });
  } catch (err) {
    // If delete fails due to relations (e.g. past orders), deactivate
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });
  }

  revalidatePath('/admin/products');
  revalidatePath('/admin/inventory');
  revalidatePath('/products');
  revalidatePath('/');

  return { success: true };
}

export async function toggleProductActiveAction(productId: string, isActive: boolean) {
  const updated = await prisma.product.update({
    where: { id: productId },
    data: { isActive },
  });

  revalidatePath('/admin/products');
  revalidatePath('/admin/inventory');
  revalidatePath('/products');
  revalidatePath('/');

  return updated;
}
