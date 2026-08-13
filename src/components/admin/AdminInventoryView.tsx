'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Package,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Save,
  Layers,
  ShoppingBag,
  FileText,
} from 'lucide-react';
import { updateVariantStockAction } from '@/app/actions/admin';

interface ProductVariant {
  id: string;
  sku: string;
  attributes: any;
  priceSale: number | null;
  priceRent: number | null;
  costPrice: number | null;
  stockTotal: number;
  stockAvailable: number;
}

interface ProductWithVariants {
  id: string;
  name: string;
  category: string | null;
  slug: string;
  images: string[];
  isActive: boolean;
  variants: ProductVariant[];
}

interface AdminInventoryViewProps {
  products: ProductWithVariants[];
}

export default function AdminInventoryView({ products: initialProducts }: AdminInventoryViewProps) {
  const [products, setProducts] = useState<ProductWithVariants[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [editingStock, setEditingStock] = useState<Record<string, { total: number; available: number }>>({});
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formatIDR = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Categories list
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]));

  // Calculate statistics
  const totalProductsCount = products.length;
  let totalVariantsCount = 0;
  let totalAvailableUnits = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  products.forEach((p) => {
    p.variants.forEach((v) => {
      totalVariantsCount++;
      totalAvailableUnits += v.stockAvailable;
      if (v.stockAvailable <= 0) {
        outOfStockCount++;
      } else if (v.stockAvailable <= 2) {
        lowStockCount++;
      }
    });
  });

  // Handle stock input change
  const handleStockChange = (variantId: string, field: 'total' | 'available', value: number) => {
    const val = Math.max(0, value);
    setEditingStock((prev) => {
      const current = prev[variantId] || {
        total: products.flatMap((p) => p.variants).find((v) => v.id === variantId)?.stockTotal || 0,
        available: products.flatMap((p) => p.variants).find((v) => v.id === variantId)?.stockAvailable || 0,
      };
      return {
        ...prev,
        [variantId]: {
          ...current,
          [field]: val,
        },
      };
    });
  };

  // Save stock changes
  const handleSaveStock = async (variantId: string) => {
    const currentVariant = products.flatMap((p) => p.variants).find((v) => v.id === variantId);
    if (!currentVariant) return;

    const edited = editingStock[variantId] ?? {
      total: currentVariant.stockTotal,
      available: currentVariant.stockAvailable,
    };

    setSavingVariantId(variantId);
    try {
      const updated = await updateVariantStockAction(variantId, edited.total, edited.available);

      setProducts((prev) =>
        prev.map((product) => ({
          ...product,
          variants: product.variants.map((v) =>
            v.id === variantId
              ? {
                  ...v,
                  stockTotal: updated.stockTotal,
                  stockAvailable: updated.stockAvailable,
                }
              : v
          ),
        }))
      );

      setSuccessMessage(`Stock updated for SKU ${updated.sku}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update stock:', err);
    } finally {
      setSavingVariantId(null);
    }
  };

  // Filter products and variants
  const filteredProducts = products
    .map((product) => {
      const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesProductQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.category && product.category.toLowerCase().includes(query));

      const matchingVariants = product.variants.filter((variant) => {
        const matchesVariantQuery =
          !query ||
          matchesProductQuery ||
          variant.sku.toLowerCase().includes(query) ||
          JSON.stringify(variant.attributes).toLowerCase().includes(query);

        let matchesStock = true;
        if (stockFilter === 'IN_STOCK') matchesStock = variant.stockAvailable > 2;
        if (stockFilter === 'LOW_STOCK') matchesStock = variant.stockAvailable > 0 && variant.stockAvailable <= 2;
        if (stockFilter === 'OUT_OF_STOCK') matchesStock = variant.stockAvailable <= 0;

        return matchesVariantQuery && matchesStock;
      });

      if (matchesCategory && matchingVariants.length > 0) {
        return {
          ...product,
          variants: matchingVariants,
        };
      }
      return null;
    })
    .filter(Boolean) as ProductWithVariants[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-light text-xs space-y-10">
      {/* Back to Dashboard Navigation */}
      <div className="flex items-center space-x-2 text-neutral-500">
        <Link href="/admin/dashboard" className="hover:text-black flex items-center space-x-1 uppercase tracking-widest text-[10px]">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Executive Dashboard</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-200 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-sans block mb-1">
            ATELIER INVENTORY & CONCURRENCY STOCK CONTROL
          </span>
          <h1 className="font-serif text-3xl font-light text-neutral-900">Inventory Management</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/products"
            className="bg-white border border-neutral-300 text-neutral-800 px-4 py-2.5 uppercase tracking-widest text-[10px] hover:border-black transition-colors flex items-center space-x-2"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Product Management</span>
          </Link>

          <Link
            href="/admin/sections"
            className="bg-white border border-neutral-300 text-neutral-800 px-4 py-2.5 uppercase tracking-widest text-[10px] hover:border-black transition-colors flex items-center space-x-2"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Landing Sections</span>
          </Link>

          <Link
            href="/admin/orders"
            className="bg-white border border-neutral-300 text-neutral-800 px-4 py-2.5 uppercase tracking-widest text-[10px] hover:border-black transition-colors flex items-center space-x-2"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Manage Orders</span>
          </Link>

          <Link
            href="/admin/ledger"
            className="bg-white border border-neutral-300 text-neutral-800 px-4 py-2.5 uppercase tracking-widest text-[10px] hover:border-black transition-colors flex items-center space-x-2"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ledger Audit</span>
          </Link>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 font-mono text-xs flex items-center space-x-2 transition-all">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-neutral-100 p-6 space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-neutral-400">
            <span className="uppercase tracking-widest text-[10px] font-medium text-neutral-500">Catalog Products</span>
            <Package className="w-4 h-4 text-neutral-600" />
          </div>
          <p className="font-mono text-xl font-bold text-neutral-900">{totalProductsCount}</p>
          <p className="text-[10px] text-neutral-500">{totalVariantsCount} distinct variants</p>
        </div>

        <div className="bg-white border border-neutral-100 p-6 space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-neutral-400">
            <span className="uppercase tracking-widest text-[10px] font-medium text-neutral-500">Available Units</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-mono text-xl font-bold text-neutral-900">{totalAvailableUnits}</p>
          <p className="text-[10px] text-emerald-700">Ready for instant sale/rental</p>
        </div>

        <div className="bg-white border border-neutral-100 p-6 space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-neutral-400">
            <span className="uppercase tracking-widest text-[10px] font-medium text-neutral-500">Low Stock Alert</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="font-mono text-xl font-bold text-neutral-900">{lowStockCount}</p>
          <p className="text-[10px] text-amber-700">&le; 2 units remaining</p>
        </div>

        <div className="bg-white border border-neutral-100 p-6 space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-neutral-400">
            <span className="uppercase tracking-widest text-[10px] font-medium text-neutral-500">Out of Stock</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="font-mono text-xl font-bold text-neutral-900">{outOfStockCount}</p>
          <p className="text-[10px] text-rose-700">Requires restocking</p>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="bg-white p-6 border border-neutral-100 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product name, SKU, attribute..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 pl-9 pr-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-black font-sans"
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 px-3 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-black font-sans"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="md:col-span-4">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="w-full bg-neutral-50 border border-neutral-200 px-3 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-black font-sans"
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="IN_STOCK">In Stock (&gt; 2 units)</option>
              <option value="LOW_STOCK">Low Stock Alert (&le; 2 units)</option>
              <option value="OUT_OF_STOCK">Out of Stock (0 units)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Products Table */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-neutral-100 p-12 text-center space-y-4">
          <Package className="w-12 h-12 text-neutral-300 mx-auto" />
          <h2 className="font-serif text-xl text-neutral-800">No Inventory Items Found</h2>
          <p className="text-neutral-500 max-w-md mx-auto">
            Try resetting your search query or filter criteria to view product variant stock levels.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredProducts.map((product) => {
            const mainImage =
              product.images?.[0] ||
              '/images/products/default-product.jpg';

            return (
              <div key={product.id} className="bg-white border border-neutral-100 p-6 sm:p-8 space-y-6 shadow-sm">
                {/* Product Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-14 aspect-[3/4] bg-neutral-100 flex-shrink-0">
                      <Image src={mainImage} alt={product.name} fill className="object-cover" unoptimized />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-sans block">
                        {product.category}
                      </span>
                      <h2 className="font-serif text-lg font-medium text-neutral-900">{product.name}</h2>
                      <p className="text-[11px] text-neutral-500 font-mono">
                        Slug: /{product.slug} &bull; {product.variants.length} Variants
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/products/${product.slug}`}
                    target="_blank"
                    className="text-[10px] uppercase tracking-widest text-neutral-600 hover:text-black border-b border-neutral-300 hover:border-black transition-colors"
                  >
                    View Product Page &rarr;
                  </Link>
                </div>

                {/* Variants Inventory List */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider text-[10px]">
                        <th className="pb-3 font-medium">SKU</th>
                        <th className="pb-3 font-medium">Attributes</th>
                        <th className="pb-3 font-medium">Prices (Sale / Rent / Cost)</th>
                        <th className="pb-3 font-medium">Stock Status</th>
                        <th className="pb-3 font-medium text-center">Available Stock</th>
                        <th className="pb-3 font-medium text-center">Total Stock</th>
                        <th className="pb-3 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
                      {product.variants.map((variant) => {
                        const edited = editingStock[variant.id] ?? {
                          total: variant.stockTotal,
                          available: variant.stockAvailable,
                        };

                        const isChanged =
                          edited.total !== variant.stockTotal || edited.available !== variant.stockAvailable;

                        const isSaving = savingVariantId === variant.id;

                        // Attributes string
                        const attrText =
                          typeof variant.attributes === 'object' && variant.attributes !== null
                            ? Object.entries(variant.attributes)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(' | ')
                            : String(variant.attributes || 'Standard');

                        return (
                          <tr key={variant.id} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="py-4 font-bold text-neutral-900">{variant.sku}</td>
                            <td className="py-4 text-neutral-600 font-sans text-xs">{attrText}</td>
                            <td className="py-4 text-neutral-700">
                              <div>Sale: {formatIDR(variant.priceSale)}</div>
                              <div>Rent: {formatIDR(variant.priceRent)}</div>
                              <div className="text-neutral-400 text-[10px]">COGS: {formatIDR(variant.costPrice)}</div>
                            </td>
                            <td className="py-4">
                              {variant.stockAvailable <= 0 ? (
                                <span className="bg-rose-100 text-rose-800 px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold inline-flex items-center space-x-1">
                                  <XCircle className="w-3 h-3" />
                                  <span>OUT OF STOCK</span>
                                </span>
                              ) : variant.stockAvailable <= 2 ? (
                                <span className="bg-amber-100 text-amber-800 px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold inline-flex items-center space-x-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>LOW STOCK ({variant.stockAvailable})</span>
                                </span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold inline-flex items-center space-x-1">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>IN STOCK</span>
                                </span>
                              )}
                            </td>

                            {/* Available Stock Counter */}
                            <td className="py-4 text-center">
                              <div className="inline-flex items-center space-x-1 bg-neutral-100 p-1 rounded-sm border border-neutral-200">
                                <button
                                  type="button"
                                  onClick={() => handleStockChange(variant.id, 'available', edited.available - 1)}
                                  className="p-1 text-neutral-600 hover:text-black hover:bg-white transition-colors"
                                  title="Decrement Available Stock"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={edited.available}
                                  onChange={(e) =>
                                    handleStockChange(variant.id, 'available', parseInt(e.target.value) || 0)
                                  }
                                  className="w-12 text-center bg-white border border-neutral-300 py-1 font-mono text-xs focus:outline-none text-neutral-900 font-bold"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleStockChange(variant.id, 'available', edited.available + 1)}
                                  className="p-1 text-neutral-600 hover:text-black hover:bg-white transition-colors"
                                  title="Increment Available Stock"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            {/* Total Stock Counter */}
                            <td className="py-4 text-center">
                              <div className="inline-flex items-center space-x-1 bg-neutral-100 p-1 rounded-sm border border-neutral-200">
                                <button
                                  type="button"
                                  onClick={() => handleStockChange(variant.id, 'total', edited.total - 1)}
                                  className="p-1 text-neutral-600 hover:text-black hover:bg-white transition-colors"
                                  title="Decrement Total Stock"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={edited.total}
                                  onChange={(e) =>
                                    handleStockChange(variant.id, 'total', parseInt(e.target.value) || 0)
                                  }
                                  className="w-12 text-center bg-white border border-neutral-300 py-1 font-mono text-xs focus:outline-none text-neutral-900"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleStockChange(variant.id, 'total', edited.total + 1)}
                                  className="p-1 text-neutral-600 hover:text-black hover:bg-white transition-colors"
                                  title="Increment Total Stock"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            {/* Save Button */}
                            <td className="py-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleSaveStock(variant.id)}
                                disabled={isSaving || !isChanged}
                                className={`px-3 py-1.5 uppercase tracking-widest text-[10px] font-medium transition-all flex items-center space-x-1 ml-auto ${
                                  isChanged
                                    ? 'bg-black text-white hover:bg-neutral-800'
                                    : 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
                                }`}
                              >
                                <Save className="w-3 h-3" />
                                <span>{isSaving ? 'Saving...' : 'Save'}</span>
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
          })}
        </div>
      )}
    </div>
  );
}
