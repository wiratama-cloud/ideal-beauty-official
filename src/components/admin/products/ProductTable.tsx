'use client';

import React from 'react';
import Image from 'next/image';
import {
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Package,
} from 'lucide-react';
import { ProductSerialized } from './types';

interface ProductTableProps {
  products: ProductSerialized[];
  selectedProductIds: Set<string>;
  onToggleSelectProduct: (id: string) => void;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;

  expandedProductIds?: Set<string>;
  onToggleExpandProduct?: (id: string) => void;

  onToggleActive: (productId: string, currentIsActive: boolean) => void;
  onOpenEditDrawer: (product: ProductSerialized) => void;
  onDeleteProduct: (productId: string) => void;

  onSaveVariantStock?: (
    variantId: string,
    stockSaleTotal: number,
    stockSaleAvailable: number,
    stockRentTotal?: number,
    stockRentAvailable?: number
  ) => Promise<void>;
}

export default function ProductTable({
  products,
  selectedProductIds,
  onToggleSelectProduct,
  onToggleSelectAll,
  isAllSelected,
  expandedProductIds,
  onToggleExpandProduct,
  onToggleActive,
  onOpenEditDrawer,
  onDeleteProduct,
  onSaveVariantStock,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
        <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mx-auto text-neutral-400 mb-4">
          <Package className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">No products found</h3>
        <p className="text-xs text-neutral-400 max-w-sm mx-auto">
          No items match your search or filter criteria. Try clearing filters or adding a new product.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-neutral-950 text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-800">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 rounded border-neutral-700 text-white focus:ring-0 focus:ring-offset-0 bg-neutral-800"
                />
              </th>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Mode</th>
              <th className="py-3 px-4">Active</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {products.map((product) => {
              const isSelected = selectedProductIds.has(product.id);

              // Calculate overall mode for badges
              const hasSale = product.variants.some((v) => v.priceSale !== null);
              const hasRent = product.variants.some((v) => v.priceRent !== null);
              const modeLabel = hasSale && hasRent ? 'BUY & RENT' : hasRent ? 'RENT ONLY' : 'BUY ONLY';

              return (
                <React.Fragment key={product.id}>
                  <tr
                    className={`transition-colors ${
                      isSelected ? 'bg-neutral-850/80' : 'hover:bg-neutral-850/40'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectProduct(product.id)}
                        className="w-4 h-4 rounded border-neutral-700 text-white focus:ring-0 focus:ring-offset-0 bg-neutral-800"
                      />
                    </td>

                    {/* Product Main Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-12 bg-neutral-800 rounded overflow-hidden flex-shrink-0 border border-neutral-700">
                          <Image
                            src={product.images[0] || '/images/products/default-product.jpg'}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-semibold text-white text-sm block leading-tight">
                            {product.name}
                          </span>
                          <span className="text-[11px] font-mono text-neutral-500 block">
                            /{product.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-neutral-300 font-medium">
                      {product.category || 'Ready To Wear'}
                    </td>

                    {/* Mode Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          hasSale && hasRent
                            ? 'bg-purple-950 border border-purple-800 text-purple-300'
                            : hasRent
                            ? 'bg-blue-950 border border-blue-800 text-blue-300'
                            : 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                        }`}
                      >
                        {modeLabel}
                      </span>
                    </td>

                    {/* Active Toggle Switch */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => onToggleActive(product.id, product.isActive)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                          product.isActive
                            ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-400 hover:bg-emerald-900'
                            : 'bg-neutral-800 border border-neutral-700 text-neutral-400 hover:bg-neutral-750'
                        }`}
                      >
                        {product.isActive ? (
                          <>
                            <Eye className="w-3 h-3" /> Active
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" /> Inactive
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenEditDrawer(product)}
                          className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md border border-neutral-700 transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 rounded-md border border-rose-800/80 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
