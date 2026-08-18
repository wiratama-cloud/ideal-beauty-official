'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, ShoppingBag, Calendar, Clock } from 'lucide-react';
import { useCart } from './CartContext';
import { getPreOrderDays, formatEstimatedArrival } from '@/lib/utils/preorder';
import { getOptimizedImageUrl } from '@/lib/utils/image-url';

export default function CartDrawer() {
  const { cart, subtotal, isCartOpen, closeCartDrawer, updateQuantity, removeItem } = useCart();

  if (!isCartOpen) return null;

  const items = cart?.items || [];

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-light text-xs">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeCartDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-neutral-800" />
              <h2 className="font-serif text-base uppercase tracking-widest text-neutral-900 font-normal">
                Shopping Bag ({items.length})
              </h2>
            </div>
            <button onClick={closeCartDrawer} className="p-1 text-neutral-400 hover:text-black">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 divide-y divide-neutral-100">
            {items.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <p className="font-serif text-sm text-neutral-500">Your shopping bag is empty</p>
                <Link
                  href="/products"
                  onClick={closeCartDrawer}
                  className="inline-block border border-black text-black px-6 py-2.5 uppercase tracking-widest text-[10px] hover:bg-black hover:text-white transition-colors"
                >
                  Explore Collections
                </Link>
              </div>
            ) : (
              items.map((item: any) => {
                const product = item.variant?.product;
                const attrs = item.variant?.attributes;
                const unitPrice =
                  item.type === 'RENTAL' ? Number(item.variant?.priceRent || 0) : Number(item.variant?.priceSale || 0);

                const image = getOptimizedImageUrl(product?.images?.[0], 256);

                return (
                  <div key={item.id} className="pt-4 first:pt-0 flex space-x-4">
                    <div className="relative w-20 aspect-[3/4] bg-neutral-100 flex-shrink-0 overflow-hidden">
                      <Image src={image} alt={product?.name || 'Item'} fill className="object-cover" unoptimized />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-serif text-xs text-neutral-900 font-medium line-clamp-1">
                          {product?.name}
                        </h3>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-neutral-400 hover:text-red-600 p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[10px] text-neutral-500 uppercase tracking-widest flex items-center space-x-2">
                        <span className="bg-neutral-100 px-1.5 py-0.5 text-neutral-800">
                          {item.type}
                        </span>
                        {attrs && <span>{attrs.size ? `Size: ${attrs.size}` : ''} {attrs.color ? `(${attrs.color})` : ''}</span>}
                      </div>

                      {item.type === 'RENTAL' && item.rentStartDate && item.rentEndDate && (
                        <div className="text-[10px] text-amber-800 bg-amber-50 p-1.5 flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-amber-700" />
                          <span>
                            {new Date(item.rentStartDate).toLocaleDateString('id-ID')} &ndash;{' '}
                            {new Date(item.rentEndDate).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      )}

                      {(item.isPreOrder || item.variant?.isPreOrder) && (
                        <div className="text-[10px] text-purple-900 bg-purple-50 p-1.5 flex flex-col space-y-0.5 rounded-xs border border-purple-100">
                          <div className="flex items-center space-x-1 font-semibold text-purple-800">
                            <Clock className="w-3 h-3 text-purple-700" />
                            <span>Pre-Order ({getPreOrderDays(item.variant)} Days Lead Time)</span>
                          </div>
                          <span className="text-[10px] text-purple-950 font-medium">
                            Arrives approx: {formatEstimatedArrival(getPreOrderDays(item.variant))}
                          </span>
                        </div>
                      )}

                      <div className="pt-2 flex justify-between items-center">
                        <div className="flex items-center border border-neutral-200">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-neutral-600 hover:bg-neutral-100"
                          >
                            -
                          </button>
                          <span className="px-2 py-0.5 font-mono text-[11px]">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.type === 'RENTAL'}
                            className={`px-2 py-0.5 ${
                              item.type === 'RENTAL'
                                ? 'text-neutral-300 cursor-not-allowed bg-neutral-50'
                                : 'text-neutral-600 hover:bg-neutral-100'
                            }`}
                            title={item.type === 'RENTAL' ? 'Rental quantity is limited to 1' : undefined}
                          >
                            +
                          </button>
                        </div>

                        <span className="font-mono text-xs font-medium text-neutral-900">
                          {formatIDR(unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && (
            <div className="p-6 border-t border-neutral-100 bg-neutral-50/50 space-y-4">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="uppercase tracking-widest text-neutral-500 font-sans">Subtotal</span>
                <span className="text-sm font-medium text-neutral-900">{formatIDR(subtotal)}</span>
              </div>

              <p className="text-[10px] text-neutral-400 font-sans leading-tight">
                Taxes and shipping calculated at checkout. Down Payment options available.
              </p>

              <Link
                href="/checkout"
                onClick={closeCartDrawer}
                className="block w-full bg-black text-white text-center py-4 uppercase tracking-[0.2em] font-light hover:bg-neutral-800 transition-colors"
              >
                Proceed to Checkout
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
