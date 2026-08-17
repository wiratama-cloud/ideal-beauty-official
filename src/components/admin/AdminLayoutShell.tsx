'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Ruler,
  Layers,
  ShoppingBag,
  FileText,
  ExternalLink,
  Sparkles,
  Calendar,
  Ticket,
  Compass,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Store,
  ShieldCheck,
  Bell,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    title: 'Overview & Analytics',
    items: [
      {
        id: 'dashboard',
        label: 'Executive Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 'catalog',
    title: 'Catalog Management',
    items: [
      {
        id: 'products',
        label: 'Products & Inventory',
        href: '/admin/products',
        icon: Package,
      },
      {
        id: 'size-charts',
        label: 'Size Charts',
        href: '/admin/size-charts',
        icon: Ruler,
      },
    ],
  },
  {
    id: 'storefront',
    title: 'Storefront & Design',
    items: [
      {
        id: 'sections',
        label: 'Landing Sections',
        href: '/admin/sections',
        icon: Layers,
      },
      {
        id: 'collection',
        label: 'Collection',
        href: '/admin/collection',
        icon: Compass,
      },
    ],
  },
  {
    id: 'operations',
    title: 'Orders & Operations',
    items: [
      {
        id: 'orders',
        label: 'Orders & Rentals',
        href: '/admin/orders',
        icon: ShoppingBag,
      },
      {
        id: 'calendar',
        label: 'Rental Calendar',
        href: '/admin/calendar',
        icon: Calendar,
      },
      {
        id: 'vouchers',
        label: 'Vouchers & Promos',
        href: '/admin/vouchers',
        icon: Ticket,
      },
      {
        id: 'notifications',
        label: 'Push Notifications',
        href: '/admin/notifications',
        icon: Bell,
      },
    ],
  },
  {
    id: 'finance',
    title: 'Finance & Security',
    items: [
      {
        id: 'ledger',
        label: 'Financial Ledger',
        href: '/admin/ledger',
        icon: FileText,
      },
      {
        id: 'audit-logs',
        label: 'Audit Logs',
        href: '/admin/audit-logs',
        icon: ClipboardList,
      },
      {
        id: 'access',
        label: 'Access Control',
        href: '/admin/access',
        icon: ShieldCheck,
      },
    ],
  },
];

export interface AdminLayoutShellProps {
  children: React.ReactNode;
}

export default function AdminLayoutShell({ children }: AdminLayoutShellProps) {
  const pathname = usePathname() || '';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    NAV_GROUPS.forEach((group) => {
      initialState[group.id] = true;
    });
    return initialState;
  });

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMobileMenuOpen(false);
  }

  const isItemActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard' || pathname === '/admin';
    }
    if (href === '/admin/collection') {
      return (
        pathname === '/admin/collection' ||
        pathname.startsWith('/admin/collection/') ||
        pathname === '/admin/navigation' ||
        pathname.startsWith('/admin/navigation/')
      );
    }
    if (href === '/admin/products') {
      return (
        pathname === '/admin/products' ||
        pathname.startsWith('/admin/products/') ||
        pathname === '/admin/inventory' ||
        pathname.startsWith('/admin/inventory/')
      );
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const renderSidebarContent = (isMobile: boolean = false) => (
    <div className="flex flex-col h-full h-screen h-dvh bg-neutral-900 text-neutral-200 border-r border-neutral-800 text-xs font-light select-none">
      {/* Sidebar Header Brand */}
      <div className="p-5 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <Link href="/admin/dashboard" className="flex items-center space-x-2.5 group">
          <div className="p-2 bg-amber-500 text-black rounded-xs transition-transform group-hover:scale-105 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-serif text-sm tracking-wide text-white block leading-tight font-medium">
              Ideal Beauty
            </span>
            <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-400 font-mono block">
              Atelier Executive
            </span>
          </div>
        </Link>
        {isMobile && (
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-neutral-400 hover:text-white rounded-xs focus:outline-none transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Grouped Collapsible Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 scrollbar-thin scrollbar-thumb-neutral-800">
        {NAV_GROUPS.map((group) => {
          const isOpen = !!openGroups[group.id];
          const hasActiveItem = group.items.some((i) => isItemActive(i.href));

          if (group.items.length === 0) {
            return null;
          }

          // Single child item: render directly as top-level link
          if (group.items.length === 1) {
            const item = group.items[0];
            const Icon = item.icon;
            const isActive = isItemActive(item.href);

            return (
              <div key={group.id}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-2.5 px-3 py-2 text-xs rounded-sm transition-all ${
                    isActive
                      ? 'bg-amber-500 text-black font-medium shadow-xs'
                      : 'text-neutral-300 hover:bg-neutral-800/80 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : 'text-neutral-400'}`} />
                  <span className="tracking-wide">{item.label}</span>
                </Link>
              </div>
            );
          }

          return (
            <div key={group.id} className="space-y-1">
              {/* Collapsible Section Group Header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] uppercase tracking-[0.2em] font-mono font-medium rounded-xs transition-colors ${
                  hasActiveItem ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{group.title}</span>
                  <span className="text-[9px] text-neutral-500 font-mono">({group.items.length})</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                )}
              </button>

              {/* Group Items */}
              {isOpen && (
                <div className="space-y-1 pl-1 pt-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isItemActive(item.href);

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center space-x-2.5 px-3 py-2 text-xs rounded-sm transition-all ${
                          isActive
                            ? 'bg-amber-500 text-black font-medium shadow-xs'
                            : 'text-neutral-300 hover:bg-neutral-800/80 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : 'text-neutral-400'}`} />
                        <span className="tracking-wide">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-neutral-800 shrink-0 space-y-3 bg-neutral-950/60">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2.5 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors border border-neutral-700/60"
        >
          <div className="flex items-center space-x-2">
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px]">Live Storefront</span>
          </div>
          <ExternalLink className="w-3 h-3 text-neutral-400" />
        </Link>

        <div className="flex items-center justify-between px-2 text-[9px] font-mono text-neutral-400">
          <span>Role: System Admin</span>
          <span className="flex items-center space-x-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active</span>
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50/50 text-neutral-900 font-sans antialiased">
      {/* Desktop Fixed Left Sidebar (Guaranteed 100vh / 100dvh expansion) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 h-screen h-dvh bg-neutral-900 border-r border-neutral-800 shadow-sm">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex-1 w-72 max-w-[80vw] h-screen h-dvh bg-neutral-900 z-10 shadow-2xl flex flex-col fixed inset-y-0 left-0">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* Main Content Area with Desktop Padding Offset */}
      <div className="lg:pl-64 min-h-screen flex flex-col bg-neutral-50/50">
        {/* Mobile Sticky Top Header */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-neutral-900 text-white border-b border-neutral-800 shadow-xs shrink-0">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 text-neutral-300 hover:text-white rounded-xs bg-neutral-800 border border-neutral-700 focus:outline-none transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/admin/dashboard" className="flex items-center space-x-2">
              <div className="p-1 bg-amber-500 text-black rounded-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-serif text-sm tracking-wide text-white font-medium">Ideal Beauty</span>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href="/"
              target="_blank"
              className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-300 bg-neutral-800 rounded-xs border border-neutral-700 flex items-center space-x-1.5 hover:text-white transition-colors"
            >
              <span>Store</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
