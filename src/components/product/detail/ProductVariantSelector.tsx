'use client';

import React from 'react';
import SizeChartModal from '../SizeChartModal';
import { ProductDetailVariant } from './useProductDetail';
import {
  getVariantStockStatus as resolveVariantStockStatus,
  VariantStockStatus,
} from '@/lib/utils/product-stock';

interface ProductVariantSelectorProps {
  variants: ProductDetailVariant[];
  selectedVariantId: string;
  onSelectVariant: (variantId: string) => void;
  optionType?: 'SALE' | 'RENTAL';
  category?: string | null;
  productName?: string;
  sizeChart?: any;
  getVariantStockStatus?: (variant: ProductDetailVariant, mode?: 'SALE' | 'RENTAL') => VariantStockStatus;
  className?: string;
}

export default function ProductVariantSelector({
  variants,
  selectedVariantId,
  onSelectVariant,
  optionType = 'SALE',
  category,
  productName,
  sizeChart,
  getVariantStockStatus,
  className = '',
}: ProductVariantSelectorProps) {
  if (!variants || variants.length === 0) {
    return null;
  }

  const getStatus = getVariantStockStatus || resolveVariantStockStatus;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header with Title and Size Chart Trigger */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="block text-xs uppercase tracking-widest text-neutral-700 font-medium font-sans">
          Select Variant / Size
        </label>
        <SizeChartModal category={category} productName={productName} sizeChart={sizeChart} />
      </div>

      {/* Variant Pills Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {variants.map((variant) => {
          const attrs = (variant.attributes || {}) as Record<string, any>;
          const size = attrs.size || attrs.Size || '';
          const color = attrs.color || attrs.Color || '';
          const attrLabel = size
            ? `${size}${color ? ` • ${color}` : ''}`
            : color
            ? color
            : variant.sku || 'Standard';

          const isSelected = variant.id === selectedVariantId;
          const status = getStatus(variant, optionType);

          // Badge coloring helper
          const getBadgeClass = () => {
            if (isSelected) {
              return 'text-neutral-300';
            }
            switch (status.badgeType) {
              case 'low-stock':
                return 'text-amber-700 font-medium';
              case 'pre-order':
                return 'text-purple-700 font-medium';
              case 'sold-out':
                return 'text-neutral-400 line-through';
              case 'in-stock':
              default:
                return 'text-neutral-500';
            }
          };

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelectVariant(variant.id)}
              className={`p-3 text-xs border rounded-xs text-center transition-all flex flex-col items-center justify-center min-h-[64px] ${
                isSelected
                  ? 'border-black bg-neutral-900 text-white font-medium shadow-xs ring-1 ring-black'
                  : status.isAvailable
                  ? 'border-neutral-200 bg-white text-neutral-800 hover:border-black hover:bg-neutral-50/50'
                  : 'border-neutral-200 bg-neutral-50/70 text-neutral-500 hover:border-neutral-400'
              }`}
            >
              <span className="tracking-wide font-sans font-medium">{attrLabel}</span>
              <span className={`text-[10px] mt-1 font-mono tracking-normal ${getBadgeClass()}`}>
                {status.badgeText}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
