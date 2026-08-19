'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AccountNavigationHeader from './AccountNavigationHeader';
import ProfileTab from './ProfileTab';
import SecurityTab from './SecurityTab';
import AddressTab from './AddressTab';
import NotificationsTab from './NotificationsTab';
import { logoutUserAction, checkIsAdminAction } from '@/app/actions/auth';
import {
  User,
  Shield,
  MapPin,
  Bell,
  ChevronRight,
  LogOut,
  Crown,
} from 'lucide-react';

export interface UserAccountData {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  isPhoneVerified: boolean;
  isEmailVerified?: boolean;
  firebaseUid?: string | null;
  fcmToken?: string | null;
  passwordHash: string | null;
  createdAt: Date | string;
  addresses: Array<{
    id: string;
    label: string | null;
    recipientName: string;
    phone: string;
    addressLine1: string;
    city: string;
    province: string;
    postalCode: string;
    isDefault: boolean;
  }>;
  _count: {
    orders: number;
    wishlist: number;
    vouchers?: number;
  };
  vouchersCount?: number;
  availableVouchersCount?: number;
}

interface AccountViewProps {
  account: UserAccountData;
}

export default function AccountView({ account }: AccountViewProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'addresses' | 'notifications'>('profile');
  const [signingOut, setSigningOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkIsAdminAction()
      .then((res) => setIsAdmin(res))
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logoutUserAction();
      window.location.href = '/login';
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <div className="bg-neutral-50/60 min-h-screen pb-16 font-light text-xs">
      {/* Shared Luxury Navigation Header */}
      <AccountNavigationHeader
        ordersCount={account._count.orders}
        wishlistCount={account._count.wishlist}
        vouchersCount={account._count.vouchers ?? account.vouchersCount ?? 0}
        patronName={account.name || 'Valued Patron'}
        patronEmail={account.email || account.phone || undefined}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Administrator Quick Portal Banner */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 border border-amber-500/40 text-white p-6 rounded-lg shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-300 font-semibold">
                  ADMINISTRATOR PRIVILEGES
                </span>
              </div>
              <h3 className="font-serif text-lg text-white font-light">
                System Administrator Access Granted
              </h3>
              <p className="text-xs text-neutral-300 font-light max-w-2xl">
                Your logged in account possesses administrator rights to manage product catalog, orders, financial ledgers, size charts, and access settings.
              </p>
            </div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 shadow-xs"
            >
              <span>Go to Admin Portal</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Patron Banner & Verification Badges */}
        <div className="bg-white border border-neutral-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Crown className="w-4 h-4 text-amber-600" />
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-900/80">
                  PATRON PROFILE OVERVIEW
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-light text-neutral-900 tracking-wide">
                {account.name || 'Valued Patron'}
              </h2>
              <p className="text-neutral-500 font-mono text-[11px] tracking-wider">
                Member since {new Date(account.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Verification & Contact Badges */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="border border-rose-200 text-rose-800 hover:bg-rose-50 text-[10px] uppercase tracking-[0.15em] px-4 py-2 font-light transition-colors flex items-center space-x-1.5 disabled:opacity-50 ml-auto sm:ml-0"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>{signingOut ? 'Signing Out...' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Clean, Intuitive Horizontal Account Settings Tabs & Content */}
        <div className="bg-white border border-neutral-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Horizontal Sub-Tabs Bar */}
          <div className="border-b border-neutral-200 pb-0">
            <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto scrollbar-none pb-0">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center space-x-2 px-4 py-3 text-xs uppercase tracking-[0.18em] transition-all border-b-2 whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'border-amber-600 text-neutral-900 font-medium'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
                }`}
              >
                <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-amber-600' : 'text-neutral-400'}`} />
                <span>Profile Details</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center space-x-2 px-4 py-3 text-xs uppercase tracking-[0.18em] transition-all border-b-2 whitespace-nowrap ${
                  activeTab === 'security'
                    ? 'border-amber-600 text-neutral-900 font-medium'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
                }`}
              >
                <Shield className={`w-4 h-4 ${activeTab === 'security' ? 'text-amber-600' : 'text-neutral-400'}`} />
                <span>Sign In & Security</span>
              </button>

              <button
                onClick={() => setActiveTab('addresses')}
                className={`flex items-center space-x-2 px-4 py-3 text-xs uppercase tracking-[0.18em] transition-all border-b-2 whitespace-nowrap ${
                  activeTab === 'addresses'
                    ? 'border-amber-600 text-neutral-900 font-medium'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
                }`}
              >
                <MapPin className={`w-4 h-4 ${activeTab === 'addresses' ? 'text-amber-600' : 'text-neutral-400'}`} />
                <span>Address Book ({account.addresses.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center space-x-2 px-4 py-3 text-xs uppercase tracking-[0.18em] transition-all border-b-2 whitespace-nowrap ${
                  activeTab === 'notifications'
                    ? 'border-amber-600 text-neutral-900 font-medium'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
                }`}
              >
                <Bell className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-amber-600' : 'text-neutral-400'}`} />
                <span>Notifications</span>
              </button>
            </div>
          </div>

          {/* Active Tab Content Panel */}
          <div className="pt-2">
            {activeTab === 'profile' && <ProfileTab user={account} />}
            {activeTab === 'security' && (
              <SecurityTab
                user={{
                  id: account.id,
                  email: account.email,
                  phone: account.phone,
                  isPhoneVerified: account.isPhoneVerified,
                  isEmailVerified: account.isEmailVerified ?? false,
                  firebaseUid: account.firebaseUid,
                  hasPassword: !!account.passwordHash,
                  createdAt: account.createdAt,
                }}
              />
            )}
            {activeTab === 'addresses' && <AddressTab addresses={account.addresses} />}
            {activeTab === 'notifications' && (
              <NotificationsTab
                user={{
                  id: account.id,
                  fcmToken: account.fcmToken,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
