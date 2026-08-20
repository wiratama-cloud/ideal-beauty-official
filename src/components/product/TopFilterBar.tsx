'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  RotateCcw,
  X,
  SlidersHorizontal,
  DollarSign,
  Filter,
  ArrowUpDown,
  Check,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import MobileFilterDrawer from './MobileFilterDrawer';
import type { NavCategoryItem } from '@/lib/types/nav-category';

export interface TopFilterBarProps {
  totalResults: number;
  categoriesTree?: NavCategoryItem[];
}

export default function TopFilterBar({ totalResults, categoriesTree = [] }: TopFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('category') || '';
  const currentType = searchParams.get('type') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentQuery = searchParams.get('query') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentInStock = searchParams.get('inStock') === 'true' || searchParams.get('inStockOnly') === 'true';

  // Local state for text fields
  const [queryInput, setQueryInput] = useState(currentQuery);
  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    setQueryInput(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    setMinPriceInput(currentMinPrice);
  }, [currentMinPrice]);

  useEffect(() => {
    setMaxPriceInput(currentMaxPrice);
  }, [currentMaxPrice]);

  const updateSearchParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value !== null && value.trim() !== '' && value !== 'All') {
      params.set(key, value.trim());
    } else {
      params.delete(key);
    }
    // Clean inStockOnly legacy param if setting inStock
    if (key === 'inStock') {
      params.delete('inStockOnly');
    }
    const queryStr = params.toString();
    router.push(queryStr ? `/products?${queryStr}` : '/products');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParam('query', queryInput);
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (minPriceInput.trim() !== '') {
      params.set('minPrice', minPriceInput.trim());
    } else {
      params.delete('minPrice');
    }
    if (maxPriceInput.trim() !== '') {
      params.set('maxPrice', maxPriceInput.trim());
    } else {
      params.delete('maxPrice');
    }
    const queryStr = params.toString();
    router.push(queryStr ? `/products?${queryStr}` : '/products');
  };

  const toggleInStock = () => {
    updateSearchParam('inStock', currentInStock ? null : 'true');
  };

  const clearAllFilters = () => {
    setQueryInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    router.push('/products');
  };

  const hasActiveFilters = Boolean(
    currentCategory ||
      currentType ||
      currentMinPrice ||
      currentMaxPrice ||
      currentQuery ||
      currentInStock ||
      (currentSort && currentSort !== 'newest')
  );

  const activeFilterCount = [
    Boolean(currentCategory),
    Boolean(currentType),
    Boolean(currentMinPrice || currentMaxPrice),
    Boolean(currentQuery),
    Boolean(currentInStock),
    Boolean(currentSort && currentSort !== 'newest'),
  ].filter(Boolean).length;

  const sortLabelMap: Record<string, string> = {
    newest: 'Newest Arrivals',
    'price-asc': 'Price: Low to High',
    'price-desc': 'Price: High to Low',
    popular: 'Most Popular',
  };

  return (
    <>
      <div className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-xs space-y-4">
        {/* Top row: Result count, Mobile Filter Button, Sort dropdown & Reset button */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-neutral-600" />
            <span className="text-xs uppercase tracking-widest font-mono text-neutral-700 font-medium">
              {totalResults} {totalResults === 1 ? 'Piece' : 'Pieces'} Found
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Mobile Filter Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden inline-flex items-center space-x-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 bg-neutral-900 text-white rounded-full text-[10px] flex items-center justify-center font-mono ml-0.5">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Desktop Sort Dropdown */}
            <div className="hidden sm:flex items-center space-x-1.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">Sort:</span>
              <select
                value={currentSort}
                onChange={(e) => updateSearchParam('sort', e.target.value === 'newest' ? null : e.target.value)}
                className="bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs rounded-lg py-1.5 px-2.5 pr-7 focus:outline-none focus:border-neutral-900 transition-all font-medium cursor-pointer"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex items-center space-x-1.5 text-xs text-neutral-500 hover:text-black transition-colors font-mono uppercase tracking-wider pl-2"
                title="Reset all search filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Filters</span>
                <span className="sm:hidden">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Desktop Filter Controls Grid */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-4">
          {/* 1. Search Query Input */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-mono text-neutral-500 mb-1">
              Search Catalogue
            </label>
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search pieces, fabrics..."
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg py-1.5 pl-3 pr-14 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all"
              />
              <div className="absolute right-2 flex items-center space-x-1 text-neutral-400">
                {queryInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setQueryInput('');
                      updateSearchParam('query', null);
                    }}
                    className="p-1 hover:text-black transition-colors cursor-pointer"
                    title="Clear search query"
                    aria-label="Clear search query"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="p-1 hover:text-neutral-900 transition-colors cursor-pointer"
                  aria-label="Submit search"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* 2. Item Option Filter (All / Purchase Only / Bespoke Rental) */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-mono text-neutral-500 mb-1">
              Acquisition Mode
            </label>
            <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => updateSearchParam('type', null)}
                className={`flex-1 py-1.5 text-center rounded-md transition-all font-medium text-[11px] ${
                  !currentType ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-black'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => updateSearchParam('type', 'SALE')}
                className={`flex-1 py-1.5 text-center rounded-md transition-all font-medium text-[11px] ${
                  currentType === 'SALE' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-black'
                }`}
              >
                Purchase
              </button>
              <button
                type="button"
                onClick={() => updateSearchParam('type', 'RENTAL')}
                className={`flex-1 py-1.5 text-center rounded-md transition-all font-medium text-[11px] ${
                  currentType === 'RENTAL' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-black'
                }`}
              >
                Rental
              </button>
            </div>
          </div>

          {/* 3. Price Range Selector */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-mono text-neutral-500 mb-1">
              Price Range ($)
            </label>
            <form onSubmit={handlePriceApply} className="flex items-center space-x-1.5">
              <input
                type="number"
                placeholder="Min"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg py-1.5 px-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-800"
                min="0"
              />
              <span className="text-neutral-400 text-xs">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg py-1.5 px-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-800"
                min="0"
              />
              <button
                type="submit"
                className="bg-neutral-900 text-white px-2.5 py-1.5 rounded-lg text-xs hover:bg-black transition-colors font-medium uppercase tracking-wider"
              >
                Apply
              </button>
            </form>
          </div>

          {/* 4. In Stock Only Toggle */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-mono text-neutral-500 mb-1">
              Availability
            </label>
            <button
              type="button"
              onClick={toggleInStock}
              className={`w-full flex items-center justify-between py-1.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                currentInStock
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                  : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400'
              }`}
            >
              <span>In-Stock Only</span>
              {currentInStock ? (
                <CheckSquare className="w-4 h-4 text-white" />
              ) : (
                <Square className="w-4 h-4 text-neutral-400" />
              )}
            </button>
          </div>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-neutral-100 text-xs">
            <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 font-medium">
              Active Filters:
            </span>

            {currentCategory && (
              <span className="inline-flex items-center bg-neutral-900 text-white pl-3 pr-1.5 py-1 rounded-full text-xs font-medium shadow-xs border border-neutral-800 transition-all">
                <span className="text-neutral-400 text-[10px] uppercase tracking-wider font-mono mr-1">Category:</span>
                <strong className="font-semibold text-white tracking-wide">{currentCategory}</strong>
                <button
                  type="button"
                  onClick={() => updateSearchParam('category', null)}
                  className="ml-1.5 p-1 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-full cursor-pointer transition-colors focus:outline-none flex items-center justify-center"
                  aria-label="Remove category filter"
                  title="Remove category filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {currentType && (
              <span className="inline-flex items-center bg-neutral-100 text-neutral-800 pl-3 pr-1.5 py-1 rounded-full text-xs font-medium border border-neutral-200 transition-all">
                <span className="text-neutral-500 text-[10px] uppercase tracking-wider font-mono mr-1">Mode:</span>
                <strong className="font-semibold text-neutral-900">
                  {currentType === 'SALE' ? 'Purchase Only' : 'Bespoke Rental'}
                </strong>
                <button
                  type="button"
                  onClick={() => updateSearchParam('type', null)}
                  className="ml-1.5 p-1 text-neutral-400 hover:text-black hover:bg-neutral-200 rounded-full cursor-pointer transition-colors focus:outline-none flex items-center justify-center"
                  aria-label="Remove acquisition mode filter"
                  title="Remove acquisition mode filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {(currentMinPrice || currentMaxPrice) && (
              <span className="inline-flex items-center bg-neutral-100 text-neutral-800 pl-3 pr-1.5 py-1 rounded-full text-xs font-medium border border-neutral-200 transition-all">
                <span className="text-neutral-500 text-[10px] uppercase tracking-wider font-mono mr-1">Price:</span>
                <strong className="font-semibold text-neutral-900">
                  {currentMinPrice ? `$${currentMinPrice}` : '$0'} - {currentMaxPrice ? `$${currentMaxPrice}` : 'Any'}
                </strong>
                <button
                  type="button"
                  onClick={() => {
                    setMinPriceInput('');
                    setMaxPriceInput('');
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('minPrice');
                    params.delete('maxPrice');
                    const queryStr = params.toString();
                    router.push(queryStr ? `/products?${queryStr}` : '/products');
                  }}
                  className="ml-1.5 p-1 text-neutral-400 hover:text-black hover:bg-neutral-200 rounded-full cursor-pointer transition-colors focus:outline-none flex items-center justify-center"
                  aria-label="Remove price range filter"
                  title="Remove price range filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {currentInStock && (
              <span className="inline-flex items-center bg-neutral-100 text-neutral-800 pl-3 pr-1.5 py-1 rounded-full text-xs font-medium border border-neutral-200 transition-all">
                <span className="text-neutral-500 text-[10px] uppercase tracking-wider font-mono mr-1">Stock:</span>
                <strong className="font-semibold text-neutral-900">In-Stock Only</strong>
                <button
                  type="button"
                  onClick={() => updateSearchParam('inStock', null)}
                  className="ml-1.5 p-1 text-neutral-400 hover:text-black hover:bg-neutral-200 rounded-full cursor-pointer transition-colors focus:outline-none flex items-center justify-center"
                  aria-label="Remove in-stock filter"
                  title="Remove in-stock filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {currentSort && currentSort !== 'newest' && (
              <span className="inline-flex items-center bg-neutral-100 text-neutral-800 pl-3 pr-1.5 py-1 rounded-full text-xs font-medium border border-neutral-200 transition-all">
                <span className="text-neutral-500 text-[10px] uppercase tracking-wider font-mono mr-1">Sort:</span>
                <strong className="font-semibold text-neutral-900">{sortLabelMap[currentSort] || currentSort}</strong>
                <button
                  type="button"
                  onClick={() => updateSearchParam('sort', null)}
                  className="ml-1.5 p-1 text-neutral-400 hover:text-black hover:bg-neutral-200 rounded-full cursor-pointer transition-colors focus:outline-none flex items-center justify-center"
                  aria-label="Remove sort filter"
                  title="Remove sort filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {currentQuery && (
              <span className="inline-flex items-center bg-neutral-100 text-neutral-800 pl-3 pr-1.5 py-1 rounded-full text-xs font-medium border border-neutral-200 transition-all">
                <span className="text-neutral-500 text-[10px] uppercase tracking-wider font-mono mr-1">Query:</span>
                <strong className="font-semibold text-neutral-900">&quot;{currentQuery}&quot;</strong>
                <button
                  type="button"
                  onClick={() => {
                    setQueryInput('');
                    updateSearchParam('query', null);
                  }}
                  className="ml-1.5 p-1 text-neutral-400 hover:text-black hover:bg-neutral-200 rounded-full cursor-pointer transition-colors focus:outline-none flex items-center justify-center"
                  aria-label="Remove search query filter"
                  title="Remove search query filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Mobile Slide-Over Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        categoriesTree={categoriesTree}
        totalResults={totalResults}
      />
    </>
  );
}
