import React from 'react';
import { redirect } from 'next/navigation';
import { getUserOrders } from '@/lib/services/order';
import { getUserAccount } from '@/lib/services/account';
import { getLoggedInUserId } from '@/lib/session';
import AccountNavigationHeader from '@/components/account/AccountNavigationHeader';
import OrdersListClient from '@/components/account/OrdersListClient';

export const metadata = {
  title: 'Order History & Batch Checkout | Ideal Beauty Official',
  description: 'Track your haute couture reservations, view item statuses, and process consolidated multi-order payments.',
};

export default async function OrderHistoryPage() {
  const userId = await getLoggedInUserId();

  if (!userId) {
    redirect('/login?redirect=/account/orders');
  }

  const [orders, accountData] = await Promise.all([
    getUserOrders(userId),
    getUserAccount(userId),
  ]);

  return (
    <div className="bg-neutral-50/50 min-h-screen pb-20 font-light text-xs">
      <AccountNavigationHeader
        ordersCount={orders.length}
        wishlistCount={accountData?._count?.wishlist ?? 0}
        vouchersCount={accountData?._count?.vouchers ?? accountData?.vouchersCount ?? 0}
        patronName={accountData?.name ?? undefined}
        patronEmail={accountData?.email ?? undefined}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 border-b border-neutral-200/60 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.35em] text-amber-900/70 font-mono block">
              PATRON RESERVATION PORTAL
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-light text-neutral-900">
              Order History & Multi-Select Checkout
            </h1>
          </div>
          <p className="text-neutral-500 font-mono text-xs">
            Total Orders Logged: <strong className="text-neutral-900">{orders.length}</strong>
          </p>
        </div>

        <OrdersListClient orders={orders} />
      </div>
    </div>
  );
}
