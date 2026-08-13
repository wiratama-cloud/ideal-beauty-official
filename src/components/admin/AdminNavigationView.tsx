'use client';

import React, { useState } from 'react';
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
  SlidersHorizontal,
  Layers,
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
}

interface AdminNavigationViewProps {
  initialCategories: NavCategoryData[];
  availableCategories: string[];
}

export default function AdminNavigationView({
  initialCategories,
  availableCategories,
}: AdminNavigationViewProps) {
  const [categories, setCategories] = useState<NavCategoryData[]>(initialCategories);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formHref, setFormHref] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const resetForm = () => {
    setFormName('');
    setFormHref('');
    setFormIsActive(true);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleStartEdit = (cat: NavCategoryData) => {
    setIsAdding(false);
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormHref(cat.href);
    setFormIsActive(cat.isActive);
  };

  const handleApplyPreset = (name: string, href: string) => {
    setFormName(name);
    setFormHref(href);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formHref.trim()) {
      setMessage({ type: 'error', text: 'Name and Link URL are required.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      if (isAdding) {
        const created = await createNavCategoryAction({
          name: formName.trim(),
          href: formHref.trim(),
          isActive: formIsActive,
        });
        setCategories((prev) => [...prev, created]);
        setMessage({ type: 'success', text: `Created collection "${created.name}" successfully.` });
      } else if (editingId) {
        const updated = await updateNavCategoryAction(editingId, {
          name: formName.trim(),
          href: formHref.trim(),
          isActive: formIsActive,
        });
        setCategories((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
        setMessage({ type: 'success', text: `Updated collection "${updated.name}" successfully.` });
      }
      resetForm();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save collection.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: NavCategoryData) => {
    try {
      const updated = await updateNavCategoryAction(cat.id, {
        isActive: !cat.isActive,
      });
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? updated : c)));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to toggle status.' });
    }
  };

  const handleDelete = async (cat: NavCategoryData) => {
    if (!confirm(`Are you sure you want to delete "${cat.name}"?`)) return;

    try {
      await deleteNavCategoryAction(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setMessage({ type: 'success', text: `Deleted collection "${cat.name}".` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete collection.' });
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newCategories.length) return;

    const [moved] = newCategories.splice(index, 1);
    newCategories.splice(targetIndex, 0, moved);

    setCategories(newCategories);

    try {
      const ids = newCategories.map((c) => c.id);
      await reorderNavCategoriesAction(ids);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to save new display order.' });
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('This will reset all header and sidebar collection items to the 6 default collections. Proceed?')) {
      return;
    }

    try {
      const resetList = await resetDefaultNavCategoriesAction();
      setCategories(resetList);
      setMessage({ type: 'success', text: 'Reset navigation collections to defaults.' });
      resetForm();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to reset collections.' });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-24">
      <AdminHeader
        title="Header & Sidebar Navigation"
        subtitle="Atelier Collection Customizer"
        activeTab="navigation"
        action={
          <button
            onClick={handleStartAdd}
            className="bg-black hover:bg-neutral-800 text-white text-xs uppercase tracking-widest px-4 py-2.5 rounded-xs flex items-center space-x-2 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Collection Link</span>
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {message && (
          <div
            className={`p-4 border text-xs tracking-wider flex justify-between items-center ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="font-bold">
              &times;
            </button>
          </div>
        )}

        {/* Add / Edit Form Modal/Card */}
        {(isAdding || editingId) && (
          <div className="bg-white border border-neutral-200 p-6 shadow-xs rounded-xs space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h3 className="font-serif text-lg text-neutral-900">
                {isAdding ? 'Add Navigation Collection Link' : 'Edit Navigation Collection Link'}
              </h3>
              <button onClick={resetForm} className="text-neutral-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-neutral-700 mb-2">
                    Collection Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bridal Collection, Kaftans, Summer Sale"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full text-xs p-3 border border-neutral-300 focus:border-black focus:outline-none bg-neutral-50/30"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-neutral-700 mb-2">
                    Target URL / Link *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. /products?category=Bridal+Wear or /products?type=RENTAL"
                    value={formHref}
                    onChange={(e) => setFormHref(e.target.value)}
                    className="w-full text-xs p-3 border border-neutral-300 focus:border-black focus:outline-none bg-neutral-50/30 font-mono"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="bg-neutral-50 p-4 border border-neutral-200/80 rounded-xs space-y-3">
                <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium block">
                  Quick Link Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('All Collections', '/products')}
                    className="text-[10px] bg-white border border-neutral-300 hover:border-black px-2.5 py-1 uppercase tracking-wider text-neutral-700 transition-colors"
                  >
                    All Collections (/products)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('Rentals', '/products?type=RENTAL')}
                    className="text-[10px] bg-white border border-neutral-300 hover:border-black px-2.5 py-1 uppercase tracking-wider text-neutral-700 transition-colors"
                  >
                    Rentals (/products?type=RENTAL)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('Purchase Only', '/products?type=SALE')}
                    className="text-[10px] bg-white border border-neutral-300 hover:border-black px-2.5 py-1 uppercase tracking-wider text-neutral-700 transition-colors"
                  >
                    Purchase Only (/products?type=SALE)
                  </button>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleApplyPreset(cat, `/products?category=${encodeURIComponent(cat)}`)}
                      className="text-[10px] bg-white border border-neutral-300 hover:border-black px-2.5 py-1 uppercase tracking-wider text-neutral-700 transition-colors"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="accent-black w-4 h-4"
                />
                <label htmlFor="isActiveToggle" className="text-xs text-neutral-800 cursor-pointer">
                  Active (Visible on Header & Search Sidebar)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-neutral-300 text-xs uppercase tracking-widest text-neutral-700 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-black text-white text-xs uppercase tracking-widest hover:bg-neutral-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Collection Link'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Collection Management Table */}
        <div className="bg-white border border-neutral-200 rounded-xs shadow-xs">
          <div className="p-5 border-b border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-serif text-lg text-neutral-900">Customizable Collections</h2>
              <p className="text-neutral-500 text-xs">
                These collection items are rendered on the top header navigation bar and on the search sidebar filters.
              </p>
            </div>

            <button
              onClick={handleResetDefaults}
              className="text-[10px] uppercase tracking-widest text-neutral-500 hover:text-black border border-neutral-300 hover:border-black px-3 py-1.5 flex items-center space-x-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase tracking-widest text-neutral-500 font-medium">
                  <th className="py-3 px-4 w-16 text-center">Order</th>
                  <th className="py-3 px-4">Collection Name</th>
                  <th className="py-3 px-4">Target Link</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                  <th className="py-3 px-4 w-36 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-light">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-400">
                      No collection items found. Click &quot;Add New Collection Link&quot; or &quot;Reset to Defaults&quot;.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat, idx) => (
                    <tr key={cat.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleMove(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-neutral-400 hover:text-black disabled:opacity-20"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMove(idx, 'down')}
                            disabled={idx === categories.length - 1}
                            className="p-1 text-neutral-400 hover:text-black disabled:opacity-20"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-neutral-900">
                        {cat.name}
                      </td>

                      <td className="py-3 px-4 text-neutral-600 font-mono text-[11px]">
                        <div className="flex items-center space-x-1">
                          <LinkIcon className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                          <span className="truncate max-w-xs">{cat.href}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(cat)}
                          className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full transition-colors ${
                            cat.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                          }`}
                        >
                          {cat.isActive ? 'Active' : 'Hidden'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleStartEdit(cat)}
                            className="p-1 text-neutral-500 hover:text-black transition-colors"
                            title="Edit Link"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-1 text-rose-500 hover:text-rose-700 transition-colors"
                            title="Delete Link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="bg-white border border-neutral-200 p-6 rounded-xs shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-neutral-100 pb-3">
            <Eye className="w-4 h-4 text-amber-600" />
            <h3 className="font-serif text-base text-neutral-900">Live Preview</h3>
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-sans block mb-2">
                Header Navigation Bar Preview:
              </span>
              <div className="bg-neutral-900 text-white p-4 text-center">
                <nav className="flex flex-wrap justify-center gap-6 text-[11px] tracking-[0.15em] uppercase font-light">
                  {categories.filter((c) => c.isActive).length === 0 ? (
                    <span className="text-neutral-500 italic">No active items</span>
                  ) : (
                    categories
                      .filter((c) => c.isActive)
                      .map((c) => (
                        <span key={c.id} className="hover:underline cursor-pointer">
                          {c.name}
                        </span>
                      ))
                  )}
                </nav>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-sans block mb-2">
                Search Sidebar Collection Filter Preview:
              </span>
              <div className="bg-neutral-50 p-4 border border-neutral-200 max-w-xs text-xs space-y-2">
                <h4 className="uppercase tracking-widest font-medium text-neutral-900 border-b border-neutral-200 pb-1">
                  Collection
                </h4>
                <div className="space-y-1">
                  {categories
                    .filter((c) => c.isActive)
                    .map((c, i) => (
                      <div
                        key={c.id}
                        className={`py-1 text-left ${i === 0 ? 'font-medium text-black border-l-2 border-black pl-2' : 'text-neutral-600'}`}
                      >
                        {c.name}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
