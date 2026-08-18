'use client';

import React, { useState, useMemo } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  X,
  Compass,
  Link as LinkIcon,
  Eye,
  Layers,
  Search,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  Image as ImageIcon,
  GitMerge,
  Sparkles,
  Folder,
  FolderOpen,
  ChevronsDown,
  ChevronsUp,
  Upload,
} from 'lucide-react';
import {
  createNavCategoryAction,
  updateNavCategoryAction,
  deleteNavCategoryAction,
  reorderNavCategoriesAction,
  resetDefaultNavCategoriesAction,
} from '@/app/actions/admin';

export interface NavCategoryData {
  id: string;
  name: string;
  href: string;
  displayOrder: number;
  isActive: boolean;
  parentId?: string | null;
  imageUrl?: string | null;
}

export interface TreeNode extends NavCategoryData {
  children: TreeNode[];
  depth: number;
}

interface AdminCollectionViewProps {
  initialCategories: NavCategoryData[];
  availableCategories: string[];
}

function getDescendantIds(targetId: string, allCats: NavCategoryData[]): Set<string> {
  const descendants = new Set<string>();
  const queue = [targetId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = allCats.filter((c) => c.parentId === currentId);
    for (const child of children) {
      if (!descendants.has(child.id)) {
        descendants.add(child.id);
        queue.push(child.id);
      }
    }
  }
  return descendants;
}

