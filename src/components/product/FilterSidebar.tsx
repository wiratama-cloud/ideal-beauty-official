'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp, X } from 'lucide-react';

interface NavCategoryItem {
  id?: string;
  name: string;
  href: string;
}

interface FilterSidebarProps {
  categories?: (string | NavCategoryItem)[];
  navCategories?: NavCategoryItem[];
}

export default function FilterSidebar({ categories, navCategories }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const currentCategory = searchParams.get('category') || 'All';
  const currentType = searchParams.get('type') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentQuery = searchParams.get('query') || '';

  let collectionList: NavCategoryItem[] = [];
  if (navCategories && navCategories.length > 0) {
    collectionList = navCategories;
  } else if (categories && categories.length > 0) {
    collectionList = categories.map((cat) => {
      if (typeof cat === 'string') {
        if (cat === 'All') return { name: 'All Collections', href: '/products' };
        return { name: cat, href: `/products?category=${encodeURIComponent(cat)}` };
      }
      return cat;
    });
  } else {
    collectionList = [
      { name: 'All Collections', href: '/products' },
      { name: 'Haute Couture', href: '/products?category=Haute+Couture' },
      { name: 'Bridal Wear', href: '/products?category=Bridal+Wear' },
      { name: 'Ready To Wear', href: '/products?category=Ready+To+Wear' },
      { name: 'Menswear', href: '/products?category=Menswear' },
      { name: 'Rentals', href: '/products?type=RENTAL' },
    ];
  }

  const isNavCategoryActive = (href: string) => {
    try {
      const urlObj = new URL(href, 'http://localhost');
      const targetCategory = urlObj.searchParams.get('category');
      const targetType = urlObj.searchParams.get('type');

      if (targetCategory) {
        return currentCategory.toLowerCase() === targetCategory.toLowerCase();
      }
      if (targetType) {
        return currentType.toLowerCase() === targetType.toLowerCase();
      }
      return (currentCategory === 'All' || !currentCategory) && !currentType;
    } catch {
      return false;
    }
  };

  const handleNavCategoryClick = (href: string) => {
    try {
      const urlObj = new URL(href, 'http://localhost');
      const targetCategory = urlObj.searchParams.get('category');
      const targetType = urlObj.searchParams.get('type');

      const params = new URLSearchParams(searchParams.toString());

      if (targetCategory) {
        params.set('category', targetCategory);
        params.delete('type');
      } else if (targetType) {
        params.set('type', targetType);
        params.delete('category');
      } else {
        params.delete('category');
        params.delete('type');
      }

      router.push(`/products?${params.toString()}`);
    } catch {
      router.push(href);
    }
  };

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'All' && value !== '') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push('/products');
  };

  const priceRanges = [
    { label: 'All Prices', min: '', max: '' },
    { label: 'Under IDR 4.000.000', min: '0', max: '4000000' },
    { label: 'IDR 4.000.000 - 8.000.000', min: '4000000', max: '8000000' },
    { label: 'Above IDR 8.000.000', min: '8000000', max: '' },
  ];

  const hasActiveFilters =
    currentCategory !== 'All' || currentType !== '' || currentMinPrice !== '' || currentMaxPrice !== '' || currentQuery !== '';

  return (
    <div className="w-full lg:w-64 flex-shrink-0">
      {/* Mobile Filter Toggle Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="w-full bg-white border border-neutral-200 py-3 px-4 flex items-center justify-between text-xs font-medium uppercase tracking-widest text-neutral-900 shadow-sm"
        >
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-neutral-700" />
            <span>Filter & Sort {hasActiveFilters && '(Active)'}</span>
          </div>
          {isMobileOpen ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
        </button>
      </div>

      {/* Filter Sidebar Container */}
      <aside
        className={`bg-white border border-neutral-100 p-6 font-light text-xs space-y-8 ${
          isMobileOpen ? 'block' : 'hidden lg:block'
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center space-x-2 text-neutral-900 uppercase tracking-widest font-medium">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Refine Search</span>
          </div>

          <div className="flex items-center space-x-3">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-[10px] text-neutral-400 hover:text-black uppercase tracking-widest flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden text-neutral-400 hover:text-black"
              aria-label="Close filters"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

      {/* Active Search Query */}
      {currentQuery && (
        <div className="bg-neutral-50 p-3 text-neutral-600 flex justify-between items-center">
          <span>Search: &quot;{currentQuery}&quot;</span>
          <button onClick={() => updateFilter('query', null)} className="text-neutral-400 hover:text-black font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Item Type: Purchase vs Rental */}
      <div className="space-y-3">
        <h4 className="uppercase tracking-widest font-medium text-neutral-900 border-b border-neutral-50 pb-2">
          Option
        </h4>
        <div className="space-y-2">
          {[
            { label: 'All Options', value: '' },
            { label: 'Purchase Only (Sale)', value: 'SALE' },
            { label: 'Bespoke Rental Only', value: 'RENTAL' },
          ].map((typeOption) => (
            <label key={typeOption.value} className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="radio"
                name="itemType"
                checked={currentType === typeOption.value}
                onChange={() => updateFilter('type', typeOption.value)}
                className="accent-black"
              />
              <span className={`transition-colors ${currentType === typeOption.value ? 'text-black font-medium' : 'text-neutral-600 group-hover:text-black'}`}>
                {typeOption.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Dynamic Collections */}
      <div className="space-y-3">
        <h4 className="uppercase tracking-widest font-medium text-neutral-900 border-b border-neutral-50 pb-2">
          Collection
        </h4>
        <div className="space-y-2">
          {collectionList.map((item) => {
            const active = isNavCategoryActive(item.href);
            return (
              <button
                key={item.id || item.name}
                onClick={() => handleNavCategoryClick(item.href)}
                className={`block w-full text-left py-1 transition-colors ${
                  active ? 'text-black font-medium border-l-2 border-black pl-2' : 'text-neutral-600 hover:text-black'
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Ranges */}
      <div className="space-y-3">
        <h4 className="uppercase tracking-widest font-medium text-neutral-900 border-b border-neutral-50 pb-2">
          Price Range
        </h4>
        <div className="space-y-2">
          {priceRanges.map((pRange, idx) => {
            const isSelected = currentMinPrice === pRange.min && currentMaxPrice === pRange.max;
            return (
              <button
                key={idx}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (pRange.min) params.set('minPrice', pRange.min);
                  else params.delete('minPrice');
                  if (pRange.max) params.set('maxPrice', pRange.max);
                  else params.delete('maxPrice');
                  router.push(`/products?${params.toString()}`);
                }}
                className={`block w-full text-left py-1 transition-colors ${
                  isSelected ? 'text-black font-medium border-l-2 border-black pl-2' : 'text-neutral-600 hover:text-black'
                }`}
              >
                {pRange.label}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
    </div>
  );
}
