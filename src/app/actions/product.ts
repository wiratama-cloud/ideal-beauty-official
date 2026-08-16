'use server';

import { prisma } from '@/lib/prisma';
import { serializeProduct } from '@/lib/utils/serialization';

export interface QuickSearchItem {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  image: string | null;
  priceSale: number | null;
  priceRent: number | null;
}

export async function quickSearchProductsAction(query: string): Promise<QuickSearchItem[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: trimmed, mode: 'insensitive' } },
          { category: { contains: trimmed, mode: 'insensitive' } },
          { description: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        images: true,
        variants: {
          take: 1,
          select: {
            priceSale: true,
            priceRent: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return products.map((p) => {
      const serialized = serializeProduct(p);
      const firstVariant = serialized.variants && serialized.variants[0];
      return {
        id: serialized.id,
        name: serialized.name,
        slug: serialized.slug,
        category: serialized.category || null,
        image: serialized.images && serialized.images.length > 0 ? serialized.images[0] : null,
        priceSale: firstVariant?.priceSale ? Number(firstVariant.priceSale) : null,
        priceRent: firstVariant?.priceRent ? Number(firstVariant.priceRent) : null,
      };
    });
  } catch (err) {
    console.error('Error in quickSearchProductsAction:', err);
    return [];
  }
}
