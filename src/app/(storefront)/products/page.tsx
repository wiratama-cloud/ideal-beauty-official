import React, { Suspense } from 'react';
import { getProducts, getCategories } from '@/lib/services/product';
import { getNavCategories } from '@/lib/services/nav-category';
import { getWishlistedProductIds } from '@/lib/services/wishlist';
import { getSessionUserId } from '@/lib/session';
import FilterSidebar from '@/components/product/FilterSidebar';
import ProductGrid from '@/components/product/ProductGrid';

interface PageProps {
  searchParams: Promise<{
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    type?: 'SALE' | 'RENTAL';
    query?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  const minPrice = resolvedParams.minPrice ? parseFloat(resolvedParams.minPrice) : undefined;
  const maxPrice = resolvedParams.maxPrice ? parseFloat(resolvedParams.maxPrice) : undefined;

  const [products, categories, navCategories, userId] = await Promise.all([
    getProducts({
      category: resolvedParams.category,
      minPrice,
      maxPrice,
      type: resolvedParams.type,
      query: resolvedParams.query,
    }),
    getCategories(),
    getNavCategories(),
    getSessionUserId(),
  ]);

  const wishlistedIds = await getWishlistedProductIds(userId);

  return (
    <div className="bg-neutral-50/50 min-h-screen pb-24">
      {/* Header Banner */}
      <div className="bg-neutral-900 text-white py-16 px-4 text-center border-b border-neutral-800">
        <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-sans block mb-2">
          THE IDEAL BEAUTY CATALOGUE
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-light tracking-wider">
          {resolvedParams.category || 'All Luxury Collections'}
        </h1>
        <p className="text-neutral-400 text-xs tracking-widest mt-3 uppercase font-light">
          {products.length} {products.length === 1 ? 'Piece' : 'Masterpieces'} Available
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex flex-col lg:flex-row gap-10">
          <Suspense fallback={<div className="w-64 bg-white p-6 h-64 animate-pulse" />}>
            <FilterSidebar categories={categories} navCategories={navCategories} />
          </Suspense>
          <main className="flex-1">
            <ProductGrid products={products} wishlistedIds={wishlistedIds} />
          </main>
        </div>
      </div>
    </div>
  );
}
