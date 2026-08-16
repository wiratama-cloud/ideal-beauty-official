import { prisma } from '../prisma';
import { ItemType } from '@prisma/client';

export interface AddToCartInput {
  variantId: string;
  type: 'SALE' | 'RENTAL';
  quantity: number;
  rentStartDate?: string;
  rentEndDate?: string;
}

export async function getOrCreateCart(userIdOrSessionId: string) {
  let cart = await prisma.cart.findFirst({
    where: {
      OR: [{ userId: userIdOrSessionId }, { sessionId: userIdOrSessionId }],
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
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!cart) {
    const userExists = await prisma.user.findUnique({
      where: { id: userIdOrSessionId },
    });

    try {
      cart = await prisma.cart.create({
        data: userExists
          ? { userId: userIdOrSessionId }
          : { sessionId: userIdOrSessionId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
    } catch (error: any) {
      // Handle race condition where a concurrent request created the cart first
      if (error.code === 'P2002' || error.message?.includes('Unique constraint failed')) {
        cart = await prisma.cart.findFirst({
          where: {
            OR: [{ userId: userIdOrSessionId }, { sessionId: userIdOrSessionId }],
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
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        });
      } else {
        throw error;
      }
    }
  }

  if (!cart) throw new Error('Failed to retrieve or create cart.');

  return {
    ...cart,
    items: cart.items.map((item) => ({
      ...item,
      variant: item.variant
        ? {
            ...item.variant,
            priceSale: item.variant.priceSale ? Number(item.variant.priceSale) : null,
            priceRent: item.variant.priceRent ? Number(item.variant.priceRent) : null,
            compareAtPrice: item.variant.compareAtPrice ? Number(item.variant.compareAtPrice) : null,
            costPrice: item.variant.costPrice ? Number(item.variant.costPrice) : null,
            purchaseCost: item.variant.purchaseCost ? Number(item.variant.purchaseCost) : null,
          }
        : null,
    })),
  };
}

export async function addItemToCart(userIdOrSessionId: string, input: AddToCartInput) {
  const cart = await getOrCreateCart(userIdOrSessionId);
  const itemType = input.type === 'RENTAL' ? ItemType.RENTAL : ItemType.SALE;

  const rentStart = input.rentStartDate ? new Date(input.rentStartDate) : null;
  const rentEnd = input.rentEndDate ? new Date(input.rentEndDate) : null;

  const variant = await prisma.productVariant.findUnique({
    where: { id: input.variantId },
    include: { product: true },
  });

  if (!variant) {
    throw new Error('Product variant not found.');
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_variantId_type: {
        cartId: cart.id,
        variantId: input.variantId,
        type: itemType,
      },
    },
  });

  const requestedQuantity = (existingItem?.quantity || 0) + input.quantity;

  const effectiveRentAvailable =
    variant.stockRentAvailable === 0 && variant.stockSaleAvailable === 0 && variant.stockAvailable > 0
      ? variant.stockAvailable
      : variant.stockRentAvailable;

  const effectiveSaleAvailable =
    variant.stockRentAvailable === 0 && variant.stockSaleAvailable === 0 && variant.stockAvailable > 0
      ? variant.stockAvailable
      : variant.stockSaleAvailable;

  const isPreOrderItem =
    itemType === ItemType.SALE &&
    Boolean(variant.isPreOrder) &&
    effectiveSaleAvailable < requestedQuantity;

  if (itemType === ItemType.RENTAL) {
    if (effectiveRentAvailable < requestedQuantity) {
      throw new Error(`Only ${effectiveRentAvailable} rental units available for ${variant.product.name}.`);
    }
  } else {
    if (!isPreOrderItem && effectiveSaleAvailable < requestedQuantity) {
      throw new Error(`Only ${effectiveSaleAvailable} items available for sale for ${variant.product.name}.`);
    }
  }

  const shipDate = isPreOrderItem ? variant.preOrderShipDate : null;

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: requestedQuantity,
        isPreOrder: isPreOrderItem,
        preOrderShipDate: shipDate,
        rentStartDate: rentStart || existingItem.rentStartDate,
        rentEndDate: rentEnd || existingItem.rentEndDate,
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId: input.variantId,
        type: itemType,
        quantity: input.quantity,
        isPreOrder: isPreOrderItem,
        preOrderShipDate: shipDate,
        rentStartDate: rentStart,
        rentEndDate: rentEnd,
      },
    });
  }

  return getOrCreateCart(userIdOrSessionId);
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  if (quantity <= 0) {
    return prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { variant: true },
  });

  if (!existingItem) {
    throw new Error('Cart item not found.');
  }

  let isPreOrder = existingItem.isPreOrder;
  let preOrderShipDate = existingItem.preOrderShipDate;

  if (existingItem.type === ItemType.SALE && existingItem.variant) {
    const effectiveSaleAvailable =
      existingItem.variant.stockRentAvailable === 0 &&
      existingItem.variant.stockSaleAvailable === 0 &&
      existingItem.variant.stockAvailable > 0
        ? existingItem.variant.stockAvailable
        : existingItem.variant.stockSaleAvailable;

    const isPreOrderItem =
      Boolean(existingItem.variant.isPreOrder) && effectiveSaleAvailable < quantity;

    isPreOrder = isPreOrderItem;
    preOrderShipDate = isPreOrderItem ? existingItem.variant.preOrderShipDate : null;
  }

  return prisma.cartItem.update({
    where: { id: cartItemId },
    data: {
      quantity,
      isPreOrder,
      preOrderShipDate,
    },
  });
}

export async function removeCartItem(cartItemId: string) {
  return prisma.cartItem.delete({
    where: { id: cartItemId },
  });
}

export async function mergeGuestCartToUser(guestSessionId: string, loggedInUserId: string) {
  const guestCart = await prisma.cart.findUnique({
    where: { sessionId: guestSessionId },
    include: { items: true },
  });

  if (!guestCart || guestCart.items.length === 0) {
    return getOrCreateCart(loggedInUserId);
  }

  const userCart = await getOrCreateCart(loggedInUserId);

  for (const item of guestCart.items) {
    const existing = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId_type: {
          cartId: userCart.id,
          variantId: item.variantId,
          type: item.type,
        },
      },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + item.quantity,
          isPreOrder: item.isPreOrder,
          preOrderShipDate: item.preOrderShipDate,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          variantId: item.variantId,
          type: item.type,
          quantity: item.quantity,
          isPreOrder: item.isPreOrder,
          preOrderShipDate: item.preOrderShipDate,
          rentStartDate: item.rentStartDate,
          rentEndDate: item.rentEndDate,
        },
      });
    }
  }

  // Clear guest cart
  await prisma.cart.delete({
    where: { id: guestCart.id },
  });

  return getOrCreateCart(loggedInUserId);
}
