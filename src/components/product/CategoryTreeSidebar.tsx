'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, ChevronDown, Sparkles, X, Layers, Search } from 'lucide-react';
import { NavCategoryItem } from '@/lib/services/nav-category';

export interface CategoryTreeSidebarProps {
  categoriesTree?: NavCategoryItem[];
  navCategories?: NavCategoryItem[];
  categories?: (string | NavCategoryItem)[];
}

export interface Level2Category {
  item: NavCategoryItem;
  l3Children: NavCategoryItem[];
}

export interface Level1Category {
  item: NavCategoryItem;
  l2Children: Level2Category[];
}

export interface MobilePill {
  name: string;
  href?: string;
}

export function getMobilePills(level1Categories: Level1Category[]): MobilePill[] {
  const pills: MobilePill[] = [];
  const seen = new Set<string>();

  level1Categories.forEach((l1) => {
    const l1Name = l1.item.name;
    if (!seen.has(l1Name.toLowerCase())) {
      seen.add(l1Name.toLowerCase());
      pills.push({ name: l1Name, href: l1.item.href });
    }

    l1.l2Children.forEach((l2) => {
      const l2Name = l2.item.name;
      if (!seen.has(l2Name.toLowerCase())) {
        seen.add(l2Name.toLowerCase());
        pills.push({ name: l2Name, href: l2.item.href });
      }
    });
  });

  return pills;
}

export function filterCategoryTree(
  level1Categories: Level1Category[],
  searchQuery: string
): Level1Category[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return level1Categories;

  return level1Categories
    .map((l1) => {
      const l1Matches = l1.item.name.toLowerCase().includes(query);

      const filteredL2 = l1.l2Children
        .map((l2) => {
          const l2Matches = l2.item.name.toLowerCase().includes(query);

          const filteredL3 = l2.l3Children.filter((l3) =>
            l3.name.toLowerCase().includes(query)
          );

          if (l1Matches || l2Matches || filteredL3.length > 0) {
            return {
              item: l2.item,
              l3Children: l1Matches || l2Matches ? l2.l3Children : filteredL3,
            };
          }

          return null;
        })
        .filter((l2): l2 is Level2Category => l2 !== null);

      if (l1Matches || filteredL2.length > 0) {
        return {
          item: l1.item,
          l2Children: filteredL2,
        };
      }

      return null;
    })
    .filter((l1): l1 is Level1Category => l1 !== null);
}

function getCategoryImage(item: NavCategoryItem | string): string {
  if (typeof item !== 'string' && item.imageUrl && item.imageUrl.trim().length > 0) {
    return item.imageUrl;
  }
  const name = (typeof item === 'string' ? item : item.name).toLowerCase();
  if (name.includes('lehenga')) return '/images/products/lehenga-1.jpg';
  if (name.includes('sharara')) return '/images/products/sharara-1.jpg';
  if (name.includes('gown') || name.includes('maxi') || name.includes('bridal')) return '/images/products/anarkali-1.jpg';
  if (name.includes('kaftan')) return '/images/products/kaftan-1.jpg';
  if (name.includes('saree')) return '/images/products/saree-1.jpg';
  if (name.includes('eveningwear') || name.includes('cape') || name.includes('couture')) return '/images/products/cape-1.jpg';
  if (name.includes('anarkali')) return '/images/products/anarkali-1.jpg';
  if (name.includes('kurta')) return '/images/products/kaftan-2.jpg';
  if (name.includes('suit') || name.includes('lawn') || name.includes('unstitched') || name.includes('3 piece') || name.includes('2 piece')) return '/images/products/saree-2.jpg';
  if (name.includes('sherwani') || name.includes('prince') || name.includes('groom')) return '/images/products/sherwani-1.jpg';
  if (name.includes('veil') || name.includes('dupatta') || name.includes('clutch') || name.includes('bag')) return '/images/products/veil-1.jpg';
  if (name.includes('footwear') || name.includes('khussa') || name.includes('heel') || name.includes('flat')) return '/images/sections/brand-atelier.jpg';
  if (name.includes('women')) return '/images/sections/brand-silk.jpg';
  if (name.includes('men')) return '/images/sections/brand-groom.jpg';
  return '/images/products/default-product.jpg';
}

