import React from 'react';
import { getFullAdminProductsAction } from '@/app/actions/admin';
import AdminProductsView from '@/components/admin/AdminProductsView';

export default async function AdminProductsPage() {
  const initialProducts = await getFullAdminProductsAction();

  return (
    <div className="bg-neutral-50/50 min-h-screen">
      <AdminProductsView initialProducts={initialProducts} />
    </div>
  );
}
