'use client';

import React, { useState, useTransition } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Ruler,
  Scale,
  Plus,
  Trash2,
  Edit2,
  Check,
  Star,
  Search,
  Link as LinkIcon,
  X,
  Package,
  Layers,
  Sparkles,
  Info,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  createSizeChartAction,
  updateSizeChartAction,
  deleteSizeChartAction,
  linkProductsToSizeChartAction,
} from '@/app/actions/admin';
import {
  SizeChartType,
  SizeMeasurementInput,
  CreateSizeChartInput,
  DEFAULT_SIZE_MEASUREMENTS,
  DEFAULT_WEIGHT_HEIGHT_MEASUREMENTS,
} from '@/lib/types/size-chart';

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  sizeChartId?: string | null;
}

interface SizeChartItem {
  id: string;
  name: string;
  type?: SizeChartType;
  category?: string | null;
  description?: string | null;
  guideText?: string | null;
  isDefault: boolean;
  productCount: number;
  measurements: SizeMeasurementInput[];
}

interface AdminSizeChartsViewProps {
  initialSizeCharts: SizeChartItem[];
  allProducts: ProductItem[];
}

export default function AdminSizeChartsView({
  initialSizeCharts,
  allProducts,
}: AdminSizeChartsViewProps) {
  const [charts, setCharts] = useState<SizeChartItem[]>(initialSizeCharts);
  const [products, setProducts] = useState<ProductItem[]>(allProducts);
  const [isPending, startTransition] = useTransition();

  // Search / Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Editor Modal / Drawer state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<SizeChartItem | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<SizeChartType>('BODY_MEASUREMENT');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formGuideText, setFormGuideText] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formRows, setFormRows] = useState<SizeMeasurementInput[]>(DEFAULT_SIZE_MEASUREMENTS);

  // Link Products Modal state
  const [linkingChart, setEditingLinkChart] = useState<SizeChartItem | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [productSearch, setProductSearch] = useState('');

  // Filtered charts
  const filteredCharts = charts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.category && c.category.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingChart(null);
    setFormName('');
    setFormType('BODY_MEASUREMENT');
    setFormCategory('Ready To Wear');
    setFormDescription('');
    setFormGuideText('All garments are tailored to standard proportions.');
    setFormIsDefault(charts.length === 0);
    setFormRows(DEFAULT_SIZE_MEASUREMENTS);
    setIsEditorOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (chart: SizeChartItem) => {
    const chartType = chart.type || 'BODY_MEASUREMENT';
    setEditingChart(chart);
    setFormName(chart.name);
    setFormType(chartType);
    setFormCategory(chart.category || '');
    setFormDescription(chart.description || '');
    setFormGuideText(chart.guideText || '');
    setFormIsDefault(chart.isDefault);
    setFormRows(
      chart.measurements && chart.measurements.length > 0
        ? chart.measurements
        : chartType === 'WEIGHT_HEIGHT'
        ? DEFAULT_WEIGHT_HEIGHT_MEASUREMENTS
        : DEFAULT_SIZE_MEASUREMENTS
    );
    setIsEditorOpen(true);
  };

  // Switch chart type
  const handleTypeChange = (newType: SizeChartType) => {
    if (newType === formType) return;
    setFormType(newType);
    if (newType === 'WEIGHT_HEIGHT') {
      setFormRows(DEFAULT_WEIGHT_HEIGHT_MEASUREMENTS);
    } else {
      setFormRows(DEFAULT_SIZE_MEASUREMENTS);
    }
  };

  // Measurement Row Editor Handlers
  const handleRowChange = (index: number, field: keyof SizeMeasurementInput, value: string) => {
    setFormRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddRow = () => {
    if (formType === 'WEIGHT_HEIGHT') {
      setFormRows((prev) => [
        ...prev,
        {
          size: 'Custom',
          heightCm: '160 - 170',
          weightKg: '55 - 65',
          minWeightKg: 55,
          maxWeightKg: 65,
          minHeightCm: 160,
          maxHeightCm: 170,
        },
      ]);
    } else {
      setFormRows((prev) => [
        ...prev,
        {
          size: 'Custom',
          bustCm: '90 - 95',
          waistCm: '70 - 75',
          hipsCm: '95 - 100',
          shoulderCm: '38.0',
        },
      ]);
    }
  };

  const handleRemoveRow = (index: number) => {
    if (formRows.length <= 1) return;
    setFormRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Create/Edit
  const handleSaveChart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Template Name is required');
      return;
    }

    const payload: CreateSizeChartInput = {
      name: formName.trim(),
      type: formType,
      category: formCategory.trim() || null,
      description: formDescription.trim() || null,
      guideText: formGuideText.trim() || null,
      isDefault: formIsDefault,
      measurements: formRows,
    };

    startTransition(async () => {
      try {
        if (editingChart) {
          const updated = await updateSizeChartAction(editingChart.id, payload);
          setCharts((prev) =>
            prev.map((c) => {
              if (c.id === editingChart.id) {
                return {
                  ...c,
                  name: updated.name,
                  type: updated.type || formType,
                  category: updated.category,
                  description: updated.description,
                  guideText: updated.guideText,
                  isDefault: updated.isDefault,
                  measurements: updated.measurements as any,
                };
              }
              if (updated.isDefault) {
                return { ...c, isDefault: false };
              }
              return c;
            })
          );
        } else {
          const created = await createSizeChartAction(payload);
          setCharts((prev) => [
            {
              id: created.id,
              name: created.name,
              type: created.type || formType,
              category: created.category,
              description: created.description,
              guideText: created.guideText,
              isDefault: created.isDefault,
              productCount: 0,
              measurements: created.measurements as any,
            },
            ...prev.map((c) => (created.isDefault ? { ...c, isDefault: false } : c)),
          ]);
        }
        setIsEditorOpen(false);
      } catch (err) {
        console.error('Failed to save size chart:', err);
        alert((err as Error).message || 'Failed to save size chart template');
      }
    });
  };

  // Delete Chart
  const handleDeleteChart = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete size chart template "${name}"?`)) return;

    startTransition(async () => {
      try {
        await deleteSizeChartAction(id);
        setCharts((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        console.error('Failed to delete size chart:', err);
        alert((err as Error).message || 'Failed to delete size chart');
      }
    });
  };

  // Open Link Products Modal
  const handleOpenLinkProducts = (chart: SizeChartItem) => {
    setEditingLinkChart(chart);
    // Find all products currently linked to this chart
    const currentlyLinked = new Set(
      products.filter((p) => p.sizeChartId === chart.id).map((p) => p.id)
    );
    setSelectedProductIds(currentlyLinked);
    setProductSearch('');
  };

  // Toggle selection for linking
  const handleToggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(productId)) {
        updated.delete(productId);
      } else {
        updated.add(productId);
      }
      return updated;
    });
  };

  // Select all products for current filter
  const handleSelectAllProducts = (filteredProductList: ProductItem[]) => {
    const allFilteredIds = filteredProductList.map((p) => p.id);
    const allSelected = allFilteredIds.every((id) => selectedProductIds.has(id));

    setSelectedProductIds((prev) => {
      const updated = new Set(prev);
      if (allSelected) {
        allFilteredIds.forEach((id) => updated.delete(id));
      } else {
        allFilteredIds.forEach((id) => updated.add(id));
      }
      return updated;
    });
  };

  // Save Product Links
  const handleSaveProductLinks = () => {
    if (!linkingChart) return;
    const chartId = linkingChart.id;
    const idsToLink = Array.from(selectedProductIds);

    startTransition(async () => {
      try {
        await linkProductsToSizeChartAction(chartId, idsToLink);

        // Update local product list state
        setProducts((prev) =>
          prev.map((p) => {
            if (idsToLink.includes(p.id)) {
              return { ...p, sizeChartId: chartId };
            } else if (p.sizeChartId === chartId) {
              return { ...p, sizeChartId: null };
            }
            return p;
          })
        );

        // Update local chart product count
        setCharts((prev) =>
          prev.map((c) => {
            if (c.id === chartId) {
              return { ...c, productCount: idsToLink.length };
            }
            return c;
          })
        );

        setEditingLinkChart(null);
      } catch (err) {
        console.error('Failed to link products:', err);
        alert((err as Error).message || 'Failed to update product links');
      }
    });
  };

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      <AdminHeader title="Size Charts & Fit Templates" activeTab="size-charts" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Page Title & Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-neutral-800 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
              <Ruler className="w-6 h-6 text-amber-500" />
              <span>Size Chart Templates</span>
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Create reusable measurement chart templates and link them effortlessly to catalog products.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2 self-start cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Template</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search size charts by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
            />
          </div>
        </div>

        {/* Size Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCharts.map((chart) => (
            <div
              key={chart.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between hover:border-neutral-700 transition-all shadow-lg group relative overflow-hidden"
            >
              <div>
                {/* Header badges */}
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-mono tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                      {chart.category || 'General'}
                    </span>
                    {chart.type === 'WEIGHT_HEIGHT' ? (
                      <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <Scale className="w-3 h-3" />
                        <span>Weight & Height</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <Ruler className="w-3 h-3" />
                        <span>Body (CM)</span>
                      </span>
                    )}
                  </div>
                  {chart.isDefault && (
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-emerald-400" />
                      <span>Default</span>
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-serif font-medium text-white group-hover:text-amber-300 transition-colors">
                  {chart.name}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2 font-light">
                  {chart.description || 'No description provided.'}
                </p>

                {/* Measurements Summary Preview */}
                <div className="mt-4 bg-neutral-950/80 rounded-lg p-3 border border-neutral-850">
                  <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Sizes Included:</span>
                    <span className="text-neutral-300 font-bold">
                      {chart.measurements?.map((m) => m.size).join(', ') || 'XS - 3XL'}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-300 font-mono truncate">
                    {chart.type === 'WEIGHT_HEIGHT' ? (
                      <>
                        Height: {chart.measurements?.[0]?.heightCm || '150-158'} - {chart.measurements?.[chart.measurements.length - 1]?.heightCm || '180-190'} cm
                      </>
                    ) : (
                      <>
                        Bust range: {chart.measurements?.[0]?.bustCm || '81'} - {chart.measurements?.[chart.measurements.length - 1]?.bustCm || '125'} cm
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleOpenLinkProducts(chart)}
                  className="text-xs font-mono text-amber-400 hover:text-amber-300 inline-flex items-center gap-1.5 cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-md border border-amber-500/30 transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Linked ({chart.productCount} Products)</span>
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(chart)}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Edit Template"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteChart(chart.id, chart.name)}
                    className="p-1.5 text-neutral-500 hover:text-rose-400 rounded-md hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredCharts.length === 0 && (
            <div className="col-span-full py-16 text-center bg-neutral-900/50 border border-neutral-800 rounded-xl">
              <Ruler className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400 text-sm font-medium">No size chart templates found.</p>
              <p className="text-neutral-500 text-xs mt-1">Create a new template to manage garment dimensions.</p>
            </div>
          )}
        </div>
      </main>

      {/* MODAL 1: Create / Edit Size Chart Template Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-amber-500" />
                  <span>{editingChart ? 'Edit Size Chart Template' : 'Create Size Chart Template'}</span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Configure measurement metrics and fit guidelines for this template.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveChart} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* General Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ready-To-Wear Fit Chart"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neutral-600 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Traditional & Festive"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neutral-600 font-sans"
                  />
                </div>

                {/* Chart Type Selector */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Size Chart Type *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('BODY_MEASUREMENT')}
                      className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        formType === 'BODY_MEASUREMENT'
                          ? 'bg-amber-500/10 border-amber-500/50 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <Ruler className={`w-5 h-5 shrink-0 mt-0.5 ${formType === 'BODY_MEASUREMENT' ? 'text-amber-400' : 'text-neutral-500'}`} />
                      <div>
                        <div className="font-semibold text-xs text-white">Body Measurement (CM)</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          Bust, Waist, Hips & Shoulder in Centimeters
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTypeChange('WEIGHT_HEIGHT')}
                      className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        formType === 'WEIGHT_HEIGHT'
                          ? 'bg-purple-500/10 border-purple-500/50 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <Scale className={`w-5 h-5 shrink-0 mt-0.5 ${formType === 'WEIGHT_HEIGHT' ? 'text-purple-400' : 'text-neutral-500'}`} />
                      <div>
                        <div className="font-semibold text-xs text-white">Weight & Height (CM / KG)</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          Height (CM) & Body Weight (KG)
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description of this size chart..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neutral-600 font-sans"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1">
                    Fit Guidance / Couture Advice Text
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Tailored for structured corsets. If in between sizes, choose larger size..."
                    value={formGuideText}
                    onChange={(e) => setFormGuideText(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neutral-600 font-sans"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                  <div>
                    <span className="text-xs font-semibold text-white block">Default Store Template</span>
                    <span className="text-[11px] text-neutral-400">
                      Fallback template for products without a specific chart assigned.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIsDefault}
                    onChange={(e) => setFormIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-700 text-amber-500 focus:ring-0 bg-neutral-900 cursor-pointer"
                  />
                </div>
              </div>

              {/* Measurement Table Editor */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-mono tracking-wider font-semibold text-amber-400">
                    Measurement Table Rows ({formRows.length} Sizes)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-mono uppercase px-3 py-1.5 rounded-md inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Size Row</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-neutral-800 rounded-xl bg-neutral-950">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-900 text-neutral-300 uppercase font-mono tracking-wider text-[10px]">
                        <th className="py-2.5 px-3 font-medium border-b border-neutral-800">Size</th>
                        {formType === 'WEIGHT_HEIGHT' ? (
                          <>
                            <th className="py-2.5 px-3 font-medium border-b border-neutral-800">Height Range (CM)</th>
                            <th className="py-2.5 px-3 font-medium border-b border-neutral-800">Weight Range (KG)</th>
                          </>
                        ) : (
                          <>
                            <th className="py-2.5 px-3 font-medium border-b border-neutral-800">Bust (CM)</th>
                            <th className="py-2.5 px-3 font-medium border-b border-neutral-800">Waist (CM)</th>
                            <th className="py-2.5 px-3 font-medium border-b border-neutral-800">Hips (CM)</th>
                            <th className="py-2.5 px-3 font-medium border-b border-neutral-800">Shoulder (CM)</th>
                          </>
                        )}
                        <th className="py-2.5 px-3 font-medium border-b border-neutral-800 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-850 font-mono">
                      {formRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-neutral-900/60">
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={row.size}
                              onChange={(e) => handleRowChange(idx, 'size', e.target.value)}
                              className="w-16 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white text-xs font-bold text-center focus:outline-none focus:border-amber-500"
                            />
                          </td>

                          {formType === 'WEIGHT_HEIGHT' ? (
                            <>
                              <td className="py-1.5 px-2">
                                <input
                                  type="text"
                                  placeholder="160 - 170"
                                  value={row.heightCm || ''}
                                  onChange={(e) => handleRowChange(idx, 'heightCm', e.target.value)}
                                  className="w-36 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 text-xs focus:outline-none focus:border-purple-500"
                                />
                              </td>
                              <td className="py-1.5 px-2">
                                <input
                                  type="text"
                                  placeholder="55 - 63"
                                  value={row.weightKg || ''}
                                  onChange={(e) => handleRowChange(idx, 'weightKg', e.target.value)}
                                  className="w-36 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 text-xs focus:outline-none focus:border-purple-500"
                                />
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-1.5 px-2">
                                <input
                                  type="text"
                                  placeholder="86 - 89"
                                  value={row.bustCm || ''}
                                  onChange={(e) => handleRowChange(idx, 'bustCm', e.target.value)}
                                  className="w-24 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 text-xs focus:outline-none focus:border-amber-500"
                                />
                              </td>
                              <td className="py-1.5 px-2">
                                <input
                                  type="text"
                                  placeholder="66 - 69"
                                  value={row.waistCm || ''}
                                  onChange={(e) => handleRowChange(idx, 'waistCm', e.target.value)}
                                  className="w-24 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 text-xs focus:outline-none focus:border-amber-500"
                                />
                              </td>
                              <td className="py-1.5 px-2">
                                <input
                                  type="text"
                                  placeholder="91 - 94"
                                  value={row.hipsCm || ''}
                                  onChange={(e) => handleRowChange(idx, 'hipsCm', e.target.value)}
                                  className="w-24 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 text-xs focus:outline-none focus:border-amber-500"
                                />
                              </td>
                              <td className="py-1.5 px-2">
                                <input
                                  type="text"
                                  placeholder="37.0"
                                  value={row.shoulderCm || ''}
                                  onChange={(e) => handleRowChange(idx, 'shoulderCm', e.target.value)}
                                  className="w-24 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 text-xs focus:outline-none focus:border-amber-500"
                                />
                              </td>
                            </>
                          )}

                          <td className="py-1.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              disabled={formRows.length <= 1}
                              className="p-1 text-neutral-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                              title="Delete size row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-4 border-t border-neutral-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs uppercase font-medium tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2 bg-white hover:bg-neutral-200 text-black text-xs uppercase font-bold tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isPending ? 'Saving...' : 'Save Template'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Quick Link Products Modal */}
      {linkingChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-amber-500" />
                  <span>Link Products to "{linkingChart.name}"</span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Select products to attach this size chart template. (No tedious manual steps required!)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingLinkChart(null)}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Filter & Search */}
            <div className="p-4 border-b border-neutral-800 bg-neutral-950/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search catalog products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              {/* Select All Toggle */}
              {(() => {
                const filteredProductsList = products.filter((p) => {
                  if (!productSearch.trim()) return true;
                  const q = productSearch.toLowerCase();
                  return p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
                });
                const isAllSelected = filteredProductsList.length > 0 && filteredProductsList.every((p) => selectedProductIds.has(p.id));

                return (
                  <button
                    type="button"
                    onClick={() => handleSelectAllProducts(filteredProductsList)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-mono inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {isAllSelected ? <CheckSquare className="w-4 h-4 text-amber-400" /> : <Square className="w-4 h-4 text-neutral-500" />}
                    <span>Select All ({selectedProductIds.size} Selected)</span>
                  </button>
                );
              })()}
            </div>

            {/* Product List Selector */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2 max-h-[50vh]">
              {products
                .filter((p) => {
                  if (!productSearch.trim()) return true;
                  const q = productSearch.toLowerCase();
                  return p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
                })
                .map((product) => {
                  const isChecked = selectedProductIds.has(product.id);
                  const isLinkedToAnother = product.sizeChartId && product.sizeChartId !== linkingChart.id;

                  return (
                    <label
                      key={product.id}
                      onClick={() => handleToggleProductSelection(product.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-amber-500/10 border-amber-500/40 text-white'
                          : 'bg-neutral-950/60 border-neutral-850 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isChecked ? 'bg-amber-500 border-amber-500 text-black font-bold' : 'border-neutral-600 bg-neutral-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <span className="text-xs font-medium block">{product.name}</span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            /{product.slug} &bull; {product.category || 'Uncategorized'}
                          </span>
                        </div>
                      </div>

                      {isLinkedToAnother && !isChecked && (
                        <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                          Linked elsewhere
                        </span>
                      )}
                    </label>
                  );
                })}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <span className="text-xs font-mono text-neutral-400">
                {selectedProductIds.size} products assigned
              </span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingLinkChart(null)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs uppercase font-medium tracking-wider rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProductLinks}
                  disabled={isPending}
                  className="px-5 py-2 bg-white hover:bg-neutral-200 text-black text-xs uppercase font-bold tracking-wider rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isPending ? 'Saving...' : 'Apply Product Links'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
