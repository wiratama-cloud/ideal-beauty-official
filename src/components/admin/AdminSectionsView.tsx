'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  ExternalLink,
  PackageCheck,
  Upload,
  X,
  Save,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  createLandingSectionAction,
  updateLandingSectionAction,
  deleteLandingSectionAction,
  createLandingSectionItemAction,
  updateLandingSectionItemAction,
  deleteLandingSectionItemAction,
  updateHeroBannerAction,
} from '@/app/actions/admin';
import { HeroBannerData, DEFAULT_HERO_BANNER } from '@/lib/types/hero-banner';
import AdminHeader from '@/components/admin/AdminHeader';

type SectionType = 'NEW_ARRIVALS' | 'FEATURED_BRANDS' | 'EDITORS_PICKS' | 'CUSTOM_GRID' | 'PROMO_BANNER';

interface AdminSectionsViewProps {
  initialSections: any[];
  products: any[];
  initialHeroBanner?: HeroBannerData | null;
}

export default function AdminSectionsView({
  initialSections,
  products,
  initialHeroBanner,
}: AdminSectionsViewProps) {
  const [sections, setSections] = useState(
    initialSections.filter((s) => s.type !== 'HERO_BANNER')
  );
  const [heroBanner, setHeroBanner] = useState<HeroBannerData>(
    initialHeroBanner || DEFAULT_HERO_BANNER
  );
  const [isEditingHero, setIsEditingHero] = useState(false);
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(
    initialSections[0]?.id || null
  );

  // New Section Form state
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionSubtitle, setNewSectionSubtitle] = useState('');
  const [newSectionType, setNewSectionType] = useState<SectionType>('NEW_ARRIVALS');
  const [newSectionViewAllUrl, setNewSectionViewAllUrl] = useState('/products');
  const [newSectionTabs, setNewSectionTabs] = useState('Women, Men, Kids');
  const [newSectionDisplayOrder, setNewSectionDisplayOrder] = useState(0);

  // Edit Section Form state
  const [editSectionTitle, setEditSectionTitle] = useState('');
  const [editSectionSubtitle, setEditSectionSubtitle] = useState('');
  const [editSectionType, setEditSectionType] = useState<SectionType>('NEW_ARRIVALS');
  const [editSectionViewAllUrl, setEditSectionViewAllUrl] = useState('');
  const [editSectionTabs, setEditSectionTabs] = useState('');
  const [editSectionDisplayOrder, setEditSectionDisplayOrder] = useState(0);

  // Item Form state (Add or Edit)
  const [addingItemToSectionId, setAddingItemToSectionId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [itemTitle, setItemTitle] = useState('');
  const [itemSubtitle, setItemSubtitle] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemLinkUrl, setItemLinkUrl] = useState('');
  const [itemCategoryTab, setItemCategoryTab] = useState('');
  const [itemProductId, setItemProductId] = useState('');
  const [itemDisplayOrder, setItemDisplayOrder] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSaveHeroBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingHero(true);
    try {
      await updateHeroBannerAction(heroBanner);
      setIsEditingHero(false);
      showNotification('Hero banner updated successfully');
    } catch (err) {
      console.error('Failed to save hero banner:', err);
      alert('Failed to save hero banner');
    } finally {
      setIsSavingHero(false);
    }
  };

  // Upload handler for image files
  const handleFileUpload = async (
    file: File,
    setUrlCallback: (url: string) => void
  ) => {
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setUrlCallback(data.url);
        showNotification('Image uploaded successfully');
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Error uploading image file');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;

    setIsLoading(true);
    try {
      const tabsArray = newSectionTabs
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const created = await createLandingSectionAction({
        title: newSectionTitle,
        subtitle: newSectionSubtitle || undefined,
        type: newSectionType,
        viewAllUrl: newSectionViewAllUrl || undefined,
        tabs: tabsArray,
        displayOrder: Number(newSectionDisplayOrder) || 0,
        isActive: true,
      });

      setSections((prev) => [...prev, { ...created, items: [] }]);
      setIsCreatingSection(false);
      setNewSectionTitle('');
      setNewSectionSubtitle('');
      setNewSectionType('NEW_ARRIVALS');
      setNewSectionViewAllUrl('/products');
      setNewSectionTabs('Women, Men, Kids');
      showNotification('Landing section created successfully');
    } catch (err) {
      console.error('Failed to create section:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditingSection = (section: any) => {
    setEditingSection(section);
    setEditSectionTitle(section.title || '');
    setEditSectionSubtitle(section.subtitle || '');
    setEditSectionType(section.type || 'NEW_ARRIVALS');
    setEditSectionViewAllUrl(section.viewAllUrl || '');
    setEditSectionTabs(section.tabs ? section.tabs.join(', ') : '');
    setEditSectionDisplayOrder(section.displayOrder || 0);
  };

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection || !editSectionTitle.trim()) return;

    setIsLoading(true);
    try {
      const tabsArray = editSectionTabs
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const updated = await updateLandingSectionAction(editingSection.id, {
        title: editSectionTitle,
        subtitle: editSectionSubtitle || undefined,
        type: editSectionType,
        viewAllUrl: editSectionViewAllUrl || undefined,
        tabs: tabsArray,
        displayOrder: Number(editSectionDisplayOrder) || 0,
      });

      if (updated) {
        setSections((prev) =>
          prev.map((s) => (s.id === editingSection.id ? { ...s, ...updated } : s))
        );
        showNotification('Section updated successfully');
      }

      setEditingSection(null);
    } catch (err) {
      console.error('Failed to update section:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (section: any) => {
    try {
      const updated = await updateLandingSectionAction(section.id, {
        isActive: !section.isActive,
      });
      if (updated) {
        setSections((prev) =>
          prev.map((s) => (s.id === section.id ? { ...s, isActive: updated.isActive } : s))
        );
        showNotification(`Section status updated to ${updated.isActive ? 'Active' : 'Inactive'}`);
      }
    } catch (err) {
      console.error('Failed to toggle active status:', err);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this landing section?')) return;
    try {
      await deleteLandingSectionAction(id);
      setSections((prev) => prev.filter((s) => s.id !== id));
      showNotification('Landing section deleted');
    } catch (err) {
      console.error('Failed to delete section:', err);
    }
  };

  // Add Item Start
  const startAddingItem = (sectionId: string) => {
    setAddingItemToSectionId(sectionId);
    setEditingItem(null);
    setItemTitle('');
    setItemSubtitle('');
    setItemImageUrl('');
    setItemLinkUrl('');
    setItemCategoryTab('');
    setItemProductId('');
    setItemDisplayOrder(0);
  };

  // Edit Item Start
  const startEditingItem = (item: any) => {
    setEditingItem(item);
    setAddingItemToSectionId(null);
    setItemCategoryTab(item.categoryTab || '');
    setItemProductId(item.productId || '');
    setItemDisplayOrder(item.displayOrder || 0);

    const selectedP = products.find((p) => p.id === item.productId);
    if (selectedP) {
      setItemTitle(selectedP.name);
      setItemSubtitle(selectedP.category || '');
      setItemImageUrl(selectedP.images?.[0] || '/images/products/default-product.jpg');
      setItemLinkUrl(`/products/${selectedP.slug}`);
    } else {
      setItemTitle(item.title || '');
      setItemSubtitle(item.subtitle || '');
      setItemImageUrl(item.imageUrl || '');
      setItemLinkUrl(item.linkUrl || '');
    }
  };

  const handleAddItem = async (sectionId: string) => {
    if (!itemProductId) {
      alert('Please select an existing product to link.');
      return;
    }

    const selectedProduct = products.find((p) => p.id === itemProductId);
    const finalTitle = selectedProduct ? selectedProduct.name : itemTitle;
    const finalSubtitle = selectedProduct ? selectedProduct.category : itemSubtitle;
    const finalImageUrl = selectedProduct ? (selectedProduct.images?.[0] || '/images/products/default-product.jpg') : itemImageUrl;
    const finalLinkUrl = selectedProduct ? `/products/${selectedProduct.slug}` : itemLinkUrl;

    setIsLoading(true);
    try {
      const created = await createLandingSectionItemAction({
        sectionId,
        title: finalTitle || undefined,
        subtitle: finalSubtitle || undefined,
        imageUrl: finalImageUrl || undefined,
        linkUrl: finalLinkUrl || undefined,
        categoryTab: itemCategoryTab || undefined,
        productId: itemProductId || undefined,
        displayOrder: Number(itemDisplayOrder) || 0,
      });

      setSections((prev) =>
        prev.map((s) => {
          if (s.id === sectionId) {
            return {
              ...s,
              items: [...s.items, { ...created, product: selectedProduct || null }],
            };
          }
          return s;
        })
      );

      setAddingItemToSectionId(null);
      showNotification('Item added to section');
    } catch (err) {
      console.error('Failed to add item:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateItem = async (sectionId: string, itemId: string) => {
    if (!itemProductId) {
      alert('Please select an existing product to link.');
      return;
    }

    const selectedProduct = products.find((p) => p.id === itemProductId);
    const finalTitle = selectedProduct ? selectedProduct.name : itemTitle;
    const finalSubtitle = selectedProduct ? selectedProduct.category : itemSubtitle;
    const finalImageUrl = selectedProduct ? (selectedProduct.images?.[0] || '/images/products/default-product.jpg') : itemImageUrl;
    const finalLinkUrl = selectedProduct ? `/products/${selectedProduct.slug}` : itemLinkUrl;

    setIsLoading(true);
    try {
      const updated = await updateLandingSectionItemAction(itemId, {
        sectionId,
        title: finalTitle || undefined,
        subtitle: finalSubtitle || undefined,
        imageUrl: finalImageUrl || undefined,
        linkUrl: finalLinkUrl || undefined,
        categoryTab: itemCategoryTab || undefined,
        productId: itemProductId || undefined,
        displayOrder: Number(itemDisplayOrder) || 0,
      });

      if (!updated) {
        showNotification('Section item not found or could not be updated');
        setEditingItem(null);
        return;
      }

      setSections((prev) =>
        prev.map((s) => {
          if (s.id === sectionId) {
            const exists = s.items.some((i: any) => i.id === itemId || i.id === updated.id);
            if (!exists) {
              return {
                ...s,
                items: [...s.items, { ...updated, product: selectedProduct || null }],
              };
            }
            return {
              ...s,
              items: s.items.map((i: any) =>
                i.id === itemId || i.id === updated.id
                  ? { ...i, ...updated, product: selectedProduct || null }
                  : i
              ),
            };
          }
          return s;
        })
      );

      setEditingItem(null);
      showNotification('Item updated successfully');
    } catch (err) {
      console.error('Failed to update item:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (sectionId: string, itemId: string) => {
    try {
      await deleteLandingSectionItemAction(itemId);
      setSections((prev) =>
        prev.map((s) => {
          if (s.id === sectionId) {
            return {
              ...s,
              items: s.items.filter((i: any) => i.id !== itemId),
            };
          }
          return s;
        })
      );
      showNotification('Item removed');
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  return (
    <div className="space-y-8 pb-12 font-light text-xs">
      <AdminHeader
        title="Storefront Landing Sections"
        subtitle="LANDING PAGE & CONTENT CURATION"
        activeTab="sections"
        action={
          <button
            onClick={() => {
              setIsCreatingSection(!isCreatingSection);
              setEditingSection(null);
            }}
            className="bg-black text-white px-4 py-2.5 uppercase tracking-widest text-[10px] font-medium hover:bg-neutral-800 transition-colors flex items-center space-x-1.5 rounded-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isCreatingSection ? 'Cancel Form' : 'Create New Section'}</span>
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Success Toast */}
        {successMessage && (
          <div className="bg-black text-white px-4 py-3 text-xs uppercase tracking-widest font-mono flex items-center justify-between rounded-sm shadow-md animate-fade-in">
            <span>✓ {successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-neutral-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Hero Banner Management Card */}
        <div className="bg-neutral-900 text-white p-6 sm:p-8 space-y-6 shadow-md rounded-sm border border-neutral-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-mono">
                  Homepage Hero Banner Configuration
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-light text-white">
                {heroBanner.title || 'Haute Couture Hero Banner'}
              </h2>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setHeroBanner((prev) => ({ ...prev, isActive: !prev.isActive }))}
                className={`px-3 py-1.5 uppercase tracking-widest text-[10px] border font-mono transition-colors flex items-center space-x-1.5 rounded-xs ${
                  heroBanner.isActive
                    ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/30'
                    : 'border-neutral-700 text-neutral-400 bg-neutral-800/50'
                }`}
              >
                {heroBanner.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{heroBanner.isActive ? 'Active on Live Site' : 'Hidden'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditingHero(!isEditingHero)}
                className="px-4 py-2 uppercase tracking-widest text-[10px] bg-white text-black font-medium hover:bg-neutral-200 transition-colors flex items-center space-x-1.5 rounded-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditingHero ? 'Close Editor' : 'Edit Hero Banner'}</span>
              </button>
            </div>
          </div>

          {/* Live Banner Preview Box */}
          {!isEditingHero && (
            <div className="relative overflow-hidden rounded-sm border border-neutral-800 min-h-[200px] sm:min-h-[240px] flex items-center justify-center bg-neutral-950 p-6 text-center">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-50 scale-105"
                style={{ backgroundImage: `url(${heroBanner.imageUrl || '/images/hero/hero-banner.jpg'})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30" />

              <div className="relative z-10 max-w-2xl space-y-3">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-neutral-300 font-sans block">
                  {heroBanner.tagline}
                </span>
                <h3 className="font-serif text-2xl sm:text-4xl text-white font-light leading-tight">
                  {heroBanner.title}
                </h3>
                <p className="text-neutral-300 font-light text-xs max-w-lg mx-auto leading-relaxed line-clamp-2">
                  {heroBanner.description}
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <span className="bg-white text-black text-[10px] uppercase tracking-widest px-4 py-2 font-medium rounded-xs">
                    {heroBanner.primaryCtaLabel || 'Explore Collections'}
                  </span>
                  {heroBanner.secondaryCtaLabel && (
                    <span className="border border-white/60 text-white text-[10px] uppercase tracking-widest px-4 py-2 font-medium rounded-xs">
                      {heroBanner.secondaryCtaLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hero Banner Form Fields */}
          {isEditingHero && (
            <form onSubmit={handleSaveHeroBanner} className="space-y-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-400">
                    Season Tagline
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="AUTUMN / WINTER HAUTE COUTURE 2026"
                    value={heroBanner.tagline}
                    onChange={(e) => setHeroBanner({ ...heroBanner, tagline: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 rounded-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-400">
                    Main Headline Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Elegance Woven in Gold & Velvet"
                    value={heroBanner.title}
                    onChange={(e) => setHeroBanner({ ...heroBanner, title: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 rounded-sm"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-400">
                    Banner Description Paragraph
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Discover hand-crafted bridal ensembles, imperial kaftans, and couture rentals..."
                    value={heroBanner.description}
                    onChange={(e) => setHeroBanner({ ...heroBanner, description: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 rounded-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-400">
                    Primary Button Label
                  </label>
                  <input
                    type="text"
                    placeholder="Explore Collections"
                    value={heroBanner.primaryCtaLabel}
                    onChange={(e) => setHeroBanner({ ...heroBanner, primaryCtaLabel: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 rounded-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-400">
                    Primary Button Link URL
                  </label>
                  <input
                    type="text"
                    placeholder="/products"
                    value={heroBanner.primaryCtaUrl}
                    onChange={(e) => setHeroBanner({ ...heroBanner, primaryCtaUrl: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 p-2.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400 rounded-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-400">
                    Secondary Button Label (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Rent Luxury Wear"
                    value={heroBanner.secondaryCtaLabel || ''}
                    onChange={(e) => setHeroBanner({ ...heroBanner, secondaryCtaLabel: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 rounded-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-400">
                    Secondary Button Link URL
                  </label>
                  <input
                    type="text"
                    placeholder="/products?type=RENTAL"
                    value={heroBanner.secondaryCtaUrl || ''}
                    onChange={(e) => setHeroBanner({ ...heroBanner, secondaryCtaUrl: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 p-2.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400 rounded-sm"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-400">
                    Hero Background Image
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {heroBanner.imageUrl && (
                      <div className="relative w-32 h-20 bg-neutral-800 overflow-hidden rounded-sm border border-neutral-700 shrink-0">
                        <img
                          src={heroBanner.imageUrl}
                          alt="Background Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src !== '/images/hero/hero-banner.jpg') {
                              target.src = '/images/hero/hero-banner.jpg';
                            }
                          }}
                        />
                      </div>
                    )}
                    <div className="w-full space-y-2">
                      <input
                        type="text"
                        placeholder="/images/hero/hero-banner.jpg or uploaded image URL"
                        value={heroBanner.imageUrl || ''}
                        onChange={(e) => setHeroBanner({ ...heroBanner, imageUrl: e.target.value })}
                        className="w-full bg-neutral-800 border border-neutral-700 p-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400 rounded-sm"
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="cursor-pointer bg-neutral-800 border border-neutral-700 hover:border-amber-400 text-neutral-200 px-3 py-1.5 text-[10px] uppercase tracking-wider font-mono flex items-center space-x-1.5 rounded-xs transition-colors">
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                          <span>Upload Image File</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file, (url) =>
                                  setHeroBanner((prev) => ({ ...prev, imageUrl: url }))
                                );
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setHeroBanner((prev) => ({ ...prev, imageUrl: '/images/hero/hero-banner.jpg' }))}
                          className="bg-neutral-800 border border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-white px-3 py-1.5 text-[10px] uppercase tracking-wider font-mono transition-colors rounded-xs"
                        >
                          Reset Default Image
                        </button>
                        {isUploadingImage && (
                          <span className="text-[10px] font-mono text-amber-400 animate-pulse">
                            Uploading file...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsEditingHero(false)}
                  className="px-5 py-2.5 uppercase tracking-widest text-[10px] border border-neutral-700 text-neutral-300 hover:border-white transition-colors rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingHero}
                  className="px-6 py-2.5 uppercase tracking-widest text-[10px] bg-amber-500 text-black font-medium hover:bg-amber-400 transition-colors flex items-center space-x-1.5 rounded-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingHero ? 'Saving Hero Banner...' : 'Save Hero Banner'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* New Section Creation Drawer */}
        {isCreatingSection && (
          <form
            onSubmit={handleCreateSection}
            className="bg-neutral-50 border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-sm rounded-sm"
          >
            <div className="flex items-center space-x-2 border-b border-neutral-200 pb-3">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h2 className="font-serif text-lg text-neutral-900 font-medium">
                Configure New Landing Page Section
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-600">
                  Section Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., New Arrivals, Featured Brands, Editor's Picks"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  className="w-full bg-white border border-neutral-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-600">
                  Section Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g., Explore runway releases curated for every wardrobe"
                  value={newSectionSubtitle}
                  onChange={(e) => setNewSectionSubtitle(e.target.value)}
                  className="w-full bg-white border border-neutral-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-600">
                  Section Type *
                </label>
                <select
                  value={newSectionType}
                  onChange={(e) => setNewSectionType(e.target.value as SectionType)}
                  className="w-full bg-white border border-neutral-300 p-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                >
                  <option value="NEW_ARRIVALS">NEW_ARRIVALS (Supports Category Tabs)</option>
                  <option value="FEATURED_BRANDS">FEATURED_BRANDS (Brand Cards / Logos)</option>
                  <option value="EDITORS_PICKS">EDITORS_PICKS (Curated Product Selection)</option>
                  <option value="CUSTOM_GRID">CUSTOM_GRID (Flexible Product Grid)</option>
                  <option value="PROMO_BANNER">PROMO_BANNER (Promotional Banners)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-600">
                  View All Target URL
                </label>
                <input
                  type="text"
                  placeholder="e.g., /products or /products?category=Women"
                  value={newSectionViewAllUrl}
                  onChange={(e) => setNewSectionViewAllUrl(e.target.value)}
                  className="w-full bg-white border border-neutral-300 p-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-600">
                  Subcategory Tabs (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="Women, Men, Kids"
                  value={newSectionTabs}
                  onChange={(e) => setNewSectionTabs(e.target.value)}
                  className="w-full bg-white border border-neutral-300 p-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-600">
                  Display Order
                </label>
                <input
                  type="number"
                  value={newSectionDisplayOrder}
                  onChange={(e) => setNewSectionDisplayOrder(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-300 p-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setIsCreatingSection(false)}
                className="px-5 py-2.5 uppercase tracking-widest text-[10px] border border-neutral-300 text-neutral-700 hover:border-black transition-colors rounded-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 uppercase tracking-widest text-[10px] bg-black text-white hover:bg-neutral-800 transition-colors rounded-sm"
              >
                {isLoading ? 'Saving...' : 'Save Section'}
              </button>
            </div>
          </form>
        )}

        {/* Edit Section Form Drawer */}
        {editingSection && (
          <form
            onSubmit={handleUpdateSection}
            className="bg-amber-50/50 border border-amber-300 p-6 sm:p-8 space-y-6 shadow-md rounded-sm"
          >
            <div className="flex justify-between items-center border-b border-amber-200 pb-3">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-amber-800" />
                <h2 className="font-serif text-lg text-neutral-900 font-medium">
                  Editing Section: {editingSection.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="p-1 text-neutral-500 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-600">
                  Section Title *
                </label>
                <input
                  type="text"
                  required
                  value={editSectionTitle}
                  onChange={(e) => setEditSectionTitle(e.target.value)}
                  className="w-full bg-white border border-neutral-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-600">
                  Section Subtitle
                </label>
                <input
                  type="text"
                  value={editSectionSubtitle}
                  onChange={(e) => setEditSectionSubtitle(e.target.value)}
                  className="w-full bg-white border border-neutral-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-600">
                  Section Type *
                </label>
                <select
                  value={editSectionType}
                  onChange={(e) => setEditSectionType(e.target.value as SectionType)}
                  className="w-full bg-white border border-neutral-300 p-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                >
                  <option value="NEW_ARRIVALS">NEW_ARRIVALS (Supports Category Tabs)</option>
                  <option value="FEATURED_BRANDS">FEATURED_BRANDS (Brand Cards / Logos)</option>
                  <option value="EDITORS_PICKS">EDITORS_PICKS (Curated Product Selection)</option>
                  <option value="CUSTOM_GRID">CUSTOM_GRID (Flexible Product Grid)</option>
                  <option value="PROMO_BANNER">PROMO_BANNER (Promotional Banners)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-600">
                  View All Target URL
                </label>
                <input
                  type="text"
                  value={editSectionViewAllUrl}
                  onChange={(e) => setEditSectionViewAllUrl(e.target.value)}
                  className="w-full bg-white border border-neutral-300 p-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-600">
                  Subcategory Tabs (Comma Separated)
                </label>
                <input
                  type="text"
                  value={editSectionTabs}
                  onChange={(e) => setEditSectionTabs(e.target.value)}
                  className="w-full bg-white border border-neutral-300 p-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block uppercase tracking-wider text-[10px] font-medium text-neutral-600">
                  Display Order
                </label>
                <input
                  type="number"
                  value={editSectionDisplayOrder}
                  onChange={(e) => setEditSectionDisplayOrder(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-300 p-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-amber-200">
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="px-5 py-2.5 uppercase tracking-widest text-[10px] border border-neutral-300 bg-white text-neutral-700 hover:border-black transition-colors rounded-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 uppercase tracking-widest text-[10px] bg-black text-white hover:bg-neutral-800 transition-colors rounded-sm flex items-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Saving Changes...' : 'Update Section'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Landing Sections List */}
        <div className="space-y-6">
          {sections
            .filter((section) => section.type !== 'HERO_BANNER')
            .map((section) => {
            const isExpanded = expandedSectionId === section.id;

            return (
              <div
                key={section.id}
                className={`bg-white border transition-all rounded-sm shadow-sm ${
                  section.isActive ? 'border-neutral-200' : 'border-neutral-200 opacity-60 bg-neutral-50'
                }`}
              >
                {/* Section Header Row */}
                <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono bg-neutral-100 text-neutral-800 text-[10px] font-bold px-2 py-0.5 rounded-sm">
                        TYPE: {section.type}
                      </span>
                      <span className="font-mono text-[10px] text-neutral-400">
                        ORDER: #{section.displayOrder}
                      </span>
                      {!section.isActive && (
                        <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest rounded-sm">
                          INACTIVE
                        </span>
                      )}
                    </div>

                    <h2 className="font-serif text-xl font-medium text-neutral-900">{section.title}</h2>
                    {section.subtitle && (
                      <p className="text-neutral-500 text-xs italic">{section.subtitle}</p>
                    )}

                    {section.tabs && section.tabs.length > 0 && (
                      <div className="flex items-center space-x-1.5 pt-1">
                        <Tag className="w-3 h-3 text-neutral-400" />
                        <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
                          Tabs: {section.tabs.join(' • ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Section Action Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(section)}
                      className="p-2 border border-neutral-300 hover:border-black text-neutral-700 transition-colors rounded-sm"
                      title={section.isActive ? 'Hide from Landing Page' : 'Show on Landing Page'}
                    >
                      {section.isActive ? <Eye className="w-4 h-4 text-emerald-700" /> : <EyeOff className="w-4 h-4 text-rose-700" />}
                    </button>

                    <button
                      onClick={() => startEditingSection(section)}
                      className="p-2 border border-neutral-300 hover:border-black text-neutral-700 hover:text-black transition-colors rounded-sm"
                      title="Edit Section Metadata"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteSection(section.id)}
                      className="p-2 border border-neutral-300 hover:border-rose-600 text-neutral-700 hover:text-rose-600 transition-colors rounded-sm"
                      title="Delete Section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setExpandedSectionId(isExpanded ? null : section.id)}
                      className="bg-neutral-900 text-white px-4 py-2 text-[10px] uppercase tracking-widest flex items-center space-x-1.5 hover:bg-neutral-800 transition-colors rounded-sm"
                    >
                      <span>Items ({section.items.length})</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Items Detail Drawer */}
                {isExpanded && (
                  <div className="border-t border-neutral-100 p-6 bg-neutral-50/50 space-y-6">
                    <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                      <h3 className="font-serif text-sm font-medium text-neutral-900 uppercase tracking-widest">
                        Section Content & Subcategory Items
                      </h3>
                      <button
                        onClick={() => startAddingItem(section.id)}
                        className="bg-black text-white px-3 py-1.5 text-[10px] uppercase tracking-widest font-medium hover:bg-neutral-800 transition-colors flex items-center space-x-1 rounded-sm"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Content Item</span>
                      </button>
                    </div>

                    {/* Add or Edit Item Form */}
                    {(addingItemToSectionId === section.id || (editingItem && editingItem.sectionId === section.id)) && (
                      <div className="bg-white p-5 border border-neutral-300 space-y-4 rounded-sm shadow-sm">
                        <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                          <h4 className="font-serif text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                            {editingItem ? `Edit Item in ${section.title}` : `Add New Item to ${section.title}`}
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingItemToSectionId(null);
                              setEditingItem(null);
                            }}
                            className="text-neutral-400 hover:text-black"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Select Existing Product */}
                          <div className="space-y-1 md:col-span-2">
                            <label className="block text-[10px] uppercase tracking-wider font-medium text-neutral-600">
                              Link Existing Product
                            </label>
                            <select
                              value={itemProductId}
                              onChange={(e) => {
                                const pId = e.target.value;
                                setItemProductId(pId);
                                const selectedP = products.find((p) => p.id === pId);
                                if (selectedP) {
                                  setItemTitle(selectedP.name);
                                  setItemSubtitle(selectedP.category || '');
                                  setItemImageUrl(selectedP.images?.[0] || '/images/products/default-product.jpg');
                                  setItemLinkUrl(`/products/${selectedP.slug}`);
                                }
                              }}
                              className="w-full bg-white border border-neutral-300 p-2 text-xs font-mono text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                            >
                              <option value="">-- Select Product --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.category || 'Collection'})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Selected Product Details Preview */}
                          {itemProductId && (
                            <div className="md:col-span-2 bg-neutral-50 border border-neutral-200 p-3 flex items-center space-x-3 rounded-sm">
                              {(() => {
                                const p = products.find((prod) => prod.id === itemProductId);
                                if (!p) return null;
                                return (
                                  <>
                                    <div className="relative w-12 aspect-[3/4] bg-neutral-200 rounded-sm overflow-hidden shrink-0">
                                      <Image
                                        src={p.images?.[0] || '/images/products/default-product.jpg'}
                                        alt={p.name}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                      />
                                    </div>
                                    <div className="text-xs space-y-0.5">
                                      <span className="font-serif font-medium text-neutral-900 block">{p.name}</span>
                                      <span className="text-[10px] text-neutral-500 font-mono uppercase block">
                                        Category: {p.category || 'Collection'} • Slug: /products/{p.slug}
                                      </span>
                                      <span className="text-[10px] text-emerald-700 font-mono font-medium block">
                                        Locked to catalog item
                                      </span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          )}

                          {/* Display Order */}
                          <div className="space-y-1">
                            <label className="block text-[10px] uppercase tracking-wider font-medium text-neutral-600">
                              Display Order
                            </label>
                            <input
                              type="number"
                              value={itemDisplayOrder}
                              onChange={(e) => setItemDisplayOrder(Number(e.target.value))}
                              className="w-full bg-white border border-neutral-300 p-2 text-xs font-mono text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                            />
                          </div>

                          {/* Category Tab Selector for New Arrivals */}
                          {section.tabs && section.tabs.length > 0 && (
                            <div className="space-y-1">
                              <label className="block text-[10px] uppercase tracking-wider font-medium text-neutral-600">
                                Subcategory Tab Assignment
                              </label>
                              <select
                                value={itemCategoryTab}
                                onChange={(e) => setItemCategoryTab(e.target.value)}
                                className="w-full bg-white border border-neutral-300 p-2 text-xs font-mono text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                              >
                                <option value="">-- All Tabs / None --</option>
                                {section.tabs.map((tab: string) => (
                                  <option key={tab} value={tab}>
                                    Tab: {tab}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end space-x-2 pt-2 border-t border-neutral-100">
                          <button
                            type="button"
                            onClick={() => {
                              setAddingItemToSectionId(null);
                              setEditingItem(null);
                            }}
                            className="px-4 py-1.5 uppercase text-[10px] tracking-wider border border-neutral-300 hover:border-black rounded-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (editingItem) {
                                handleUpdateItem(section.id, editingItem.id);
                              } else {
                                handleAddItem(section.id);
                              }
                            }}
                            disabled={isLoading}
                            className="px-4 py-1.5 uppercase text-[10px] tracking-wider bg-black text-white hover:bg-neutral-800 rounded-sm"
                          >
                            {isLoading ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Existing Items Table / Grid */}
                    {section.items.length === 0 ? (
                      <div className="text-center py-8 text-neutral-400 italic">
                        No content items added to this section yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {section.items.map((item: any) => {
                          const product = item.product;
                          const displayImage =
                            item.imageUrl ||
                            product?.images?.[0] ||
                            '/images/products/default-product.jpg';

                          return (
                            <div
                              key={item.id}
                              className="bg-white border border-neutral-200 p-4 flex flex-col justify-between space-y-3 rounded-sm hover:border-neutral-400 transition-colors"
                            >
                              <div className="flex items-start space-x-3">
                                <div className="relative w-16 aspect-[3/4] bg-neutral-100 flex-shrink-0 rounded-sm overflow-hidden">
                                  <Image
                                    src={displayImage}
                                    alt={item.title || 'Item image'}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>

                                <div className="space-y-1 flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    {item.categoryTab && (
                                      <span className="bg-black text-white text-[8px] uppercase tracking-widest font-mono px-1.5 py-0.5 rounded-xs inline-block">
                                        Tab: {item.categoryTab}
                                      </span>
                                    )}
                                    <span className="text-[9px] font-mono text-neutral-400">
                                      #{item.displayOrder}
                                    </span>
                                  </div>

                                  <h4 className="font-serif text-xs font-semibold text-neutral-900 truncate">
                                    {item.title || product?.name || 'Untitled Item'}
                                  </h4>

                                  {item.subtitle && (
                                    <p className="text-[10px] text-neutral-500 line-clamp-1">
                                      {item.subtitle}
                                    </p>
                                  )}

                                  {product && (
                                    <div className="flex items-center space-x-1 text-[9px] text-emerald-800 font-mono">
                                      <PackageCheck className="w-3 h-3" />
                                      <span>Linked: {product.name}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-neutral-100 text-[10px] font-mono text-neutral-500">
                                <span className="truncate max-w-[140px]" title={item.linkUrl || (product ? `/products/${product.slug}` : 'No link')}>
                                  {item.linkUrl || (product ? `/products/${product.slug}` : 'No link')}
                                </span>

                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => startEditingItem(item)}
                                    className="text-neutral-600 hover:text-black font-bold p-1 transition-colors"
                                    title="Edit Item"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(section.id, item.id)}
                                    className="text-rose-600 hover:text-rose-900 font-bold p-1 transition-colors"
                                    title="Remove Item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
