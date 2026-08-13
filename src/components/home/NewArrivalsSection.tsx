'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import { ArrowRight } from 'lucide-react';

interface NewArrivalsSectionProps {
  section: {
    id: string;
    title: string;
    subtitle?: string | null;
    viewAllUrl?: string | null;
    tabs: string[];
    items: any[];
  };
  wishlistedIds?: string[];
}

export default function NewArrivalsSection({ section, wishlistedIds = [] }: NewArrivalsSectionProps) {
  const tabs = ['All', ...(section.tabs || ['Women', 'Men', 'Kids'])];
  const [activeTab, setActiveTab] = useState('All');

  // Filter items by active category tab
  const filteredItems = section.items.filter((item) => {
    if (activeTab === 'All') return true;
    return item.categoryTab?.toLowerCase() === activeTab.toLowerCase();
  });

  // Extract products from items
  const displayProducts = filteredItems
    .map((item) => item.product)
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-neutral-100 last:border-b-0">
      <div className="text-center space-y-3 mb-10">
        <span className="text-[10px] uppercase tracking-[0.35em] text-neutral-500 font-medium block">
          CURATED COLLECTION
        </span>
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

      {/* Subcategory Navigation Tabs (Women, Men, Kids) */}
      {tabs.length > 1 && (
        <div className="flex justify-center items-center space-x-6 sm:space-x-10 mb-10 border-b border-neutral-100 pb-4 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs sm:text-sm uppercase tracking-[0.2em] font-medium transition-all relative pb-2 whitespace-nowrap ${
                  isActive ? 'text-black' : 'text-neutral-400 hover:text-neutral-800'
                }`}
              >
                {tab}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black transition-all" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Product Grid */}
      {displayProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {displayProducts.slice(0, 8).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlistedInitial={wishlistedIds.includes(product.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-neutral-400 text-xs italic">
          No items currently featured under {activeTab}.
        </div>
      )}

      {/* View All Button */}
      <div className="text-center pt-12">
        <Link
          href={section.viewAllUrl || '/products'}
          className="inline-flex items-center space-x-2 border border-neutral-300 text-neutral-800 text-xs sm:text-sm font-medium uppercase tracking-widest px-8 py-3.5 hover:border-black hover:bg-neutral-50 transition-all rounded-sm"
        >
          <span>View All {section.title}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
