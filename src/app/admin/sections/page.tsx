import React from 'react';
import AdminSectionsView from '@/components/admin/AdminSectionsView';
import { getAdminLandingSectionsAction, getAdminProductsAction, getHeroBannerAction } from '@/app/actions/admin';

export const metadata = {
  title: "Landing Sections Management | Ideal Beauty Official",
  description: "Configure storefront hero banner, landing sections, category tabs, and featured brand cards.",
};

export default async function AdminSectionsPage() {
  const [sections, products, heroBanner] = await Promise.all([
    getAdminLandingSectionsAction(),
    getAdminProductsAction(),
    getHeroBannerAction(),
  ]);

  return <AdminSectionsView initialSections={sections} products={products} initialHeroBanner={heroBanner} />;
}
