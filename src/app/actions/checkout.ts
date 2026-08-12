'use server';

import { revalidatePath } from 'next/cache';
import { createOrder, CreateOrderInput } from '@/lib/services/order';
import { processPaymentCompletion, createFinalBalancePayment } from '@/lib/services/payment';
import { getSessionUserId } from '@/lib/session';

export async function submitCheckoutAction(input: Omit<CreateOrderInput, 'userId'>) {
  const userId = await getSessionUserId();
  const result = await createOrder({
    ...input,
    userId,
  });

  revalidatePath('/account/orders');
  revalidatePath('/products');
  return result;
}

export async function simulatePaymentCompletionAction(paymentId: string) {
  const payment = await processPaymentCompletion(paymentId, `SIM-${Date.now()}`);
  revalidatePath('/account/orders');
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/ledger');
  return payment;
}

export async function createFinalPaymentAction(
  orderId: string,
  paymentMethod: 'QRIS' | 'BANK_TRANSFER' | 'CREDIT_CARD',
  bankName?: string
) {
  const payment = await createFinalBalancePayment(orderId, paymentMethod, bankName);
  revalidatePath(`/account/orders/${orderId}`);
  return payment;
}
