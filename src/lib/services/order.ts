import { prisma } from '../prisma';
import { generateQRISData, generateVirtualAccountData } from './payment-gateway';
import { OrderStatus, PaymentType, PaymentStatus, RentalStatus } from '@prisma/client';

export interface CreateOrderInput {
  userId: string;
  shippingAddress: {
    recipientName: string;
    phone: string;
    addressLine1: string;
    city: string;
    province: string;
    postalCode: string;
  };
  paymentType: 'DOWN_PAYMENT' | 'FULL_PAYMENT';
  paymentMethod: 'QRIS' | 'BANK_TRANSFER' | 'CREDIT_CARD';
  bankName?: string;
  downPaymentPercentage?: number; // e.g. 50%
}

export async function createOrder(input: CreateOrderInput) {
  const { userId, shippingAddress, paymentType, paymentMethod, bankName, downPaymentPercentage = 50 } = input;

  const cart = await prisma.cart.findFirst({
    where: {
      OR: [{ userId }, { sessionId: userId }],
    },
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
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error('Your shopping bag is empty.');
  }

  const hasRentalItems = cart.items.some((item) => item.type === 'RENTAL');
  if (hasRentalItems && paymentType === 'DOWN_PAYMENT') {
    throw new Error('Rental items require 100% full payment upon checkout.');
  }

  // Calculate order total
  let totalAmount = 0;
  for (const item of cart.items) {
    const itemPrice =
      item.type === 'RENTAL' ? Number(item.variant.priceRent || 0) : Number(item.variant.priceSale || 0);
    totalAmount += itemPrice * item.quantity;
  }

  const pType = paymentType === 'DOWN_PAYMENT' ? PaymentType.DOWN_PAYMENT : PaymentType.FULL_PAYMENT;

  const initialPaymentAmount =
    pType === PaymentType.DOWN_PAYMENT ? (totalAmount * downPaymentPercentage) / 100 : totalAmount;

  // Execute atomic Prisma transaction for stock deduction and order placement
  return prisma.$transaction(async (tx) => {
    // 1. Atomic Stock Deduction Check
    for (const item of cart.items) {
      const updatedVariant = await tx.productVariant.updateMany({
        where: {
          id: item.variantId,
          stockAvailable: {
            gte: item.quantity,
          },
        },
        data: {
          stockAvailable: {
            decrement: item.quantity,
          },
        },
      });

      if (updatedVariant.count === 0) {
        throw new Error(
          `Insufficient stock available for ${item.variant.product.name} (${item.variant.sku}).`
        );
      }
    }

    // 2. Create Address record
    const address = await tx.address.create({
      data: {
        userId,
        recipientName: shippingAddress.recipientName,
        phone: shippingAddress.phone,
        addressLine1: shippingAddress.addressLine1,
        city: shippingAddress.city,
        province: shippingAddress.province,
        postalCode: shippingAddress.postalCode,
      },
    });

    // 3. Create Order
    const order = await tx.order.create({
      data: {
        userId,
        totalAmount,
        status: OrderStatus.PENDING,
        shippingAddressId: address.id,
        shippingCost: 0, // Complimentary express shipping
        courierName: 'JNE Express / Private Atelier Courier',
        items: {
          create: cart.items.map((item) => {
            const price =
              item.type === 'RENTAL' ? Number(item.variant.priceRent || 0) : Number(item.variant.priceSale || 0);

            return {
              variantId: item.variantId,
              type: item.type,
              quantity: item.quantity,
              priceAtTime: price,
              rentStartDate: item.rentStartDate,
              rentEndDate: item.rentEndDate,
              rentalStatus: item.type === 'RENTAL' ? RentalStatus.OUT_WITH_CUSTOMER : RentalStatus.NOT_APPLICABLE,
            };
          }),
        },
      },
      include: {
        items: true,
      },
    });

    // 4. Generate Gateway Payment Details (QRIS or Virtual Account)
    let qrisUrl: string | undefined;
    let vaNumber: string | undefined;

    if (paymentMethod === 'QRIS') {
      const qrisData = await generateQRISData(order.id, initialPaymentAmount);
      qrisUrl = qrisData.qrCodeUrl;
    } else if (paymentMethod === 'BANK_TRANSFER') {
      const vaData = await generateVirtualAccountData(order.id, bankName || 'BCA');
      vaNumber = vaData.vaNumber;
    }

    // 5. Create Payment record
    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        amount: initialPaymentAmount,
        type: pType,
        status: PaymentStatus.PENDING,
        paymentMethod,
        qrisUrl,
        vaNumber,
        bankName: bankName || 'BCA',
        providerTxId: `MID-${order.id.substring(0, 8)}-${Date.now()}`,
      },
    });

    // 6. Clear Cart Items
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return {
      order: serializeOrder(order),
      payment: serializePayment(payment),
    };
  });
}

export function serializePayment(payment: any) {
  if (!payment) return null;
  return {
    ...payment,
    amount: payment.amount !== undefined && payment.amount !== null ? Number(payment.amount) : null,
  };
}

export function serializeOrder(order: any) {
  if (!order) return null;
  return {
    ...order,
    totalAmount: order.totalAmount !== undefined && order.totalAmount !== null ? Number(order.totalAmount) : null,
    shippingCost: order.shippingCost !== undefined && order.shippingCost !== null ? Number(order.shippingCost) : null,
    items: order.items
      ? order.items.map((item: any) => ({
          ...item,
          priceAtTime: item.priceAtTime !== undefined && item.priceAtTime !== null ? Number(item.priceAtTime) : null,
          variant: item.variant
            ? {
                ...item.variant,
                priceSale: item.variant.priceSale !== undefined && item.variant.priceSale !== null ? Number(item.variant.priceSale) : null,
                priceRent: item.variant.priceRent !== undefined && item.variant.priceRent !== null ? Number(item.variant.priceRent) : null,
                compareAtPrice: item.variant.compareAtPrice !== undefined && item.variant.compareAtPrice !== null ? Number(item.variant.compareAtPrice) : null,
                costPrice: item.variant.costPrice !== undefined && item.variant.costPrice !== null ? Number(item.variant.costPrice) : null,
              }
            : null,
        }))
      : [],
    payments: order.payments ? order.payments.map((payment: any) => serializePayment(payment)) : [],
  };
}

export async function getOrderById(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
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
  });

  if (!order) return null;

  return serializeOrder(order);
}

export async function getUserOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
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
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return orders.map(order => serializeOrder(order));
}
