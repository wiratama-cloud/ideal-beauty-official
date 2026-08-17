import { Suspense } from 'react';
import Header, { HeaderUser } from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import { getNavCategoryTree } from '@/lib/services/nav-category';
import { getLoggedInUserId } from '@/lib/session';
import { isEmailAdmin } from '@/lib/services/access';
import { prisma } from '@/lib/prisma';
import FcmNotificationPrompt from '@/components/common/FcmNotificationPrompt';

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [navCategories, userId] = await Promise.all([
    getNavCategoryTree(),
    getLoggedInUserId(),
  ]);

  let isAdmin = false;
  let currentUser: HeaderUser | null = null;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (user) {
      currentUser = {
        id: user.id,
        name: user.name,
        email: user.email,
      };
      if (user.email) {
        isAdmin = await isEmailAdmin(user.email);
      }
    }
  }

  return (
    <>
      <Suspense fallback={<div className="h-20 border-b border-neutral-100 bg-white" />}>
        <Header initialNavCategories={navCategories} initialIsAdmin={isAdmin} initialUser={currentUser} />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <FcmNotificationPrompt isLoggedIn={!!userId} />
    </>
  );
}
