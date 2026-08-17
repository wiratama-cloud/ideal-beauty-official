'use client';

import React, { useState, useTransition, useMemo } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  toggleProductActiveAction,
  updateVariantStockAction,
  bulkToggleProductActiveAction,
  bulkDeleteProductsAction,
  CreateProductInput,
} from '@/app/actions/admin';
import {
  ProductSerialized,
  StockFilterType,
  ModeFilterType,
  StatusFilterType,
} from './products/types';
import ProductMetricsBar from './products/ProductMetricsBar';
import ProductFilterToolbar from './products/ProductFilterToolbar';
import ProductTable from './products/ProductTable';
import ProductDrawerEditor from './products/ProductDrawerEditor';

interface AdminProductsViewProps {
  initialProducts: ProductSerialized[];
  initialSizeCharts?: any[];
}

export default function AdminProductsView({ initialProducts, initialSizeCharts = [] }: AdminProductsViewProps) {
  const [products, setProducts] = useState<ProductSerialized[]>(initialProducts);
  const [isPending, startTransition] = useTransition();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState<ModeFilterType>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('All');
  const [stockFilter, setStockFilter] = useState<StockFilterType>('ALL');

  // Bulk Selection State
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Accordion Matrix Expand State
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  // Side Drawer Editor State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductSerialized | null>(null);
  const [drawerError, setDrawerError] = useState('');
  const [isSavingDrawer, setIsSavingDrawer] = useState(false);

  // Compute Categories List
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    cats.add('All');
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  // Client-Side Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Text Search Filter (name, SKU, slug, category)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesSlug = product.slug.toLowerCase().includes(q);
        const matchesCategory = (product.category || '').toLowerCase().includes(q);
        const matchesSku = product.variants.some((v) => v.sku.toLowerCase().includes(q));
        if (!matchesName && !matchesSlug && !matchesCategory && !matchesSku) {
          return false;
        }
      }

      // 2. Category Filter
      if (categoryFilter !== 'All' && product.category !== categoryFilter) {
        return false;
      }

      // 3. Status Filter
      if (statusFilter === 'ACTIVE' && !product.isActive) return false;
      if (statusFilter === 'INACTIVE' && product.isActive) return false;

      // 4. Mode Filter
      const hasSale = product.variants.some((v) => v.priceSale !== null);
      const hasRent = product.variants.some((v) => v.priceRent !== null);
      if (modeFilter === 'BUY_ONLY' && (!hasSale || hasRent)) return false;
      if (modeFilter === 'RENT_ONLY' && (!hasRent || hasSale)) return false;
      if (modeFilter === 'BOTH' && (!hasSale || !hasRent)) return false;

      // 5. Stock Filter
      const totalAvailable = product.variants.reduce((sum, v) => sum + (v.stockAvailable || 0), 0);
      if (stockFilter === 'IN_STOCK' && totalAvailable === 0) return false;
      if (stockFilter === 'LOW_STOCK' && (totalAvailable === 0 || totalAvailable >= 3)) return false;
      if (stockFilter === 'OUT_OF_STOCK' && totalAvailable > 0) return false;

      return true;
    });
  }, [products, searchQuery, categoryFilter, modeFilter, statusFilter, stockFilter]);

  // Selection Handlers
  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const isAllSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedProductIds.has(p.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProductIds(new Set());
    } else {
      const allIds = new Set(filteredProducts.map((p) => p.id));
      setSelectedProductIds(allIds);
    }
  };

  // Accordion Handler
  const handleToggleExpandProduct = (id: string) => {
    setExpandedProductIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  // Server Action: Toggle Single Product Active
  const handleToggleActive = (productId: string, currentIsActive: boolean) => {
    const nextIsActive = !currentIsActive;
    // Optimistic UI Update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isActive: nextIsActive } : p))
    );

    startTransition(async () => {
      try {
        await toggleProductActiveAction(productId, nextIsActive);
      } catch (err) {
        console.error('Failed to toggle active status:', err);
        // Revert on error
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, isActive: currentIsActive } : p))
        );
      }
    });
  };

  // Server Action: Save Variant Stock
  const handleSaveVariantStock = async (
    variantId: string,
    stockSaleTotal: number,
    stockSaleAvailable: number,
    stockRentTotal: number = 0,
    stockRentAvailable: number = 0
  ) => {
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((product) => ({
        ...product,
        variants: product.variants.map((v) =>
          v.id === variantId
            ? {
                ...v,
                stockSaleTotal,
                stockSaleAvailable,
                stockRentTotal,
                stockRentAvailable,
                stockTotal: stockSaleTotal + stockRentTotal,
                stockAvailable: stockSaleAvailable + stockRentAvailable,
              }
            : v
        ),
      }))
    );

    await updateVariantStockAction(
      variantId,
      stockSaleTotal,
      stockSaleAvailable,
      stockRentTotal,
      stockRentAvailable
    );
  };

  // Server Action: Bulk Activate
  const handleBulkActivate = () => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (selectedProductIds.has(p.id) ? { ...p, isActive: true } : p))
    );

    startTransition(async () => {
      try {
        await bulkToggleProductActiveAction(ids, true);
        setSelectedProductIds(new Set());
      } catch (err) {
        console.error('Failed bulk activate:', err);
      }
    });
  };

  // Server Action: Bulk Deactivate
  const handleBulkDeactivate = () => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (selectedProductIds.has(p.id) ? { ...p, isActive: false } : p))
    );

    startTransition(async () => {
      try {
        await bulkToggleProductActiveAction(ids, false);
        setSelectedProductIds(new Set());
      } catch (err) {
        console.error('Failed bulk deactivate:', err);
      }
    });
  };

  // Server Action: Bulk Delete
  const handleBulkDelete = () => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete or deactivate ${ids.length} selected products?`)) {
      return;
    }

    // Optimistic update
    setProducts((prev) => prev.filter((p) => !selectedProductIds.has(p.id)));

    startTransition(async () => {
      try {
        await bulkDeleteProductsAction(ids);
        setSelectedProductIds(new Set());
      } catch (err) {
        console.error('Failed bulk delete:', err);
      }
    });
  };

  // Server Action: Delete Single Product
  const handleDeleteProduct = (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    // Optimistic UI update
    setProducts((prev) => prev.filter((p) => p.id !== productId));

    startTransition(async () => {
      try {
        await deleteProductAction(productId);
      } catch (err) {
        console.error('Failed to delete product:', err);
      }
    });
  };

  // Drawer Triggers
  const handleOpenAddDrawer = () => {
    setEditingProduct(null);
    setDrawerError('');
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (product: ProductSerialized) => {
    setEditingProduct(product);
    setDrawerError('');
    setIsDrawerOpen(true);
  };

  // Server Action: Save Product (Create / Update) inside Drawer
  const handleSaveProductDrawer = async (data: CreateProductInput) => {
    setIsSavingDrawer(true);
    setDrawerError('');

    try {
      if (editingProduct) {
        // Update product
        const updated = await updateProductAction(editingProduct.id, data);
        if (updated && 'id' in updated) {
          setProducts((prev) =>
            prev.map((p) => (p.id === editingProduct.id ? (updated as unknown as ProductSerialized) : p))
          );
        }
      } else {
        // Create new product
        const created = await createProductAction(data);
        if (created && 'id' in created) {
          setProducts((prev) => [(created as unknown as ProductSerialized), ...prev]);
        }
      }
      setIsDrawerOpen(false);
    } catch (err) {
      console.error('Failed to save product:', err);
      setDrawerError((err as Error).message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSavingDrawer(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-16 text-xs">
      <AdminHeader
        title={`Products & Inventory (${products.length})`}
        subtitle="ATELIER GARMENT CATALOG & STOCK MATRIX"
        activeTab="products"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* 1. Metrics Bar */}
        <ProductMetricsBar products={products} />

        {/* 2. Filter Toolbar */}
        <ProductFilterToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          categories={categoriesList}
          modeFilter={modeFilter}
          onModeChange={setModeFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          stockFilter={stockFilter}
          onStockChange={setStockFilter}
          selectedCount={selectedProductIds.size}
          totalCount={filteredProducts.length}
          onSelectAllToggle={handleToggleSelectAll}
          isAllSelected={isAllSelected}
          onBulkActivate={handleBulkActivate}
          onBulkDeactivate={handleBulkDeactivate}
          onBulkDelete={handleBulkDelete}
          isBulkPending={isPending}
          onOpenAddDrawer={handleOpenAddDrawer}
        />

        {/* 3. Products Table & Variant Matrix */}
        <ProductTable
          products={filteredProducts}
          selectedProductIds={selectedProductIds}
          onToggleSelectProduct={handleToggleSelectProduct}
          onToggleSelectAll={handleToggleSelectAll}
          isAllSelected={isAllSelected}
          expandedProductIds={expandedProductIds}
          onToggleExpandProduct={handleToggleExpandProduct}
          onToggleActive={handleToggleActive}
          onOpenEditDrawer={handleOpenEditDrawer}
          onDeleteProduct={handleDeleteProduct}
          onSaveVariantStock={handleSaveVariantStock}
        />

        {/* 4. Slide-over Side Drawer Editor */}
        <ProductDrawerEditor
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          product={editingProduct}
          categories={categoriesList}
          sizeCharts={initialSizeCharts}
          onSave={handleSaveProductDrawer}
          isSaving={isSavingDrawer}
          errorMessage={drawerError}
        />
      </main>
    </div>
  );
}
