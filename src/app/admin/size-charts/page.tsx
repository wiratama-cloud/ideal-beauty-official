import React from 'react';
import { getSizeChartsAction, getFullAdminProductsAction } from '@/app/actions/admin';
import AdminSizeChartsView from '@/components/admin/AdminSizeChartsView';

export default async function AdminSizeChartsPage() {
  const [initialSizeCharts, fullProducts] = await Promise.all([
    getSizeChartsAction(),
    getFullAdminProductsAction(),
  ]);

  const allProducts = fullProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    sizeChartId: (p as any).sizeChartId || null,
  }));

  return (
    <div className="bg-neutral-50/50 min-h-screen">
      <AdminSizeChartsView
        initialSizeCharts={initialSizeCharts as any}
        allProducts={allProducts}
      />
    </div>
  );
}
