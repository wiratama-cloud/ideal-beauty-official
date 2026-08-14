import React from 'react';
import { getNavCategories } from '@/lib/services/nav-category';
import { getCategories } from '@/lib/services/product';
import AdminCollectionView from '@/components/admin/AdminCollectionView';

export default async function AdminCollectionPage() {
  const [initialCategories, availableCategories] = await Promise.all([
    getNavCategories(false),
    getCategories(),
  ]);

  return (
    <AdminCollectionView
      initialCategories={initialCategories}
      availableCategories={availableCategories}
    />
  );
}
