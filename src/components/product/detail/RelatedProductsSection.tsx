'use client';

import React from 'react';
import ProductCard from '../ProductCard';
import { Sparkles } from 'lucide-react';

export interface RelatedProductItem {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  images: string[];
  variants: Array<{
    id: string;
    priceSale: any;
    priceRent: any;
    compareAtPrice?: any;
    stockAvailable: number;
  }>;
}

export interface RelatedProductsSectionProps {
  products: RelatedProductItem[];
  wishlistedIds?: string[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function RelatedProductsSection({
  products,
  wishlistedIds = [],
  title = 'Complete The Look',
  subtitle = 'Curated complementary creations hand-selected by our atelier stylists.',
  className = '',
}: RelatedProductsSectionProps) {
  if (!products || products.length === 0) {
    return null;
  }

  const wishlistedSet = new Set(wishlistedIds);

  return (
    <section className={`pt-12 sm:pt-16 border-t border-neutral-100 mt-12 sm:mt-16 ${className}`} data-testid="related-products-section">
      {/* Section Header */}
      <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12 space-y-2">
        <div className="flex items-center justify-center space-x-1.5 text-xs uppercase tracking-[0.25em] text-neutral-400 font-sans">
          <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
          <span>Curated Selection</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-light text-neutral-900 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((item, index) => (
          <ProductCard
            key={item.id}
            product={item}
            priority={index < 2}
            isWishlistedInitial={wishlistedSet.has(item.id)}
          />
        ))}
      </div>
    </section>
  );
}
