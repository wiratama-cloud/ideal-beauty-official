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

  const activePercent = totalProducts > 0 ? Math.round((activeProducts / totalProducts) * 100) : 0;
  const alertStockCount = lowStockCount + outOfStockCount;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {/* Card 1: Total Products */}
      <div className="bg-white border border-neutral-200 p-4 rounded-xs shadow-2xs hover:border-neutral-300 transition-colors">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">
            Total Products
          </span>
          <Package className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="text-xl font-serif font-medium text-neutral-900">{totalProducts}</div>
        <p className="text-[10px] text-neutral-500 mt-1">Catalog items</p>
      </div>

      {/* Card 2: Active Catalog */}
      <div className="bg-white border border-neutral-200 p-4 rounded-xs shadow-2xs hover:border-neutral-300 transition-colors">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">
            Active Catalog
          </span>
          <Eye className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-xl font-serif font-medium text-emerald-900">{activeProducts}</span>
          <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-xs">
            {activePercent}% ACTIVE
          </span>
        </div>
        <p className="text-[10px] text-neutral-500 mt-1">Published in store</p>
      </div>

      {/* Card 3: Low / Out of Stock */}
      <div className="bg-white border border-neutral-200 p-4 rounded-xs shadow-2xs hover:border-neutral-300 transition-colors">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">
            Stock Alerts
          </span>
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-xl font-serif font-medium text-amber-900">{alertStockCount}</span>
          {alertStockCount > 0 && (
            <span className="text-[10px] font-mono text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded-xs">
              {outOfStockCount} OUT
            </span>
          )}
        </div>
        <p className="text-[10px] text-neutral-500 mt-1">{lowStockCount} low, {outOfStockCount} zero stock</p>
      </div>

      {/* Card 4: Total Variants */}
      <div className="bg-white border border-neutral-200 p-4 rounded-xs shadow-2xs hover:border-neutral-300 transition-colors">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">
            Total Variants
          </span>
          <Layers className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="text-xl font-serif font-medium text-neutral-900">{totalVariants}</div>
        <p className="text-[10px] text-neutral-500 mt-1">Managed SKUs</p>
      </div>

      {/* Card 5: Catalog Valuation Estimate */}
      <div className="bg-white border border-neutral-200 p-4 rounded-xs shadow-2xs hover:border-neutral-300 transition-colors col-span-2 md:col-span-1">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">
            Catalog Value
          </span>
          <DollarSign className="w-4 h-4 text-neutral-500" />
        </div>
        <div className="text-lg font-mono font-bold text-neutral-900 truncate">
          Rp {estimatedValuation.toLocaleString('id-ID')}
        </div>
        <p className="text-[10px] text-neutral-500 mt-1">Inventory retail value</p>
      </div>
    </div>
  );
}
