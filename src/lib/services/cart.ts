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
  }

  if (!cart) return cart;

  return {
    ...cart,
    items: cart.items.map((item) => ({
      ...item,
      variant: item.variant
        ? {
            ...item.variant,
            priceSale: item.variant.priceSale ? Number(item.variant.priceSale) : null,
            priceRent: item.variant.priceRent ? Number(item.variant.priceRent) : null,
            costPrice: item.variant.costPrice ? Number(item.variant.costPrice) : null,
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

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_variantId_type: {
        cartId: cart.id,
        variantId: input.variantId,
        type: itemType,
      },
    },
  });

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + input.quantity,
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

  return prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
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
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          variantId: item.variantId,
          type: item.type,
          quantity: item.quantity,
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
