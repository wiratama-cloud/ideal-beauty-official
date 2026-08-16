import React from 'react';
import { getFullAdminProductsAction, getSizeChartsAction } from '@/app/actions/admin';
import AdminProductsView from '@/components/admin/AdminProductsView';

export default async function AdminProductsPage() {
  const [initialProducts, initialSizeCharts] = await Promise.all([
    getFullAdminProductsAction(),
    getSizeChartsAction(),
  ]);

  return (
    <div className="bg-neutral-50/50 min-h-screen">
      <AdminProductsView initialProducts={initialProducts} initialSizeCharts={initialSizeCharts} />
    </div>
  );
}
