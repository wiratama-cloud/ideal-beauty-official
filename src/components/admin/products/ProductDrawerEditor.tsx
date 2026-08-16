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
} from 'lucide-react';
import { Prisma } from '@prisma/client';
import { ProductSerialized } from './types';
import { CreateProductInput, VariantInput } from '@/app/actions/admin';

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
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload image');
      const data = await res.json();
      if (data.url) {
        setFormImages((prev) => [...prev, data.url]);
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Failed to upload image. Please try again.');
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-neutral-900 border-l border-neutral-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-xs text-neutral-400">
              {product ? `Managing /${product.slug}` : 'Create a new catalog entry with variants and pricing.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-850 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/50 px-5 text-xs font-medium text-neutral-400">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-white text-white font-semibold'
                : 'border-transparent hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>General Details</span>
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'media'
                ? 'border-white text-white font-semibold'
                : 'border-transparent hover:text-neutral-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Media Gallery ({formImages.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('variants')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'variants'
                ? 'border-white text-white font-semibold'
                : 'border-transparent hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Variant Generator ({formVariants.length})</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: General Details */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Silk Evening Gown"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                    Slug *
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoSlug}
                    className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white"
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
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
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
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Linked Size Chart Template
                </label>
                <select
                  value={formSizeChartId}
                  onChange={(e) => setFormSizeChartId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-neutral-600 font-mono"
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
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed garment description..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                <div>
                  <span className="text-xs font-semibold text-white block">Active Status</span>
                  <span className="text-[11px] text-neutral-400">
                    Control store visibility for customers.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-5 h-5 rounded border-neutral-700 text-emerald-500 focus:ring-0 bg-neutral-900"
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
                className={`p-4 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
                  isDragOverDropzone
                    ? 'border-white bg-neutral-800/80 text-white'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <Upload className="w-5 h-5 text-neutral-400" />
                  <span className="text-xs font-medium text-neutral-200">
                    Drag & drop product images here to upload
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    Supports JPG, PNG, WEBP files
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Product Image Upload
                </label>
                <div>
                  <label className="w-full py-2.5 bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-2 transition-colors shadow-sm">
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
                <span className="text-xs text-neutral-400 font-medium">
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
                      className={`group relative bg-neutral-950 border rounded-lg p-2 flex flex-col items-center cursor-grab active:cursor-grabbing transition-all ${
                        draggedImageIndex === index
                          ? 'border-white opacity-50 scale-95'
                          : 'border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="relative w-full h-32 bg-neutral-900 rounded overflow-hidden mb-2">
                        <Image
                          src={imgUrl}
                          alt={`Product media ${index}`}
                          fill
                          className="object-cover"
                        />
                        {index === 0 && (
                          <span className="absolute top-1.5 left-1.5 bg-black/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded border border-neutral-700">
                            Primary
                          </span>
                        )}
                        <span className="absolute top-1.5 right-1.5 bg-black/60 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      <div className="flex items-center justify-between w-full text-[11px]">
                        {index !== 0 ? (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(index)}
                            className="text-neutral-400 hover:text-white"
                          >
                            Set Primary
                          </button>
                        ) : (
                          <span className="text-emerald-400 font-medium">Primary Image</span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="text-rose-400 hover:text-rose-300 p-1"
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
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                    Product Variants ({formVariants.length})
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Configure pricing, stock, and SKU attributes per variant.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Variant
                </button>
              </div>

              <div className="space-y-3">
                {formVariants.map((variant, index) => (
                  <div
                    key={index}
                    className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <span className="text-xs font-bold text-neutral-300">
                        Variant #{index + 1}
                      </span>
                      {formVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-neutral-400 mb-1">Base SKU *</label>
                        <input
                          type="text"
                          required
                          value={variant.sku}
                          onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-400 mb-1">SKU (Buy/Sale)</label>
                        <input
                          type="text"
                          placeholder="e.g. SKU-001-BUY"
                          value={variant.skuSale || ''}
                          onChange={(e) => handleVariantChange(index, 'skuSale', e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-400 mb-1">SKU (Rent)</label>
                        <input
                          type="text"
                          placeholder="e.g. SKU-001-RENT"
                          value={variant.skuRent || ''}
                          onChange={(e) => handleVariantChange(index, 'skuRent', e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-400 mb-1">Size Attribute</label>
                        <input
                          type="text"
                          value={((variant.attributes as Record<string, string> | null)?.size) || 'Free Size'}
                          onChange={(e) =>
                            handleVariantChange(index, 'attributes', {
                              ...((variant.attributes as Record<string, string> | null) || {}),
                              size: e.target.value,
                            })
                          }
                          className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-400 mb-1">Sale Price (IDR)</label>
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
                          className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-400 mb-1">Rent Price (IDR)</label>
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
                          className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-400 mb-1">Initial Stock Total</label>
                        <input
                          type="number"
                          value={variant.stockSaleTotal ?? variant.stockTotal ?? 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            handleVariantChange(index, 'stockSaleTotal', val);
                            handleVariantChange(index, 'stockTotal', val);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-400 mb-1">Initial Stock Available</label>
                        <input
                          type="number"
                          value={variant.stockSaleAvailable ?? variant.stockAvailable ?? 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            handleVariantChange(index, 'stockSaleAvailable', val);
                            handleVariantChange(index, 'stockAvailable', val);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-white"
                        />
                      </div>
                    </div>

                    {/* Pre-Order Controls */}
                    <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-white block">Pre-Order Option</span>
                          <span className="text-[11px] text-neutral-400">
                            Allow customers to buy this variant on pre-order when stock is 0.
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(variant.isPreOrder)}
                          onChange={(e) => handleVariantChange(index, 'isPreOrder', e.target.checked)}
                          className="w-4 h-4 rounded border-neutral-700 text-amber-500 focus:ring-0 bg-neutral-800"
                        />
                      </div>

                      {variant.isPreOrder && (
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-800">
                          <div>
                            <label className="block text-neutral-400 mb-1">Estimated Ship Date</label>
                            <input
                              type="date"
                              value={
                                variant.preOrderShipDate
                                  ? typeof variant.preOrderShipDate === 'string'
                                    ? variant.preOrderShipDate.split('T')[0]
                                    : new Date(variant.preOrderShipDate).toISOString().split('T')[0]
                                  : ''
                              }
                              onChange={(e) => handleVariantChange(index, 'preOrderShipDate', e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-neutral-400 mb-1">Pre-Order Note</label>
                            <input
                              type="text"
                              placeholder="e.g. Ships in 2-3 weeks"
                              value={variant.preOrderNote || ''}
                              onChange={(e) => handleVariantChange(index, 'preOrderNote', e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drawer Footer Actions */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3 sticky bottom-0 bg-neutral-900 py-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : product ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
