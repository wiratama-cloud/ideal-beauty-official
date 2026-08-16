import React, { Suspense } from 'react';
import { getProducts } from '@/lib/services/product';
import { getNavCategoryTree } from '@/lib/services/nav-category';
import { getWishlistedProductIds } from '@/lib/services/wishlist';
import { getSessionUserId } from '@/lib/session';
import CategoryTreeSidebar from '@/components/product/CategoryTreeSidebar';
import TopFilterBar from '@/components/product/TopFilterBar';
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

  const [products, categoriesTree, userId] = await Promise.all([
    getProducts({
      category: resolvedParams.category,
      minPrice,
      maxPrice,
      type: resolvedParams.type,
      query: resolvedParams.query,
    }),
    getNavCategoryTree(),
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

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 pt-6 sm:pt-10 pb-12">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 items-stretch min-h-[calc(100vh-16rem)]">
          {/* Category Navigation: Mobile Pills Bar & Desktop Sticky Sidebar */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 lg:sticky lg:top-24 z-30 h-auto lg:h-self-stretch">
            <Suspense fallback={<div className="w-full bg-white p-3 lg:p-6 h-12 lg:h-full lg:min-h-[400px] animate-pulse rounded-xl border border-neutral-200" />}>
              <CategoryTreeSidebar categoriesTree={categoriesTree} />
            </Suspense>
          </div>

          {/* TopFilterBar + ProductGrid on right */}
          <main className="flex-1 space-y-6 min-w-0">
            <Suspense fallback={<div className="h-24 bg-white animate-pulse rounded-lg border border-neutral-200" />}>
              <TopFilterBar totalResults={products.length} />
            </Suspense>
            <ProductGrid products={products} wishlistedIds={wishlistedIds} />
          </main>
        </div>
      </div>
    </div>
  );
}
