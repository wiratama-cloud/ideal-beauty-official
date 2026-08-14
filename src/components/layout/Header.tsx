'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronDown } from 'lucide-react';
import { useCart } from '../cart/CartContext';

export interface HeaderNavCategoryItem {
  id?: string;
  name: string;
  href: string;
  parentId?: string | null;
  imageUrl?: string | null;
  children?: HeaderNavCategoryItem[];
}

interface HeaderProps {
  initialNavCategories?: HeaderNavCategoryItem[];
}

export default function Header({ initialNavCategories = [] }: HeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { totalItems, toggleCartDrawer } = useCart();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileCategories, setExpandedMobileCategories] = useState<Record<string, boolean>>({});

  const toggleMobileCategory = (key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedMobileCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const DEFAULT_NAV_CATEGORIES: HeaderNavCategoryItem[] = [
    { name: 'All Collections', href: '/products' },
    {
      name: 'Women',
      href: '/products?category=Women',
      imageUrl: '/images/sections/brand-silk.jpg',
      children: [
        {
          name: 'Clothing',
          href: '/products?category=Clothing',
          children: [
            {
              name: 'Bridal Wear',
              href: '/products?category=Bridal+Wear',
              children: [
                { name: 'Lehengas', href: '/products?category=Lehengas' },
                { name: 'Shararas', href: '/products?category=Shararas' },
                { name: 'Bridal Maxis & Gowns', href: '/products?category=Bridal+Maxis+%26+Gowns' },
              ],
            },
            {
              name: 'Haute Couture',
              href: '/products?category=Haute+Couture',
              children: [
                { name: 'Kaftans', href: '/products?category=Kaftans' },
                { name: 'Sarees', href: '/products?category=Sarees' },
                { name: 'Eveningwear', href: '/products?category=Eveningwear' },
              ],
            },
            {
              name: 'Ready To Wear',
              href: '/products?category=Ready+To+Wear',
              children: [
                { name: 'Anarkalis', href: '/products?category=Anarkalis' },
                { name: 'Kurta Sets', href: '/products?category=Kurta+Sets' },
              ],
            },
          ],
        },
        {
          name: 'Accessories',
          href: '/products?category=Accessories',
          children: [
            { name: 'Veils & Dupattas', href: '/products?category=Veils+%26+Dupattas' },
            { name: 'Clutches & Bags', href: '/products?category=Clutches+%26+Bags' },
          ],
        },
      ],
    },
    {
      name: 'Men',
      href: '/products?category=Men',
      imageUrl: '/images/sections/brand-groom.jpg',
      children: [
        {
          name: 'Clothing',
          href: '/products?category=Clothing',
          children: [
            {
              name: 'Formals & Wedding',
              href: '/products?category=Formals+%26+Wedding',
              children: [
                { name: 'Sherwanis', href: '/products?category=Sherwanis' },
                { name: 'Prince Suits', href: '/products?category=Prince+Suits' },
              ],
            },
            {
              name: 'Men Kurta Sets',
              href: '/products?category=Men+Kurta+Sets',
              children: [
                { name: 'Kurta Shalwar', href: '/products?category=Kurta+Shalwar' },
              ],
            },
          ],
        },
      ],
    },
    { name: 'Rentals', href: '/products?type=RENTAL' },
  ];

  // Filter for top-level categories (parentId is null/undefined)
  const topLevelCategories = React.useMemo(() => {
    if (!initialNavCategories || initialNavCategories.length === 0) {
      return DEFAULT_NAV_CATEGORIES;
    }

    const roots = initialNavCategories.filter((cat) => !cat.parentId);
    if (roots.length === 0) {
      return initialNavCategories;
    }

    // Deduplicate by category name
    const seen = new Set<string>();
    const result: HeaderNavCategoryItem[] = [];
    for (const item of roots) {
      const key = item.name.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
    return result;
  }, [initialNavCategories]);

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
          {topLevelCategories.map((cat) => {
            const hasChildren = Boolean(cat.children && cat.children.length > 0);
            return (
              <div key={cat.name} className="group relative">
                <Link
                  href={cat.href}
                  className="flex items-center space-x-1 text-neutral-600 hover:text-black transition-colors border-b-2 border-transparent hover:border-black pb-1 py-1"
                >
                  <span>{cat.name}</span>
                  {hasChildren && (
                    <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:text-black transition-transform duration-200 group-hover:rotate-180" />
                  )}
                </Link>

                {/* Mega Menu Dropdown */}
                {hasChildren && (
                  <div className="fixed left-0 right-0 top-[105px] hidden group-hover:block z-50 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-all duration-200">
                    <div className="bg-white border border-neutral-200/90 shadow-2xl rounded-b-xl p-6 lg:p-8 grid grid-cols-12 gap-8 text-left normal-case">
                      {/* Left: Columns for Level 2 & Level 3 Subcategories */}
                      <div
                        className={`grid gap-6 ${cat.imageUrl ? 'col-span-8 lg:col-span-9' : 'col-span-12'} ${
                          cat.children!.length >= 4
                            ? 'grid-cols-4'
                            : cat.children!.length === 3
                            ? 'grid-cols-3'
                            : cat.children!.length === 2
                            ? 'grid-cols-2'
                            : 'grid-cols-1'
                        }`}
                      >
                        {cat.children!.map((l2) => (
                          <div key={l2.name} className="space-y-3">
                            {/* Level 2 Header */}
                            <Link
                              href={l2.href}
                              className="font-semibold text-neutral-900 tracking-wider text-xs uppercase hover:text-amber-700 block pb-1 border-b border-neutral-100 transition-colors"
                            >
                              {l2.name}
                            </Link>

                            {/* Level 3 & Level 4 Items */}
                            {l2.children && l2.children.length > 0 && (
                              <div className="space-y-2">
                                {l2.children.map((l3) => (
                                  <div key={l3.name} className="space-y-1">
                                    <Link
                                      href={l3.href}
                                      className="block text-xs font-medium text-neutral-800 hover:text-amber-600 transition-all hover:translate-x-0.5"
                                    >
                                      {l3.name}
                                    </Link>
                                    {l3.children && l3.children.length > 0 && (
                                      <div className="pl-2 space-y-1 border-l border-neutral-200/60">
                                        {l3.children.map((l4) => (
                                          <Link
                                            key={l4.name}
                                            href={l4.href}
                                            className="block text-[11px] text-neutral-500 hover:text-black transition-all hover:translate-x-0.5"
                                          >
                                            {l4.name}
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Right: Category Featured Card */}
                      {cat.imageUrl && (
                        <div className="col-span-4 lg:col-span-3 bg-neutral-900 text-white rounded-lg p-5 flex flex-col justify-between relative overflow-hidden group/card shadow-inner">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover/card:scale-105 transition-transform duration-500"
                          />
                          <div className="relative z-10 space-y-1">
                            <span className="text-[10px] uppercase tracking-widest text-amber-400 font-mono">
                              Featured Collection
                            </span>
                            <h4 className="font-serif text-lg text-white font-medium">
                              {cat.name}
                            </h4>
                            <p className="text-[11px] text-neutral-300 font-light line-clamp-2">
                              Discover luxury designs and handcrafted artisan pieces.
                            </p>
                          </div>
                          <div className="relative z-10 pt-4">
                            <Link
                              href={cat.href}
                              className="inline-block text-[11px] uppercase tracking-wider bg-white text-black font-semibold px-4 py-2 rounded hover:bg-amber-400 transition-colors"
                            >
                              Shop {cat.name}
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-neutral-100 px-4 pt-4 pb-6 space-y-4 shadow-xl">
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 border border-neutral-200 px-3 py-2 rounded-xs" suppressHydrationWarning>
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

          <nav className="flex flex-col space-y-2 text-xs uppercase tracking-widest pt-2">
            {topLevelCategories.map((cat) => {
              const catKey = cat.name;
              const hasL2 = Boolean(cat.children && cat.children.length > 0);
              const isL1Expanded = Boolean(expandedMobileCategories[catKey]);

              return (
                <div key={cat.name} className="border-b border-neutral-100 pb-2">
                  <div className="flex items-center justify-between py-1">
                    <Link
                      href={cat.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-neutral-900 font-semibold hover:text-black tracking-wider text-xs"
                    >
                      {cat.name}
                    </Link>
                    {hasL2 && (
                      <button
                        type="button"
                        onClick={(e) => toggleMobileCategory(catKey, e)}
                        className="p-1 text-neutral-500 hover:text-black focus:outline-none"
                        aria-label="Toggle category"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isL1Expanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>

                  {/* Level 2 Accordion */}
                  {hasL2 && isL1Expanded && (
                    <div className="pl-3 mt-1 space-y-2 border-l-2 border-amber-500/40 ml-1">
                      {cat.children!.map((l2) => {
                        const l2Key = `${cat.name}-${l2.name}`;
                        const hasL3 = Boolean(l2.children && l2.children.length > 0);
                        const isL2Expanded = Boolean(expandedMobileCategories[l2Key]);

                        return (
                          <div key={l2.name} className="space-y-1">
                            <div className="flex items-center justify-between py-0.5">
                              <Link
                                href={l2.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-[11px] font-medium text-neutral-800 hover:text-amber-700 tracking-wide"
                              >
                                {l2.name}
                              </Link>
                              {hasL3 && (
                                <button
                                  type="button"
                                  onClick={(e) => toggleMobileCategory(l2Key, e)}
                                  className="p-1 text-neutral-400 hover:text-black focus:outline-none"
                                >
                                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isL2Expanded ? 'rotate-180' : ''}`} />
                                </button>
                              )}
                            </div>

                            {/* Level 3 Accordion */}
                            {hasL3 && isL2Expanded && (
                              <div className="pl-3 space-y-1 border-l border-neutral-200 ml-1 py-1">
                                {l2.children!.map((l3) => (
                                  <div key={l3.name} className="space-y-0.5">
                                    <Link
                                      href={l3.href}
                                      onClick={() => setIsMobileMenuOpen(false)}
                                      className="block text-[11px] text-neutral-600 hover:text-black capitalize tracking-normal py-0.5"
                                    >
                                      {l3.name}
                                    </Link>
                                    {l3.children && l3.children.length > 0 && (
                                      <div className="pl-2 space-y-0.5 border-l border-neutral-100">
                                        {l3.children.map((l4) => (
                                          <Link
                                            key={l4.name}
                                            href={l4.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block text-[10px] text-neutral-500 hover:text-black capitalize tracking-normal"
                                          >
                                            {l4.name}
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            <Link
              href="/admin/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-neutral-400 hover:text-black pt-3 text-[10px] tracking-widest block border-t border-neutral-100"
            >
              Admin Portal
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
