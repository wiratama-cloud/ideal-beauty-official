'use server';

import { revalidatePath } from 'next/cache';
import { toggleWishlistItem, getWishlistedProductIds } from '@/lib/services/wishlist';
import { getSessionUserId } from '@/lib/session';

export async function toggleWishlistAction(productId: string, variantId?: string) {
  const userId = await getSessionUserId();
  const result = await toggleWishlistItem(userId, productId, variantId);
  revalidatePath('/products');
  revalidatePath('/account/wishlist');
  return result;
}

export async function getWishlistedIdsAction(): Promise<string[]> {
  const userId = await getSessionUserId();
  return getWishlistedProductIds(userId);
}
