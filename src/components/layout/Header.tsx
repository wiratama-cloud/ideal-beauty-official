'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Heart, ShoppingBag, User, Menu, X } from 'lucide-react';
import { useCart } from '../cart/CartContext';

interface HeaderProps {
  initialNavCategories?: { name: string; href: string }[];
}

export default function Header({ initialNavCategories = [] }: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { totalItems, toggleCartDrawer } = useCart();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?query=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const DEFAULT_NAV_CATEGORIES = [
    { name: 'All Collections', href: '/products' },
    { name: 'Haute Couture', href: '/products?category=Haute+Couture' },
    { name: 'Bridal Wear', href: '/products?category=Bridal+Wear' },
    { name: 'Ready To Wear', href: '/products?category=Ready+To+Wear' },
    { name: 'Menswear', href: '/products?category=Menswear' },
    { name: 'Rentals', href: '/products?type=RENTAL' },
  ];

  const navCategories = initialNavCategories.length > 0 ? initialNavCategories : DEFAULT_NAV_CATEGORIES;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-100 backdrop-blur-md bg-white/95" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 text-neutral-800 hover:text-black focus:outline-none"
              aria-label="Toggle menu"
              suppressHydrationWarning
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>

          {/* Desktop Search Bar (Left) */}
          <div className="hidden md:flex items-center w-1/4">
            <form onSubmit={handleSearchSubmit} className="flex items-center w-full border-b border-neutral-300 pb-1 mr-4" suppressHydrationWarning>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-xs focus:outline-none text-neutral-900 placeholder-neutral-500 font-light"
                suppressHydrationWarning
              />
              <button type="submit" className="text-neutral-500 hover:text-black transition-colors" aria-label="Search" suppressHydrationWarning>
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Logo Center */}
          <div className="flex-1 text-center md:w-2/4">
            <Link href="/" className="inline-block">
              <span className="font-sans text-lg sm:text-2xl md:text-3xl tracking-[0.15em] sm:tracking-[0.2em] uppercase font-light text-neutral-900">
                IDEAL BEAUTY
              </span>
              <span className="block text-[8px] sm:text-[9px] tracking-[0.25em] sm:tracking-[0.3em] uppercase text-neutral-400 font-sans mt-0.5">
                OFFICIAL LUXURY
              </span>
            </Link>
          </div>

          {/* Action Icons Right */}
          <div className="flex items-center justify-end space-x-2.5 sm:space-x-5 md:w-1/4">
            <Link
              href="/account/wishlist"
              className="text-neutral-700 hover:text-black transition-colors relative p-1"
              title="Wishlist"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.5]" />
            </Link>

            <Link
              href="/account"
              className="text-neutral-700 hover:text-black transition-colors p-1"
              title="Account Portal"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.5]" />
            </Link>

            <button
              onClick={toggleCartDrawer}
              className="text-neutral-700 hover:text-black transition-colors relative p-1"
              aria-label="Shopping Cart"
              suppressHydrationWarning
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.5]" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center font-mono">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Navigation Bar (Desktop) */}
        <nav className="hidden md:flex justify-center space-x-8 py-3 border-t border-neutral-100 text-xs tracking-[0.15em] uppercase font-light">
          {navCategories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="text-neutral-600 hover:text-black transition-colors border-b-2 border-transparent hover:border-black pb-1"
            >
              {cat.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-neutral-100 px-4 pt-4 pb-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 border border-neutral-200 px-3 py-2" suppressHydrationWarning>
            <Search className="w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs focus:outline-none"
              suppressHydrationWarning
            />
            <button type="submit" className="text-xs uppercase font-medium" suppressHydrationWarning>
              Go
            </button>
          </form>

          <nav className="flex flex-col space-y-3 text-xs uppercase tracking-widest pt-2">
            {navCategories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-neutral-700 hover:text-black py-1 border-b border-neutral-50"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/admin/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-neutral-400 hover:text-black pt-2 text-[10px] tracking-widest"
            >
              Admin Portal
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
