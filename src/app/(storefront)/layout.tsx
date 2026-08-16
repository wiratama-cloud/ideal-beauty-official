import { Suspense } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import { getNavCategoryTree } from '@/lib/services/nav-category';
import FcmNotificationPrompt from '@/components/common/FcmNotificationPrompt';

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const navCategories = await getNavCategoryTree();
  
  return (
    <>
      <Suspense fallback={<div className="h-20 border-b border-neutral-100 bg-white" />}>
        <Header initialNavCategories={navCategories} />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <FcmNotificationPrompt />
    </>
  );
}
