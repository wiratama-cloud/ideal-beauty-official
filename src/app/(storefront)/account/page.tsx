import React from 'react';
import { redirect } from 'next/navigation';
import { getLoggedInUserId } from '@/lib/session';
import { getUserAccount } from '@/lib/services/account';
import AccountView from '@/components/account/AccountView';

export const metadata = {
  title: 'My Account | Ideal Beauty Official',
  description: 'Manage your personal details, saved shipping addresses, security options, and order history.',
};

export default async function AccountPage() {
  const userId = await getLoggedInUserId();

  if (!userId) {
    redirect('/login?redirect=/account');
  }

  const accountData = await getUserAccount(userId);

  if (!accountData) {
    redirect('/login?redirect=/account');
  }

  return <AccountView account={accountData} />;
}
