'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export interface BookedDateRange {
  id: string;
  startDate: string;
  endDate: string;
  orderId?: string;
  customerName?: string;
  rentalStatus?: string;
}

export interface MaintenanceDateRange {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  notes?: string | null;
}

export interface VariantRentalAvailability {
  variantId: string;
  sku: string;
  stockRentTotal: number;
  stockRentAvailable: number;
  bookedRanges: BookedDateRange[];
  maintenanceRanges: MaintenanceDateRange[];
}

export async function getVariantRentalAvailabilityAction(variantId: string): Promise<VariantRentalAvailability> {
  if (!variantId) {
    return {
      variantId: '',
      sku: '',
      stockRentTotal: 0,
      stockRentAvailable: 0,
      bookedRanges: [],
      maintenanceRanges: [],
    };
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: {
      id: true,
      sku: true,
      stockRentTotal: true,
      stockRentAvailable: true,
      stockTotal: true,
      stockAvailable: true,
    },
  });

  if (!variant) {
    throw new Error('Product variant not found.');
  }

  const orderItems = await prisma.orderItem.findMany({
    where: {
      variantId,
      type: 'RENTAL',
      order: {
        status: {
          not: OrderStatus.CANCELLED,
        },
      },
      rentStartDate: { not: null },
      rentEndDate: { not: null },
    },
    select: {
      id: true,
      rentStartDate: true,
      rentEndDate: true,
      rentalStatus: true,
      order: {
        select: {
          id: true,
          user: { select: { name: true, email: true } },
          shippingAddress: { select: { recipientName: true } },
        },
      },
    },
  });

  const rentalBlocks = await prisma.rentalBlock.findMany({
    where: { variantId },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      reason: true,
      notes: true,
    },
  });

  const bookedRanges: BookedDateRange[] = orderItems.map((item) => ({
    id: item.id,
    startDate: item.rentStartDate!.toISOString().split('T')[0],
    endDate: item.rentEndDate!.toISOString().split('T')[0],
    orderId: item.order.id,
    customerName: item.order.shippingAddress?.recipientName || item.order.user?.name || 'Customer',
    rentalStatus: item.rentalStatus,
  }));

  const maintenanceRanges: MaintenanceDateRange[] = rentalBlocks.map((block) => ({
    id: block.id,
    startDate: block.startDate.toISOString().split('T')[0],
    endDate: block.endDate.toISOString().split('T')[0],
    reason: block.reason,
    notes: block.notes,
  }));

  return {
    variantId: variant.id,
    sku: variant.sku,
    stockRentTotal: variant.stockRentTotal || variant.stockTotal || 1,
    stockRentAvailable: variant.stockRentAvailable || variant.stockAvailable || 1,
    bookedRanges,
    maintenanceRanges,
  };
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore revalidate errors outside Next.js request context during testing
  }
}

export async function createRentalBlockAction(input: {
  variantId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  notes?: string;
}) {
  const { variantId, startDate, endDate, reason = 'MAINTENANCE', notes } = input;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid start or end date format.');
  }

  if (start > end) {
    throw new Error('Start date cannot be after end date.');
  }

  const block = await prisma.rentalBlock.create({
    data: {
      variantId,
      startDate: start,
      endDate: end,
      reason,
      notes: notes || null,
    },
  });

  safeRevalidatePath('/admin/calendar');
  safeRevalidatePath('/admin/products');
  safeRevalidatePath('/products');

  return {
    ...block,
    startDate: block.startDate.toISOString().split('T')[0],
    endDate: block.endDate.toISOString().split('T')[0],
  };
}

export async function deleteRentalBlockAction(blockId: string) {
  const deleted = await prisma.rentalBlock.delete({
    where: { id: blockId },
  });

  safeRevalidatePath('/admin/calendar');
  safeRevalidatePath('/admin/products');
  safeRevalidatePath('/products');

  return deleted;
}

export async function getAdminRentalCalendarDataAction() {
  const products = await prisma.product.findMany({
    include: {
      variants: {
        include: {
          rentalBlocks: {
            orderBy: { startDate: 'asc' },
          },
          orderItems: {
            where: {
              type: 'RENTAL',
              order: {
                status: {
                  not: OrderStatus.CANCELLED,
                },
              },
            },
            include: {
              order: {
                include: {
                  user: true,
                  shippingAddress: true,
                },
              },
            },
            orderBy: { rentStartDate: 'asc' },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return products.map((product) => ({
    ...product,
    variants: product.variants.map((v) => ({
      ...v,
      priceSale: v.priceSale ? Number(v.priceSale) : null,
      priceRent: v.priceRent ? Number(v.priceRent) : null,
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
      costPrice: v.costPrice ? Number(v.costPrice) : null,
      rentalBlocks: v.rentalBlocks.map((b) => ({
        ...b,
        startDate: b.startDate.toISOString().split('T')[0],
        endDate: b.endDate.toISOString().split('T')[0],
      })),
      orderItems: v.orderItems.map((oi) => ({
        ...oi,
        priceAtTime: Number(oi.priceAtTime),
        rentStartDate: oi.rentStartDate ? oi.rentStartDate.toISOString().split('T')[0] : null,
        rentEndDate: oi.rentEndDate ? oi.rentEndDate.toISOString().split('T')[0] : null,
        order: {
          ...oi.order,
          totalAmount: Number(oi.order.totalAmount),
          shippingCost: oi.order.shippingCost ? Number(oi.order.shippingCost) : null,
        },
      })),
    })),
  }));
}
