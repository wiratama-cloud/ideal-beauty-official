'use client';

import React from 'react';
import { Package, Eye, AlertTriangle, Layers, DollarSign } from 'lucide-react';
import { ProductSerialized } from './types';

interface ProductMetricsBarProps {
  products: ProductSerialized[];
}

export default function ProductMetricsBar({ products }: ProductMetricsBarProps) {
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive).length;

  let totalVariants = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let estimatedValuation = 0;

  products.forEach((product) => {
    product.variants.forEach((v) => {
      totalVariants += 1;
      const avail = v.stockAvailable;
      if (avail === 0) {
        outOfStockCount += 1;
      } else if (avail < 3) {
        lowStockCount += 1;
      }

      const unitPrice = v.priceSale ?? v.priceRent ?? 0;
      estimatedValuation += unitPrice * (v.stockTotal || 0);
    });
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
      {/* Card 1: Total Products */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm hover:border-neutral-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Total Products</span>
          <div className="p-2 bg-neutral-800/80 rounded-lg text-neutral-300">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-white tracking-tight">{totalProducts}</span>
          <span className="text-xs text-neutral-500">items</span>
        </div>
      </div>

      {/* Card 2: Active Catalog */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm hover:border-neutral-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Active Catalog</span>
          <div className="p-2 bg-emerald-950/60 border border-emerald-900/50 rounded-lg text-emerald-400">
            <Eye className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-white tracking-tight">{activeProducts}</span>
          <span className="text-xs text-emerald-400 font-medium">
            {totalProducts > 0 ? `${Math.round((activeProducts / totalProducts) * 100)}% active` : '0%'}
          </span>
        </div>
      </div>

      {/* Card 3: Low / Out of Stock */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm hover:border-neutral-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Low / Out Stock</span>
          <div className="p-2 bg-amber-950/60 border border-amber-900/50 rounded-lg text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-amber-400 tracking-tight">{lowStockCount + outOfStockCount}</span>
          <span className="text-xs text-neutral-500">
            ({outOfStockCount} zero, {lowStockCount} low)
          </span>
        </div>
      </div>

      {/* Card 4: Total Variants */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm hover:border-neutral-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Total Variants</span>
          <div className="p-2 bg-neutral-800/80 rounded-lg text-neutral-300">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-white tracking-tight">{totalVariants}</span>
          <span className="text-xs text-neutral-500">SKUs</span>
        </div>
      </div>

      {/* Card 5: Catalog Valuation Estimate */}
      <div className="col-span-2 md:col-span-4 lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm hover:border-neutral-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Catalog Value</span>
          <div className="p-2 bg-blue-950/60 border border-blue-900/50 rounded-lg text-blue-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-xl font-semibold text-white tracking-tight">
            Rp {estimatedValuation.toLocaleString('id-ID')}
          </span>
        </div>
      </div>
    </div>
  );
}
