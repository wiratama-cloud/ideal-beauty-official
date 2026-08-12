import React from 'react';
import Link from 'next/link';
import HeroBanner from '@/components/product/HeroBanner';
import ProductGrid from '@/components/product/ProductGrid';
import { getProducts } from '@/lib/services/product';
import { getWishlistedProductIds } from '@/lib/services/wishlist';
import { getSessionUserId } from '@/lib/session';

export default async function HomePage() {
  const [products, userId] = await Promise.all([
    getProducts(),
    getSessionUserId(),
  ]);

  const wishlistedIds = await getWishlistedProductIds(userId);
  const featuredProducts = products.slice(0, 6);

  return (
    <div className="space-y-16 pb-20 bg-white">
      {/* Hero Section */}
      <HeroBanner />

      {/* Featured Collections Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-center space-y-2 mb-12">
          <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 block font-medium">
            ATELIER SELECTIONS
          </span>
          <h2 className="text-3xl sm:text-4xl font-light text-neutral-900">
            Featured Masterpieces
          </h2>
          <div className="w-12 h-px bg-neutral-300 mx-auto mt-6" />
        </div>

        <ProductGrid products={featuredProducts} wishlistedIds={wishlistedIds} />

        <div className="text-center pt-16">
          <Link
            href="/products"
            className="inline-block border border-neutral-300 text-neutral-800 text-sm font-medium uppercase tracking-widest px-10 py-4 hover:border-black hover:bg-gray-50 transition-all rounded-sm"
          >
            View Entire Catalogue
          </Link>
        </div>
      </section>

      {/* Bespoke Rental Highlight Banner */}
      <section className="bg-neutral-100 text-neutral-900 py-20 px-4 text-center my-16 rounded-sm max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500 font-medium block">
            BESPOKE RENTAL SERVICE
          </span>
          <h2 className="text-3xl sm:text-5xl font-light leading-tight">
            Wear Haute Couture for Your Special Occasions
          </h2>
          <p className="text-neutral-600 text-sm font-light leading-relaxed max-w-xl mx-auto">
            Experience imperial velvet kaftans, silk lehengas, and tailored sherwanis without long-term commitment. Flexible 3-day to 7-day rentals across Indonesia.
          </p>
          <div className="pt-6">
            <Link
              href="/products?type=RENTAL"
              className="inline-block bg-black text-white text-sm uppercase tracking-widest px-8 py-4 font-medium hover:bg-neutral-800 transition-colors rounded-sm"
            >
              Browse Rental Boutique
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
