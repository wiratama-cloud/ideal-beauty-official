'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  FileText,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  activeTab: 'dashboard' | 'products' | 'sections' | 'orders' | 'ledger';
  action?: React.ReactNode;
}

export default function AdminHeader({ title, subtitle, activeTab, action }: AdminHeaderProps) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'products',
      label: 'Products & Inventory',
      href: '/admin/products',
      icon: Package,
    },
    {
      id: 'sections',
      label: 'Landing Sections',
      href: '/admin/sections',
      icon: Layers,
    },
    {
      id: 'orders',
      label: 'Orders & Rentals',
      href: '/admin/orders',
      icon: ShoppingBag,
    },
    {
      id: 'ledger',
      label: 'Financial Ledger',
      href: '/admin/ledger',
      icon: FileText,
    },
  ];

  return (
    <div className="bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Status & Storefront Switcher */}
        <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-sans border-b border-neutral-100 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span className="font-semibold text-neutral-800">Atelier Executive Console</span>
          </div>
          <Link
            href="/"
            target="_blank"
            className="hover:text-black flex items-center space-x-1 font-medium transition-colors"
          >
            <span>View Live Storefront</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Page Title & Main Action Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            {subtitle && (
              <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-sans block mb-1">
                {subtitle}
              </span>
            )}
            <h1 className="font-serif text-2xl sm:text-3xl font-light text-neutral-900">{title}</h1>
          </div>

          {action && <div className="flex-shrink-0">{action}</div>}
        </div>

        {/* Uniform Navigation Bar */}
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-1 scrollbar-none border-t border-neutral-100 pt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center space-x-2 px-3.5 py-2 text-[10px] font-medium uppercase tracking-widest transition-all whitespace-nowrap rounded-xs ${
                  isActive
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100 hover:text-black border border-neutral-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
