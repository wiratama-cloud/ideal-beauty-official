import React from 'react';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import { ArrowRight, Sparkles } from 'lucide-react';

interface EditorsPicksSectionProps {
  section: {
    id: string;
    title: string;
    subtitle?: string | null;
    viewAllUrl?: string | null;
    items: any[];
  };
  wishlistedIds?: string[];
}

export default function EditorsPicksSection({
  section,
  wishlistedIds = [],
}: EditorsPicksSectionProps) {
  // Extract products from items
  const products = section.items
    .map((item) => item.product)
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-b border-neutral-100 last:border-b-0">
      <div className="text-center space-y-3 mb-12">
        <div className="inline-flex items-center space-x-1.5 text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-medium">
            CREATIVE DIRECTOR HIGHLIGHTS
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 font-serif">
          {section.title}
        </h2>
        {section.subtitle && (
          <p className="text-xs sm:text-sm text-neutral-500 font-light max-w-xl mx-auto">
            {section.subtitle}
          </p>
        )}
        <div className="w-12 h-px bg-neutral-300 mx-auto mt-4" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {products.slice(0, 8).map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < 4}
            isWishlistedInitial={wishlistedIds.includes(product.id)}
          />
        ))}
      </div>

      <div className="text-center pt-12">
        <Link
          href={section.viewAllUrl || '/products?type=SALE'}
          className="inline-flex items-center space-x-2 border border-neutral-300 text-neutral-800 text-xs sm:text-sm font-medium uppercase tracking-widest px-8 py-3.5 hover:border-black hover:bg-neutral-50 transition-all rounded-sm"
        >
          <span>Explore Editor&apos;s Choices</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
