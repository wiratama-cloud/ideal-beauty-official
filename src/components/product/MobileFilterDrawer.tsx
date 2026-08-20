'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  DollarSign,
  Sparkles,
  ArrowUpDown,
  Layers,
} from 'lucide-react';
import type { NavCategoryItem } from '@/lib/types/nav-category';

export interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categoriesTree?: NavCategoryItem[];
  totalResults: number;
}

export default function MobileFilterDrawer({
  isOpen,
  onClose,
  categoriesTree = [],
  totalResults,
}: MobileFilterDrawerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search Param values
  const currentCategory = searchParams.get('category') || '';
  const currentType = searchParams.get('type') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentQuery = searchParams.get('query') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentInStock = searchParams.get('inStock') === 'true' || searchParams.get('inStockOnly') === 'true';

  // Local draft state for drawer
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);
  const [selectedType, setSelectedType] = useState(currentType);
  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);
  const [query, setQuery] = useState(currentQuery);
  const [sort, setSort] = useState(currentSort);
  const [inStockOnly, setInStockOnly] = useState(currentInStock);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Sync state with search params whenever drawer opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(currentCategory);
      setSelectedType(currentType);
      setMinPrice(currentMinPrice);
      setMaxPrice(currentMaxPrice);
      setQuery(currentQuery);
      setSort(currentSort);
      setInStockOnly(currentInStock);
    }
  }, [isOpen, currentCategory, currentType, currentMinPrice, currentMaxPrice, currentQuery, currentSort, currentInStock]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleCategoryExpand = (id: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleApply = () => {
    const params = new URLSearchParams();

    if (selectedCategory && selectedCategory !== 'All') {
      params.set('category', selectedCategory);
    }
    if (selectedType) {
      params.set('type', selectedType);
    }
    if (minPrice.trim()) {
      params.set('minPrice', minPrice.trim());
    }
    if (maxPrice.trim()) {
      params.set('maxPrice', maxPrice.trim());
    }
    if (query.trim()) {
      params.set('query', query.trim());
    }
    if (sort && sort !== 'newest') {
      params.set('sort', sort);
    }
    if (inStockOnly) {
      params.set('inStock', 'true');
    }

    const queryStr = params.toString();
    router.push(queryStr ? `/products?${queryStr}` : '/products');
    onClose();
  };

  const handleReset = () => {
    setSelectedCategory('');
    setSelectedType('');
    setMinPrice('');
    setMaxPrice('');
    setQuery('');
    setSort('newest');
    setInStockOnly(false);
    router.push('/products');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Filter Catalogue">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-neutral-300" />
              <h2 className="font-serif text-lg tracking-wide uppercase font-light">Refine Catalogue</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              aria-label="Close filter drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Search Query */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-mono text-neutral-500 block">
                Search Catalogue
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search pieces, fabrics, styles..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg py-2 pl-3 pr-9 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2.5 p-1 text-neutral-400 hover:text-black"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-mono text-neutral-500 flex items-center space-x-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                <span>Sort By</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'newest', label: 'Newest Arrivals' },
                  { id: 'price-asc', label: 'Price: Low to High' },
                  { id: 'price-desc', label: 'Price: High to Low' },
                  { id: 'popular', label: 'Most Popular' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSort(item.id)}
                    className={`py-2 px-3 text-left rounded-lg text-xs font-medium border transition-all ${
                      sort === item.id
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* In-Stock Toggle */}
            <div className="pt-2 border-t border-neutral-100">
              <label className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-100/70 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-neutral-900 block">In-Stock Only</span>
                  <span className="text-[10px] text-neutral-500 block font-light">
                    Hide sold out and pre-order waitlist items
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 text-neutral-900 rounded border-neutral-300 focus:ring-neutral-900 cursor-pointer"
                />
              </label>
            </div>

            {/* Acquisition Mode */}
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <label className="text-[11px] uppercase tracking-widest font-mono text-neutral-500 block">
                Acquisition Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '', label: 'All Modes' },
                  { id: 'SALE', label: 'Purchase' },
                  { id: 'RENTAL', label: 'Bespoke Rental' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSelectedType(mode.id)}
                    className={`py-2 px-2 text-center rounded-lg text-xs font-medium border transition-all ${
                      selectedType === mode.id
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <label className="text-[11px] uppercase tracking-widest font-mono text-neutral-500 block">
                Price Range ($)
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">$</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg py-2 pl-6 pr-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
                    min="0"
                  />
                </div>
                <span className="text-neutral-400 text-xs font-light">to</span>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">$</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg py-2 pl-6 pr-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            {categoriesTree && categoriesTree.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase tracking-widest font-mono text-neutral-500 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Category Collections</span>
                  </label>
                  {selectedCategory && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('')}
                      className="text-[10px] uppercase font-mono text-neutral-500 hover:text-black"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('')}
                    className={`w-full flex items-center justify-between py-2 px-3 rounded-lg text-xs transition-all ${
                      !selectedCategory
                        ? 'bg-neutral-900 text-white font-medium'
                        : 'text-neutral-700 hover:bg-neutral-100 font-light'
                    }`}
                  >
                    <span>All Collections</span>
                    {!selectedCategory && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>

                  {categoriesTree.map((cat) => {
                    const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                    const hasChildren = Boolean(cat.children && cat.children.length > 0);
                    const isExpanded = expandedCategories[cat.id];

                    return (
                      <div key={cat.id} className="space-y-1">
                        <div
                          className={`flex items-center justify-between py-1.5 px-3 rounded-lg text-xs transition-all ${
                            isSelected
                              ? 'bg-neutral-900 text-white font-medium'
                              : 'text-neutral-700 hover:bg-neutral-100'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedCategory(cat.name)}
                            className="flex-1 text-left flex items-center space-x-2"
                          >
                            <span>{cat.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                          {hasChildren && (
                            <button
                              type="button"
                              onClick={() => toggleCategoryExpand(cat.id)}
                              className="p-1 hover:text-black text-neutral-400"
                              aria-label="Toggle subcategories"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>

                        {hasChildren && isExpanded && (
                          <div className="pl-4 space-y-1 border-l border-neutral-200 ml-3 my-1">
                            {cat.children?.map((sub) => {
                              const isSubSelected = selectedCategory.toLowerCase() === sub.name.toLowerCase();
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => setSelectedCategory(sub.name)}
                                  className={`w-full flex items-center justify-between py-1 px-2.5 rounded-md text-xs transition-all ${
                                    isSubSelected
                                      ? 'bg-neutral-900 text-white font-medium'
                                      : 'text-neutral-600 hover:bg-neutral-100 font-light'
                                  }`}
                                >
                                  <span>{sub.name}</span>
                                  {isSubSelected && <Check className="w-3 h-3 text-white" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50 flex items-center space-x-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 py-2.5 px-3 border border-neutral-300 text-neutral-700 hover:text-black hover:border-black rounded-lg text-xs font-mono uppercase tracking-wider transition-colors flex items-center justify-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 py-2.5 px-3 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-medium uppercase tracking-widest transition-colors shadow-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
