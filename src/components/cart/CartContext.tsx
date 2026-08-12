'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getCartAction,
  addToCartAction,
  updateCartQuantityAction,
  removeFromCartAction,
} from '@/app/actions/cart';
import { AddToCartInput } from '@/lib/services/cart';

interface CartContextType {
  cart: any;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  isLoading: boolean;
  toggleCartDrawer: () => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  addToCart: (input: AddToCartInput) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<any>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCart = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getCartAction();
      setCart(data);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const toggleCartDrawer = () => setIsCartOpen((prev) => !prev);
  const openCartDrawer = () => setIsCartOpen(true);
  const closeCartDrawer = () => setIsCartOpen(false);

  const addToCart = async (input: AddToCartInput) => {
    setIsLoading(true);
    try {
      const updatedCart = await addToCartAction(input);
      setCart(updatedCart);
      openCartDrawer();
    } catch (err) {
      console.error('Error adding to cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const updatedCart = await updateCartQuantityAction(cartItemId, quantity);
      setCart(updatedCart);
    } catch (err) {
      console.error('Error updating quantity:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (cartItemId: string) => {
    setIsLoading(true);
    try {
      const updatedCart = await removeFromCartAction(cartItemId);
      setCart(updatedCart);
    } catch (err) {
      console.error('Error removing item:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const items = cart?.items || [];
  const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0);

  const subtotal = items.reduce((sum: number, item: any) => {
    const price = item.type === 'RENTAL' ? Number(item.variant?.priceRent || 0) : Number(item.variant?.priceSale || 0);
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        totalItems,
        subtotal,
        isCartOpen,
        isLoading,
        toggleCartDrawer,
        openCartDrawer,
        closeCartDrawer,
        addToCart,
        updateQuantity,
        removeItem,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
