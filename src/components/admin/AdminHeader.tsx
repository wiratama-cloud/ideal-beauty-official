'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
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
} from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  activeTab:
    | 'dashboard'
    | 'products'
    | 'sections'
    | 'navigation'
    | 'collection'
    | 'orders'
    | 'calendar'
    | 'vouchers'
    | 'ledger'
    | 'audit-logs';
  action?: React.ReactNode;
  children?: React.ReactNode;
}

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

const NAV_GROUPS: NavGroup[] = [
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
    ],
  },
];

export default function AdminHeader({ title, subtitle, activeTab, action, children }: AdminHeaderProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    NAV_GROUPS.forEach((group) => {
      initialState[group.id] = true;
    });
    return initialState;
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const mainEl = document.querySelector('main') || document.body;
    mainEl.classList.add('admin-sidebar-active');
    return () => {
      mainEl.classList.remove('admin-sidebar-active');
    };
  }, []);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-neutral-900 text-neutral-200 border-r border-neutral-800 text-xs font-light">
      {/* Sidebar Header Brand */}
      <div className="p-5 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <Link href="/admin/dashboard" className="flex items-center space-x-2.5 group">
          <div className="p-2 bg-amber-500 text-black rounded-xs transition-transform group-hover:scale-105">
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
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden p-1 text-neutral-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Grouped Collapsible Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 scrollbar-thin scrollbar-thumb-neutral-800">
        {NAV_GROUPS.map((group) => {
          const isOpen = !!openGroups[group.id];
          const hasActiveItem = group.items.some((i) => i.id === activeTab);

          if (group.items.length === 0) {
            return null;
          }

          // Single child item: render directly as top-level link without sub or collapsible header
          if (group.items.length === 1) {
            const item = group.items[0];
            const Icon = item.icon;
            const isActive = activeTab === item.id;

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
                  hasActiveItem ? 'text-amber-400' : 'text-neutral-400 hover:text-neutral-200'
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
                    const isActive = activeTab === item.id;

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
    <>
      {/* Global CSS for desktop content shift */}
      <style jsx global>{`
        @media (min-width: 1024px) {
          .admin-sidebar-active {
            padding-left: 16rem !important;
          }
        }
      `}</style>

      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-40">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex-1 max-w-xs w-full h-full bg-neutral-900 z-10 shadow-2xl">
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-white border-b border-neutral-200 w-full transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-neutral-700 hover:text-black border border-neutral-200 rounded-sm bg-neutral-50"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                {subtitle && (
                  <span className="text-[10px] uppercase tracking-[0.35em] text-neutral-400 font-mono block mb-0.5">
                    {subtitle}
                  </span>
                )}
                <h1 className="font-serif text-xl sm:text-2xl font-light text-neutral-900">
                  {title}
                </h1>
              </div>
            </div>

            {action && <div className="flex-shrink-0">{action}</div>}
          </div>
        </div>
      </header>

      {children}
    </>
  );
}
