'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { createExpenseEntry, CreateExpenseInput, generateLedgerCSV } from '@/lib/services/ledger';
import { RentalStatus } from '@prisma/client';

export async function logExpenseAction(data: CreateExpenseInput) {
  const result = await createExpenseEntry(data);
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/ledger');
  return result;
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
  return updated;
}

export async function getAllOrdersAdminAction() {
  return prisma.order.findMany({
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
}
