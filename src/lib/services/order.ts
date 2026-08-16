import { prisma } from '../prisma';
import { generateQRISData, generateVirtualAccountData } from './payment-gateway';
import { OrderStatus, PaymentType, PaymentStatus, RentalStatus, InventoryTransactionType } from '@prisma/client';
import { validateVoucherForCart, serializeVoucher } from './voucher';
import { sendOrderPushNotification } from './notification';

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
  voucherCode?: string;
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

  // Calculate subtotal
  let subtotal = 0;
  for (const item of cart.items) {
    const itemPrice =
      item.type === 'RENTAL' ? Number(item.variant.priceRent || 0) : Number(item.variant.priceSale || 0);
    subtotal += itemPrice * item.quantity;
  }

  let discountAmount = 0;
  let appliedVoucher: any = null;

  if (input.voucherCode) {
    const voucherRes = await validateVoucherForCart(input.voucherCode, subtotal, userId);
    if (!voucherRes.valid) {
      throw new Error(voucherRes.message || 'Invalid voucher code.');
    }
    discountAmount = voucherRes.discountAmount || 0;
    appliedVoucher = voucherRes.voucher;
  }

  const totalAmount = Math.max(0, subtotal - discountAmount);

  const pType = paymentType === 'DOWN_PAYMENT' ? PaymentType.DOWN_PAYMENT : PaymentType.FULL_PAYMENT;

  const initialPaymentAmount =
    pType === PaymentType.DOWN_PAYMENT ? (totalAmount * downPaymentPercentage) / 100 : totalAmount;

  // Execute atomic Prisma transaction for stock deduction and order placement
  return prisma.$transaction(async (tx) => {
    const itemPreOrderMap = new Map<string, { isPreOrder: boolean; shipDate: Date | null }>();

    // 1. Atomic Stock Deduction Check
    for (const item of cart.items) {
      const isRental = item.type === 'RENTAL';

      if (isRental) {
        if (item.rentStartDate && item.rentEndDate) {
          const overlappingOrdersCount = await tx.orderItem.count({
            where: {
              variantId: item.variantId,
              type: 'RENTAL',
              order: {
                status: {
                  not: OrderStatus.CANCELLED,
                },
              },
              rentStartDate: { lte: item.rentEndDate },
              rentEndDate: { gte: item.rentStartDate },
            },
          });

          const overlappingBlocksCount = await tx.rentalBlock.count({
            where: {
              variantId: item.variantId,
              startDate: { lte: item.rentEndDate },
              endDate: { gte: item.rentStartDate },
            },
          });

          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { stockRentTotal: true, stockRentAvailable: true },
          });

          const maxCapacity = Math.max(
            variant?.stockRentTotal ?? 0,
            variant?.stockRentAvailable ?? 0,
            1
          );

          if (overlappingOrdersCount + overlappingBlocksCount + item.quantity > maxCapacity) {
            throw new Error(
              `The selected rental dates for ${item.variant.product.name} (${item.variant.sku}) are no longer available.`
            );
          }
        }

        const updatedVariant = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            stockRentAvailable: {
              gte: item.quantity,
            },
          },
          data: {
            stockRentAvailable: {
              decrement: item.quantity,
            },
            stockAvailable: {
              decrement: item.quantity,
            },
          },
        });

        if (updatedVariant.count === 0) {
          throw new Error(
            `Insufficient rental stock available for ${item.variant.product.name} (${item.variant.sku}).`
          );
        }

        await tx.inventoryTransaction.create({
          data: {
            variantId: item.variantId,
            type: InventoryTransactionType.RENTAL,
            quantity: item.quantity,
            reason: 'CUSTOMER_RENTAL',
            notes: `Deducted for order checkout`,
          },
        });

        itemPreOrderMap.set(item.id, { isPreOrder: false, shipDate: null });
      } else {
        const currentVariant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (!currentVariant) {
          throw new Error('Product variant not found.');
        }

        const effectiveSaleAvailable =
          currentVariant.stockRentAvailable === 0 &&
          currentVariant.stockSaleAvailable === 0 &&
          currentVariant.stockAvailable > 0
            ? currentVariant.stockAvailable
            : currentVariant.stockSaleAvailable;

        const isPreOrderEligible = Boolean(currentVariant.isPreOrder);
        const isPreOrderNeeded = effectiveSaleAvailable < item.quantity;
        const isPreOrder = isPreOrderEligible && isPreOrderNeeded;

        if (!isPreOrderEligible && effectiveSaleAvailable < item.quantity) {
          throw new Error(
            `Insufficient sale stock available for ${currentVariant.product.name} (${currentVariant.sku}).`
          );
        }

        if (isPreOrder) {
          if (effectiveSaleAvailable > 0) {
            const dec = Math.min(effectiveSaleAvailable, item.quantity);
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stockSaleAvailable: { decrement: dec },
                stockAvailable: { decrement: dec },
              },
            });
          }

          await tx.inventoryTransaction.create({
            data: {
              variantId: item.variantId,
              type: InventoryTransactionType.SALE,
              quantity: item.quantity,
              reason: 'CUSTOMER_PURCHASE',
              notes: `Pre-order checkout`,
            },
          });

          itemPreOrderMap.set(item.id, {
            isPreOrder: true,
            shipDate: currentVariant.preOrderShipDate || null,
          });
        } else {
          const updatedVariant = await tx.productVariant.updateMany({
            where: {
              id: item.variantId,
              stockSaleAvailable: {
                gte: item.quantity,
              },
            },
            data: {
              stockSaleAvailable: {
                decrement: item.quantity,
              },
              stockAvailable: {
                decrement: item.quantity,
              },
            },
          });

          if (updatedVariant.count === 0) {
            throw new Error(
              `Insufficient sale stock available for ${currentVariant.product.name} (${currentVariant.sku}).`
            );
          }

          await tx.inventoryTransaction.create({
            data: {
              variantId: item.variantId,
              type: InventoryTransactionType.SALE,
              quantity: item.quantity,
              reason: 'CUSTOMER_PURCHASE',
              notes: `Deducted for order checkout`,
            },
          });

          itemPreOrderMap.set(item.id, { isPreOrder: false, shipDate: null });
        }
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
        discountAmount,
        voucherId: appliedVoucher ? appliedVoucher.id : null,
        status: OrderStatus.PENDING,
        shippingAddressId: address.id,
        shippingCost: 0, // Complimentary express shipping
        courierName: 'JNE Express / Private Atelier Courier',
        items: {
          create: cart.items.map((item) => {
            const price =
              item.type === 'RENTAL' ? Number(item.variant.priceRent || 0) : Number(item.variant.priceSale || 0);
            const preOrderInfo = itemPreOrderMap.get(item.id) || { isPreOrder: false, shipDate: null };

            return {
              variantId: item.variantId,
              type: item.type,
              quantity: item.quantity,
              priceAtTime: price,
              isPreOrder: preOrderInfo.isPreOrder,
              preOrderShipDate: preOrderInfo.shipDate,
              rentStartDate: item.rentStartDate,
              rentEndDate: item.rentEndDate,
              rentalStatus: item.type === 'RENTAL' ? RentalStatus.OUT_WITH_CUSTOMER : RentalStatus.NOT_APPLICABLE,
            };
          }),
        },
      },
      include: {
        items: true,
        voucher: true,
      },
    });

    if (appliedVoucher) {
      await tx.voucherUsage.create({
        data: {
          voucherId: appliedVoucher.id,
          orderId: order.id,
          userId,
          discountAmount,
        },
      });

      await tx.voucher.update({
        where: { id: appliedVoucher.id },
        data: {
          usageCount: { increment: 1 },
        },
      });
    }

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
    discountAmount: order.discountAmount !== undefined && order.discountAmount !== null ? Number(order.discountAmount) : 0,
    shippingCost: order.shippingCost !== undefined && order.shippingCost !== null ? Number(order.shippingCost) : null,
    voucher: order.voucher ? serializeVoucher(order.voucher) : null,
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
                purchaseCost: item.variant.purchaseCost !== undefined && item.variant.purchaseCost !== null ? Number(item.variant.purchaseCost) : null,
              }
            : null,
        }))
      : [],
    payments: order.payments ? order.payments.map((payment: any) => serializePayment(payment)) : [],
  };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status },
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
      payments: true,
      shippingAddress: true,
      user: true,
      voucher: true,
    },
  });

  if (updated.user?.fcmToken && ['PROCESSING', 'SHIPPED', 'COMPLETED'].includes(status)) {
    await sendOrderPushNotification(
      updated.user.fcmToken,
      'Order Update',
      `Your order ${orderId} is now ${status}.`,
      orderId
    );
  }

  return serializeOrder(updated);
}

export async function updateOrderShippingInfo(orderId: string, courierName?: string, trackingNumber?: string) {
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      ...(courierName !== undefined && { courierName }),
      ...(trackingNumber !== undefined && { trackingNumber }),
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
      payments: true,
      shippingAddress: true,
      user: true,
      voucher: true,
    },
  });

  return serializeOrder(updated);
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
      voucher: true,
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
      voucher: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return orders.map(order => serializeOrder(order));
}
