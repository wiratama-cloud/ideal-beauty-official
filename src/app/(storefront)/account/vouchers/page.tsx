import React from 'react';
import { redirect } from 'next/navigation';
import { getLoggedInUserId } from '@/lib/session';
import { getUserVouchers, getUserVoucherHistory } from '@/lib/services/voucher';
import { getUserAccount } from '@/lib/services/account';
import AccountNavigationHeader from '@/components/account/AccountNavigationHeader';
import VouchersListClient from '@/components/account/VouchersListClient';
import { Ticket } from 'lucide-react';

export const metadata = {
  title: 'My Vouchers & Exclusive Privileges | Ideal Beauty Official',
  description: 'View and manage your personal promo vouchers, seasonal discounts, and redemption history.',
};

export default async function AccountVouchersPage() {
  const userId = await getLoggedInUserId();

  if (!userId) {
    redirect('/login?redirect=/account/vouchers');
  }

  const [vouchers, history, accountData] = await Promise.all([
    getUserVouchers(userId),
    getUserVoucherHistory(userId),
    getUserAccount(userId),
  ]);

  const availableCount = vouchers.filter((v) => v.isAvailable).length;

  return (
    <div className="bg-neutral-50/50 min-h-screen pb-20 font-light text-xs">
      <AccountNavigationHeader
        ordersCount={accountData?._count?.orders ?? 0}
        wishlistCount={accountData?._count?.wishlist ?? 0}
        vouchersCount={availableCount}
        patronName={accountData?.name ?? undefined}
        patronEmail={accountData?.email ?? undefined}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 border-b border-neutral-200/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Ticket className="w-4 h-4 text-amber-600" />
              <span className="text-[10px] uppercase tracking-[0.35em] text-amber-900/70 font-mono">
                PATRON PRIVILEGES & INCENTIVES
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-light text-neutral-900">
              Exclusive Vouchers & Promotional Rewards
            </h1>
          </div>
          <p className="text-neutral-500 font-mono text-xs">
            Available Offers: <strong className="text-neutral-900">{availableCount}</strong>
          </p>
        </div>

        <VouchersListClient
          initialVouchers={vouchers as any}
          initialHistory={history as any}
        />
      </div>
    </div>
  );
}
