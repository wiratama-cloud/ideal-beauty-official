import React from 'react';
import AdminSectionsView from '@/components/admin/AdminSectionsView';
import { getAdminLandingSectionsAction, getAdminProductsAction } from '@/app/actions/admin';

export const metadata = {
  title: "Landing Sections Management | Ideal Beauty Official",
  description: "Configure storefront landing sections, category tabs, and featured brand cards.",
};

export default async function AdminSectionsPage() {
  const [sections, products] = await Promise.all([
    getAdminLandingSectionsAction(),
    getAdminProductsAction(),
  ]);

  return <AdminSectionsView initialSections={sections} products={products} />;
}
