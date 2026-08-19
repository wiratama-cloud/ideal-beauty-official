'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Package, Heart, Sparkles, Ticket } from 'lucide-react';

export interface AccountNavigationHeaderProps {
  ordersCount?: number;
  wishlistCount?: number;
  vouchersCount?: number;
  patronName?: string;
  patronEmail?: string;
}

export default function AccountNavigationHeader({
  ordersCount,
  wishlistCount,
  vouchersCount,
  patronName,
  patronEmail,
}: AccountNavigationHeaderProps) {
  const pathname = usePathname();

  const isOverview = pathname === '/account';
  const isOrders = pathname.startsWith('/account/orders');
  const isWishlist = pathname.startsWith('/account/wishlist');
  const isVouchers = pathname.startsWith('/account/vouchers');

  const navItems = [
    {
      label: 'Overview & Profile',
      href: '/account',
      active: isOverview,
      icon: User,
      badge: null,
    },
    {
      label: 'My Orders',
      href: '/account/orders',
      active: isOrders,
      icon: Package,
      badge: typeof ordersCount === 'number' ? ordersCount : null,
    },
    {
      label: 'Saved Wishlist',
      href: '/account/wishlist',
      active: isWishlist,
      icon: Heart,
      badge: typeof wishlistCount === 'number' ? wishlistCount : null,
    },
    {
      label: 'My Vouchers',
      href: '/account/vouchers',
      active: isVouchers,
      icon: Ticket,
      badge: typeof vouchersCount === 'number' ? vouchersCount : null,
    },
  ];

  return (
    <header className="bg-white border-b border-neutral-200/80 mb-8 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-100">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-neutral-400">
                HAUTE COUTURE ATELIER &bull; PATRON PORTAL
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-light text-neutral-900 tracking-wide flex items-center gap-2">
              <span>{patronName ? `Welcome, ${patronName}` : 'Patron Account Portal'}</span>
              <Sparkles className="w-4.5 h-4.5 text-amber-600 inline-block" />
            </h1>
            {patronEmail && (
              <p className="text-[11px] font-mono text-neutral-500 tracking-wider">
                {patronEmail}
              </p>
            )}
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-[10px] uppercase font-mono tracking-widest text-amber-900 bg-amber-50/80 border border-amber-200/60 px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
            <span>Atelier Private Patron Suite</span>
          </div>
        </div>

        {/* Cohesive Navigation Header Tabs */}
        <nav className="flex items-center space-x-6 sm:space-x-10 mt-4 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center space-x-2.5 pb-4 text-xs uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                  item.active
                    ? 'text-neutral-900 font-medium'
                    : 'text-neutral-500 hover:text-neutral-900 font-light'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 transition-colors ${
                    item.active
                      ? 'text-amber-600'
                      : 'text-neutral-400 group-hover:text-amber-600'
                  }`}
                />
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full transition-colors ${
                      item.active
                        ? 'bg-amber-100 text-amber-900 font-medium'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-600" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
