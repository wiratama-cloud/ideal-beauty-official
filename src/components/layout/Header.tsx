'use client';

import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    // Lock background page scroll when mobile drawer is open
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const toggleMobileCategory = (key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedMobileCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getValidCategoryHref = (name: string, href?: string) => {
    if (href && (href.startsWith('/products') || href.startsWith('http') || href === '/')) {
      return href;
    }
    return `/products?category=${encodeURIComponent(name)}`;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsMobileMenuOpen(false);
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
          <div className="flex-1 flex items-center justify-start lg:w-1/4 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-800 hover:text-black focus:outline-none cursor-pointer rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              suppressHydrationWarning
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>

          {/* Desktop Search Bar (Left) */}
          <div className="hidden lg:flex items-center lg:w-1/4">
            <form onSubmit={handleSearchSubmit} className="flex items-center w-full border-b border-neutral-300 pb-1 mr-4" suppressHydrationWarning>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-xs focus:outline-none text-neutral-900 placeholder-neutral-500 font-light"
                suppressHydrationWarning
              />
              <button type="submit" className="text-neutral-500 hover:text-black transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Search" suppressHydrationWarning>
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Logo Center */}
          <div className="flex-1 text-center lg:w-2/4 px-1">
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
          <div className="flex-1 flex items-center justify-end space-x-0.5 sm:space-x-3 lg:w-1/4">
            <Link
              href="/account/wishlist"
              className="text-neutral-700 hover:text-black transition-colors relative p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Wishlist"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.5]" />
            </Link>

            <Link
              href="/account"
              className="text-neutral-700 hover:text-black transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Account Portal"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.5]" />
            </Link>

            <button
              type="button"
              onClick={toggleCartDrawer}
              className="text-neutral-700 hover:text-black transition-colors relative p-1 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Shopping Cart"
              suppressHydrationWarning
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.5]" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 bg-black text-white text-[9px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center font-mono">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Navigation Bar (Desktop) */}
        <nav className="hidden lg:flex justify-center space-x-8 py-3 border-t border-neutral-100 text-xs tracking-[0.15em] uppercase font-light">
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

      {/* Mobile Drawer Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide-over Drawer Panel */}
          <div
            className="relative w-full max-w-xs sm:max-w-sm bg-white h-[100dvh] shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-left duration-300"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-white shrink-0">
              <span className="font-sans text-xs tracking-[0.2em] uppercase font-bold text-neutral-900">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-neutral-500 hover:text-black rounded-full hover:bg-neutral-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Search Bar */}
            <div className="p-3 bg-neutral-50 border-b border-neutral-100 shrink-0">
              <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 border border-neutral-200 px-3 py-1.5 rounded-lg bg-white" suppressHydrationWarning>
                <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs focus:outline-none bg-transparent min-h-[38px]"
                  suppressHydrationWarning
                />
                <button type="submit" className="text-xs uppercase font-medium px-2.5 py-1 bg-neutral-900 text-white rounded min-h-[36px] cursor-pointer" suppressHydrationWarning>
                  Go
                </button>
              </form>
            </div>

            {/* Scrollable Categories List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              <nav className="flex flex-col space-y-1 text-xs uppercase tracking-widest pt-1">
                {topLevelCategories.map((cat) => {
                  const catKey = cat.name;
                  const hasL2 = Boolean(cat.children && cat.children.length > 0);
                  const isL1Expanded = Boolean(expandedMobileCategories[catKey]);

                  return (
                    <div key={cat.name} className="border-b border-neutral-100 pb-1">
                      {hasL2 ? (
                        <button
                          type="button"
                          onClick={(e) => toggleMobileCategory(catKey, e)}
                          className="w-full flex items-center justify-between py-1 min-h-[44px] cursor-pointer group text-left"
                          aria-expanded={isL1Expanded}
                        >
                          <span className="text-neutral-900 font-semibold group-hover:text-amber-700 tracking-wider text-xs flex-1 flex items-center min-h-[44px]">
                            {cat.name}
                          </span>
                          <span className="p-2 text-neutral-500 group-hover:text-black min-h-[44px] min-w-[44px] flex items-center justify-center">
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isL1Expanded ? 'rotate-180' : ''}`} />
                          </span>
                        </button>
                      ) : (
                        <Link
                          href={getValidCategoryHref(cat.name, cat.href)}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-neutral-900 font-semibold hover:text-black tracking-wider text-xs flex items-center min-h-[44px] py-1"
                        >
                          {cat.name}
                        </Link>
                      )}

                      {/* Level 2 Accordion */}
                      {hasL2 && isL1Expanded && (
                        <div className="pl-3 mt-1 space-y-1 border-l-2 border-amber-500/40 ml-1 pb-1">
                          <Link
                            href={getValidCategoryHref(cat.name, cat.href)}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block text-[11px] font-bold text-amber-700 hover:text-black tracking-wider py-1 min-h-[44px] flex items-center"
                          >
                            Shop All {cat.name}
                          </Link>

                          {cat.children!.map((l2) => {
                            const l2Key = `${cat.name}-${l2.name}`;
                            const hasL3 = Boolean(l2.children && l2.children.length > 0);
                            const isL2Expanded = Boolean(expandedMobileCategories[l2Key]);

                            return (
                              <div key={l2.name} className="space-y-1">
                                {hasL3 ? (
                                  <button
                                    type="button"
                                    onClick={(e) => toggleMobileCategory(l2Key, e)}
                                    className="w-full flex items-center justify-between py-1 min-h-[44px] cursor-pointer group text-left"
                                    aria-expanded={isL2Expanded}
                                  >
                                    <span className="text-[11px] font-medium text-neutral-800 group-hover:text-amber-700 tracking-wide flex-1 flex items-center min-h-[44px]">
                                      {l2.name}
                                    </span>
                                    <span className="p-2 text-neutral-400 group-hover:text-black min-h-[44px] min-w-[44px] flex items-center justify-center">
                                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isL2Expanded ? 'rotate-180' : ''}`} />
                                    </span>
                                  </button>
                                ) : (
                                  <Link
                                    href={getValidCategoryHref(l2.name, l2.href)}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-[11px] font-medium text-neutral-800 hover:text-amber-700 tracking-wide flex items-center min-h-[44px] py-1"
                                  >
                                    {l2.name}
                                  </Link>
                                )}

                                {/* Level 3 Accordion */}
                                {hasL3 && isL2Expanded && (
                                  <div className="pl-3 space-y-1 border-l border-neutral-200 ml-1 py-1">
                                    <Link
                                      href={getValidCategoryHref(l2.name, l2.href)}
                                      onClick={() => setIsMobileMenuOpen(false)}
                                      className="block text-[11px] font-semibold text-amber-700 hover:text-black tracking-normal min-h-[44px] flex items-center"
                                    >
                                      Shop All {l2.name}
                                    </Link>
                                    {l2.children!.map((l3) => (
                                      <div key={l3.name} className="space-y-0.5">
                                        <Link
                                          href={getValidCategoryHref(l3.name, l3.href)}
                                          onClick={() => setIsMobileMenuOpen(false)}
                                          className="block text-[11px] text-neutral-600 hover:text-black tracking-normal min-h-[44px] flex items-center"
                                        >
                                          {l3.name}
                                        </Link>
                                        {l3.children && l3.children.length > 0 && (
                                          <div className="pl-2 space-y-0.5 border-l border-neutral-100">
                                            {l3.children.map((l4) => (
                                              <Link
                                                key={l4.name}
                                                href={getValidCategoryHref(l4.name, l4.href)}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="block text-[10px] text-neutral-500 hover:text-black tracking-normal min-h-[44px] flex items-center"
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
              </nav>
            </div>

            {/* Navigation Quick Links Footer */}
            <div className="shrink-0 border-t border-neutral-200 bg-neutral-50 p-4 space-y-2">
              <span className="block text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500">
                Quick Links
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-medium text-neutral-800">
                <Link
                  href="/account/wishlist"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-neutral-200/60 min-h-[44px] transition-colors"
                >
                  <Heart className="w-4 h-4 text-neutral-600 shrink-0" />
                  <span>Wishlist</span>
                </Link>
                <Link
                  href="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-neutral-200/60 min-h-[44px] transition-colors"
                >
                  <User className="w-4 h-4 text-neutral-600 shrink-0" />
                  <span>Account</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    toggleCartDrawer();
                  }}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-neutral-200/60 min-h-[44px] text-left transition-colors cursor-pointer w-full"
                >
                  <ShoppingBag className="w-4 h-4 text-neutral-600 shrink-0" />
                  <span>Cart ({totalItems})</span>
                </button>
                <Link
                  href="/products"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-neutral-200/60 min-h-[44px] transition-colors"
                >
                  <span className="w-4 text-center font-bold text-neutral-400">•</span>
                  <span>Collections</span>
                </Link>
                <Link
                  href="/products?type=RENTAL"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-neutral-200/60 min-h-[44px] transition-colors"
                >
                  <span className="w-4 text-center font-bold text-neutral-400">•</span>
                  <span>Rentals</span>
                </Link>
                <Link
                  href="/admin/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-neutral-200/60 min-h-[44px] transition-colors"
                >
                  <span className="w-4 text-center font-bold text-neutral-400">•</span>
                  <span>Admin</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
