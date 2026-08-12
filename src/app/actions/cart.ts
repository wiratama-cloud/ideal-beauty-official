'use server';

import { revalidatePath } from 'next/cache';
import {
  getOrCreateCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  AddToCartInput,
} from '@/lib/services/cart';
import { getSessionUserId } from '@/lib/session';

export async function getCartAction() {
  const userId = await getSessionUserId();
  return getOrCreateCart(userId);
}

export async function addToCartAction(input: AddToCartInput) {
  const userId = await getSessionUserId();
  const cart = await addItemToCart(userId, input);
  revalidatePath('/products');
  revalidatePath('/checkout');
  return cart;
}

export async function updateCartQuantityAction(cartItemId: string, quantity: number) {
  await updateCartItemQuantity(cartItemId, quantity);
  const userId = await getSessionUserId();
  revalidatePath('/products');
  revalidatePath('/checkout');
  return getOrCreateCart(userId);
}

export async function removeFromCartAction(cartItemId: string) {
  await removeCartItem(cartItemId);
  const userId = await getSessionUserId();
  revalidatePath('/products');
  revalidatePath('/checkout');
  return getOrCreateCart(userId);
}