function buildCategoryTree(flatCategories: NavCategoryData[]): TreeNode[] {
  const itemMap = new Map<string, TreeNode>();

  flatCategories.forEach((cat) => {
    itemMap.set(cat.id, { ...cat, children: [], depth: 0 });
  });

  const roots: TreeNode[] = [];

  flatCategories.forEach((cat) => {
    const node = itemMap.get(cat.id)!;
    if (cat.parentId && itemMap.has(cat.parentId)) {
      itemMap.get(cat.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  function setDepths(nodes: TreeNode[], depth: number) {
    nodes.forEach((node) => {
      node.depth = depth;
      setDepths(node.children, depth + 1);
    });
  }

  setDepths(roots, 0);
  return roots;
}

function flattenTreeForRender(
  nodes: TreeNode[],
  collapsedIds: Set<string>
): TreeNode[] {
  const result: TreeNode[] = [];

  function traverse(list: TreeNode[]) {
    list.forEach((node) => {
      result.push(node);
      if (node.children.length > 0 && !collapsedIds.has(node.id)) {
        traverse(node.children);
      }
    });
  }

  traverse(nodes);
  return result;
}

function getFlattenedParentOptions(
  flatCategories: NavCategoryData[],
  editingId?: string | null
): Array<{ id: string; name: string; depth: number }> {
  const descendantIds = editingId ? getDescendantIds(editingId, flatCategories) : new Set<string>();
  const tree = buildCategoryTree(flatCategories);
  const options: Array<{ id: string; name: string; depth: number }> = [];

  function traverse(nodes: TreeNode[]) {
    nodes.forEach((node) => {
      if (node.id !== editingId && !descendantIds.has(node.id)) {
        options.push({
          id: node.id,
          name: node.name,
          depth: node.depth,
        });
        traverse(node.children);
      }
    });
  }

  traverse(tree);
  return options;
}

export default function AdminCollectionView({
  initialCategories,
  availableCategories,
}: AdminCollectionViewProps) {
  const [categories, setCategories] = useState<NavCategoryData[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formHref, setFormHref] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formParentId, setFormParentId] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const renderedRows = useMemo(
    () => flattenTreeForRender(categoryTree, collapsedIds),
    [categoryTree, collapsedIds]
  );
  const parentOptions = useMemo(
    () => getFlattenedParentOptions(categories, editingId),
    [categories, editingId]
  );

  // Filtered rows for search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return renderedRows;
    const query = searchQuery.toLowerCase();
    return renderedRows.filter(
      (node) =>
        node.name.toLowerCase().includes(query) ||
        node.href.toLowerCase().includes(query)
    );
  }, [renderedRows, searchQuery]);

  // Metrics
  const totalCount = categories.length;
  const rootCount = categories.filter((c) => !c.parentId).length;
  const subCount = categories.filter((c) => Boolean(c.parentId)).length;
  const activeCount = categories.filter((c) => c.isActive).length;

  const resetForm = () => {
    setFormName('');
    setFormHref('');
    setFormIsActive(true);
    setFormParentId('');
    setFormImageUrl('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleAddSubcategory = (parentCat: NavCategoryData) => {
    resetForm();
    setIsAdding(true);
    setFormParentId(parentCat.id);
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      next.delete(parentCat.id);
      return next;
    });
  };

  const handleStartEdit = (cat: NavCategoryData) => {
    setIsAdding(false);
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormHref(cat.href);
    setFormIsActive(cat.isActive);
    setFormParentId(cat.parentId || '');
    setFormImageUrl(cat.imageUrl || '');
  };

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setCollapsedIds(new Set());
  };

  const collapseAll = () => {
    const parentIds = categories.filter((c) =>
      categories.some((child) => child.parentId === c.id)
    ).map((c) => c.id);
    setCollapsedIds(new Set(parentIds));
  };

  const handleNameChange = (name: string) => {
    setFormName(name);
    if (!editingId && name.trim()) {
      const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (name.toLowerCase() === 'all collections') {
        setFormHref('/products');
      } else if (name.toLowerCase() === 'rentals') {
        setFormHref('/products?type=RENTAL');
      } else {
        setFormHref(`/products?category=${encodeURIComponent(name.trim())}`);
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'collections');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setFormImageUrl(data.url);
        setMessage({ type: 'success', text: 'Image uploaded successfully.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to upload image.' });
      }
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      setMessage({ type: 'error', text: err.message || 'Error uploading image file.' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formHref.trim()) {
      setMessage({ type: 'error', text: 'Collection Name and Link URL are required.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      if (isAdding) {
        const newCat = await createNavCategoryAction({
          name: formName.trim(),
          href: formHref.trim(),
          isActive: formIsActive,
          parentId: formParentId || null,
          imageUrl: formImageUrl.trim() || null,
        });
        setCategories((prev) => [...prev, newCat]);
        setMessage({ type: 'success', text: `Collection "${newCat.name}" added successfully.` });
      } else if (editingId) {
        const updatedCat = await updateNavCategoryAction(editingId, {
          name: formName.trim(),
          href: formHref.trim(),
          isActive: formIsActive,
          parentId: formParentId || null,
          imageUrl: formImageUrl.trim() || null,
        });
        setCategories((prev) => prev.map((c) => (c.id === editingId ? updatedCat : c)));
        setMessage({ type: 'success', text: `Collection "${updatedCat.name}" updated successfully.` });
      }
      resetForm();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save collection.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const childCount = categories.filter((c) => c.parentId === id).length;
    let confirmMsg = `Are you sure you want to delete collection "${name}"?`;
    if (childCount > 0) {
      confirmMsg = `Warning: "${name}" has ${childCount} sub-collection(s). Deleting it will re-assign sub-collections to root or cascade delete. Proceed?`;
    }

    if (!confirm(confirmMsg)) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      await deleteNavCategoryAction(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setMessage({ type: 'success', text: `Collection "${name}" deleted.` });
      if (editingId === id) resetForm();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete collection.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveOrder = async (node: TreeNode, direction: 'up' | 'down') => {
    const siblings = categories
      .filter((c) => (c.parentId || null) === (node.parentId || null))
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const index = siblings.findIndex((c) => c.id === node.id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === siblings.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const swapTarget = siblings[targetIndex];

    const updatedCategories = categories.map((c) => {
      if (c.id === node.id) return { ...c, displayOrder: swapTarget.displayOrder };
      if (c.id === swapTarget.id) return { ...c, displayOrder: node.displayOrder };
      return c;
    });

    setCategories(updatedCategories);

    try {
      await reorderNavCategoriesAction(updatedCategories.map((c) => c.id));
    } catch {
      setCategories(categories);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('Are you sure you want to reset all collections to the default luxury category tree? All custom categories will be lost.')) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const resetList = await resetDefaultNavCategoriesAction();
      setCategories(resetList);
      setMessage({ type: 'success', text: 'Collection tree reset to luxury defaults successfully.' });
      resetForm();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to reset collection tree.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 text-xs font-sans text-neutral-900">
      <AdminHeader
        title={`Collection & Taxonomy (${categories.length})`}
        subtitle="CATEGORY TREE HIERARCHIES, PARENT-CHILD RELATIONSHIPS & LEAF ASSETS"
        activeTab="collection"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xs text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Expand all tree branches"
            >
              <ChevronsDown className="w-3.5 h-3.5" />
              <span>Expand All</span>
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xs text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Collapse all tree branches"
            >
              <ChevronsUp className="w-3.5 h-3.5" />
              <span>Collapse All</span>
            </button>
            <button
              onClick={handleResetDefaults}
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xs text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Tree</span>
            </button>
            <button
              onClick={handleStartAdd}
              className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-xs text-xs flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Collection</span>
            </button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Status Message */}
        {message && (
          <div
            className={`p-4 rounded-xs border text-xs flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="hover:opacity-75 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-neutral-200 rounded-xs p-4 flex items-center space-x-3 shadow-2xs hover:border-neutral-300 transition-colors">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xs border border-amber-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">Total Collections</p>
              <p className="text-xl font-serif font-medium text-neutral-900">{totalCount}</p>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xs p-4 flex items-center space-x-3 shadow-2xs hover:border-neutral-300 transition-colors">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xs border border-blue-200">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">Root Collections</p>
              <p className="text-xl font-serif font-medium text-neutral-900">{rootCount}</p>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xs p-4 flex items-center space-x-3 shadow-2xs hover:border-neutral-300 transition-colors">
            <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xs border border-purple-200">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">Nested Sub-items</p>
              <p className="text-xl font-serif font-medium text-neutral-900">{subCount}</p>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xs p-4 flex items-center space-x-3 shadow-2xs hover:border-neutral-300 transition-colors">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xs border border-emerald-200">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">Active Live</p>
              <p className="text-xl font-serif font-medium text-emerald-900">{activeCount}</p>
            </div>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="bg-white border border-neutral-200 p-3 rounded-xs flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xs pl-9 pr-8 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-neutral-500 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
            <span>Tip: Click <strong className="text-amber-700">+ Sub</strong> on any row to instantly create a nested collection.</span>
          </div>
        </div>

        {/* Form Card (Add or Edit Collection) */}
        {(isAdding || editingId) && (
          <div className="bg-white border border-neutral-300 rounded-xs p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-amber-50 text-amber-700 rounded-xs border border-amber-200">
                  {isAdding ? <Plus className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                </div>
                <h3 className="font-serif text-base font-medium text-neutral-900">
                  {isAdding ? 'Add New Collection' : 'Edit Collection'}
                </h3>
              </div>
              <button onClick={resetForm} className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-semibold mb-1">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Haute Couture, Kaftans, Lehengas"
                    className="w-full bg-white border border-neutral-200 rounded-xs px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-semibold mb-1">
                    Parent Collection (Tree Node)
                  </label>
                  <select
                    value={formParentId}
                    onChange={(e) => setFormParentId(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xs px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-400 shadow-2xs cursor-pointer"
                  >
                    <option value="">None (Top-Level Root Collection)</option>
                    {parentOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {'\u00A0\u00A0'.repeat(opt.depth)}
                        {opt.depth > 0 ? '└─ ' : ''}
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-semibold mb-1">
                    Storefront Link URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={formHref}
                    onChange={(e) => setFormHref(e.target.value)}
                    placeholder="e.g. /products?category=Kaftans"
                    className="w-full bg-white border border-neutral-200 rounded-xs px-3 py-2 text-neutral-900 font-mono placeholder-neutral-400 focus:outline-none focus:border-neutral-400 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-semibold mb-1">
                    Leaf Image Asset URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="/images/products/default-product.jpg"
                      className="w-full bg-white border border-neutral-200 rounded-xs px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 shadow-2xs"
                    />
                    <label className="bg-neutral-900 hover:bg-neutral-800 text-white px-3 py-2 text-xs rounded-xs cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">{isUploadingImage ? '...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingImage}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                    {formImageUrl.trim() && (
                      <div className="w-9 h-9 relative rounded-xs border border-neutral-200 overflow-hidden flex-shrink-0 bg-neutral-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formImageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-neutral-200">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded-xs bg-white border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="formIsActive" className="text-neutral-700 font-medium cursor-pointer">
                  Publish & Active on Storefront
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-neutral-200 text-neutral-700 hover:bg-neutral-100 rounded-xs transition-colors cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-xs transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : isAdding ? 'Create Collection' : 'Update Collection'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tree Table View */}
        <div className="bg-white border border-neutral-200 rounded-xs overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-800">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-500">
                <tr>
                  <th className="py-3 px-4">Collection Hierarchy</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Leaf Asset</th>
                  <th className="py-3 px-4">Storefront Route</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-500">
                      <Layers className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                      <p className="font-serif text-sm text-neutral-700">No collections found matching query.</p>
                      <button
                        onClick={handleResetDefaults}
                        className="mt-3 px-3 py-1 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xs transition-colors cursor-pointer shadow-2xs"
                      >
                        Reset Default Tree
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((node) => {
                    const hasChildren = node.children.length > 0;
                    const isCollapsed = collapsedIds.has(node.id);
                    const paddingLeft = node.depth * 24 + 16;

                    return (
                      <tr
                        key={node.id}
                        className={`hover:bg-neutral-50/60 transition-colors ${
                          node.depth === 0 ? 'bg-neutral-50/30' : ''
                        }`}
                      >
                        {/* Collection Hierarchy Cell */}
                        <td className="py-3 pr-4" style={{ paddingLeft: `${paddingLeft}px` }}>
                          <div className="flex items-center space-x-2">
                            {hasChildren ? (
                              <button
                                onClick={() => toggleCollapse(node.id)}
                                className="p-1 rounded-xs text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                                title={isCollapsed ? 'Expand subcategories' : 'Collapse subcategories'}
                              >
                                {isCollapsed ? (
                                  <ChevronRight className="w-4 h-4 text-amber-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-amber-600" />
                                )}
                              </button>
                            ) : (
                              <span className="w-6 h-4 inline-block text-center text-neutral-400 font-mono">
                                {node.depth > 0 ? '└' : '•'}
                              </span>
                            )}

                            {node.depth === 0 ? (
                              <FolderOpen className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            ) : (
                              <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            )}

                            <span className="font-medium text-neutral-900">
                              {node.name}
                            </span>

                            {hasChildren && (
                              <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded-xs font-mono ml-2">
                                {node.children.length} sub
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Level Badge */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[10px] uppercase font-mono tracking-wider font-semibold ${
                              node.depth === 0
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : node.depth === 1
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-purple-50 text-purple-800 border border-purple-200'
                            }`}
                          >
                            {node.depth === 0 ? 'Root' : `L${node.depth} Sub`}
                          </span>
                        </td>

                        {/* Leaf Asset Thumbnail */}
                        <td className="py-3 px-4">
                          {node.imageUrl ? (
                            <div className="w-8 h-8 relative rounded-xs overflow-hidden border border-neutral-200 bg-neutral-100 flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={node.imageUrl}
                                alt={node.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/products/default-product.jpg';
                                }}
                              />
                            </div>
                          ) : (
                            <span className="text-neutral-400 text-[10px] italic">No image</span>
                          )}
                        </td>

                        {/* Route Link */}
                        <td className="py-3 px-4 text-neutral-600 font-mono text-[11px] truncate max-w-[200px]">
                          <a
                            href={node.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-amber-800 flex items-center space-x-1 group"
                          >
                            <LinkIcon className="w-3 h-3 text-neutral-400 group-hover:text-amber-800 flex-shrink-0" />
                            <span className="truncate">{node.href}</span>
                          </a>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[10px] font-mono font-semibold uppercase ${
                              node.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                            }`}
                          >
                            {node.isActive ? 'Active' : 'Hidden'}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {/* Reorder controls */}
                            <button
                              onClick={() => handleMoveOrder(node, 'up')}
                              className="p-1 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xs transition-colors cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveOrder(node, 'down')}
                              className="p-1 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xs transition-colors cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Add Subcategory Quick Action */}
                            <button
                              onClick={() => handleAddSubcategory(node)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xs text-[11px] font-medium flex items-center space-x-1 transition-colors cursor-pointer"
                              title={`Add subcategory under ${node.name}`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>Sub</span>
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleStartEdit(node)}
                              className="p-1 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xs transition-colors cursor-pointer border border-neutral-200"
                              title="Edit Collection"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(node.id, node.name)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xs transition-colors cursor-pointer border border-rose-200"
                              title="Delete Collection"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
