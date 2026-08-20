'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const subTabNavRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    checkIsAdminAction()
      .then((res) => setIsAdmin(res))
      .catch(() => {});
  }, []);

  // Smoothly center active subtab on mobile when clicked/changed
  useEffect(() => {
    const container = subTabNavRef.current;
    if (!container) return;

    const frameId = requestAnimationFrame(() => {
      const activeBtn = container.querySelector<HTMLElement>('[data-active="true"]');
      if (activeBtn) {
        const containerWidth = container.clientWidth;
        const scrollWidth = container.scrollWidth;
        if (scrollWidth > containerWidth) {
          const activeLeft = activeBtn.offsetLeft;
          const activeWidth = activeBtn.offsetWidth;
          const targetScrollLeft = activeLeft - containerWidth / 2 + activeWidth / 2;
          container.scrollTo({
            left: Math.max(0, targetScrollLeft),
            behavior: 'smooth',
          });
        }
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [activeTab]);

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

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Administrator Quick Portal Banner */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 border border-amber-500/40 text-white p-4 sm:p-6 rounded-lg shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.25em] text-amber-300 font-semibold">
                  ADMINISTRATOR PRIVILEGES
                </span>
              </div>
              <h3 className="font-serif text-base sm:text-lg text-white font-light">
                System Administrator Access Granted
              </h3>
              <p className="text-xs text-neutral-300 font-light max-w-2xl">
                Your logged in account possesses administrator rights to manage product catalog, orders, financial ledgers, size charts, and access settings.
              </p>
            </div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white px-4 sm:px-5 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 shadow-xs w-full sm:w-auto"
            >
              <span>Go to Admin Portal</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Patron Banner & Verification Badges */}
        <div className="bg-white border border-neutral-200/80 p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center space-x-2">
                <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.25em] sm:tracking-[0.3em] text-amber-900/80">
                  PATRON PROFILE OVERVIEW
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-light text-neutral-900 tracking-wide">
                {account.name || 'Valued Patron'}
              </h2>
              <p className="text-neutral-500 font-mono text-[10px] sm:text-[11px] tracking-wider">
                Member since {new Date(account.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Verification & Contact Badges */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full sm:w-auto border border-rose-200 text-rose-800 hover:bg-rose-50 text-[10px] uppercase tracking-[0.15em] px-4 py-2.5 sm:py-2 font-light transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{signingOut ? 'Signing Out...' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Clean, Intuitive Horizontal Account Settings Tabs & Content */}
        <div className="bg-white border border-neutral-200/80 p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 shadow-xs">
          {/* Horizontal Sub-Tabs Bar */}
          <div className="border-b border-neutral-200 pb-0">
            <div
              ref={subTabNavRef}
              className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto scrollbar-none pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 overscroll-x-contain touch-pan-x scroll-smooth"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <button
                onClick={() => setActiveTab('profile')}
                data-active={activeTab === 'profile' ? 'true' : undefined}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.18em] transition-all border-b-2 whitespace-nowrap shrink-0 ${
                  activeTab === 'profile'
                    ? 'border-amber-600 text-neutral-900 font-medium'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
                }`}
              >
                <User className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeTab === 'profile' ? 'text-amber-600' : 'text-neutral-400'}`} />
                <span className="hidden xs:inline sm:inline">Profile Details</span>
                <span className="xs:hidden">Profile</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                data-active={activeTab === 'security' ? 'true' : undefined}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.18em] transition-all border-b-2 whitespace-nowrap shrink-0 ${
                  activeTab === 'security'
                    ? 'border-amber-600 text-neutral-900 font-medium'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
                }`}
              >
                <Shield className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeTab === 'security' ? 'text-amber-600' : 'text-neutral-400'}`} />
                <span className="hidden xs:inline sm:inline">Sign In & Security</span>
                <span className="xs:hidden">Security</span>
              </button>

              <button
                onClick={() => setActiveTab('addresses')}
                data-active={activeTab === 'addresses' ? 'true' : undefined}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.18em] transition-all border-b-2 whitespace-nowrap shrink-0 ${
                  activeTab === 'addresses'
                    ? 'border-amber-600 text-neutral-900 font-medium'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
                }`}
              >
                <MapPin className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeTab === 'addresses' ? 'text-amber-600' : 'text-neutral-400'}`} />
                <span>Address Book ({account.addresses.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                data-active={activeTab === 'notifications' ? 'true' : undefined}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.18em] transition-all border-b-2 whitespace-nowrap shrink-0 ${
                  activeTab === 'notifications'
                    ? 'border-amber-600 text-neutral-900 font-medium'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
                }`}
              >
                <Bell className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeTab === 'notifications' ? 'text-amber-600' : 'text-neutral-400'}`} />
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
