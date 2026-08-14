import React from 'react';
import { redirect } from 'next/navigation';
import { getUserWishlist } from '@/lib/services/wishlist';
import { getUserAccount } from '@/lib/services/account';
import { getLoggedInUserId } from '@/lib/session';
import AccountNavigationHeader from '@/components/account/AccountNavigationHeader';
import WishlistClientView from '@/components/account/WishlistClientView';

export const metadata = {
  title: 'Saved Wishlist & Private Atelier Gallery | Ideal Beauty Official',
  description: 'Curate your private haute couture gallery, view availability, and move saved pieces to your shopping bag.',
};

export default async function WishlistPage() {
  const userId = await getLoggedInUserId();

  if (!userId) {
    redirect('/login?redirect=/account/wishlist');
  }

  const [wishlistItems, accountData] = await Promise.all([
    getUserWishlist(userId),
    getUserAccount(userId),
  ]);

  return (
    <div className="bg-neutral-50/50 min-h-screen pb-20 font-light text-xs">
      <AccountNavigationHeader
        ordersCount={accountData?._count?.orders ?? 0}
        wishlistCount={wishlistItems.length}
        patronName={accountData?.name ?? undefined}
        patronEmail={accountData?.email ?? undefined}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <WishlistClientView initialItems={wishlistItems as any} />
      </div>
    </div>
  );
}
