import React from 'react';
import Link from 'next/link';
import { getUserWishlist } from '@/lib/services/wishlist';
import { getSessionUserId } from '@/lib/session';
import ProductGrid from '@/components/product/ProductGrid';

export default async function WishlistPage() {
  const userId = await getSessionUserId();
  const wishlistItems = await getUserWishlist(userId);

  const products = wishlistItems
    .map((item) => item.product)
    .filter((prod): prod is any => Boolean(prod));

  const wishlistedIds = products.map((p) => p.id);

  return (
    <div className="bg-neutral-50/50 min-h-screen py-12 font-light text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-2">
          <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-sans block">
            MY PRIVATE ATELIER SAVED PIECES
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-neutral-900">
            Saved Wishlist ({products.length})
          </h1>
        </div>

        {products.length === 0 ? (
          <div className="bg-white border border-neutral-100 p-12 text-center space-y-4 max-w-xl mx-auto">
            <h2 className="font-serif text-xl text-neutral-800">Your Wishlist is Empty</h2>
            <p className="text-neutral-500 font-light text-xs">
              Explore our haute couture, bridal lehengas, and imperial kaftans to save your favorite pieces.
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-block bg-black text-white text-xs uppercase tracking-[0.2em] px-8 py-3.5 font-light hover:bg-neutral-800 transition-colors"
              >
                Browse Catalogue
              </Link>
            </div>
          </div>
        ) : (
          <ProductGrid products={products} wishlistedIds={wishlistedIds} />
        )}
      </div>
    </div>
  );
}
