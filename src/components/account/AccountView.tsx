'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ProfileTab from './ProfileTab';
import SecurityTab from './SecurityTab';
import AddressTab from './AddressTab';
import { logoutUserAction } from '@/app/actions/auth';
import {
  User,
  Shield,
  MapPin,
  Package,
  Heart,
  ChevronRight,
  ExternalLink,
  Sparkles,
  LogOut,
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
    <div className="bg-neutral-50/50 min-h-screen py-8 sm:py-12 font-light text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Summary Banner */}
        <div className="bg-white border border-neutral-100 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-sans block">
                PATRON ACCOUNT PORTAL
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-light text-neutral-900 flex items-center space-x-2">
                <span>Welcome, {account.name || 'Valued Patron'}</span>
                <Sparkles className="w-5 h-5 text-amber-600 inline-block" />
              </h1>
              <p className="text-neutral-500 font-mono text-[11px]">{account.email || account.phone || 'No contact email'}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/account/orders"
                className="bg-black text-white text-[11px] uppercase tracking-[0.15em] px-4 py-2.5 font-light hover:bg-neutral-800 transition-colors flex items-center space-x-1.5"
              >
                <Package className="w-3.5 h-3.5" />
                <span>My Orders ({account._count.orders})</span>
              </Link>
              <Link
                href="/account/wishlist"
                className="border border-neutral-300 text-neutral-800 text-[11px] uppercase tracking-[0.15em] px-4 py-2.5 font-light hover:bg-neutral-100 transition-colors flex items-center space-x-1.5"
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Wishlist ({account._count.wishlist})</span>
              </Link>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="border border-rose-200 text-rose-800 hover:bg-rose-50 text-[11px] uppercase tracking-[0.15em] px-4 py-2.5 font-light transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>{signingOut ? 'Signing Out...' : 'Sign Out'}</span>
              </button>
            </div>
          </div>

          {/* Patron Dashboard Overview Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Orders Summary Card */}
            <Link
              href="/account/orders"
              className="group bg-neutral-50/60 hover:bg-neutral-100/80 p-5 border border-neutral-100 hover:border-neutral-300 transition-all space-y-2 block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium">
                  Total Orders
                </span>
                <Package className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="font-serif text-2xl font-normal text-neutral-900">
                  {account._count.orders}
                </span>
                <span className="text-[10px] text-neutral-500">placed to date</span>
              </div>
              <p className="text-[10px] text-neutral-500 flex items-center space-x-1 group-hover:text-black transition-colors pt-1">
                <span>View Order History & Tracking</span>
                <ChevronRight className="w-3 h-3" />
              </p>
            </Link>

            {/* Wishlist Summary Card */}
            <Link
              href="/account/wishlist"
              className="group bg-neutral-50/60 hover:bg-neutral-100/80 p-5 border border-neutral-100 hover:border-neutral-300 transition-all space-y-2 block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium">
                  Saved Wishlist
                </span>
                <Heart className="w-4 h-4 text-neutral-400 group-hover:text-red-500 transition-colors" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="font-serif text-2xl font-normal text-neutral-900">
                  {account._count.wishlist}
                </span>
                <span className="text-[10px] text-neutral-500">items saved</span>
              </div>
              <p className="text-[10px] text-neutral-500 flex items-center space-x-1 group-hover:text-black transition-colors pt-1">
                <span>View Saved Favorites</span>
                <ChevronRight className="w-3 h-3" />
              </p>
            </Link>

            {/* Default Address Preview Card */}
            <div
              onClick={() => setActiveTab('addresses')}
              className="cursor-pointer group bg-neutral-50/60 hover:bg-neutral-100/80 p-5 border border-neutral-100 hover:border-neutral-300 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium">
                  Default Shipping Location
                </span>
                <MapPin className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
              </div>
              {defaultAddress ? (
                <div className="space-y-0.5 text-[11px] font-light text-neutral-800">
                  <p className="font-medium text-neutral-900 truncate">
                    {defaultAddress.recipientName} ({defaultAddress.label || 'Home'})
                  </p>
                  <p className="text-neutral-500 truncate">{defaultAddress.addressLine1}</p>
                  <p className="text-neutral-500 truncate">
                    {defaultAddress.city}, {defaultAddress.province} {defaultAddress.postalCode}
                  </p>
                </div>
              ) : (
                <p className="text-neutral-400 italic text-[11px]">No default shipping address set</p>
              )}
              <p className="text-[10px] text-neutral-500 flex items-center space-x-1 group-hover:text-black transition-colors pt-1">
                <span>Manage Address Book ({account.addresses.length})</span>
                <ChevronRight className="w-3 h-3" />
              </p>
            </div>
          </div>
        </div>

        {/* Main Layout with Sidebar Navigation Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <aside className="lg:col-span-1 space-y-2">
            <div className="bg-white border border-neutral-100 p-2 space-y-1 shadow-sm">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-3 text-xs uppercase tracking-[0.15em] flex items-center space-x-3 transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-black text-white font-medium'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-black'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Profile Details</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-4 py-3 text-xs uppercase tracking-[0.15em] flex items-center space-x-3 transition-colors ${
                  activeTab === 'security'
                    ? 'bg-black text-white font-medium'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-black'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Sign In & Security</span>
              </button>

              <button
                onClick={() => setActiveTab('addresses')}
                className={`w-full text-left px-4 py-3 text-xs uppercase tracking-[0.15em] flex items-center space-x-3 transition-colors ${
                  activeTab === 'addresses'
                    ? 'bg-black text-white font-medium'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-black'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Address Book ({account.addresses.length})</span>
              </button>

              <div className="pt-2 border-t border-neutral-100 mt-2 space-y-1">
                <Link
                  href="/account/orders"
                  className="w-full text-left px-4 py-3 text-xs uppercase tracking-[0.15em] flex items-center justify-between text-neutral-600 hover:bg-neutral-50 hover:text-black transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Package className="w-4 h-4" />
                    <span>Order History</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                </Link>

                <Link
                  href="/account/wishlist"
                  className="w-full text-left px-4 py-3 text-xs uppercase tracking-[0.15em] flex items-center justify-between text-neutral-600 hover:bg-neutral-50 hover:text-black transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Heart className="w-4 h-4" />
                    <span>Saved Wishlist</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                </Link>

                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full text-left px-4 py-3 text-xs uppercase tracking-[0.15em] flex items-center space-x-3 text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>{signingOut ? 'Signing Out...' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Active Tab Panel */}
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
