'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SearchX, Sparkles, RefreshCw, LayoutGrid, Grid2X2, Columns2, Grid3X3 } from 'lucide-react';
import ProductCard from './ProductCard';

export type GridDensity = 'editorial' | 'compact';

const GRID_DENSITY_STORAGE_KEY = 'ideal_beauty_grid_density';

interface ProductGridProps {
  products: Array<{
    id: string;
    name: string;
    slug: string;
    category?: string | null;
    images: string[];
    variants: Array<{
      id: string;
      priceSale: any;
      priceRent: any;
      stockAvailable: number;
    }>;
  }>;
  wishlistedIds?: string[];
  showDensitySwitcher?: boolean;
}

export default function ProductGrid({
  products,
  wishlistedIds = [],
  showDensitySwitcher = true,
}: ProductGridProps) {
  const [density, setDensity] = useState<GridDensity>('compact');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(GRID_DENSITY_STORAGE_KEY) as GridDensity | null;
      if (saved === 'editorial' || saved === 'compact') {
        setDensity(saved);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const handleDensityChange = (newDensity: GridDensity) => {
    setDensity(newDensity);
    try {
      localStorage.setItem(GRID_DENSITY_STORAGE_KEY, newDensity);
    } catch {
      // Ignore storage errors
    }
  };

  if (products.length === 0) {
    return (
      <div className="py-16 px-6 text-center space-y-6 bg-white border border-neutral-200/80 rounded-xl shadow-xs max-w-2xl mx-auto my-6">
        <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
          <SearchX className="w-7 h-7 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-2xl text-neutral-900 font-normal">No Masterpieces Found</h3>
          <p className="text-xs text-neutral-500 font-light max-w-md mx-auto leading-relaxed">
            We couldn&apos;t find any luxury pieces matching your search query or active filter combination.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/products"
            className="inline-flex items-center space-x-2 bg-neutral-900 text-white text-xs uppercase font-medium tracking-widest px-5 py-2.5 rounded-lg hover:bg-black transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Search & Filters</span>
          </Link>
        </div>

        <div className="border-t border-neutral-100 pt-6 mt-4">
          <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 block mb-3 flex items-center justify-center space-x-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Explore Popular Collections</span>
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { label: 'Lehengas', href: '/products?category=Lehengas' },
              { label: 'Kaftans', href: '/products?category=Kaftans' },
              { label: 'Anarkalis', href: '/products?category=Anarkalis' },
              { label: 'Sarees', href: '/products?category=Sarees' },
              { label: 'Rentals', href: '/products?type=RENTAL' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-xs bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-700 px-3 py-1.5 rounded-full transition-colors font-light"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isEditorial = isMounted && density === 'editorial';

  return (
    <div className="space-y-4">
      {/* Density Switcher Bar */}
      {showDensitySwitcher && (
        <div className="flex items-center justify-between px-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-light">
            Displaying {products.length} {products.length === 1 ? 'Design' : 'Designs'}
          </div>

          <div className="hidden sm:flex items-center space-x-1 bg-neutral-100/80 p-1 rounded-lg border border-neutral-200/60">
            <button
              type="button"
              onClick={() => handleDensityChange('editorial')}
              className={`p-1.5 rounded-md text-xs transition-all flex items-center space-x-1 ${
                isEditorial
                  ? 'bg-white text-neutral-900 shadow-2xs font-medium'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title="Editorial 2-Column View"
              aria-label="Editorial 2-Column View"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-mono tracking-wider">Editorial</span>
            </button>
            <button
              type="button"
              onClick={() => handleDensityChange('compact')}
              className={`p-1.5 rounded-md text-xs transition-all flex items-center space-x-1 ${
                !isEditorial
                  ? 'bg-white text-neutral-900 shadow-2xs font-medium'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title="Compact Multi-Column Grid"
              aria-label="Compact Multi-Column Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-mono tracking-wider">Compact</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid container */}
      <div
        className={
          isEditorial
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8 transition-all duration-300'
            : 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 transition-all duration-300'
        }
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isWishlistedInitial={wishlistedIds.includes(product.id)}
          />
        ))}
      </div>
    </div>
  );
}
