'use client';

import React, { useState } from 'react';
import { Plus, Minus, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { ProductVariantSerialized } from './types';

interface ProductVariantMatrixProps {
  productId?: string;
  variants: ProductVariantSerialized[];
  onSaveVariantStock: (
    variantId: string,
    stockSaleTotal: number,
    stockSaleAvailable: number,
    stockRentTotal?: number,
    stockRentAvailable?: number
  ) => Promise<void>;
}

export default function ProductVariantMatrix({
  variants,
  onSaveVariantStock,
}: ProductVariantMatrixProps) {
  // Local state for stock inputs
  const [stockState, setStockState] = useState<
    Record<string, { total: number; available: number }>
  >(() => {
    const initial: Record<string, { total: number; available: number }> = {};
    variants.forEach((v) => {
      initial[v.id] = {
        total: v.stockTotal,
        available: v.stockAvailable,
      };
    });
    return initial;
  });

  const [savingVariantId, setSavingVariantId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  const handleStockChange = (
    variantId: string,
    field: 'total' | 'available',
    delta: number
  ) => {
    setStockState((prev) => {
      const current = prev[variantId] || { total: 0, available: 0 };
      const nextVal = Math.max(0, (current[field] || 0) + delta);
      return {
        ...prev,
        [variantId]: {
          ...current,
          [field]: nextVal,
        },
      };
    });
  };

  const handleDirectInput = (
    variantId: string,
    field: 'total' | 'available',
    value: string
  ) => {
    const parsed = Math.max(0, parseInt(value, 10) || 0);
    setStockState((prev) => ({
      ...prev,
      [variantId]: {
        ...(prev[variantId] || { total: 0, available: 0 }),
        [field]: parsed,
      },
    }));
  };

  const handleSave = async (variant: ProductVariantSerialized) => {
    const current = stockState[variant.id] || {
      total: variant.stockTotal,
      available: variant.stockAvailable,
    };

    setSavingVariantId(variant.id);
    try {
      await onSaveVariantStock(
        variant.id,
        current.total,
        current.available,
        variant.stockRentTotal ?? 0,
        variant.stockRentAvailable ?? 0
      );
      setSavedSuccessId(variant.id);
      setTimeout(() => setSavedSuccessId(null), 2000);
    } catch (err) {
      console.error('Failed to update variant stock:', err);
    } finally {
      setSavingVariantId(null);
    }
  };

  if (!variants || variants.length === 0) {
    return (
      <div className="p-4 bg-neutral-50 text-center text-xs text-neutral-500 italic border-t border-neutral-200">
        No variants configured for this product.
      </div>
    );
  }

  return (
    <div className="bg-neutral-50/50 p-4 border-t border-neutral-200 space-y-3">
      <div className="flex items-center justify-between text-xs text-neutral-600 font-medium pb-2 border-b border-neutral-200">
        <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-neutral-500">
          Variant Matrix & Inventory Control
        </span>
        <span className="text-[11px] font-mono text-neutral-500">{variants.length} SKU(s)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="text-neutral-500 uppercase tracking-wider font-mono text-[10px] font-semibold border-b border-neutral-200">
              <th className="py-2 px-3">SKU</th>
              <th className="py-2 px-3">Attributes</th>
              <th className="py-2 px-3">Sale Price</th>
              <th className="py-2 px-3">Rent Price</th>
              <th className="py-2 px-3">Compare-At</th>
              <th className="py-2 px-3">Cost Price</th>
              <th className="py-2 px-3">Stock Available</th>
              <th className="py-2 px-3">Stock Total</th>
              <th className="py-2 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {variants.map((variant) => {
              const currentStock = stockState[variant.id] || {
                total: variant.stockTotal,
                available: variant.stockAvailable,
              };
              const isLowStock = currentStock.available > 0 && currentStock.available < 3;
              const isOutOfStock = currentStock.available === 0;

              const attrString = variant.attributes
                ? Object.entries(variant.attributes)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(', ')
                : 'Free Size';

              return (
                <tr key={variant.id} className="hover:bg-neutral-100/50 transition-colors">
                  {/* SKU */}
                  <td className="py-2.5 px-3 font-mono font-medium text-neutral-900">
                    {variant.sku}
                  </td>

                  {/* Attributes */}
                  <td className="py-2.5 px-3 text-neutral-600">{attrString}</td>

                  {/* Sale Price */}
                  <td className="py-2.5 px-3 text-neutral-800 font-mono">
                    {variant.priceSale !== null && variant.priceSale !== undefined
                      ? `Rp ${variant.priceSale.toLocaleString('id-ID')}`
                      : '-'}
                  </td>

                  {/* Rent Price */}
                  <td className="py-2.5 px-3 text-neutral-800 font-mono">
                    {variant.priceRent !== null && variant.priceRent !== undefined
                      ? `Rp ${variant.priceRent.toLocaleString('id-ID')}`
                      : '-'}
                  </td>

                  {/* Compare-At Price */}
                  <td className="py-2.5 px-3 text-neutral-500 font-mono">
                    {variant.compareAtPrice !== null && variant.compareAtPrice !== undefined
                      ? `Rp ${variant.compareAtPrice.toLocaleString('id-ID')}`
                      : '-'}
                  </td>

                  {/* Cost Price */}
                  <td className="py-2.5 px-3 text-neutral-500 font-mono">
                    {variant.costPrice !== null && variant.costPrice !== undefined
                      ? `Rp ${variant.costPrice.toLocaleString('id-ID')}`
                      : '-'}
                  </td>

                  {/* Stock Available with Warning Indicators & Quick Edit */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white border border-neutral-200 rounded-xs shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleStockChange(variant.id, 'available', -1)}
                          className="p-1 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 rounded-l-xs transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          value={currentStock.available}
                          onChange={(e) => handleDirectInput(variant.id, 'available', e.target.value)}
                          className="w-12 text-center bg-transparent text-neutral-900 font-medium text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleStockChange(variant.id, 'available', 1)}
                          className="p-1 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 rounded-r-xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Stock Warning Pill */}
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-rose-50 border border-rose-200 text-rose-700">
                          <AlertCircle className="w-3 h-3" /> Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-amber-50 border border-amber-200 text-amber-700">
                          <AlertCircle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                          In Stock
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Stock Total Quick Edit */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center bg-white border border-neutral-200 rounded-xs shadow-2xs w-fit">
                      <button
                        type="button"
                        onClick={() => handleStockChange(variant.id, 'total', -1)}
                        className="p-1 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 rounded-l-xs transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        value={currentStock.total}
                        onChange={(e) => handleDirectInput(variant.id, 'total', e.target.value)}
                        className="w-12 text-center bg-transparent text-neutral-900 font-medium text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleStockChange(variant.id, 'total', 1)}
                        className="p-1 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 rounded-r-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* Actions (Save Button) */}
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSave(variant)}
                      disabled={savingVariantId === variant.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-xs text-[11px] transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                      {savingVariantId === variant.id ? (
                        <span>Saving...</span>
                      ) : savedSuccessId === variant.id ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3" />
                          <span>Save</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
