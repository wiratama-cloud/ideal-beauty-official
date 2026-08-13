import { prisma } from '../prisma';
import { PaymentStatus, OrderStatus, EntryType, IncomeCategory, PaymentType, DebitCredit } from '@prisma/client';
import { generateQRISData, generateVirtualAccountData } from './payment-gateway';

export async function processPaymentCompletion(paymentId: string, providerTxId?: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            items: true,
            payments: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error(`Payment with ID ${paymentId} not found.`);
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return {
        ...payment,
        amount: payment.amount ? Number(payment.amount) : null,
      };
    }

    // 1. Update Payment status to COMPLETED
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.COMPLETED,
        providerTxId: providerTxId || payment.providerTxId || `MID-${payment.id.substring(0, 8)}`,
      },
    });

    // 2. Recalculate total completed payments for the order
    const allPayments = await tx.payment.findMany({
      where: {
        orderId: payment.orderId,
        status: PaymentStatus.COMPLETED,
      },
    });

    const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const orderTotal = Number(payment.order.totalAmount);

    // 3. Update Order Status
    let newOrderStatus = payment.order.status;
    if (totalPaid >= orderTotal) {
      newOrderStatus = OrderStatus.PAID;
    } else if (payment.type === PaymentType.DOWN_PAYMENT) {
      newOrderStatus = OrderStatus.PARTIALLY_PAID;
    }

    await tx.order.update({
      where: { id: payment.orderId },
      data: { status: newOrderStatus },
    });

    // 4. Determine Income Category (SALES_REVENUE or RENTAL_REVENUE)
    const hasRental = payment.order.items.some((i) => i.type === 'RENTAL');
    const incomeCategory = hasRental ? IncomeCategory.RENTAL_REVENUE : IncomeCategory.SALES_REVENUE;

    // 5. Automatically create INCOME LedgerEntry
    await tx.ledgerEntry.create({
      data: {
        type: EntryType.INCOME,
        dcType: DebitCredit.CREDIT,
        tranCode: 'PAYMENT_INCOME',
        tranSequence: 1,
        amount: payment.amount,
        description: `Received ${payment.type} payment for Order #${payment.orderId.substring(0, 8)} (${payment.paymentMethod || 'QRIS'})`,
        incomeCategory,
        paymentId: payment.id,
      },
    });

    return {
      ...updatedPayment,
      amount: updatedPayment.amount ? Number(updatedPayment.amount) : null,
    };
  });
}

export async function createFinalBalancePayment(
  orderId: string,
  paymentMethod: 'QRIS' | 'BANK_TRANSFER' | 'CREDIT_CARD',
  bankName?: string
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payments: {
        where: { status: PaymentStatus.COMPLETED },
      },
    },
  });

  if (!order) {
    throw new Error(`Order #${orderId} not found.`);
  }

  const totalPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remainingBalance = Number(order.totalAmount) - totalPaid;

  if (remainingBalance <= 0) {
    throw new Error('This order has already been fully paid.');
  }

  let qrisUrl: string | undefined;
  let vaNumber: string | undefined;

  if (paymentMethod === 'QRIS') {
    const qrisData = await generateQRISData(order.id, remainingBalance);
    qrisUrl = qrisData.qrCodeUrl;
  } else if (paymentMethod === 'BANK_TRANSFER') {
    const vaData = await generateVirtualAccountData(order.id, bankName || 'BCA');
    vaNumber = vaData.vaNumber;
  }

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      amount: remainingBalance,
      type: PaymentType.FINAL_BALANCE,
      status: PaymentStatus.PENDING,
      paymentMethod,
      qrisUrl,
      vaNumber,
      bankName: bankName || 'BCA',
      providerTxId: `MID-${order.id.substring(0, 8)}-${Date.now()}`,
    },
  });

  return {
    ...payment,
    amount: payment.amount ? Number(payment.amount) : null,
  };
}
