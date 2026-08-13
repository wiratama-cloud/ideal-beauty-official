import { prisma } from '../prisma';
import { VoucherDiscountType, VoucherTargetType } from '@prisma/client';

export interface CreateVoucherInput {
  code: string;
  description?: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  minPurchase?: number | null;
  maxDiscount?: number | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  usageLimit?: number | null;
  targetType?: VoucherTargetType;
  userId?: string | null;
}

export interface ValidateVoucherResult {
  valid: boolean;
  message?: string;
  voucher?: any;
  discountAmount?: number;
  finalTotal?: number;
}

export async function createVoucher(input: CreateVoucherInput) {
  const code = input.code.trim().toUpperCase();
  if (!code) {
    throw new Error('Voucher code is required.');
  }

  const existing = await prisma.voucher.findUnique({
    where: { code },
  });

  if (existing) {
    throw new Error(`Voucher code "${code}" already exists.`);
  }

  if (input.targetType === 'CUSTOMER' && !input.userId) {
    throw new Error('A customer user ID must be specified for customer-bound vouchers.');
  }

  const voucher = await prisma.voucher.create({
    data: {
      code,
      description: input.description || null,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minPurchase: input.minPurchase ?? null,
      maxDiscount: input.maxDiscount ?? null,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      usageLimit: input.usageLimit ?? null,
      targetType: input.targetType || 'EVENT',
      userId: input.userId || null,
    },
  });

  return serializeVoucher(voucher);
}

export async function getVouchers() {
  const vouchers = await prisma.voucher.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      usages: {
        select: {
          id: true,
          usedAt: true,
          discountAmount: true,
        },
      },
      _count: {
        select: {
          usages: true,
          orders: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return vouchers.map(serializeVoucher);
}

export async function toggleVoucherStatus(id: string) {
  const voucher = await prisma.voucher.findUnique({ where: { id } });
  if (!voucher) throw new Error('Voucher not found.');

  const updated = await prisma.voucher.update({
    where: { id },
    data: { isActive: !voucher.isActive },
  });

  return serializeVoucher(updated);
}

export async function deleteVoucher(id: string) {
  return prisma.voucher.delete({ where: { id } });
}

export async function validateVoucherForCart(
  code: string,
  subtotal: number,
  userId?: string | null
): Promise<ValidateVoucherResult> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, message: 'Please enter a voucher code.' };
  }

  const voucher = await prisma.voucher.findUnique({
    where: { code: cleanCode },
  });

  if (!voucher) {
    return { valid: false, message: 'Invalid voucher code.' };
  }

  if (!voucher.isActive) {
    return { valid: false, message: 'This voucher is inactive.' };
  }

  const now = new Date();
  if (voucher.startDate && new Date(voucher.startDate) > now) {
    return { valid: false, message: 'This voucher is not active yet.' };
  }

  if (voucher.endDate && new Date(voucher.endDate) < now) {
    return { valid: false, message: 'This voucher has expired.' };
  }

  if (voucher.targetType === 'CUSTOMER') {
    if (!userId || voucher.userId !== userId) {
      return { valid: false, message: 'This voucher is reserved for a specific customer account.' };
    }
  }

  if (voucher.usageLimit !== null && voucher.usageCount >= voucher.usageLimit) {
    return { valid: false, message: 'This voucher has reached its maximum usage limit.' };
  }

  const minPurchase = voucher.minPurchase ? Number(voucher.minPurchase) : 0;
  if (subtotal < minPurchase) {
    return {
      valid: false,
      message: `Minimum purchase amount of IDR ${minPurchase.toLocaleString('id-ID')} required to use this voucher.`,
    };
  }

  let discountAmount = 0;
  const val = Number(voucher.discountValue);
  if (voucher.discountType === 'PERCENTAGE') {
    discountAmount = (subtotal * val) / 100;
    if (voucher.maxDiscount !== null && voucher.maxDiscount !== undefined) {
      const maxDisc = Number(voucher.maxDiscount);
      if (maxDisc > 0 && discountAmount > maxDisc) {
        discountAmount = maxDisc;
      }
    }
  } else {
    discountAmount = val;
  }

  discountAmount = Math.min(discountAmount, subtotal);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  return {
    valid: true,
    voucher: serializeVoucher(voucher),
    discountAmount,
    finalTotal,
  };
}

export function serializeVoucher(voucher: any) {
  if (!voucher) return null;
  return {
    ...voucher,
    discountValue: voucher.discountValue ? Number(voucher.discountValue) : 0,
    minPurchase: voucher.minPurchase ? Number(voucher.minPurchase) : null,
    maxDiscount: voucher.maxDiscount ? Number(voucher.maxDiscount) : null,
  };
}
