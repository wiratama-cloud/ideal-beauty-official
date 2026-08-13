import React from 'react';
import { getSessionUserId } from '@/lib/session';
import { getUserAccount } from '@/lib/services/account';
import AccountView from '@/components/account/AccountView';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'My Account | Ideal Beauty Official',
  description: 'Manage your personal details, saved shipping addresses, security options, and order history.',
};

export default async function AccountPage() {
  const userId = await getSessionUserId();

  let accountData = null;
  let errorMessage: string | null = null;

  try {
    accountData = await getUserAccount(userId);
  } catch (err: any) {
    errorMessage = err.message || 'Failed to load patron account data.';
  }

  if (!accountData) {
    return (
      <div className="bg-neutral-50/50 min-h-screen py-16 font-light text-xs">
        <div className="max-w-md mx-auto px-4 text-center space-y-6">
          <div className="bg-white border border-neutral-100 p-8 space-y-4 shadow-sm">
            <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
            <h1 className="font-serif text-xl font-normal text-neutral-900">Account Access Issue</h1>
            <p className="text-neutral-500 font-light text-xs">
              {errorMessage || 'Unable to load account information. Please sign in or refresh the page.'}
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-block bg-black text-white text-xs uppercase tracking-[0.2em] px-6 py-3 font-light hover:bg-neutral-800 transition-colors"
              >
                Browse Collections
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AccountView account={accountData} />;
}
