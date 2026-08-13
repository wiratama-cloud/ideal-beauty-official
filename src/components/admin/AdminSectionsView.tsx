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
} from '@/app/actions/admin';
import AdminHeader from '@/components/admin/AdminHeader';

type SectionType = 'NEW_ARRIVALS' | 'FEATURED_BRANDS' | 'EDITORS_PICKS' | 'CUSTOM_GRID' | 'PROMO_BANNER';

interface AdminSectionsViewProps {
  initialSections: any[];
  products: any[];
}

export default function AdminSectionsView({ initialSections, products }: AdminSectionsViewProps) {
  const [sections, setSections] = useState(initialSections);
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

      setSections((prev) =>
        prev.map((s) => (s.id === editingSection.id ? { ...s, ...updated } : s))
      );

      setEditingSection(null);
      showNotification('Section updated successfully');
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
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, isActive: updated.isActive } : s))
      );
      showNotification(`Section status updated to ${updated.isActive ? 'Active' : 'Inactive'}`);
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
    setItemTitle(item.title || '');
    setItemSubtitle(item.subtitle || '');
    setItemImageUrl(item.imageUrl || '');
    setItemLinkUrl(item.linkUrl || '');
    setItemCategoryTab(item.categoryTab || '');
    setItemProductId(item.productId || '');
    setItemDisplayOrder(item.displayOrder || 0);
  };

  const handleAddItem = async (sectionId: string) => {
    setIsLoading(true);
    try {
      const created = await createLandingSectionItemAction({
        sectionId,
        title: itemTitle || undefined,
        subtitle: itemSubtitle || undefined,
        imageUrl: itemImageUrl || undefined,
        linkUrl: itemLinkUrl || undefined,
        categoryTab: itemCategoryTab || undefined,
        productId: itemProductId || undefined,
        displayOrder: Number(itemDisplayOrder) || 0,
      });

      const selectedProduct = products.find((p) => p.id === itemProductId);

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
    setIsLoading(true);
    try {
      const updated = await updateLandingSectionItemAction(itemId, {
        title: itemTitle || undefined,
        subtitle: itemSubtitle || undefined,
        imageUrl: itemImageUrl || undefined,
        linkUrl: itemLinkUrl || undefined,
        categoryTab: itemCategoryTab || undefined,
        productId: itemProductId || undefined,
        displayOrder: Number(itemDisplayOrder) || 0,
      });

      const selectedProduct = products.find((p) => p.id === itemProductId);

      setSections((prev) =>
        prev.map((s) => {
          if (s.id === sectionId) {
            return {
              ...s,
              items: s.items.map((i: any) =>
                i.id === itemId
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
          {sections.map((section) => {
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
                          {/* Select Existing Product (Optional) */}
                          <div className="space-y-1 md:col-span-2">
                            <label className="block text-[10px] uppercase tracking-wider font-medium text-neutral-600">
                              Link Existing Product (Optional)
                            </label>
                            <select
                              value={itemProductId}
                              onChange={(e) => {
                                const pId = e.target.value;
                                setItemProductId(pId);
                                const selectedP = products.find((p) => p.id === pId);
                                if (selectedP) {
                                  if (!itemTitle) setItemTitle(selectedP.name);
                                  if (!itemImageUrl && selectedP.images?.[0]) setItemImageUrl(selectedP.images[0]);
                                  if (!itemLinkUrl) setItemLinkUrl(`/products/${selectedP.slug}`);
                                }
                              }}
                              className="w-full bg-white border border-neutral-300 p-2 text-xs font-mono text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                            >
                              <option value="">-- Custom Brand / Banner / Item (No Product) --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.category || 'Collection'})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] uppercase tracking-wider font-medium text-neutral-600">
                              Item Title / Brand Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., Royal Velvet, Emerald Kaftan"
                              value={itemTitle}
                              onChange={(e) => setItemTitle(e.target.value)}
                              className="w-full bg-white border border-neutral-300 p-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] uppercase tracking-wider font-medium text-neutral-600">
                              Subtitle / Tagline
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., Heritage Kaftans & Robes"
                              value={itemSubtitle}
                              onChange={(e) => setItemSubtitle(e.target.value)}
                              className="w-full bg-white border border-neutral-300 p-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                            />
                          </div>

                          {/* Image URL & Local Upload Button */}
                          <div className="space-y-1 md:col-span-2">
                            <label className="block text-[10px] uppercase tracking-wider font-medium text-neutral-600">
                              Image Path / URL or Server File Upload
                            </label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                placeholder="/images/products/... or /uploads/..."
                                value={itemImageUrl}
                                onChange={(e) => setItemImageUrl(e.target.value)}
                                className="w-full bg-white border border-neutral-300 p-2 text-xs font-mono text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                              />
                              <label className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 px-3 py-2 text-[10px] uppercase tracking-wider cursor-pointer font-medium flex items-center space-x-1 whitespace-nowrap rounded-sm transition-colors">
                                <Upload className="w-3.5 h-3.5" />
                                <span>{isUploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={isUploadingImage}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleFileUpload(file, setItemImageUrl);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] uppercase tracking-wider font-medium text-neutral-600">
                              Link Target URL
                            </label>
                            <input
                              type="text"
                              placeholder="/products?category=Women"
                              value={itemLinkUrl}
                              onChange={(e) => setItemLinkUrl(e.target.value)}
                              className="w-full bg-white border border-neutral-300 p-2 text-xs font-mono text-neutral-900 focus:outline-none focus:border-black rounded-sm"
                            />
                          </div>

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
                            <div className="space-y-1 md:col-span-2">
                              <label className="block text-[10px] uppercase tracking-wider font-medium text-neutral-600">
                                Subcategory Tab Assignment (e.g., Women, Men, Kids)
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