export default function CategoryTreeSidebar({
  categoriesTree,
  navCategories,
  categories,
}: CategoryTreeSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') || '';

  // State for active popover Level 2 category on desktop
  const [activePopoverL2, setActivePopoverL2] = useState<Level2Category | null>(null);

  // Ref and click outside handler for desktop popover overlay
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activePopoverL2) return;

    const handlePointerDown = (e: PointerEvent | MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActivePopoverL2(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [activePopoverL2]);

  // State for expanded Level 2 categories in desktop sidebar (accordion)
  const [expandedDesktopL2Map, setExpandedDesktopL2Map] = useState<Record<string, boolean>>({});

  // State for mobile category drawer
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Process raw tree into normalized 3-depth structure (Level 1, Level 2, and Level 3)
  const level1Categories: Level1Category[] = useMemo(() => {
    let rawItems: NavCategoryItem[] = [];

    if (categoriesTree && categoriesTree.length > 0) {
      rawItems = categoriesTree;
    } else if (navCategories && navCategories.length > 0) {
      const map = new Map<string, NavCategoryItem>();
      for (const item of navCategories) {
        map.set(item.id || item.name, { ...item, children: [] });
      }
      const roots: NavCategoryItem[] = [];
      for (const item of navCategories) {
        const node = map.get(item.id || item.name)!;
        if (item.parentId && map.has(item.parentId)) {
          map.get(item.parentId)!.children!.push(node);
        } else {
          roots.push(node);
        }
      }
      rawItems = roots;
    } else if (categories && categories.length > 0) {
      rawItems = categories.map((cat, idx) => {
        if (typeof cat === 'string') {
          return {
            id: `cat-${idx}`,
            name: cat,
            href: `/products?category=${encodeURIComponent(cat)}`,
            displayOrder: idx,
            isActive: true,
            children: [],
          };
        }
        return { ...cat, children: cat.children || [] };
      });
    }

    if (rawItems.length === 0) {
      rawItems = [
        {
          id: 'fb-women',
          name: 'Women',
          href: '/products?category=Women',
          displayOrder: 1,
          isActive: true,
          children: [
            {
              id: 'fb-bridal',
              name: 'Bridal Wear',
              href: '/products?category=Bridal+Wear',
              displayOrder: 0,
              isActive: true,
              children: [
                { id: 'fb-lehengas', name: 'Lehengas', href: '/products?category=Lehengas', displayOrder: 0, isActive: true },
                { id: 'fb-shararas', name: 'Shararas', href: '/products?category=Shararas', displayOrder: 1, isActive: true },
                { id: 'fb-maxis', name: 'Bridal Maxis & Gowns', href: '/products?category=Bridal+Maxis+%26+Gowns', displayOrder: 2, isActive: true },
              ],
            },
            {
              id: 'fb-couture',
              name: 'Haute Couture',
              href: '/products?category=Haute+Couture',
              displayOrder: 1,
              isActive: true,
              children: [
                { id: 'fb-kaftans', name: 'Kaftans', href: '/products?category=Kaftans', displayOrder: 0, isActive: true },
                { id: 'fb-sarees', name: 'Sarees', href: '/products?category=Sarees', displayOrder: 1, isActive: true },
                { id: 'fb-eveningwear', name: 'Eveningwear', href: '/products?category=Eveningwear', displayOrder: 2, isActive: true },
              ],
            },
            {
              id: 'fb-rtw',
              name: 'Ready To Wear',
              href: '/products?category=Ready+To+Wear',
              displayOrder: 2,
              isActive: true,
              children: [
                { id: 'fb-anarkalis', name: 'Anarkalis', href: '/products?category=Anarkalis', displayOrder: 0, isActive: true },
                { id: 'fb-kurtasets', name: 'Kurta Sets', href: '/products?category=Kurta+Sets', displayOrder: 1, isActive: true },
              ],
            },
          ],
        },
        {
          id: 'fb-men',
          name: 'Men',
          href: '/products?category=Men',
          displayOrder: 2,
          isActive: true,
          children: [
            {
              id: 'fb-formals',
              name: 'Formals & Wedding',
              href: '/products?category=Formals+%26+Wedding',
              displayOrder: 0,
              isActive: true,
              children: [
                { id: 'fb-sherwanis', name: 'Sherwanis', href: '/products?category=Sherwanis', displayOrder: 0, isActive: true },
                { id: 'fb-princesuits', name: 'Prince Suits', href: '/products?category=Prince+Suits', displayOrder: 1, isActive: true },
              ],
            },
            {
              id: 'fb-menkurta',
              name: 'Men Kurta Sets',
              href: '/products?category=Men+Kurta+Sets',
              displayOrder: 1,
              isActive: true,
              children: [
                { id: 'fb-kurtashalwar', name: 'Kurta Shalwar', href: '/products?category=Kurta+Shalwar', displayOrder: 0, isActive: true },
              ],
            },
          ],
        },
        {
          id: 'fb-acc',
          name: 'Jewelry & Accessories',
          href: '/products?category=Accessories',
          displayOrder: 3,
          isActive: true,
          children: [],
        },
      ];
    }

    const filtered = rawItems.filter((cat) => {
      const name = cat.name.trim().toLowerCase();
      return name !== 'all' && name !== 'all collections';
    });

    return filtered.map((l1) => {
      const l2List: Level2Category[] = [];

      if (l1.children && l1.children.length > 0) {
        l1.children.forEach((child) => {
          // If child is an intermediate wrapper node (e.g. "Clothing"), flatten its children
          if (
            child.children &&
            child.children.length > 0 &&
            child.children.some((sub) => sub.children && sub.children.length > 0)
          ) {
            child.children.forEach((subL2) => {
              l2List.push({
                item: subL2,
                l3Children: subL2.children || [],
              });
            });
          } else if (child.children && child.children.length > 0) {
            l2List.push({
              item: child,
              l3Children: child.children,
            });
          } else {
            l2List.push({
              item: child,
              l3Children: [],
            });
          }
        });
      }

      return {
        item: l1,
        l2Children: l2List,
      };
    });
  }, [categoriesTree, navCategories, categories]);

  // Mobile Category Pills derived from level1Categories and primary L2 subcategories
  const mobilePills = useMemo(() => {
    return getMobilePills(level1Categories);
  }, [level1Categories]);

  // Track expanded Level 1 items in the sidebar
  const [expandedL1Map, setExpandedL1Map] = useState<Record<string, boolean>>({});

  // Auto-expand Level 1 and Level 2 items in desktop sidebar containing the active category
  useEffect(() => {
    if (level1Categories.length === 0) return;

    const newL1Map: Record<string, boolean> = {};
    const newL2Map: Record<string, boolean> = {};

    level1Categories.forEach((l1) => {
      const l1Id = l1.item.id || l1.item.name;
      const matchesL1 = currentCategory && l1.item.name.toLowerCase() === currentCategory.toLowerCase();
      
      let matchesL2OrL3 = false;
      l1.l2Children.forEach((l2) => {
        const l2Id = l2.item.id || l2.item.name;
        const matchesL2 = currentCategory && l2.item.name.toLowerCase() === currentCategory.toLowerCase();
        const matchesL3 = currentCategory && l2.l3Children.some(
          (l3) => l3.name.toLowerCase() === currentCategory.toLowerCase()
        );

        if (matchesL2 || matchesL3) {
          matchesL2OrL3 = true;
          newL2Map[l2Id] = true;
        }
      });

      if (matchesL1 || matchesL2OrL3 || !currentCategory) {
        newL1Map[l1Id] = true;
      }
    });

    setExpandedL1Map((prev) => ({ ...prev, ...newL1Map }));
    setExpandedDesktopL2Map((prev) => ({ ...prev, ...newL2Map }));
  }, [currentCategory, level1Categories]);

  // Drawer search query & expansion state
  const [drawerSearchQuery, setDrawerSearchQuery] = useState('');
  const [expandedDrawerL1Map, setExpandedDrawerL1Map] = useState<Record<string, boolean>>({});
  const [expandedDrawerL2Map, setExpandedDrawerL2Map] = useState<Record<string, boolean>>({});

  // Filtered categories for mobile drawer
  const filteredDrawerCategories = useMemo(() => {
    return filterCategoryTree(level1Categories, drawerSearchQuery);
  }, [level1Categories, drawerSearchQuery]);

  // Handle ESC key to close popover or mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePopoverL2(null);
        setIsMobileDrawerOpen(false);
      }
    };
    if (activePopoverL2 || isMobileDrawerOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePopoverL2, isMobileDrawerOpen]);

  // Auto-expand active category in mobile drawer when opened
  useEffect(() => {
    if (isMobileDrawerOpen && level1Categories.length > 0) {
      const newDrawerL1Map: Record<string, boolean> = {};
      const newDrawerL2Map: Record<string, boolean> = {};

      level1Categories.forEach((l1) => {
        const l1Id = l1.item.id || l1.item.name;
        const matchesL1 =
          currentCategory && l1.item.name.toLowerCase() === currentCategory.toLowerCase();
        const matchesL2 =
          currentCategory &&
          l1.l2Children.some((l2) => {
            const l2Id = l2.item.id || l2.item.name;
            const isL2Match = l2.item.name.toLowerCase() === currentCategory.toLowerCase();
            const isL3Match = l2.l3Children.some(
              (l3) => l3.name.toLowerCase() === currentCategory.toLowerCase()
            );
            if (isL2Match || isL3Match) {
              newDrawerL2Map[l2Id] = true;
            }
            return isL2Match || isL3Match;
          });

        if (matchesL1 || matchesL2 || !currentCategory) {
          newDrawerL1Map[l1Id] = true;
        }
      });

      setExpandedDrawerL1Map((prev) => ({ ...newDrawerL1Map, ...prev }));
      setExpandedDrawerL2Map((prev) => ({ ...newDrawerL2Map, ...prev }));
    }
  }, [isMobileDrawerOpen, currentCategory, level1Categories]);

  const toggleL1Expand = (l1Id: string) => {
    setExpandedL1Map((prev) => ({
      ...prev,
      [l1Id]: !prev[l1Id],
    }));
  };

  const handleCategorySelect = (categoryName: string, href?: string) => {
    setActivePopoverL2(null);
    setIsMobileDrawerOpen(false);
    if (href && (href.startsWith('/products') || href.startsWith('http'))) {
      router.push(href);
    } else {
      router.push(`/products?category=${encodeURIComponent(categoryName)}`);
    }
  };

  const handleL2Click = (l2: Level2Category) => {
    handleCategorySelect(l2.item.name, l2.item.href);
    if (l2.l3Children && l2.l3Children.length > 0) {
      const l2Id = l2.item.id || l2.item.name;
      setActivePopoverL2((prev) => (prev?.item.name === l2.item.name ? null : l2));
      setExpandedDesktopL2Map((prev) => ({
        ...prev,
        [l2Id]: !prev[l2Id],
      }));
    }
  };

  return (
    <>
      {/* Mobile Horizontal Category Pills Bar (lg:hidden) */}
      <div className="lg:hidden w-full mb-2 sm:mb-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* "All Categories" Pill (Drawer trigger) */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen((prev) => !prev)}
            className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all border min-h-[44px] ${
              isMobileDrawerOpen
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border-neutral-200/80'
            }`}
            aria-label="Open all categories drawer"
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>All Categories</span>
          </button>

          <div className="h-5 w-px bg-neutral-200/80 shrink-0 mx-0.5" aria-hidden="true" />

          {/* "All Collections" Pill */}
          <button
            type="button"
            onClick={() => {
              setActivePopoverL2(null);
              router.push('/products');
            }}
            className={`px-3.5 py-2 rounded-full text-xs shrink-0 cursor-pointer transition-all border min-h-[44px] flex items-center gap-1.5 ${
              !currentCategory || currentCategory.toLowerCase() === 'all'
                ? 'bg-neutral-900 text-white font-semibold border-neutral-900 shadow-xs ring-1 ring-neutral-900'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-transparent font-medium'
            }`}
          >
            <span>All Collections</span>
            {(!currentCategory || currentCategory.toLowerCase() === 'all') && (
              <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
            )}
          </button>

          {/* Dynamic Category Pills */}
          {mobilePills.map((pill) => {
            const isActive =
              Boolean(currentCategory && currentCategory.toLowerCase() === pill.name.toLowerCase());

            return (
              <button
                key={pill.name}
                type="button"
                onClick={() => handleCategorySelect(pill.name, pill.href)}
                className={`px-3.5 py-2 rounded-full text-xs shrink-0 cursor-pointer transition-all border min-h-[44px] flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-neutral-900 text-white font-semibold border-neutral-900 shadow-xs ring-1 ring-neutral-900'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-transparent font-medium'
                }`}
              >
                <span>{pill.name}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <aside className="hidden lg:flex bg-white border border-neutral-200/80 rounded-xl p-4 w-full h-full min-h-full font-sans shadow-xs flex-col relative">
        {/* Sidebar Header & Clear Filter */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100 flex-shrink-0">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-neutral-800" />
            <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
              Categories
            </h3>
          </div>
          {currentCategory && currentCategory !== 'All' && (
            <button
              type="button"
              onClick={() => {
                setActivePopoverL2(null);
                router.push('/products');
              }}
              className="text-[11px] text-neutral-500 hover:text-black hover:underline transition-colors"
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Sidebar Content: Level 1 & Level 2 Categories */}
        <div className="space-y-1 flex-1 overflow-y-auto">
          {/* All Collections Button */}
          <button
            type="button"
            onClick={() => {
              setActivePopoverL2(null);
              router.push('/products');
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors rounded-lg text-left ${
              !currentCategory || currentCategory === 'All'
                ? 'text-neutral-900 font-semibold bg-neutral-100'
                : 'text-neutral-700 hover:text-black hover:bg-neutral-50'
            }`}
          >
            <span>All Collections</span>
            {!currentCategory || currentCategory === 'All' ? (
              <ChevronRight className="w-3.5 h-3.5 text-neutral-900" />
            ) : null}
          </button>

          {/* Level 1 Category Items */}
          {level1Categories.map((l1) => {
            const l1Id = l1.item.id || l1.item.name;
            const isL1Expanded = Boolean(expandedL1Map[l1Id]);
            const isL1Active =
              currentCategory && l1.item.name.toLowerCase() === currentCategory.toLowerCase();
            const hasL2 = l1.l2Children.length > 0;

            return (
              <div key={l1Id} className="space-y-0.5">
                {/* Level 1 Item Button */}
                <div
                  className={`group flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${
                    isL1Active
                      ? 'bg-neutral-900 text-white font-semibold'
                      : 'text-neutral-800 hover:bg-neutral-100 hover:text-black font-medium'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleCategorySelect(l1.item.name, l1.item.href)}
                    className="flex-1 text-left truncate tracking-wide"
                  >
                    {l1.item.name}
                  </button>

                  {hasL2 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleL1Expand(l1Id);
                      }}
                      className="p-1 rounded hover:bg-black/10 focus:outline-none transition-colors"
                      aria-label={isL1Expanded ? 'Collapse subcategories' : 'Expand subcategories'}
                    >
                      {isL1Expanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Level 2 Subcategories in Sidebar */}
                {hasL2 && isL1Expanded && (
                  <div className="pl-3 ml-2 border-l border-neutral-200/80 space-y-1 my-1">
                    {l1.l2Children.map((l2) => {
                      const l2Id = l2.item.id || l2.item.name;
                      const isL2Active =
                        currentCategory &&
                        (l2.item.name.toLowerCase() === currentCategory.toLowerCase() ||
                          l2.l3Children.some(
                            (l3) => l3.name.toLowerCase() === currentCategory.toLowerCase()
                          ));
                      const hasL3 = l2.l3Children.length > 0;
                      const isL2Expanded = Boolean(expandedDesktopL2Map[l2Id]);
                      const isPopoverOpen =
                        activePopoverL2?.item.id === l2.item.id ||
                        activePopoverL2?.item.name === l2.item.name;

                      return (
                        <div key={l2Id} className="relative group/l2">
                          <div className="flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => handleL2Click(l2)}
                              className={`flex-1 flex items-center justify-between px-2.5 py-1.5 text-xs transition-all rounded-md text-left ${
                                isL2Active
                                  ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                                  : 'text-neutral-700 hover:text-black hover:bg-neutral-50 font-medium'
                              }`}
                            >
                              <span className="truncate">{l2.item.name}</span>
                              {hasL3 && (
                                <span className="ml-1 flex items-center text-[10px] opacity-80">
                                  <ChevronRight
                                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                      isPopoverOpen || isL2Expanded ? 'rotate-90' : ''
                                    }`}
                                  />
                                </span>
                              )}
                            </button>

                            {hasL3 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedDesktopL2Map((prev) => ({
                                    ...prev,
                                    [l2Id]: !prev[l2Id],
                                  }));
                                }}
                                className="p-1 text-neutral-400 hover:text-neutral-900 rounded hover:bg-neutral-100 transition-colors shrink-0"
                                aria-label={isL2Expanded ? 'Collapse subcategories' : 'Expand subcategories'}
                                title={isL2Expanded ? 'Collapse subcategories' : 'Expand subcategories'}
                              >
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                    isL2Expanded ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                            )}
                          </div>

                          {/* Smooth Popover Overlay for Level 3 Subcategories */}
                          {hasL3 && isPopoverOpen && (
                            <div
                              ref={popoverRef}
                              className="absolute left-[calc(100%+0.75rem)] top-0 z-50 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-neutral-200/90 p-4 animate-in fade-in slide-in-from-left-2 duration-200"
                            >
                                {/* Popover Header */}
                                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
                                  <div>
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                                      Subcategories
                                    </span>
                                    <h4 className="text-sm font-bold text-neutral-900 truncate">
                                      {l2.item.name}
                                    </h4>
                                  </div>
                                  <div className="flex items-center space-x-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleCategorySelect(l2.item.name, l2.item.href)}
                                      className="text-[11px] px-2.5 py-1 rounded-full bg-neutral-900 text-white hover:bg-black font-medium transition-colors"
                                    >
                                      View All
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setActivePopoverL2(null)}
                                      className="p-1 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors"
                                      aria-label="Close popover"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Level 3 Items Grid with Luxury Image Previews */}
                                <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                                  {l2.l3Children.map((l3) => {
                                    const img = getCategoryImage(l3);
                                    const isL3Active =
                                      currentCategory &&
                                      currentCategory.toLowerCase() === l3.name.toLowerCase();

                                    return (
                                      <button
                                        key={l3.id || l3.name}
                                        type="button"
                                        onClick={() => handleCategorySelect(l3.name, l3.href)}
                                        className={`group flex flex-col items-center bg-white p-2 rounded-lg border text-center transition-all hover:shadow-xs ${
                                          isL3Active
                                            ? 'border-neutral-900 ring-2 ring-neutral-900 bg-neutral-50'
                                            : 'border-neutral-200/80 hover:border-neutral-800'
                                        }`}
                                      >
                                        <div className="w-full aspect-[4/3] relative rounded-md overflow-hidden bg-neutral-100 mb-1.5 shadow-2xs">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={img}
                                            alt={l3.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                          />
                                        </div>
                                        <span className="text-[11px] font-semibold text-neutral-900 line-clamp-1 group-hover:text-black">
                                          {l3.name}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>

                                <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400">
                                  <span>{l2.l3Children.length} items available</span>
                                  <span className="text-neutral-600 font-medium">Luxury Atelier</span>
                                </div>
                              </div>
                          )}

                          {/* Level 3 Inline Expanding Accordion */}
                          {hasL3 && isL2Expanded && (
                            <div className="pl-3 ml-2 my-1 border-l border-neutral-200/80 space-y-1 animate-in fade-in duration-150">
                              {l2.l3Children.map((l3) => {
                                const isL3Active =
                                  currentCategory &&
                                  currentCategory.toLowerCase() === l3.name.toLowerCase();

                                return (
                                  <button
                                    key={l3.id || l3.name}
                                    type="button"
                                    onClick={() => handleCategorySelect(l3.name, l3.href)}
                                    className={`w-full flex items-center justify-between px-2 py-1 text-[11px] rounded-md transition-all text-left ${
                                      isL3Active
                                        ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                                        : 'text-neutral-600 hover:text-black hover:bg-neutral-50 font-medium'
                                    }`}
                                  >
                                    <span className="truncate">{l3.name}</span>
                                    {isL3Active && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-1" />
                                    )}
                                  </button>
                                );
                              })}
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
        </div>
      </aside>

      {/* Mobile Category Drawer / Sheet Overlay */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex justify-end lg:hidden transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsMobileDrawerOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-[101] overflow-hidden animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Category Navigation Drawer"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-white shrink-0">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-neutral-900 shrink-0" />
                <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                  All Categories
                </h2>
                {currentCategory && currentCategory.toLowerCase() !== 'all' && (
                  <span className="text-[10px] bg-neutral-100 text-neutral-800 font-medium px-2 py-0.5 rounded-full border border-neutral-200/80 max-w-[120px] truncate">
                    {currentCategory}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {currentCategory && currentCategory.toLowerCase() !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActivePopoverL2(null);
                      router.push('/products');
                    }}
                    className="text-xs text-neutral-500 hover:text-neutral-900 underline px-2 py-1 min-h-[44px] flex items-center"
                  >
                    Reset Filter
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-2 text-neutral-500 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close category drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Search Input */}
            <div className="p-3 bg-neutral-50/80 border-b border-neutral-100 shrink-0">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={drawerSearchQuery}
                  onChange={(e) => setDrawerSearchQuery(e.target.value)}
                  placeholder="Search categories & collections..."
                  className="w-full pl-9 pr-9 py-2.5 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent text-neutral-900 placeholder:text-neutral-400 min-h-[44px]"
                />
                {drawerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setDrawerSearchQuery('')}
                    className="absolute right-2.5 p-1 text-neutral-400 hover:text-neutral-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Clear category search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* All Collections option */}
              {!drawerSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    handleCategorySelect('All', '/products');
                    setIsMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all min-h-[44px] ${
                    !currentCategory || currentCategory.toLowerCase() === 'all'
                      ? 'bg-neutral-900 text-white border-neutral-900 font-semibold shadow-xs'
                      : 'bg-white border-neutral-200/80 text-neutral-800 hover:bg-neutral-50 font-medium'
                  }`}
                >
                  <span className="text-xs">All Collections</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {/* Empty state when searching */}
              {filteredDrawerCategories.length === 0 ? (
                <div className="text-center py-10 px-4 space-y-3">
                  <p className="text-sm font-medium text-neutral-800">No categories found</p>
                  <p className="text-xs text-neutral-500">
                    No category matching &quot;{drawerSearchQuery}&quot;
                  </p>
                  <button
                    type="button"
                    onClick={() => setDrawerSearchQuery('')}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-black transition-colors min-h-[44px]"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                /* Level 1 Category Visual Cards */
                filteredDrawerCategories.map((l1) => {
                  const l1Id = l1.item.id || l1.item.name;
                  const isL1Expanded = drawerSearchQuery
                    ? true
                    : Boolean(expandedDrawerL1Map[l1Id]);
                  const isL1Active =
                    Boolean(currentCategory && l1.item.name.toLowerCase() === currentCategory.toLowerCase());
                  const totalSubcategories = l1.l2Children.reduce(
                    (acc, l2) => acc + 1 + l2.l3Children.length,
                    0
                  );
                  const thumbImage = getCategoryImage(l1.item);

                  return (
                    <div
                      key={l1Id}
                      className={`border rounded-xl overflow-hidden transition-all bg-white ${
                        isL1Active ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-200/80'
                      }`}
                    >
                      {/* L1 Card Header */}
                      <div className="flex items-center justify-between p-2.5 sm:p-3 bg-neutral-50/50 min-h-[44px]">
                        {/* Left: Thumbnail & Name (Tap to select / view L1) */}
                        <button
                          type="button"
                          onClick={() => {
                            handleCategorySelect(l1.item.name, l1.item.href);
                            setIsMobileDrawerOpen(false);
                          }}
                          className="flex items-center space-x-3 text-left flex-1 min-w-0 pr-2 min-h-[44px]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumbImage}
                            alt={l1.item.name}
                            className="w-12 h-12 rounded-lg object-cover border border-neutral-200/60 shrink-0 bg-neutral-100"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-neutral-900 truncate">
                                {l1.item.name}
                              </span>
                              {isL1Active && (
                                <span className="w-2 h-2 rounded-full bg-neutral-900 shrink-0" />
                              )}
                            </div>
                            {totalSubcategories > 0 && (
                              <span className="text-[11px] text-neutral-500 font-normal block">
                                {totalSubcategories} subcategories
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Right: Expand / Collapse Accordion Toggle */}
                        {l1.l2Children.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedDrawerL1Map((prev) => ({
                                ...prev,
                                [l1Id]: !prev[l1Id],
                              }));
                            }}
                            className="p-2.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-200/60 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                            aria-label={isL1Expanded ? `Collapse ${l1.item.name}` : `Expand ${l1.item.name}`}
                          >
                            {isL1Expanded ? (
                              <ChevronDown className="w-4 h-4 text-neutral-700" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-neutral-700" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Level 2 & Level 3 Subcategories Accordion Content */}
                      {l1.l2Children.length > 0 && isL1Expanded && (
                        <div className="border-t border-neutral-100 bg-white p-2 space-y-1">
                          {l1.l2Children.map((l2) => {
                            const l2Id = l2.item.id || l2.item.name;
                            const isL2Expanded = drawerSearchQuery
                              ? true
                              : Boolean(expandedDrawerL2Map[l2Id]);
                            const isL2Active =
                              Boolean(currentCategory && l2.item.name.toLowerCase() === currentCategory.toLowerCase());
                            const hasL3 = l2.l3Children.length > 0;

                            return (
                              <div key={l2Id} className="rounded-lg overflow-hidden bg-neutral-50/40 border border-neutral-100">
                                {/* Level 2 Item */}
                                <div className="flex items-center justify-between px-3 py-2 min-h-[44px]">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleCategorySelect(l2.item.name, l2.item.href);
                                      setIsMobileDrawerOpen(false);
                                    }}
                                    className={`flex-1 text-left text-xs font-semibold truncate min-h-[44px] flex items-center ${
                                      isL2Active ? 'text-neutral-900 font-bold' : 'text-neutral-800'
                                    }`}
                                  >
                                    <span>{l2.item.name}</span>
                                    {hasL3 && (
                                      <span className="ml-2 text-[10px] text-neutral-400 font-normal">
                                        ({l2.l3Children.length})
                                      </span>
                                    )}
                                  </button>

                                  {hasL3 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedDrawerL2Map((prev) => ({
                                          ...prev,
                                          [l2Id]: !prev[l2Id],
                                        }));
                                      }}
                                      className="p-2 text-neutral-400 hover:text-neutral-900 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                                      aria-label={isL2Expanded ? `Collapse ${l2.item.name}` : `Expand ${l2.item.name}`}
                                    >
                                      {isL2Expanded ? (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>

                                {/* Level 3 Children */}
                                {hasL3 && isL2Expanded && (
                                  <div className="pl-4 pr-2 pb-2 pt-0.5 space-y-1 border-t border-neutral-100 bg-white">
                                    {l2.l3Children.map((l3) => {
                                      const isL3Active =
                                        Boolean(currentCategory && l3.name.toLowerCase() === currentCategory.toLowerCase());

                                      return (
                                        <button
                                          key={l3.id || l3.name}
                                          type="button"
                                          onClick={() => {
                                            handleCategorySelect(l3.name, l3.href);
                                            setIsMobileDrawerOpen(false);
                                          }}
                                          className={`w-full text-left px-2.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-between min-h-[44px] ${
                                            isL3Active
                                              ? 'bg-neutral-900 text-white font-semibold'
                                              : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                                          }`}
                                        >
                                          <span>{l3.name}</span>
                                          {isL3Active && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Sticky Bottom Action Bar */}
            <div className="p-4 border-t border-neutral-200 bg-white shadow-lg shrink-0 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span>Active Filter:</span>
                <span className="font-semibold text-neutral-900 truncate max-w-[200px]">
                  {currentCategory || 'All Collections'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-full py-3 px-4 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 min-h-[44px]"
              >
                <span>View Products</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
