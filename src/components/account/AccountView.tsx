'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AccountNavigationHeader from './AccountNavigationHeader';
import ProfileTab from './ProfileTab';
import SecurityTab from './SecurityTab';
import AddressTab from './AddressTab';
import { logoutUserAction, checkIsAdminAction } from '@/app/actions/auth';
import {
  User,
  Shield,
  MapPin,
  Package,
  Heart,
  ChevronRight,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Sparkles,
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
  };
}

interface AccountViewProps {
  account: UserAccountData;
}

export default function AccountView({ account }: AccountViewProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'addresses'>('profile');
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

  const defaultAddress = account.addresses.find((addr) => addr.isDefault) || account.addresses[0];

  return (
    <div className="bg-neutral-50/60 min-h-screen pb-16 font-light text-xs">
      {/* Shared Luxury Navigation Header */}
      <AccountNavigationHeader
        ordersCount={account._count.orders}
        wishlistCount={account._count.wishlist}
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-neutral-100 pb-6">
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
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-1.5 px-3 py-2 bg-neutral-50 border border-neutral-200/70 text-[10px] font-mono tracking-wider">
                <span className="text-neutral-500">EMAIL:</span>
                <span className="text-neutral-900 font-medium">{account.email || 'Not provided'}</span>
                {account.isEmailVerified ? (
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 ml-1 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                  </span>
                ) : (
                  <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 ml-1 flex items-center gap-0.5">
                    <AlertCircle className="w-3 h-3 text-amber-600" /> Unverified
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-1.5 px-3 py-2 bg-neutral-50 border border-neutral-200/70 text-[10px] font-mono tracking-wider">
                <span className="text-neutral-500">PHONE:</span>
                <span className="text-neutral-900 font-medium">{account.phone || 'Not provided'}</span>
                {account.isPhoneVerified ? (
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 ml-1 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                  </span>
                ) : (
                  <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 ml-1 flex items-center gap-0.5">
                    <AlertCircle className="w-3 h-3 text-amber-600" /> Unverified
                  </span>
                )}
              </div>

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

          {/* Quick Stats Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Orders Summary Card */}
            <Link
              href="/account/orders"
              className="group bg-neutral-50/80 hover:bg-amber-50/30 p-5 border border-neutral-200/80 hover:border-amber-300 transition-all space-y-2 block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-mono">
                  Orders History
                </span>
                <Package className="w-4 h-4 text-neutral-400 group-hover:text-amber-700 transition-colors" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="font-serif text-3xl font-light text-neutral-900">
                  {account._count.orders}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">placed to date</span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-600 group-hover:text-amber-900 transition-colors pt-2 flex items-center justify-between border-t border-neutral-200/50">
                <span>View Order History & Multi-Checkout</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </p>
            </Link>

            {/* Wishlist Summary Card */}
            <Link
              href="/account/wishlist"
              className="group bg-neutral-50/80 hover:bg-amber-50/30 p-5 border border-neutral-200/80 hover:border-amber-300 transition-all space-y-2 block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-mono">
                  Saved Wishlist
                </span>
                <Heart className="w-4 h-4 text-neutral-400 group-hover:text-amber-700 transition-colors" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="font-serif text-3xl font-light text-neutral-900">
                  {account._count.wishlist}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">pieces saved</span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-600 group-hover:text-amber-900 transition-colors pt-2 flex items-center justify-between border-t border-neutral-200/50">
                <span>View Atelier Favorites</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </p>
            </Link>

            {/* Default Shipping Address Preview Card */}
            <div
              onClick={() => setActiveTab('addresses')}
              className="cursor-pointer group bg-neutral-50/80 hover:bg-amber-50/30 p-5 border border-neutral-200/80 hover:border-amber-300 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-mono">
                  Default Shipping Address
                </span>
                <MapPin className="w-4 h-4 text-neutral-400 group-hover:text-amber-700 transition-colors" />
              </div>
              {defaultAddress ? (
                <div className="space-y-0.5 text-[11px] font-light text-neutral-800">
                  <p className="font-medium text-neutral-900 truncate">
                    {defaultAddress.recipientName} {defaultAddress.label && `(${defaultAddress.label})`}
                  </p>
                  <p className="text-neutral-500 truncate">{defaultAddress.addressLine1}</p>
                  <p className="text-neutral-500 truncate">
                    {defaultAddress.city}, {defaultAddress.province} {defaultAddress.postalCode}
                  </p>
                </div>
              ) : (
                <p className="text-neutral-400 italic text-[11px]">No default shipping address saved</p>
              )}
              <p className="text-[10px] uppercase tracking-wider text-neutral-600 group-hover:text-amber-900 transition-colors pt-2 flex items-center justify-between border-t border-neutral-200/50">
                <span>Manage Address Book ({account.addresses.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </p>
            </div>
          </div>
        </div>

        {/* Main Layout with Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Tabs Navigation Sidebar */}
          <aside className="lg:col-span-1 space-y-2">
            <div className="bg-white border border-neutral-200/80 p-2 space-y-1 shadow-xs">
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-neutral-400 px-3 pt-2 pb-1 block">
                ACCOUNT SETTINGS
              </span>

              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-3 text-xs uppercase tracking-[0.18em] flex items-center space-x-3 transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-neutral-900 text-white font-medium border-l-2 border-amber-500'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <User className="w-4 h-4 text-amber-600" />
                <span>Profile Details</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-4 py-3 text-xs uppercase tracking-[0.18em] flex items-center space-x-3 transition-colors ${
                  activeTab === 'security'
                    ? 'bg-neutral-900 text-white font-medium border-l-2 border-amber-500'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-600" />
                <span>Sign In & Security</span>
              </button>

              <button
                onClick={() => setActiveTab('addresses')}
                className={`w-full text-left px-4 py-3 text-xs uppercase tracking-[0.18em] flex items-center space-x-3 transition-colors ${
                  activeTab === 'addresses'
                    ? 'bg-neutral-900 text-white font-medium border-l-2 border-amber-500'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>Address Book ({account.addresses.length})</span>
              </button>
            </div>
          </aside>

          {/* Active Tab Content Panel */}
          <main className="lg:col-span-3">
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
          </main>
        </div>
      </div>
    </div>
  );
}
