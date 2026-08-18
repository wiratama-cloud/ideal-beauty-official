'use client';

import React from 'react';
import Image from 'next/image';
import {
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Package,
  ChevronDown,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { ProductSerialized } from './types';
import ProductVariantMatrix from './ProductVariantMatrix';
import { getOptimizedImageUrl } from '@/lib/utils/image-url';

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
      <div className="bg-white border border-neutral-200 rounded-xs p-12 text-center shadow-2xs">
        <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400 mb-4">
          <Package className="w-6 h-6" />
        </div>
        <h3 className="text-base font-serif font-medium text-neutral-900 mb-1">No products found</h3>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
          No items match your search or filter criteria. Try clearing filters or adding a new product.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xs overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-neutral-50/80 text-neutral-500 uppercase tracking-wider font-mono text-[10px] font-semibold border-b border-neutral-200">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 rounded-xs border-neutral-300 text-neutral-900 focus:ring-0 focus:ring-offset-0 bg-white cursor-pointer"
                />
              </th>
              <th className="py-3 px-2 w-8"></th>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Mode</th>
              <th className="py-3 px-4">Variants</th>
              <th className="py-3 px-4">Active</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {products.map((product) => {
              const isSelected = selectedProductIds.has(product.id);
              const isExpanded = expandedProductIds?.has(product.id) ?? false;

              // Calculate overall mode for badges
              const hasSale = product.variants.some((v) => v.priceSale !== null);
              const hasRent = product.variants.some((v) => v.priceRent !== null);
              const modeLabel = hasSale && hasRent ? 'BUY & RENT' : hasRent ? 'RENT ONLY' : 'BUY ONLY';

              const totalStock = product.variants.reduce((sum, v) => sum + (v.stockAvailable || 0), 0);

              return (
                <React.Fragment key={product.id}>
                  <tr
                    className={`transition-colors ${
                      isSelected ? 'bg-neutral-50' : 'hover:bg-neutral-50/60'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectProduct(product.id)}
                        className="w-4 h-4 rounded-xs border-neutral-300 text-neutral-900 focus:ring-0 focus:ring-offset-0 bg-white cursor-pointer"
                      />
                    </td>

                    {/* Accordion expand button */}
                    <td className="py-3 px-2">
                      {onToggleExpandProduct && (
                        <button
                          type="button"
                          onClick={() => onToggleExpandProduct(product.id)}
                          className="p-1 text-neutral-400 hover:text-neutral-900 rounded-xs hover:bg-neutral-100 transition-colors cursor-pointer"
                          title={isExpanded ? 'Collapse variants' : 'Expand variants'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </td>

                    {/* Product Main Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-12 bg-neutral-100 rounded-xs overflow-hidden flex-shrink-0 border border-neutral-200">
                          <Image
                            src={getOptimizedImageUrl(product.images[0], 256)}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-serif font-medium text-neutral-900 text-sm block leading-tight">
                            {product.name}
                          </span>
                          <span className="text-[11px] font-mono text-neutral-400 block mt-0.5">
                            /{product.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-neutral-700 font-medium">
                      {product.category || 'Ready To Wear'}
                    </td>

                    {/* Mode Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-mono font-semibold ${
                          hasSale && hasRent
                            ? 'bg-purple-50 border border-purple-200 text-purple-700'
                            : hasRent
                            ? 'bg-blue-50 border border-blue-200 text-blue-700'
                            : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        }`}
                      >
                        {modeLabel}
                      </span>
                    </td>

                    {/* Variants count & stock summary */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-neutral-600 font-mono text-[11px]">
                        <Layers className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{product.variants.length} SKU(s)</span>
                        <span className="text-neutral-400">·</span>
                        <span className={totalStock === 0 ? 'text-rose-600 font-semibold' : 'text-neutral-700'}>
                          {totalStock} avail
                        </span>
                      </div>
                    </td>

                    {/* Active Toggle Switch */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => onToggleActive(product.id, product.isActive)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                          product.isActive
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-neutral-100 border border-neutral-200 text-neutral-500 hover:bg-neutral-200'
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenEditDrawer(product)}
                          className="p-1.5 text-neutral-600 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 rounded-xs border border-neutral-200 transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xs border border-rose-200 transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Accordion Row for Variant Matrix */}
                  {isExpanded && onSaveVariantStock && (
                    <tr>
                      <td colSpan={8} className="p-0">
                        <ProductVariantMatrix
                          productId={product.id}
                          variants={product.variants}
                          onSaveVariantStock={onSaveVariantStock}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
