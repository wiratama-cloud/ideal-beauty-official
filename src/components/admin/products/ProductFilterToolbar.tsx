'use client';

import React from 'react';
import { Search, Plus, Check, EyeOff, Trash2, X } from 'lucide-react';
import { StockFilterType, ModeFilterType, StatusFilterType } from './types';

interface ProductFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  modeFilter: ModeFilterType;
  onModeChange: (mode: ModeFilterType) => void;
  statusFilter: StatusFilterType;
  onStatusChange: (status: StatusFilterType) => void;
  stockFilter: StockFilterType;
  onStockChange: (stock: StockFilterType) => void;

  selectedCount: number;
  totalCount: number;
  onSelectAllToggle: () => void;
  isAllSelected: boolean;
  onBulkActivate: () => void;
  onBulkDeactivate: () => void;
  onBulkDelete: () => void;
  isBulkPending: boolean;

  onOpenAddDrawer: () => void;
}

export default function ProductFilterToolbar({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories,
  modeFilter,
  onModeChange,
  statusFilter,
  onStatusChange,
  stockFilter,
  onStockChange,
  selectedCount,
  totalCount,
  onSelectAllToggle,
  isAllSelected,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete,
  isBulkPending,
  onOpenAddDrawer,
}: ProductFilterToolbarProps) {
  return (
    <div className="space-y-3 mb-6">
      {/* Top bar: Search, Add Product Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by product name, SKU, slug, or category..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white border border-neutral-200 rounded-xs pl-10 pr-9 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 shadow-2xs transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={onOpenAddDrawer}
          className="inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs px-4 py-2 rounded-xs shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter Toolbar Selectors */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-neutral-200 rounded-xs text-xs shadow-2xs">
        {/* Category Select */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-xs px-2.5 py-1.5 text-xs focus:outline-none focus:border-neutral-400 cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Mode Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">Mode:</span>
          <select
            value={modeFilter}
            onChange={(e) => onModeChange(e.target.value as ModeFilterType)}
            className="bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-xs px-2.5 py-1.5 text-xs focus:outline-none focus:border-neutral-400 cursor-pointer"
          >
            <option value="All">All Modes</option>
            <option value="BUY_ONLY">Buy Only</option>
            <option value="RENT_ONLY">Rent Only</option>
            <option value="BOTH">Buy & Rent</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as StatusFilterType)}
            className="bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-xs px-2.5 py-1.5 text-xs focus:outline-none focus:border-neutral-400 cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* Stock Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">Stock:</span>
          <select
            value={stockFilter}
            onChange={(e) => onStockChange(e.target.value as StockFilterType)}
            className="bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-xs px-2.5 py-1.5 text-xs focus:outline-none focus:border-neutral-400 cursor-pointer"
          >
            <option value="ALL">All Levels</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock (&lt; 3)</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Floating / Sticky Bulk Actions Toolbar */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-xs shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={onSelectAllToggle}
              className="w-4 h-4 rounded-xs border-neutral-700 text-neutral-900 focus:ring-0 focus:ring-offset-0 bg-neutral-800 cursor-pointer"
            />
            <span className="text-xs font-semibold text-white">
              {selectedCount} of {totalCount} items selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBulkActivate}
              disabled={isBulkPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 border border-emerald-700 text-emerald-300 hover:bg-emerald-900 rounded-xs text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Bulk Activate</span>
            </button>

            <button
              onClick={onBulkDeactivate}
              disabled={isBulkPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/80 border border-amber-700 text-amber-300 hover:bg-amber-900 rounded-xs text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Bulk Deactivate</span>
            </button>

            <button
              onClick={onBulkDelete}
              disabled={isBulkPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/80 border border-rose-700 text-rose-300 hover:bg-rose-900 rounded-xs text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
