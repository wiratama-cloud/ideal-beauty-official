'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Plus,
  Minus,
  Search,
  Edit,
  Trash2,
  Tag,
  ShoppingBag,
  Layers,
  FileText,
  DollarSign,
  X,
  Check,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Sparkles,
  Upload,
  ChevronDown,
  ChevronUp,
  Save,
  Boxes,
  ArrowLeft,
} from 'lucide-react';
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  toggleProductActiveAction,
  updateVariantStockAction,
  CreateProductInput,
  VariantInput,
} from '@/app/actions/admin';
import AdminHeader from '@/components/admin/AdminHeader';

interface ProductVariantSerialized {
  id: string;
  sku: string;
  attributes: any;
  priceSale: number | null;
  priceRent: number | null;
  compareAtPrice: number | null;
  costPrice: number | null;
  stockSaleTotal?: number;
  stockSaleAvailable?: number;
  stockRentTotal?: number;
  stockRentAvailable?: number;
  stockTotal: number;
  stockAvailable: number;
}

interface ProductSerialized {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  images: string[];
  isActive: boolean;
  variants: ProductVariantSerialized[];
}

interface AdminProductsViewProps {
  initialProducts: ProductSerialized[];
}

export default function AdminProductsView({ initialProducts }: AdminProductsViewProps) {
  const [products, setProducts] = useState<ProductSerialized[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All'); // 'All' | 'BUY_ONLY' | 'RENT_ONLY' | 'BOTH'
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'ACTIVE' | 'INACTIVE'
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Accordion State for Inline Stock Management
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  // Inline Stock Edit State
  const [editingStock, setEditingStock] = useState<Record<string, { total: number; available: number }>>({});
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductSerialized | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Delete State
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('Ready To Wear');
  const [formDescription, setFormDescription] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formVariants, setFormVariants] = useState<VariantInput[]>([]);

  // Format currency
  const formatIDR = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper: determine product mode (BUY_ONLY, RENT_ONLY, BOTH)
  const getProductMode = (product: ProductSerialized) => {
    const hasSale = product.variants.some((v) => v.priceSale !== null && v.priceSale > 0);
    const hasRent = product.variants.some((v) => v.priceRent !== null && v.priceRent > 0);

    if (hasSale && hasRent) return 'BOTH';
    if (hasSale) return 'BUY_ONLY';
    if (hasRent) return 'RENT_ONLY';
    return 'BUY_ONLY';
  };

  // Unique categories
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]))];

  // Accordion Expand/Collapse Helpers
  const toggleExpandProduct = (productId: string) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const expandAllProducts = () => {
    setExpandedProductIds(new Set(products.map((p) => p.id)));
  };

  const collapseAllProducts = () => {
    setExpandedProductIds(new Set());
  };

  // Stock Edit Controls
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

  const handleSaveStock = async (variantId: string) => {
    const currentVariant = products.flatMap((p) => p.variants).find((v) => v.id === variantId);
    if (!currentVariant) return;

    const edited = editingStock[variantId] ?? {
      total: currentVariant.stockTotal,
      available: currentVariant.stockAvailable,
    };

    setSavingVariantId(variantId);
    try {
      const updatedVariant = await updateVariantStockAction(
        variantId,
        edited.total,
        edited.available
      );

      setProducts((prev) =>
        prev.map((p) => ({
          ...p,
          variants: p.variants.map((v) =>
            v.id === variantId
              ? {
                  ...v,
                  stockTotal: updatedVariant.stockTotal,
                  stockAvailable: updatedVariant.stockAvailable,
                }
              : v
          ),
        }))
      );

      setSuccessMessage(`Stock successfully updated for variant ${currentVariant.sku}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update stock:', err);
    } finally {
      setSavingVariantId(null);
    }
  };

  // Filtering
  const filteredProducts = products.filter((product) => {
    const mode = getProductMode(product);

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = product.name.toLowerCase().includes(q);
      const matchSlug = product.slug.toLowerCase().includes(q);
      const matchCategory = (product.category || '').toLowerCase().includes(q);
      const matchSku = product.variants.some((v) => v.sku.toLowerCase().includes(q));
      if (!matchName && !matchSlug && !matchCategory && !matchSku) return false;
    }

    // Category filter
    if (categoryFilter !== 'All' && product.category !== categoryFilter) {
      return false;
    }

    // Mode filter
    if (modeFilter !== 'All' && mode !== modeFilter) {
      return false;
    }

    // Status filter
    if (statusFilter === 'ACTIVE' && !product.isActive) return false;
    if (statusFilter === 'INACTIVE' && product.isActive) return false;

    // Stock Filter
    if (stockFilter === 'IN_STOCK' && !product.variants.some((v) => v.stockAvailable > 2)) return false;
    if (stockFilter === 'LOW_STOCK' && !product.variants.some((v) => v.stockAvailable > 0 && v.stockAvailable <= 2)) return false;
    if (stockFilter === 'OUT_OF_STOCK' && !product.variants.some((v) => v.stockAvailable <= 0)) return false;

    return true;
  });

  // Calculate statistics
  const totalProducts = products.length;
  const activeCount = products.filter((p) => p.isActive).length;

  let totalVariants = 0;
  let totalStockUnits = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  products.forEach((p) => {
    p.variants.forEach((v) => {
      totalVariants++;
      totalStockUnits += v.stockAvailable;
      if (v.stockAvailable <= 0) {
        outOfStockCount++;
      } else if (v.stockAvailable <= 2) {
        lowStockCount++;
      }
    });
  });

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSlug('');
    setFormCategory('Ready To Wear');
    setFormDescription('');
    setFormImages([
      '/images/products/default-product.jpg',
    ]);
    setNewImageUrl('');
    setFormIsActive(true);
    setFormVariants([
      {
        sku: 'ITEM-S',
        attributes: { size: 'S', color: 'Gold' },
        priceSale: 2500000,
        priceRent: 500000,
        compareAtPrice: 3200000,
        costPrice: 1000000,
        stockSaleTotal: 10,
        stockSaleAvailable: 10,
        stockRentTotal: 5,
        stockRentAvailable: 5,
        stockTotal: 15,
        stockAvailable: 15,
      },
    ]);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (product: ProductSerialized) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormSlug(product.slug);
    setFormCategory(product.category || 'Ready To Wear');
    setFormDescription(product.description || '');
    setFormImages(product.images.length > 0 ? [...product.images] : []);
    setNewImageUrl('');
    setFormIsActive(product.isActive);
    setFormVariants(
      product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        attributes: v.attributes || { size: 'Free Size' },
        priceSale: v.priceSale,
        priceRent: v.priceRent,
        compareAtPrice: v.compareAtPrice,
        costPrice: v.costPrice,
        stockSaleTotal: v.stockSaleTotal ?? v.stockTotal,
        stockSaleAvailable: v.stockSaleAvailable ?? v.stockAvailable,
        stockRentTotal: v.stockRentTotal ?? 0,
        stockRentAvailable: v.stockRentAvailable ?? 0,
        stockTotal: v.stockTotal,
        stockAvailable: v.stockAvailable,
      }))
    );
    setErrorMessage('');
    setIsModalOpen(true);
  };

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingProduct) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormSlug(generated);
    }
  };

  // Images management
  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormImages([...formImages, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormImages(formImages.filter((_, idx) => idx !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      setFormImages((prev) => [...prev, data.url]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload image file');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // Variant management
  const handleAddVariant = () => {
    const nextNum = formVariants.length + 1;
    setFormVariants([
      ...formVariants,
      {
        sku: `${formName.slice(0, 3).toUpperCase() || 'VAR'}-${nextNum}`,
        attributes: { size: 'M' },
        priceSale: 2000000,
        priceRent: 400000,
        compareAtPrice: null,
        costPrice: 800000,
        stockSaleTotal: 5,
        stockSaleAvailable: 5,
        stockRentTotal: 3,
        stockRentAvailable: 3,
        stockTotal: 8,
        stockAvailable: 8,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (formVariants.length <= 1) {
      setErrorMessage('At least one product variant is required.');
      return;
    }
    setFormVariants(formVariants.filter((_, idx) => idx !== index));
  };

  const handleVariantChange = (index: number, field: keyof VariantInput, value: any) => {
    const updated = [...formVariants];
    updated[index] = { ...updated[index], [field]: value };
    setFormVariants(updated);
  };

  // Variant mode change (BOTH, BUY_ONLY, RENT_ONLY)
  const handleVariantModeChange = (index: number, mode: 'BOTH' | 'BUY_ONLY' | 'RENT_ONLY') => {
    const updated = [...formVariants];
    const item = updated[index];

    if (mode === 'BUY_ONLY') {
      item.priceSale = item.priceSale ?? 2000000;
      item.priceRent = null;
    } else if (mode === 'RENT_ONLY') {
      item.priceRent = item.priceRent ?? 500000;
      item.priceSale = null;
    } else {
      item.priceSale = item.priceSale ?? 2000000;
      item.priceRent = item.priceRent ?? 500000;
    }

    updated[index] = item;
    setFormVariants(updated);
  };

  // Save Product Submit
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMessage('Product name is required.');
      return;
    }
    if (!formSlug.trim()) {
      setErrorMessage('Product slug is required.');
      return;
    }
    if (formVariants.length === 0) {
      setErrorMessage('At least one variant is required.');
      return;
    }

    // Validate variants
    for (const v of formVariants) {
      if (!v.sku.trim()) {
        setErrorMessage('All variants must have a valid SKU.');
        return;
      }
      if (v.priceSale === null && v.priceRent === null) {
        setErrorMessage(`Variant ${v.sku} must have either a Sale price or Rent price.`);
        return;
      }
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const payload: CreateProductInput = {
        name: formName.trim(),
        slug: formSlug.trim(),
        category: formCategory.trim(),
        description: formDescription.trim(),
        images: formImages.length > 0 ? formImages : ['/images/products/default-product.jpg'],
        isActive: formIsActive,
        variants: formVariants,
      };

      if (editingProduct) {
        await updateProductAction(editingProduct.id, payload);
      } else {
        await createProductAction(payload);
      }

      // Refresh list
      window.location.reload();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setErrorMessage(err?.message || 'Failed to save product.');
      setIsSaving(false);
    }
  };

  // Toggle Active Server Action
  const handleToggleActive = async (productId: string, currentActive: boolean) => {
    try {
      setProducts(
        products.map((p) => (p.id === productId ? { ...p, isActive: !currentActive } : p))
      );
      await toggleProductActiveAction(productId, !currentActive);
    } catch (err) {
      console.error('Failed to toggle active status', err);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId: string) => {
    setIsDeleting(true);
    try {
      const res = await deleteProductAction(productId);
      if (res?.deactivated) {
        setProducts(products.map((p) => (p.id === productId ? { ...p, isActive: false } : p)));
        setSuccessMessage('Product was deactivated because it has linked order history or records.');
      } else {
        setProducts(products.filter((p) => p.id !== productId));
        setSuccessMessage('Product deleted successfully.');
      }
      setDeletingProductId(null);
    } catch (err) {
      console.error('Failed to delete product', err);
      setErrorMessage('Failed to delete or deactivate product.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 font-light text-xs">
      {/* Top Navigation Header */}
      <AdminHeader
        title="Products & Inventory Management"
        subtitle="ATELIER CATALOG & STOCK CONTROL"
        activeTab="products"
        action={
          <button
            onClick={handleOpenCreateModal}
            className="bg-black text-white px-4 py-2.5 uppercase tracking-widest text-[10px] font-medium hover:bg-neutral-800 transition-colors flex items-center space-x-1.5 rounded-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Toast Notification Banner */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xs flex items-center justify-between text-xs font-medium">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-neutral-200 p-4 rounded-sm shadow-2xs">
            <span className="text-[9px] uppercase tracking-widest text-neutral-500 block mb-1 font-medium">Catalog Products</span>
            <div className="text-xl font-serif text-neutral-900">{totalProducts}</div>
            <span className="text-[10px] text-emerald-600 mt-1 block font-medium">{activeCount} active in storefront</span>
          </div>

          <div className="bg-white border border-neutral-200 p-4 rounded-sm shadow-2xs">
            <span className="text-[9px] uppercase tracking-widest text-neutral-500 block mb-1 font-medium">Variants & Stock</span>
            <div className="text-xl font-serif text-neutral-900">{totalVariants} <span className="text-xs text-neutral-400 font-sans">({totalStockUnits} units)</span></div>
            <span className="text-[10px] text-neutral-400 mt-1 block">Total available inventory</span>
          </div>

          <div className="bg-white border border-neutral-200 p-4 rounded-sm shadow-2xs">
            <span className="text-[9px] uppercase tracking-widest text-neutral-500 block mb-1 font-medium">Low Stock Items</span>
            <div className="text-xl font-serif text-amber-600">{lowStockCount}</div>
            <span className="text-[10px] text-amber-700 mt-1 block">2 or fewer units remaining</span>
          </div>

          <div className="bg-white border border-neutral-200 p-4 rounded-sm shadow-2xs">
            <span className="text-[9px] uppercase tracking-widest text-neutral-500 block mb-1 font-medium">Out of Stock</span>
            <div className="text-xl font-serif text-red-600">{outOfStockCount}</div>
            <span className="text-[10px] text-red-700 mt-1 block">Requires inventory replenishment</span>
          </div>

          <div className="bg-white border border-neutral-200 p-4 rounded-sm shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[9px] uppercase tracking-widest text-neutral-500 block mb-1 font-medium">Availability Modes</span>
            <div className="text-xs font-mono space-y-0.5 text-neutral-800 pt-0.5">
              <div>Buy & Rent: <strong className="text-neutral-900">{products.filter((p) => getProductMode(p) === 'BOTH').length}</strong></div>
              <div>Buy Only: <strong className="text-emerald-700">{products.filter((p) => getProductMode(p) === 'BUY_ONLY').length}</strong></div>
              <div>Rent Only: <strong className="text-purple-700">{products.filter((p) => getProductMode(p) === 'RENT_ONLY').length}</strong></div>
            </div>
          </div>
        </div>

        {/* Search, Filter & Actions Bar */}
        <div className="bg-white border border-neutral-200 p-4 rounded-sm space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by product name, category, slug, or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-sm text-xs focus:outline-none focus:border-black"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-neutral-200 px-3 py-2 rounded-sm text-xs bg-white focus:outline-none focus:border-black"
              >
                <option value="All">All Categories</option>
                {categories.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="border border-neutral-200 px-3 py-2 rounded-sm text-xs bg-white focus:outline-none focus:border-black"
              >
                <option value="All">All Modes</option>
                <option value="BOTH">Both (Buy & Rent)</option>
                <option value="BUY_ONLY">Buy Only</option>
                <option value="RENT_ONLY">Rent Only</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-neutral-200 px-3 py-2 rounded-sm text-xs bg-white focus:outline-none focus:border-black"
              >
                <option value="All">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>

              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="border border-neutral-200 px-3 py-2 rounded-sm text-xs bg-white focus:outline-none focus:border-black font-mono"
              >
                <option value="ALL">All Stock Levels</option>
                <option value="IN_STOCK">In Stock (&gt; 2 units)</option>
                <option value="LOW_STOCK">Low Stock (&le; 2 units)</option>
                <option value="OUT_OF_STOCK">Out of Stock (0 units)</option>
              </select>

              <button
                onClick={expandedProductIds.size === products.length ? collapseAllProducts : expandAllProducts}
                className="border border-neutral-300 text-neutral-800 px-3 py-2 uppercase tracking-widest text-[10px] hover:border-black transition-colors flex items-center space-x-1.5"
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>{expandedProductIds.size === products.length ? 'Collapse Stock' : 'Expand Stock'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Products & Variant Stock Table */}
        <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase tracking-wider font-semibold text-neutral-600">
                  <th className="py-3 px-4 w-10"></th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Variants</th>
                  <th className="py-3 px-4">Sale Price</th>
                  <th className="py-3 px-4">Rent Price</th>
                  <th className="py-3 px-4">Available Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-neutral-500">
                      No products found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const mode = getProductMode(product);
                    const mainImage = product.images[0] || '/images/products/default-product.jpg';

                    const salePrices = product.variants.map((v) => v.priceSale).filter((p): p is number => p !== null);
                    const rentPrices = product.variants.map((v) => v.priceRent).filter((p): p is number => p !== null);

                    const minSale = salePrices.length > 0 ? Math.min(...salePrices) : null;
                    const minRent = rentPrices.length > 0 ? Math.min(...rentPrices) : null;

                    const totalAvailableStock = product.variants.reduce((acc, v) => acc + v.stockAvailable, 0);
                    const isExpanded = expandedProductIds.has(product.id);

                    return (
                      <React.Fragment key={product.id}>
                        <tr className={`hover:bg-neutral-50/80 transition-colors ${isExpanded ? 'bg-neutral-50/50' : ''}`}>
                          {/* Expand Button */}
                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={() => toggleExpandProduct(product.id)}
                              className="p-1 hover:bg-neutral-200 rounded-xs text-neutral-600 hover:text-black transition-colors"
                              title={isExpanded ? 'Hide Stock Controls' : 'Manage Variant Stock'}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>

                          {/* Product Thumbnail & Name */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="relative w-12 h-14 bg-neutral-100 flex-shrink-0 border border-neutral-200 overflow-hidden">
                                <Image src={mainImage} alt={product.name} fill className="object-cover" unoptimized />
                              </div>
                              <div>
                                <span className="font-medium text-neutral-900 block line-clamp-1">{product.name}</span>
                                <span className="text-[10px] text-neutral-400 font-mono block">/{product.slug}</span>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4 font-medium text-neutral-700">{product.category || 'Ready To Wear'}</td>

                          {/* Mode Badge */}
                          <td className="py-3 px-4">
                            {mode === 'BOTH' && (
                              <span className="bg-black text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs">
                                Buy & Rent
                              </span>
                            )}
                            {mode === 'BUY_ONLY' && (
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs border border-emerald-200">
                                Buy Only
                              </span>
                            )}
                            {mode === 'RENT_ONLY' && (
                              <span className="bg-purple-100 text-purple-800 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs border border-purple-200">
                                Rent Only
                              </span>
                            )}
                          </td>

                          {/* Variants Summary */}
                          <td className="py-3 px-4">
                            <span className="font-semibold text-neutral-800 block">{product.variants.length} variant(s)</span>
                            <span className="text-[10px] text-neutral-400 block truncate max-w-[120px]">
                              {product.variants.map((v) => (v.attributes?.size ? v.attributes.size : v.sku)).join(', ')}
                            </span>
                          </td>

                          {/* Sale Price */}
                          <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                            {minSale !== null ? formatIDR(minSale) : <span className="text-neutral-400 font-sans italic">N/A</span>}
                          </td>

                          {/* Rent Price */}
                          <td className="py-3 px-4 font-mono font-medium text-neutral-800">
                            {minRent !== null ? formatIDR(minRent) : <span className="text-neutral-400 font-sans italic">N/A</span>}
                          </td>

                          {/* Available Stock */}
                          <td className="py-3 px-4">
                            <span
                              className={`font-mono font-bold ${
                                totalAvailableStock === 0
                                  ? 'text-red-600'
                                  : totalAvailableStock <= 2
                                  ? 'text-amber-600'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {totalAvailableStock}
                            </span>
                            <span className="text-[10px] text-neutral-400 block">units</span>
                          </td>

                          {/* Active Status */}
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleActive(product.id, product.isActive)}
                              className={`flex items-center space-x-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-xs transition-colors ${
                                product.isActive
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                              }`}
                            >
                              {product.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              <span>{product.isActive ? 'Active' : 'Inactive'}</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => toggleExpandProduct(product.id)}
                                className={`px-2 py-1 border rounded-xs text-[10px] font-medium uppercase tracking-wider transition-colors flex items-center space-x-1 ${
                                  isExpanded ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-700 hover:border-black'
                                }`}
                              >
                                <Tag className="w-3 h-3" />
                                <span>Stock</span>
                              </button>

                              <button
                                onClick={() => handleOpenEditModal(product)}
                                className="p-1.5 border border-neutral-300 rounded-xs text-neutral-700 hover:border-black hover:text-black transition-colors"
                                title="Edit Product Details"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingProductId(product.id)}
                                className="p-1.5 border border-red-200 rounded-xs text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Inline Inventory Variant Controls */}
                        {isExpanded && (
                          <tr className="bg-neutral-50/90 border-b-2 border-neutral-200">
                            <td colSpan={10} className="p-4 sm:p-6">
                              <div className="bg-white border border-neutral-200 p-4 rounded-sm space-y-4 shadow-xs">
                                <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                                  <div className="flex items-center space-x-2">
                                    <Boxes className="w-4 h-4 text-neutral-700" />
                                    <h4 className="font-serif text-sm font-medium text-neutral-900">
                                      Inventory Variant Management &bull; {product.name}
                                    </h4>
                                  </div>
                                  <span className="text-[10px] font-mono text-neutral-500">
                                    {product.variants.length} variant(s) registered
                                  </span>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs font-mono">
                                    <thead>
                                      <tr className="border-b border-neutral-100 text-[9px] text-neutral-400 uppercase tracking-wider">
                                        <th className="py-2 px-3">SKU</th>
                                        <th className="py-2 px-3">Attributes</th>
                                        <th className="py-2 px-3">Sale Price</th>
                                        <th className="py-2 px-3">Rent Price</th>
                                        <th className="py-2 px-3">Cost Price</th>
                                        <th className="py-2 px-3">Stock Status</th>
                                        <th className="py-2 px-3">Total Stock</th>
                                        <th className="py-2 px-3">Available Stock</th>
                                        <th className="py-2 px-3 text-right">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                      {product.variants.map((v) => {
                                        const currentEdit = editingStock[v.id] || {
                                          total: v.stockTotal,
                                          available: v.stockAvailable,
                                        };
                                        const isSavingThis = savingVariantId === v.id;

                                        return (
                                          <tr key={v.id} className="hover:bg-neutral-50">
                                            <td className="py-2.5 px-3 font-bold text-neutral-900">{v.sku}</td>
                                            <td className="py-2.5 px-3 text-neutral-600">
                                              {v.attributes ? JSON.stringify(v.attributes).replace(/["{}]/g, ' ') : 'Default'}
                                            </td>
                                            <td className="py-2.5 px-3 text-neutral-800">{formatIDR(v.priceSale)}</td>
                                            <td className="py-2.5 px-3 text-neutral-800">{formatIDR(v.priceRent)}</td>
                                            <td className="py-2.5 px-3 text-neutral-500">{formatIDR(v.costPrice)}</td>

                                            <td className="py-2.5 px-3">
                                              {v.stockAvailable <= 0 ? (
                                                <span className="bg-red-100 text-red-800 text-[9px] px-2 py-0.5 rounded-xs font-bold uppercase tracking-wider">
                                                  Out of Stock
                                                </span>
                                              ) : v.stockAvailable <= 2 ? (
                                                <span className="bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded-xs font-bold uppercase tracking-wider">
                                                  Low Stock
                                                </span>
                                              ) : (
                                                <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded-xs font-bold uppercase tracking-wider">
                                                  In Stock
                                                </span>
                                              )}
                                            </td>

                                            {/* Total Stock Control */}
                                            <td className="py-2.5 px-3">
                                              <div className="flex items-center space-x-1">
                                                <button
                                                  type="button"
                                                  onClick={() => handleStockChange(v.id, 'total', currentEdit.total - 1)}
                                                  className="w-6 h-6 border border-neutral-300 rounded-xs flex items-center justify-center text-neutral-700 hover:bg-neutral-200"
                                                >
                                                  <Minus className="w-3 h-3" />
                                                </button>
                                                <input
                                                  type="number"
                                                  min={0}
                                                  value={currentEdit.total}
                                                  onChange={(e) => handleStockChange(v.id, 'total', parseInt(e.target.value) || 0)}
                                                  className="w-12 text-center border border-neutral-300 py-0.5 text-xs bg-white focus:outline-none"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => handleStockChange(v.id, 'total', currentEdit.total + 1)}
                                                  className="w-6 h-6 border border-neutral-300 rounded-xs flex items-center justify-center text-neutral-700 hover:bg-neutral-200"
                                                >
                                                  <Plus className="w-3 h-3" />
                                                </button>
                                              </div>
                                            </td>

                                            {/* Available Stock Control */}
                                            <td className="py-2.5 px-3">
                                              <div className="flex items-center space-x-1">
                                                <button
                                                  type="button"
                                                  onClick={() => handleStockChange(v.id, 'available', currentEdit.available - 1)}
                                                  className="w-6 h-6 border border-neutral-300 rounded-xs flex items-center justify-center text-neutral-700 hover:bg-neutral-200"
                                                >
                                                  <Minus className="w-3 h-3" />
                                                </button>
                                                <input
                                                  type="number"
                                                  min={0}
                                                  value={currentEdit.available}
                                                  onChange={(e) => handleStockChange(v.id, 'available', parseInt(e.target.value) || 0)}
                                                  className="w-12 text-center border border-neutral-300 py-0.5 text-xs bg-white focus:outline-none font-bold"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => handleStockChange(v.id, 'available', currentEdit.available + 1)}
                                                  className="w-6 h-6 border border-neutral-300 rounded-xs flex items-center justify-center text-neutral-700 hover:bg-neutral-200"
                                                >
                                                  <Plus className="w-3 h-3" />
                                                </button>
                                              </div>
                                            </td>

                                            {/* Save Action */}
                                            <td className="py-2.5 px-3 text-right">
                                              <button
                                                type="button"
                                                disabled={isSavingThis}
                                                onClick={() => handleSaveStock(v.id)}
                                                className="bg-black text-white px-3 py-1 rounded-xs text-[10px] uppercase tracking-wider font-sans hover:bg-neutral-800 transition-colors flex items-center space-x-1 ml-auto disabled:opacity-50"
                                              >
                                                <Save className="w-3 h-3" />
                                                <span>{isSavingThis ? 'Saving...' : 'Save'}</span>
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit / Create Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-neutral-200 rounded-sm w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl my-8">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-neutral-400 block font-sans">ATELIER CATALOG EDITOR</span>
                <h2 className="font-serif text-xl text-neutral-900">
                  {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Luxury Product'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-6 flex-1">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xs text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4 border-b border-neutral-200 pb-6">
                <h3 className="font-serif text-sm font-normal text-neutral-900 uppercase tracking-widest border-b border-neutral-100 pb-2">
                  Basic Product Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-700 font-medium mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Velvet Royal Emerald Kaftan"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xs text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-700 font-medium mb-1">
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      placeholder="e.g. velvet-royal-emerald-kaftan"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xs text-xs font-mono focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-700 font-medium mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="e.g. Haute Couture, Ready To Wear, Bridal Wear"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xs text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-5">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="w-4 h-4 accent-black"
                      />
                      <span className="text-xs text-neutral-800 font-medium">Publish Active in Storefront</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-700 font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Provide a detailed description of the design, craftsmanship, fabric, and embellishments..."
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xs text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Images Manager */}
              <div className="space-y-4 border-b border-neutral-200 pb-6">
                <h3 className="font-serif text-sm font-normal text-neutral-900 uppercase tracking-widest border-b border-neutral-100 pb-2">
                  Product Gallery Images
                </h3>

                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <label className="cursor-pointer bg-neutral-900 text-white px-4 py-2 uppercase tracking-widest text-[10px] hover:bg-black transition-colors flex items-center justify-center space-x-1 flex-shrink-0">
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    <span>{isUploading ? 'Uploading...' : 'Upload Image File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                  <div className="flex-1 flex space-x-2">
                    <input
                      type="text"
                      placeholder="Or enter image path (/images/products/...)"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1 px-3 py-2 border border-neutral-200 rounded-xs text-xs focus:outline-none focus:border-black font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddImage}
                      className="bg-neutral-100 border border-neutral-300 text-neutral-800 px-4 py-2 uppercase tracking-widest text-[10px] hover:bg-neutral-200 transition-colors"
                    >
                      Add Path
                    </button>
                  </div>
                </div>

                {/* Thumbnails list */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                  {formImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-[3/4] border border-neutral-200 rounded-xs overflow-hidden bg-neutral-100 group">
                      <Image src={img} alt={`Preview ${idx}`} fill className="object-cover" unoptimized />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove Image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 bg-black/80 text-white text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-xs">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Variants Builder & Availability Setup */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                  <h3 className="font-serif text-sm font-normal text-neutral-900 uppercase tracking-widest">
                    Product Variants & Availability Settings
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="bg-neutral-100 border border-neutral-300 text-neutral-800 px-3 py-1.5 uppercase tracking-widest text-[10px] hover:bg-neutral-200 transition-colors flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formVariants.map((variant, index) => {
                    const currentMode =
                      variant.priceSale !== null && variant.priceRent !== null
                        ? 'BOTH'
                        : variant.priceRent !== null
                        ? 'RENT_ONLY'
                        : 'BUY_ONLY';

                    return (
                      <div key={index} className="bg-neutral-50 border border-neutral-200 p-4 rounded-xs space-y-3 relative">
                        <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
                          <span className="font-mono font-semibold text-neutral-800 text-xs">
                            Variant #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(index)}
                            className="text-red-600 hover:text-red-800 text-[10px] uppercase tracking-wider font-semibold flex items-center space-x-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>

                        {/* Availability Mode Selector */}
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-neutral-700 font-medium mb-1">
                            Transaction Mode
                          </label>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleVariantModeChange(index, 'BOTH')}
                              className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border rounded-xs font-medium transition-colors ${
                                currentMode === 'BOTH'
                                  ? 'bg-black text-white border-black'
                                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                              }`}
                            >
                              Both (Buy & Rent)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVariantModeChange(index, 'BUY_ONLY')}
                              className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border rounded-xs font-medium transition-colors ${
                                currentMode === 'BUY_ONLY'
                                  ? 'bg-emerald-700 text-white border-emerald-700'
                                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                              }`}
                            >
                              Buy Only
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVariantModeChange(index, 'RENT_ONLY')}
                              className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border rounded-xs font-medium transition-colors ${
                                currentMode === 'RENT_ONLY'
                                  ? 'bg-purple-700 text-white border-purple-700'
                                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                              }`}
                            >
                              Rent Only
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[9px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                              SKU *
                            </label>
                            <input
                              type="text"
                              required
                              value={variant.sku}
                              onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-xs text-xs font-mono focus:outline-none focus:border-black"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                              Size
                            </label>
                            <input
                              type="text"
                              value={variant.attributes?.size || ''}
                              onChange={(e) =>
                                handleVariantChange(index, 'attributes', {
                                  ...variant.attributes,
                                  size: e.target.value,
                                })
                              }
                              placeholder="S, M, L, XL, Free Size"
                              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-xs text-xs focus:outline-none focus:border-black"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                              Color
                            </label>
                            <input
                              type="text"
                              value={variant.attributes?.color || ''}
                              onChange={(e) =>
                                handleVariantChange(index, 'attributes', {
                                  ...variant.attributes,
                                  color: e.target.value,
                                })
                              }
                              placeholder="Emerald, Ivory, Crimson"
                              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-xs text-xs focus:outline-none focus:border-black"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                              Buy Stock (Sale)
                            </label>
                            <input
                              type="number"
                              min="0"
                              disabled={currentMode === 'RENT_ONLY'}
                              value={variant.stockSaleAvailable ?? variant.stockAvailable ?? 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                handleVariantChange(index, 'stockSaleAvailable', val);
                                handleVariantChange(index, 'stockSaleTotal', val);
                              }}
                              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-xs text-xs font-mono focus:outline-none focus:border-black disabled:bg-neutral-200/60 disabled:text-neutral-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                              Rent Stock (Fleet)
                            </label>
                            <input
                              type="number"
                              min="0"
                              disabled={currentMode === 'BUY_ONLY'}
                              value={variant.stockRentAvailable ?? 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                handleVariantChange(index, 'stockRentAvailable', val);
                                handleVariantChange(index, 'stockRentTotal', val);
                              }}
                              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-xs text-xs font-mono focus:outline-none focus:border-black disabled:bg-neutral-200/60 disabled:text-neutral-400"
                            />
                          </div>
                        </div>

                        {/* Price Fields */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                          <div>
                            <label className="block text-[9px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                              Purchase Price (IDR)
                            </label>
                            <input
                              type="number"
                              disabled={currentMode === 'RENT_ONLY'}
                              value={variant.priceSale ?? ''}
                              onChange={(e) =>
                                handleVariantChange(
                                  index,
                                  'priceSale',
                                  e.target.value !== '' ? parseFloat(e.target.value) : null
                                )
                              }
                              placeholder={currentMode === 'RENT_ONLY' ? 'Disabled for Rent Only' : '0'}
                              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-xs text-xs font-mono focus:outline-none focus:border-black disabled:bg-neutral-200/60 disabled:text-neutral-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                              Rental Rate (IDR)
                            </label>
                            <input
                              type="number"
                              disabled={currentMode === 'BUY_ONLY'}
                              value={variant.priceRent ?? ''}
                              onChange={(e) =>
                                handleVariantChange(
                                  index,
                                  'priceRent',
                                  e.target.value !== '' ? parseFloat(e.target.value) : null
                                )
                              }
                              placeholder={currentMode === 'BUY_ONLY' ? 'Disabled for Buy Only' : '0'}
                              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-xs text-xs font-mono focus:outline-none focus:border-black disabled:bg-neutral-200/60 disabled:text-neutral-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                              Compare-At / List (IDR)
                            </label>
                            <input
                              type="number"
                              value={variant.compareAtPrice ?? ''}
                              onChange={(e) =>
                                handleVariantChange(
                                  index,
                                  'compareAtPrice',
                                  e.target.value !== '' ? parseFloat(e.target.value) : null
                                )
                              }
                              placeholder="Original price for discount"
                              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-xs text-xs font-mono focus:outline-none focus:border-black"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase tracking-wider text-neutral-600 font-medium mb-1">
                              Cost Price / COGS (IDR)
                            </label>
                            <input
                              type="number"
                              value={variant.costPrice ?? ''}
                              onChange={(e) =>
                                handleVariantChange(
                                  index,
                                  'costPrice',
                                  e.target.value !== '' ? parseFloat(e.target.value) : null
                                )
                              }
                              placeholder="Production cost"
                              className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-xs text-xs font-mono focus:outline-none focus:border-black"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Actions */}
              <div className="pt-4 border-t border-neutral-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-neutral-300 uppercase tracking-widest text-[10px] text-neutral-700 hover:border-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-black text-white px-6 py-2.5 uppercase tracking-widest text-[10px] font-medium hover:bg-neutral-800 transition-colors flex items-center space-x-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving Product...' : editingProduct ? 'Update Product' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 p-6 rounded-sm w-full max-w-md space-y-4 shadow-xl">
            <h3 className="font-serif text-lg text-neutral-900">Delete Product</h3>
            <p className="text-xs text-neutral-600">
              Are you sure you want to delete this product? If the product has past order records, it will be deactivated instead of deleted.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeletingProductId(null)}
                className="px-4 py-2 border border-neutral-300 uppercase tracking-widest text-[10px] text-neutral-700 hover:border-black"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deletingProductId)}
                disabled={isDeleting}
                className="bg-red-600 text-white px-4 py-2 uppercase tracking-widest text-[10px] font-medium hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
