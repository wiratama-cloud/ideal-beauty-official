'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Package, Heart, Sparkles, Ticket } from 'lucide-react';

export const ACCOUNT_NAV_SCROLL_KEY = 'ideal_account_nav_scroll_left';

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
  const navRef = useRef<HTMLElement | null>(null);

  const isOverview = pathname === '/account';
  const isOrders = pathname.startsWith('/account/orders');
  const isWishlist = pathname.startsWith('/account/wishlist');
  const isVouchers = pathname.startsWith('/account/vouchers');

  // Auto-center active tab on mount and route (pathname) changes
  useEffect(() => {
    const container = navRef.current;
    if (!container) return;

    // Use requestAnimationFrame to ensure DOM layout has rendered
    const frameId = requestAnimationFrame(() => {
      const activeEl = container.querySelector<HTMLElement>('[data-active="true"]');
      if (activeEl) {
        const containerWidth = container.clientWidth;
        const scrollWidth = container.scrollWidth;
        if (scrollWidth > containerWidth) {
          const activeLeft = activeEl.offsetLeft;
          const activeWidth = activeEl.offsetWidth;
          const targetScrollLeft = activeLeft - containerWidth / 2 + activeWidth / 2;
          container.scrollTo({
            left: Math.max(0, targetScrollLeft),
            behavior: 'smooth',
          });
        }
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [pathname]);

  // Persist scroll position to sessionStorage for fast back/forward navigation
  const handleScroll = useCallback(() => {
    if (navRef.current && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(ACCOUNT_NAV_SCROLL_KEY, String(navRef.current.scrollLeft));
      } catch {
        // Safe fail for restricted storage contexts
      }
    }
  }, []);

  const navItems = [
    {
      label: 'Overview & Profile',
      shortLabel: 'Overview',
      href: '/account',
      active: isOverview,
      icon: User,
      badge: null,
    },
    {
      label: 'My Orders',
      shortLabel: 'Orders',
      href: '/account/orders',
      active: isOrders,
      icon: Package,
      badge: typeof ordersCount === 'number' ? ordersCount : null,
    },
    {
      label: 'Saved Wishlist',
      shortLabel: 'Wishlist',
      href: '/account/wishlist',
      active: isWishlist,
      icon: Heart,
      badge: typeof wishlistCount === 'number' ? wishlistCount : null,
    },
    {
      label: 'My Vouchers',
      shortLabel: 'Vouchers',
      href: '/account/vouchers',
      active: isVouchers,
      icon: Ticket,
      badge: typeof vouchersCount === 'number' ? vouchersCount : null,
    },
  ];

  return (
    <header className="bg-white border-b border-neutral-200/80 mb-6 sm:mb-8 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-neutral-100">
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.25em] sm:tracking-[0.35em] text-neutral-400">
                HAUTE COUTURE ATELIER &bull; PATRON PORTAL
              </span>
            </div>
            <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-light text-neutral-900 tracking-wide flex items-center gap-2">
              <span className="truncate">{patronName ? `Welcome, ${patronName}` : 'Patron Account Portal'}</span>
              <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-600 inline-block shrink-0" />
            </h1>
            {patronEmail && (
              <p className="text-[10px] sm:text-[11px] font-mono text-neutral-500 tracking-wider truncate">
                {patronEmail}
              </p>
            )}
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-[10px] uppercase font-mono tracking-widest text-amber-900 bg-amber-50/80 border border-amber-200/60 px-3 py-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
            <span>Atelier Private Patron Suite</span>
          </div>
        </div>

        {/* Cohesive Navigation Header Tabs with Smooth Touch Momentum Scrolling */}
        <nav
          ref={navRef}
          onScroll={handleScroll}
          className="flex items-center space-x-4 sm:space-x-8 mt-2 sm:mt-4 overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0 overscroll-x-contain touch-pan-x scroll-smooth"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={item.active ? 'true' : undefined}
                className={`group relative flex items-center space-x-1.5 sm:space-x-2.5 pb-3 sm:pb-4 text-[11px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.2em] transition-all whitespace-nowrap shrink-0 ${
                  item.active
                    ? 'text-neutral-900 font-medium'
                    : 'text-neutral-500 hover:text-neutral-900 font-light'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    item.active
                      ? 'text-amber-600'
                      : 'text-neutral-400 group-hover:text-amber-600'
                  }`}
                />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.shortLabel}</span>
                {item.badge !== null && (
                  <span
                    className={`text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-full transition-colors ${
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
