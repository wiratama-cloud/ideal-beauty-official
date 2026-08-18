'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  X,
  Sparkles,
  Upload,
  Plus,
  Trash2,
  ImageIcon,
  Layers,
  FileText,
  AlertCircle,
  GripVertical,
  ShoppingBag,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Prisma } from '@prisma/client';
import { ProductSerialized } from './types';
import { CreateProductInput, VariantInput } from '@/app/actions/admin';
import { getOptimizedImageUrl } from '@/lib/utils/image-url';

interface SizeChartOption {
  id: string;
  name: string;
  type?: string;
  category?: string | null;
  isDefault?: boolean;
}

interface ProductDrawerEditorProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductSerialized | null;
  categories: string[];
  sizeCharts?: SizeChartOption[];
  onSave: (data: CreateProductInput) => Promise<void>;
  isSaving: boolean;
  errorMessage: string;
}

export default function ProductDrawerEditor({
  isOpen,
  onClose,
  product,
  categories,
  sizeCharts,
  onSave,
  isSaving,
  errorMessage,
}: ProductDrawerEditorProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'media' | 'variants'>('general');

  // Form states
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('Ready To Wear');
  const [formDescription, setFormDescription] = useState('');
  const [formSizeChartId, setFormSizeChartId] = useState<string>('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formVariants, setFormVariants] = useState<VariantInput[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [isDragOverDropzone, setIsDragOverDropzone] = useState(false);
  const [collapsedIndexes, setCollapsedIndexes] = useState<Record<number, boolean>>({});

  const toggleCollapseVariant = (index: number) => {
    setCollapsedIndexes((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleExpandAllVariants = () => {
    setCollapsedIndexes({});
  };

  const handleCollapseAllVariants = () => {
    const allCollapsed: Record<number, boolean> = {};
    formVariants.forEach((_, i) => {
      allCollapsed[i] = true;
    });
    setCollapsedIndexes(allCollapsed);
  };

  const [prevProductKey, setPrevProductKey] = useState<string | null>(null);
  const currentKey = product ? product.id : 'new-product';

  if (isOpen && currentKey !== prevProductKey) {
    setPrevProductKey(currentKey);
    if (product) {
      setFormName(product.name || '');
      setFormSlug(product.slug || '');
      setFormCategory(product.category || 'Ready To Wear');
      setFormDescription(product.description || '');
      setFormSizeChartId((product as any).sizeChartId || '');
      setFormImages(product.images && product.images.length > 0 ? product.images : []);
      setFormIsActive(product.isActive ?? true);
      setFormVariants(
        product.variants && product.variants.length > 0
          ? product.variants.map((v) => ({
              id: v.id,
              sku: v.sku,
              skuSale: v.skuSale || '',
              skuRent: v.skuRent || '',
              isPreOrder: v.isPreOrder ?? false,
              preOrderShipDate: v.preOrderShipDate
                ? new Date(v.preOrderShipDate).toISOString().split('T')[0]
                : '',
              preOrderDays: v.preOrderDays ?? (v.isPreOrder ? 15 : null),
              preOrderNote: v.preOrderNote || '',
              attributes: (v.attributes as Record<string, Prisma.InputJsonValue>) || { size: 'Free Size' },
              priceSale: v.priceSale,
              priceRent: v.priceRent,
              compareAtPrice: v.compareAtPrice,
              costPrice: v.costPrice,
              stockSaleTotal: v.stockSaleTotal ?? v.stockTotal ?? 0,
              stockSaleAvailable: v.stockSaleAvailable ?? v.stockAvailable ?? 0,
              stockRentTotal: v.stockRentTotal ?? 0,
              stockRentAvailable: v.stockRentAvailable ?? 0,
              stockTotal: v.stockTotal ?? 0,
              stockAvailable: v.stockAvailable ?? 0,
            }))
          : [
              {
                sku: 'SKU-001',
                skuSale: 'SKU-001-BUY',
                skuRent: 'SKU-001-RENT',
                isPreOrder: false,
                preOrderShipDate: '',
                preOrderDays: null,
                preOrderNote: '',
                attributes: { size: 'Free Size' },
                priceSale: 250000,
                priceRent: 100000,
                stockSaleTotal: 5,
                stockSaleAvailable: 5,
                stockRentTotal: 2,
                stockRentAvailable: 2,
                stockTotal: 7,
                stockAvailable: 7,
              },
            ]
      );
    } else {
      // Reset for New Product creation
      setFormName('');
      setFormSlug('');
      setFormCategory('Ready To Wear');
      setFormDescription('');
      setFormSizeChartId('');
      setFormImages(['/images/products/default-product.jpg']);
      setFormIsActive(true);
      setFormVariants([
        {
          sku: 'SKU-001',
          skuSale: 'SKU-001-BUY',
          skuRent: 'SKU-001-RENT',
          isPreOrder: false,
          preOrderShipDate: '',
          preOrderDays: null,
          preOrderNote: '',
          attributes: { size: 'Free Size' },
          priceSale: 250000,
          priceRent: 100000,
          stockSaleTotal: 5,
          stockSaleAvailable: 5,
          stockRentTotal: 2,
          stockRentAvailable: 2,
          stockTotal: 7,
          stockAvailable: 7,
        },
      ]);
    }
    setActiveTab('general');
  }

  if (!isOpen) return null;

  // Auto slug generator
  const handleAutoSlug = () => {
    const slug = formName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setFormSlug(slug);
  };

  // Image Upload handler
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'products');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload image');
      }
      const data = await res.json();
      if (data.url) {
        setFormImages((prev) => [...prev, data.url]);
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      alert(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleDropzoneDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOverDropzone(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          await uploadFile(file);
        }
      }
    }
  };

  const handleReorderImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setFormImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const handleRemoveImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setFormImages((prev) => {
      const updated = [...prev];
      const [selected] = updated.splice(index, 1);
      return [selected, ...updated];
    });
  };

  // Variant generator helper
  const handleAddVariant = () => {
    const num = Math.floor(100 + Math.random() * 900);
    const nextSku = `SKU-${num}`;
    setFormVariants((prev) => [
      ...prev,
      {
        sku: nextSku,
        skuSale: `${nextSku}-BUY`,
        skuRent: `${nextSku}-RENT`,
        isPreOrder: false,
        preOrderShipDate: '',
        preOrderNote: '',
        attributes: { size: 'Free Size' },
        priceSale: 250000,
        priceRent: 100000,
        stockSaleTotal: 5,
        stockSaleAvailable: 5,
        stockRentTotal: 0,
        stockRentAvailable: 0,
        stockTotal: 5,
        stockAvailable: 5,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (formVariants.length <= 1) {
      alert('Product must have at least one variant.');
      return;
    }
    setFormVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (
    index: number,
    field: keyof VariantInput,
    value: string | number | boolean | Record<string, string> | null
  ) => {
    setFormVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSelectPreOrderDuration = (index: number, days: number | null) => {
    setFormVariants((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        preOrderDays: days,
        preOrderNote: days !== null ? `Ships in ${days} Days` : updated[index].preOrderNote || '',
      };
      return updated;
    });
  };

  const getActivePreOrderPreset = (daysVal?: number | null, noteVal?: string | null): '15' | '30' | '45' | 'custom' => {
    if (daysVal === 15) return '15';
    if (daysVal === 30) return '30';
    if (daysVal === 45) return '45';
    const note = (noteVal || '').toLowerCase();
    if (note.includes('15 days') || note.includes('15 day')) return '15';
    if (note.includes('30 days') || note.includes('30 day')) return '30';
    if (note.includes('45 days') || note.includes('45 day')) return '45';

    return 'custom';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Product name is required');
      return;
    }

    const payload: CreateProductInput = {
      name: formName.trim(),
      slug: formSlug.trim() || formName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: formCategory,
      description: formDescription,
      sizeChartId: formSizeChartId || null,
      images: formImages.length > 0 ? formImages : ['/images/products/default-product.jpg'],
      isActive: formIsActive,
      variants: formVariants,
    };

    await onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-2xl w-full bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-900 text-white">
          <div>
            <h2 className="font-serif text-lg font-light tracking-wide">
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              {product ? `Managing /${product.slug}` : 'Create a new catalog entry with variants and pricing.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xs hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-6 text-xs font-medium text-neutral-500">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'general'
                ? 'border-neutral-900 text-neutral-900 font-semibold'
                : 'border-transparent hover:text-neutral-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>General Details</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'media'
                ? 'border-neutral-900 text-neutral-900 font-semibold'
                : 'border-transparent hover:text-neutral-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Media Gallery ({formImages.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'variants'
                ? 'border-neutral-900 text-neutral-900 font-semibold'
                : 'border-transparent hover:text-neutral-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Variant Generator ({formVariants.length})</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white text-neutral-900">
          {/* TAB 1: General Details */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Silk Evening Gown"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xs px-3.5 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 shadow-2xs transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-mono font-semibold text-neutral-600 uppercase tracking-wider">
                    Slug *
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoSlug}
                    className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="silk-evening-gown"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xs px-3.5 py-2 text-xs text-neutral-900 font-mono focus:outline-none focus:border-neutral-400 shadow-2xs transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xs px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-400 shadow-2xs cursor-pointer"
                >
                  {categories
                    .filter((c) => c !== 'All')
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  {!categories.includes('Ready To Wear') && <option value="Ready To Wear">Ready To Wear</option>}
                  {!categories.includes('Evening Wear') && <option value="Evening Wear">Evening Wear</option>}
                  {!categories.includes('Bridal') && <option value="Bridal">Bridal</option>}
                  {!categories.includes('Accessories') && <option value="Accessories">Accessories</option>}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Linked Size Chart Template
                </label>
                <select
                  value={formSizeChartId}
                  onChange={(e) => setFormSizeChartId(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xs px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-400 shadow-2xs cursor-pointer font-mono"
                >
                  <option value="">Default (Auto-fallback to global default chart)</option>
                  {sizeCharts?.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name} {sc.type === 'WEIGHT_HEIGHT' ? '[Weight & Height]' : '[Body CM]'} {sc.category ? `(${sc.category})` : ''} {sc.isDefault ? '[Default]' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-500 mt-1 font-sans">
                  Quickly link a dedicated size chart template for this product.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed garment description..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xs px-3.5 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 shadow-2xs transition-colors"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-xs">
                <div>
                  <span className="text-xs font-semibold text-neutral-900 block">Active Status</span>
                  <span className="text-[11px] text-neutral-500">
                    Control store visibility for customers.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded-xs border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Media Gallery */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              {/* Drag and Drop File Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOverDropzone(true);
                }}
                onDragLeave={() => setIsDragOverDropzone(false)}
                onDrop={handleDropzoneDrop}
                className={`p-6 border-2 border-dashed rounded-xs text-center cursor-pointer transition-colors ${
                  isDragOverDropzone
                    ? 'border-neutral-900 bg-neutral-100 text-neutral-900'
                    : 'border-neutral-300 bg-neutral-50 text-neutral-600 hover:border-neutral-400'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <Upload className="w-5 h-5 text-neutral-500" />
                  <span className="text-xs font-medium text-neutral-800">
                    Drag & drop product images here to upload
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    Supports JPG, PNG, WEBP files
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="block text-[10px] font-mono font-semibold text-neutral-600 uppercase tracking-wider">
                  Product Image Upload
                </label>
                <div>
                  <label className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-xs text-xs cursor-pointer flex items-center justify-center gap-2 transition-colors shadow-2xs">
                    <Upload className="w-4 h-4" />
                    <span>{isUploading ? 'Uploading...' : 'Upload Image File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Image Preview List with Drag-and-Drop Reordering */}
              <div className="space-y-2">
                <span className="text-xs text-neutral-600 font-medium">
                  Image Gallery ({formImages.length} items) - Drag items to reorder. First image is Primary.
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {formImages.map((imgUrl, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', index.toString());
                        setDraggedImageIndex(index);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedImageIndex !== null) {
                          handleReorderImage(draggedImageIndex, index);
                          setDraggedImageIndex(null);
                        }
                      }}
                      onDragEnd={() => setDraggedImageIndex(null)}
                      className={`group relative bg-neutral-50 border rounded-xs p-2 flex flex-col items-center cursor-grab active:cursor-grabbing transition-all ${
                        draggedImageIndex === index
                          ? 'border-neutral-900 opacity-50 scale-95'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="relative w-full h-32 bg-neutral-100 rounded-xs overflow-hidden mb-2">
                        <Image
                          src={getOptimizedImageUrl(imgUrl, 768)}
                          alt={`Product media ${index}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        {index === 0 && (
                          <span className="absolute top-1.5 left-1.5 bg-neutral-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded-xs">
                            Primary
                          </span>
                        )}
                        <span className="absolute top-1.5 right-1.5 bg-neutral-900/60 text-white p-1 rounded-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      <div className="flex items-center justify-between w-full text-[11px]">
                        {index !== 0 ? (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(index)}
                            className="text-neutral-500 hover:text-neutral-900 cursor-pointer font-medium"
                          >
                            Set Primary
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-medium">Primary Image</span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Variant Generator Matrix */}
          {activeTab === 'variants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider font-mono">
                    Product Variants ({formVariants.length})
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Configure pricing, stock, and SKU attributes per variant.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {formVariants.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const allCollapsed = formVariants.every((_, i) => collapsedIndexes[i]);
                        if (allCollapsed) handleExpandAllVariants();
                        else handleCollapseAllVariants();
                      }}
                      className="px-2.5 py-1.5 text-neutral-600 hover:text-neutral-900 text-xs border border-neutral-200 hover:border-neutral-300 rounded-xs transition-colors font-medium bg-white cursor-pointer shadow-2xs"
                    >
                      {formVariants.every((_, i) => collapsedIndexes[i]) ? 'Expand All' : 'Collapse All'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-xs text-xs transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Variant
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {formVariants.map((variant, index) => {
                  const isCollapsed = Boolean(collapsedIndexes[index]);
                  const variantSize = ((variant.attributes as Record<string, string> | null)?.size) || 'Free Size';

                  return (
                    <div
                      key={index}
                      className="bg-neutral-50/50 border border-neutral-200 rounded-xs overflow-hidden transition-all shadow-2xs"
                    >
                      {/* Variant Header - Clickable to Expand / Collapse */}
                      <div className="p-3.5 flex items-center justify-between bg-neutral-100/70 hover:bg-neutral-100 transition-colors border-b border-neutral-200">
                        <div
                          onClick={() => toggleCollapseVariant(index)}
                          className="flex items-center gap-2.5 cursor-pointer select-none flex-1 min-w-0 pr-3"
                        >
                          <span className="p-1 text-neutral-500 hover:text-neutral-900 rounded-xs hover:bg-neutral-200 transition-colors">
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4 text-neutral-500" />
                            ) : (
                              <ChevronUp className="w-4 h-4 text-neutral-500" />
                            )}
                          </span>
                          <span className="text-xs font-mono font-semibold text-neutral-800 bg-white border border-neutral-200 px-2 py-0.5 rounded-xs flex-shrink-0">
                            Variant #{index + 1}
                          </span>
                          <span className="text-[11px] text-neutral-700 font-mono flex-shrink-0">
                            {variant.sku || 'Unassigned SKU'}
                          </span>

                          {isCollapsed && (
                            <div className="flex items-center gap-2 text-[11px] text-neutral-500 truncate ml-2">
                              <span className="bg-white px-2 py-0.5 rounded-xs border border-neutral-200 font-medium text-neutral-700">
                                {variantSize}
                              </span>
                              {variant.priceSale && (
                                <span className="text-emerald-700 font-mono">
                                  Sale: Rp {Number(variant.priceSale).toLocaleString('id-ID')}
                                </span>
                              )}
                              {variant.priceRent && (
                                <span className="text-amber-700 font-mono">
                                  Rent: Rp {Number(variant.priceRent).toLocaleString('id-ID')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {formVariants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(index)}
                              className="text-rose-600 hover:text-rose-700 text-xs flex items-center gap-1 font-medium px-2 py-1 rounded-xs hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Collapsible Content Body */}
                      {!isCollapsed && (
                        <div className="p-4 space-y-4 bg-white">
                          {/* Shared Variant Identity */}
                          <div className="grid grid-cols-2 gap-3 text-xs bg-neutral-50 p-3 rounded-xs border border-neutral-200">
                            <div>
                              <label className="block text-[10px] font-mono font-semibold text-neutral-600 uppercase tracking-wider mb-1">Base SKU *</label>
                              <input
                                type="text"
                                required
                                value={variant.sku}
                                onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                                className="w-full bg-white border border-neutral-200 rounded-xs px-2.5 py-1.5 text-neutral-900 font-mono focus:outline-none focus:border-neutral-400"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-mono font-semibold text-neutral-600 uppercase tracking-wider mb-1">Size / Option Attribute</label>
                              <input
                                type="text"
                                value={((variant.attributes as Record<string, string> | null)?.size) || 'Free Size'}
                                onChange={(e) =>
                                  handleVariantChange(index, 'attributes', {
                                    ...((variant.attributes as Record<string, string> | null) || {}),
                                    size: e.target.value,
                                  })
                                }
                                className="w-full bg-white border border-neutral-200 rounded-xs px-2.5 py-1.5 text-neutral-900 focus:outline-none focus:border-neutral-400"
                              />
                            </div>
                          </div>

                          {/* 🛍️ BUY / RETAIL SALE OPTION */}
                          <div className="pt-3 border-t border-neutral-200 space-y-3">
                            <div className="flex items-center justify-between pb-1">
                              <div className="flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Buy / Retail Sale Option</span>
                              </div>
                              <span className="text-[10px] text-emerald-700 font-mono font-semibold uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded-xs">
                                Purchase Mode
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                              <div>
                                <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">SKU (Buy/Sale)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. SKU-001-BUY"
                                  value={variant.skuSale || ''}
                                  onChange={(e) => handleVariantChange(index, 'skuSale', e.target.value)}
                                  className="w-full bg-white border border-neutral-200 rounded-xs px-2.5 py-1.5 text-neutral-900 font-mono focus:outline-none focus:border-neutral-400"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Sale Price (IDR)</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 250000"
                                  value={variant.priceSale ?? ''}
                                  onChange={(e) =>
                                    handleVariantChange(
                                      index,
                                      'priceSale',
                                      e.target.value ? parseFloat(e.target.value) : null
                                    )
                                  }
                                  className="w-full bg-white border border-neutral-200 rounded-xs px-2.5 py-1.5 text-neutral-900 focus:outline-none focus:border-neutral-400 font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Compare-at Price (IDR)</label>
                                <input
                                  type="number"
                                  placeholder="Original / Strikethrough"
                                  value={variant.compareAtPrice ?? ''}
                                  onChange={(e) =>
                                    handleVariantChange(
                                      index,
                                      'compareAtPrice',
                                      e.target.value ? parseFloat(e.target.value) : null
                                    )
                                  }
                                  className="w-full bg-white border border-neutral-200 rounded-xs px-2.5 py-1.5 text-neutral-900 focus:outline-none focus:border-neutral-400 font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Sale Stock Total</label>
                                <input
                                  type="number"
                                  value={variant.stockSaleTotal ?? variant.stockTotal ?? 0}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                    handleVariantChange(index, 'stockSaleTotal', val);
                                    handleVariantChange(index, 'stockTotal', val + (variant.stockRentTotal || 0));
                                  }}
                                  className="w-full bg-white border border-neutral-200 rounded-xs px-2.5 py-1.5 text-neutral-900 focus:outline-none focus:border-neutral-400 font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Sale Stock Available</label>
                                <input
                                  type="number"
                                  value={variant.stockSaleAvailable ?? variant.stockAvailable ?? 0}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                    handleVariantChange(index, 'stockSaleAvailable', val);
                                    handleVariantChange(index, 'stockAvailable', val + (variant.stockRentAvailable || 0));
                                  }}
                                  className="w-full bg-white border border-neutral-200 rounded-xs px-2.5 py-1.5 text-neutral-900 focus:outline-none focus:border-neutral-400 font-mono"
                                />
                              </div>
                            </div>

                            {/* Embedded Pre-Order Controls under Buy Option */}
                            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xs space-y-3 text-xs">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-semibold text-neutral-900 block">Pre-Order Option</span>
                                  <span className="text-[11px] text-neutral-500">
                                    Allow customers to buy this variant on pre-order when sale stock is 0.
                                  </span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={Boolean(variant.isPreOrder)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    handleVariantChange(index, 'isPreOrder', checked);
                                    if (checked && !variant.preOrderDays) {
                                      handleVariantChange(index, 'preOrderDays', 15);
                                      if (!variant.preOrderNote) {
                                        handleVariantChange(index, 'preOrderNote', 'Ships in 15 Days');
                                      }
                                    }
                                  }}
                                  className="w-4 h-4 rounded-xs border-neutral-300 text-amber-600 focus:ring-0 bg-white cursor-pointer"
                                />
                              </div>

                              {variant.isPreOrder && (
                                <div className="space-y-3 pt-2.5 border-t border-neutral-200">
                                  <div>
                                    <label className="block text-neutral-700 font-medium mb-1.5">
                                      Pre-Order Lead Time / Wait Duration
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      {[
                                        { id: '15', label: '15 Days', days: 15 },
                                        { id: '30', label: '30 Days', days: 30 },
                                        { id: '45', label: '45 Days', days: 45 },
                                        { id: 'custom', label: 'Custom', days: null },
                                      ].map((option) => {
                                        const activePreset = getActivePreOrderPreset(variant.preOrderDays, variant.preOrderNote);
                                        const isSelected = activePreset === option.id;

                                        return (
                                          <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => handleSelectPreOrderDuration(index, option.days)}
                                            className={`py-2 px-3 rounded-xs border text-center transition-all cursor-pointer font-medium text-xs ${
                                              isSelected
                                                ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold shadow-2xs'
                                                : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'
                                            }`}
                                          >
                                            {option.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div>
                                      <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Lead Time Days (Integer) *</label>
                                      <input
                                        type="number"
                                        min="1"
                                        placeholder="e.g. 15"
                                        value={variant.preOrderDays ?? ''}
                                        onChange={(e) => {
                                          const daysVal = e.target.value ? parseInt(e.target.value, 10) : null;
                                          handleVariantChange(index, 'preOrderDays', daysVal);
                                          if (daysVal) {
                                            handleVariantChange(index, 'preOrderNote', `Ships in ${daysVal} Days`);
                                          }
                                        }}
                                        className="w-full bg-white border border-neutral-200 rounded-xs px-2.5 py-1.5 text-neutral-900 focus:outline-none focus:border-neutral-400 font-mono"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Wait Duration Note</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Ships in 15 Days"
                                        value={variant.preOrderNote || ''}
                                        onChange={(e) => handleVariantChange(index, 'preOrderNote', e.target.value)}
                                        className="w-full bg-white border border-neutral-200 rounded-xs px-2.5 py-1.5 text-neutral-900 focus:outline-none focus:border-neutral-400"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 🗝️ RENTAL OPTION */}
                          <div className="pt-3 border-t border-neutral-200 space-y-3">
                            <div className="flex items-center justify-between pb-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-amber-600" />
                                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Rental Option</span>
                              </div>
                              <span className="text-[10px] text-amber-700 font-mono font-semibold uppercase tracking-wider bg-amber-50 px-1.5 py-0.5 rounded-xs">
                                Rental Mode
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              <div>
                                <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">SKU (Rent)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. SKU-001-RENT"
                                  value={variant.skuRent || ''}
                                  onChange={(e) => handleVariantChange(index, 'skuRent', e.target.value)}
                                  className="w-full bg-white border border-neutral-200 rounded-xs px-2.5 py-1.5 text-neutral-900 font-mono focus:outline-none focus:border-neutral-400"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Rent Price / 3-4 Days (IDR)</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 100000"
                                  value={variant.priceRent ?? ''}
                                  onChange={(e) =>
                                    handleVariantChange(
                                      index,
                                      'priceRent',
                                      e.target.value ? parseFloat(e.target.value) : null
                                    )
                                  }
                                  className="w-full bg-white border border-neutral-200 rounded-xs px-2.5 py-1.5 text-neutral-900 focus:outline-none focus:border-neutral-400 font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Rental Stock Total</label>
                                <input
                                  type="number"
                                  value={variant.stockRentTotal ?? 0}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                    handleVariantChange(index, 'stockRentTotal', val);
                                    handleVariantChange(index, 'stockTotal', (variant.stockSaleTotal || 0) + val);
                                  }}
                                  className="w-full bg-white border border-neutral-200 rounded-xs px-2.5 py-1.5 text-neutral-900 focus:outline-none focus:border-neutral-400 font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Rental Stock Available</label>
                                <input
                                  type="number"
                                  value={variant.stockRentAvailable ?? 0}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                    handleVariantChange(index, 'stockRentAvailable', val);
                                    handleVariantChange(index, 'stockAvailable', (variant.stockSaleAvailable || 0) + val);
                                  }}
                                  className="w-full bg-white border border-neutral-200 rounded-xs px-2.5 py-1.5 text-neutral-900 focus:outline-none focus:border-neutral-400 font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Drawer Footer Actions */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 font-medium text-xs rounded-xs transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs rounded-xs shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Saving...' : product ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
