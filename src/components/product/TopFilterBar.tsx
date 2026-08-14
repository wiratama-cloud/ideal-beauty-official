'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, RotateCcw, X, SlidersHorizontal, DollarSign, Filter } from 'lucide-react';

export interface TopFilterBarProps {
  totalResults: number;
}

export default function TopFilterBar({ totalResults }: TopFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('category') || '';
  const currentType = searchParams.get('type') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentQuery = searchParams.get('query') || '';

  // Local state for text fields
  const [queryInput, setQueryInput] = useState(currentQuery);
  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice);

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
    router.push(`/products?${params.toString()}`);
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
    router.push(`/products?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setQueryInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    router.push('/products');
  };

  const hasActiveFilters = Boolean(
    currentCategory || currentType || currentMinPrice || currentMaxPrice || currentQuery
  );

  return (
    <div className="bg-white border border-neutral-200/80 rounded-lg p-4 shadow-sm space-y-4">
      {/* Top row: Result count & Reset button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-4 h-4 text-neutral-600" />
          <span className="text-xs uppercase tracking-widest font-mono text-neutral-600">
            {totalResults} {totalResults === 1 ? 'Piece' : 'Pieces'} Found
          </span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center space-x-1.5 text-xs text-neutral-500 hover:text-black transition-colors font-mono uppercase tracking-wider"
            title="Reset all search filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Main Filter Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              className="w-full bg-neutral-50 border border-neutral-200 rounded-md py-1.5 pl-3 pr-8 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-800 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-2 text-neutral-400 hover:text-neutral-900"
              aria-label="Submit search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* 2. Item Option Filter (All / Purchase Only / Bespoke Rental) */}
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-mono text-neutral-500 mb-1">
            Acquisition Mode
          </label>
          <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-md p-0.5 text-xs">
            <button
              type="button"
              onClick={() => updateSearchParam('type', null)}
              className={`flex-1 py-1 text-center rounded transition-all font-medium text-[11px] ${
                !currentType
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => updateSearchParam('type', 'SALE')}
              className={`flex-1 py-1 text-center rounded transition-all font-medium text-[11px] ${
                currentType === 'SALE'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Purchase Only
            </button>
            <button
              type="button"
              onClick={() => updateSearchParam('type', 'RENTAL')}
              className={`flex-1 py-1 text-center rounded transition-all font-medium text-[11px] ${
                currentType === 'RENTAL'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Bespoke Rental
            </button>
          </div>
        </div>

        {/* 3. Price Range Selector */}
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-mono text-neutral-500 mb-1">
            Price Range ($)
          </label>
          <form onSubmit={handlePriceApply} className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-md py-1.5 px-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-800"
              min="0"
            />
            <span className="text-neutral-400 text-xs">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-md py-1.5 px-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-800"
              min="0"
            />
            <button
              type="submit"
              className="bg-neutral-900 text-white px-3 py-1.5 rounded-md text-xs hover:bg-black transition-colors font-medium uppercase tracking-wider"
            >
              Apply
            </button>
          </form>
        </div>
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 text-xs">
          <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400">
            Active Filters:
          </span>

          {currentCategory && (
            <span className="inline-flex items-center bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-full text-xs font-medium border border-neutral-200">
              Category: <strong className="ml-1 font-semibold">{currentCategory}</strong>
              <button
                onClick={() => updateSearchParam('category', null)}
                className="ml-1.5 text-neutral-400 hover:text-black"
                aria-label="Remove category filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {currentType && (
            <span className="inline-flex items-center bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-full text-xs font-medium border border-neutral-200">
              Mode: <strong className="ml-1 font-semibold">{currentType === 'SALE' ? 'Purchase Only' : 'Bespoke Rental'}</strong>
              <button
                onClick={() => updateSearchParam('type', null)}
                className="ml-1.5 text-neutral-400 hover:text-black"
                aria-label="Remove acquisition mode filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(currentMinPrice || currentMaxPrice) && (
            <span className="inline-flex items-center bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-full text-xs font-medium border border-neutral-200">
              Price:{' '}
              <strong className="ml-1 font-semibold">
                {currentMinPrice ? `$${currentMinPrice}` : '$0'} - {currentMaxPrice ? `$${currentMaxPrice}` : 'Any'}
              </strong>
              <button
                onClick={() => {
                  setMinPriceInput('');
                  setMaxPriceInput('');
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete('minPrice');
                  params.delete('maxPrice');
                  router.push(`/products?${params.toString()}`);
                }}
                className="ml-1.5 text-neutral-400 hover:text-black"
                aria-label="Remove price range filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {currentQuery && (
            <span className="inline-flex items-center bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-full text-xs font-medium border border-neutral-200">
              Query: <strong className="ml-1 font-semibold">&quot;{currentQuery}&quot;</strong>
              <button
                onClick={() => {
                  setQueryInput('');
                  updateSearchParam('query', null);
                }}
                className="ml-1.5 text-neutral-400 hover:text-black"
                aria-label="Remove search query filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
