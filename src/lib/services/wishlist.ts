import { prisma } from '../prisma';

export async function getUserWishlist(userId: string) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          variants: true,
        },
      },
      variant: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return items.map(item => ({
    ...item,
    product: item.product ? {
      ...item.product,
      variants: item.product.variants.map(variant => ({
        ...variant,
        priceSale: variant.priceSale ? Number(variant.priceSale) : null,
        priceRent: variant.priceRent ? Number(variant.priceRent) : null,
        compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
        costPrice: variant.costPrice ? Number(variant.costPrice) : null,
        purchaseCost: variant.purchaseCost ? Number(variant.purchaseCost) : null,
      })),
    } : null,
    variant: item.variant ? {
      ...item.variant,
      priceSale: item.variant.priceSale ? Number(item.variant.priceSale) : null,
      priceRent: item.variant.priceRent ? Number(item.variant.priceRent) : null,
      compareAtPrice: item.variant.compareAtPrice ? Number(item.variant.compareAtPrice) : null,
      costPrice: item.variant.costPrice ? Number(item.variant.costPrice) : null,
      purchaseCost: item.variant.purchaseCost ? Number(item.variant.purchaseCost) : null,
    } : null,
  }));
}

export async function toggleWishlistItem(userId: string, productId: string, variantId?: string) {
  const existing = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  if (existing) {
    await prisma.wishlistItem.delete({
      where: { id: existing.id },
    });
    return { wishlisted: false };
  } else {
    await prisma.wishlistItem.create({
      data: {
        userId,
        productId,
        variantId,
      },
    });
    return { wishlisted: true };
  }
}

export async function getWishlistedProductIds(userId?: string | null): Promise<string[]> {
  if (!userId) return [];
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      select: { productId: true },
    });

    return items.map((item) => item.productId);
  } catch (error) {
    console.error('Failed to fetch wishlisted product IDs:', error);
    return [];
  }
}
