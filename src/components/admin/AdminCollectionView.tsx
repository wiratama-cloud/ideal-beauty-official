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
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans pb-24">
      <AdminHeader
        title="Collection & Taxonomy Management"
        subtitle="Define 1, 2, and 3+ level category tree hierarchies, parent-child relationships, and leaf image assets"
        activeTab="collection"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xs text-xs font-medium flex items-center space-x-1.5 transition-colors"
              title="Expand all tree branches"
            >
              <ChevronsDown className="w-3.5 h-3.5" />
              <span>Expand All</span>
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xs text-xs font-medium flex items-center space-x-1.5 transition-colors"
              title="Collapse all tree branches"
            >
              <ChevronsUp className="w-3.5 h-3.5" />
              <span>Collapse All</span>
            </button>
            <button
              onClick={handleResetDefaults}
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xs text-xs font-medium flex items-center space-x-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Tree</span>
            </button>
            <button
              onClick={handleStartAdd}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xs text-xs flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Collection</span>
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Status Message */}
        {message && (
          <div
            className={`p-4 rounded-xs border text-xs flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
                : 'bg-rose-950/80 border-rose-800 text-rose-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-xs p-4 flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xs border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400">Total Collections</p>
              <p className="text-xl font-serif text-white">{totalCount}</p>
            </div>
          </div>

          <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-xs p-4 flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xs border border-blue-500/20">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400">Root Collections</p>
              <p className="text-xl font-serif text-white">{rootCount}</p>
            </div>
          </div>

          <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-xs p-4 flex items-center space-x-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xs border border-purple-500/20">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400">Nested Sub-items</p>
              <p className="text-xl font-serif text-white">{subCount}</p>
            </div>
          </div>

          <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-xs p-4 flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xs border border-emerald-500/20">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400">Active Live</p>
              <p className="text-xl font-serif text-white">{activeCount}</p>
            </div>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="bg-neutral-800/60 border border-neutral-700/60 p-4 rounded-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xs pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-neutral-400 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
            <span>Tip: Click <strong className="text-amber-400">+ Sub</strong> on any row to instantly create a nested collection.</span>
          </div>
        </div>

        {/* Form Modal (Add or Edit Collection) */}
        {(isAdding || editingId) && (
          <div className="bg-neutral-800 border border-amber-500/40 rounded-xs p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-700 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-xs">
                  {isAdding ? <Plus className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                </div>
                <h3 className="font-serif text-base text-white">
                  {isAdding ? 'Add New Collection' : 'Edit Collection'}
                </h3>
              </div>
              <button onClick={resetForm} className="text-neutral-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Haute Couture, Kaftans, Lehengas"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xs px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Parent Collection (Tree Node)
                  </label>
                  <select
                    value={formParentId}
                    onChange={(e) => setFormParentId(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xs px-3 py-2 text-white focus:outline-none focus:border-amber-500"
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
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Storefront Link URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={formHref}
                    onChange={(e) => setFormHref(e.target.value)}
                    placeholder="e.g. /products?category=Kaftans"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xs px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Leaf Image Asset URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="/images/products/default-product.jpg"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xs px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                    />
                    {formImageUrl.trim() && (
                      <div className="w-9 h-9 relative rounded-xs border border-neutral-700 overflow-hidden flex-shrink-0 bg-neutral-950">
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

              <div className="flex items-center space-x-2 pt-2 border-t border-neutral-700/60">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded bg-neutral-900 border-neutral-700 text-amber-500 focus:ring-0"
                />
                <label htmlFor="formIsActive" className="text-neutral-300">
                  Publish & Active on Storefront
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-neutral-700 text-neutral-300 hover:bg-neutral-700/50 rounded-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xs transition-colors shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : isAdding ? 'Create Collection' : 'Update Collection'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tree Table View */}
        <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-xs overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-200">
              <thead className="bg-neutral-900/80 border-b border-neutral-700 text-[10px] uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="py-3 px-4 font-medium">Collection Hierarchy</th>
                  <th className="py-3 px-4 font-medium">Level</th>
                  <th className="py-3 px-4 font-medium">Leaf Asset</th>
                  <th className="py-3 px-4 font-medium">Storefront Route</th>
                  <th className="py-3 px-4 font-medium text-center">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700/50">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-500">
                      <Layers className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
                      <p className="font-serif text-sm">No collections found matching query.</p>
                      <button
                        onClick={handleResetDefaults}
                        className="mt-3 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xs hover:bg-amber-500/20"
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
                        className={`hover:bg-neutral-700/30 transition-colors ${
                          node.depth === 0 ? 'bg-neutral-800/40' : ''
                        }`}
                      >
                        {/* Collection Hierarchy Cell */}
                        <td className="py-3 pr-4" style={{ paddingLeft: `${paddingLeft}px` }}>
                          <div className="flex items-center space-x-2">
                            {hasChildren ? (
                              <button
                                onClick={() => toggleCollapse(node.id)}
                                className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                                title={isCollapsed ? 'Expand subcategories' : 'Collapse subcategories'}
                              >
                                {isCollapsed ? (
                                  <ChevronRight className="w-4 h-4 text-amber-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-amber-400" />
                                )}
                              </button>
                            ) : (
                              <span className="w-6 h-4 inline-block text-center text-neutral-600">
                                {node.depth > 0 ? '└' : '•'}
                              </span>
                            )}

                            {node.depth === 0 ? (
                              <FolderOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            ) : (
                              <Folder className="w-4 h-4 text-amber-500/70 flex-shrink-0" />
                            )}

                            <span className="font-medium text-white tracking-wide">
                              {node.name}
                            </span>

                            {hasChildren && (
                              <span className="text-[10px] bg-neutral-900 border border-neutral-700 text-amber-400/90 px-1.5 py-0.5 rounded-full font-mono ml-2">
                                {node.children.length} sub
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Level Badge */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[10px] uppercase font-mono tracking-wider ${
                              node.depth === 0
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : node.depth === 1
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {node.depth === 0 ? 'Root' : `L${node.depth} Sub`}
                          </span>
                        </td>

                        {/* Leaf Asset Thumbnail */}
                        <td className="py-3 px-4">
                          {node.imageUrl ? (
                            <div className="w-8 h-8 relative rounded-xs overflow-hidden border border-neutral-700 bg-neutral-950 flex-shrink-0">
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
                            <span className="text-neutral-600 text-[10px] italic">No image</span>
                          )}
                        </td>

                        {/* Route Link */}
                        <td className="py-3 px-4 text-neutral-400 font-mono text-[11px] truncate max-w-[200px]">
                          <a
                            href={node.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-amber-400 flex items-center space-x-1 group"
                          >
                            <LinkIcon className="w-3 h-3 text-neutral-500 group-hover:text-amber-400 flex-shrink-0" />
                            <span className="truncate">{node.href}</span>
                          </a>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold uppercase ${
                              node.isActive
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                            }`}
                          >
                            {node.isActive ? 'Active' : 'Hidden'}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Reorder controls */}
                            <button
                              onClick={() => handleMoveOrder(node, 'up')}
                              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-xs transition-colors"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveOrder(node, 'down')}
                              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-xs transition-colors"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Add Subcategory Quick Action */}
                            <button
                              onClick={() => handleAddSubcategory(node)}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xs text-[11px] font-medium flex items-center space-x-1 transition-colors"
                              title={`Add subcategory under ${node.name}`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>Sub</span>
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleStartEdit(node)}
                              className="p-1 text-neutral-400 hover:text-amber-400 hover:bg-neutral-700 rounded-xs transition-colors"
                              title="Edit Collection"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(node.id, node.name)}
                              className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-neutral-700 rounded-xs transition-colors"
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
      </div>
    </div>
  );
}
