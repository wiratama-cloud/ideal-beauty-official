import React from 'react';
import { getNavCategories } from '@/lib/services/nav-category';
import { getCategories } from '@/lib/services/product';
import AdminNavigationView from '@/components/admin/AdminNavigationView';

export default async function AdminNavigationPage() {
  const [initialCategories, availableCategories] = await Promise.all([
    getNavCategories(false),
    getCategories(),
  ]);

  return (
    <AdminNavigationView
      initialCategories={initialCategories}
      availableCategories={availableCategories}
    />
  );
}
