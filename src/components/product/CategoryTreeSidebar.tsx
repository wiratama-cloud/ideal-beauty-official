'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, ChevronDown, Sparkles, X, Layers } from 'lucide-react';
import { NavCategoryItem } from '@/lib/services/nav-category';

export interface CategoryTreeSidebarProps {
  categoriesTree?: NavCategoryItem[];
  navCategories?: NavCategoryItem[];
  categories?: (string | NavCategoryItem)[];
}

interface Level2Category {
  item: NavCategoryItem;
  l3Children: NavCategoryItem[];
}

interface Level1Category {
  item: NavCategoryItem;
  l2Children: Level2Category[];
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

  // State for active Level 2 category whose 3rd depth subcategories dialog is currently open
  const [activeDialogL2, setActiveDialogL2] = useState<Level2Category | null>(null);

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
          name: 'Women',
          href: '/products?category=Women',
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
          name: 'Men',
          href: '/products?category=Men',
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
        {
          name: 'Jewelry & Accessories',
          href: '/products?category=Accessories',
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

  // Track expanded Level 1 items in the sidebar
  const [expandedL1Map, setExpandedL1Map] = useState<Record<string, boolean>>({});

  // Auto-expand Level 1 item containing the active category
  useEffect(() => {
    if (level1Categories.length === 0) return;

    const newMap: Record<string, boolean> = {};
    level1Categories.forEach((l1) => {
      const l1Id = l1.item.id || l1.item.name;
      const matchesL1 = currentCategory && l1.item.name.toLowerCase() === currentCategory.toLowerCase();
      const matchesL2 = currentCategory && l1.l2Children.some(
        (l2) =>
          l2.item.name.toLowerCase() === currentCategory.toLowerCase() ||
          l2.l3Children.some((l3) => l3.name.toLowerCase() === currentCategory.toLowerCase())
      );

      if (matchesL1 || matchesL2 || !currentCategory) {
        newMap[l1Id] = true;
      }
    });

    setExpandedL1Map((prev) => ({ ...prev, ...newMap }));
  }, [currentCategory, level1Categories]);

  // Handle ESC key to close dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDialogL2(null);
      }
    };
    if (activeDialogL2) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDialogL2]);

  const toggleL1Expand = (l1Id: string) => {
    setExpandedL1Map((prev) => ({
      ...prev,
      [l1Id]: !prev[l1Id],
    }));
  };

  const handleCategorySelect = (categoryName: string, href?: string) => {
    setActiveDialogL2(null);
    if (href) {
      router.push(href);
    } else {
      router.push(`/products?category=${encodeURIComponent(categoryName)}`);
    }
  };

  const handleL2Click = (l2: Level2Category) => {
    if (l2.l3Children && l2.l3Children.length > 0) {
      setActiveDialogL2(l2);
    } else {
      handleCategorySelect(l2.item.name, l2.item.href);
    }
  };

  return (
    <>
      <aside className="bg-white border border-neutral-200/80 rounded-xl p-4 w-full h-full min-h-full font-sans shadow-xs flex flex-col">
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
                setActiveDialogL2(null);
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
              setActiveDialogL2(null);
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
                  <div className="pl-3 ml-2 border-l border-neutral-200/80 space-y-0.5 my-1">
                    {l1.l2Children.map((l2) => {
                      const l2Id = l2.item.id || l2.item.name;
                      const isL2Active =
                        currentCategory &&
                        (l2.item.name.toLowerCase() === currentCategory.toLowerCase() ||
                          l2.l3Children.some(
                            (l3) => l3.name.toLowerCase() === currentCategory.toLowerCase()
                          ));
                      const hasL3 = l2.l3Children.length > 0;

                      return (
                        <div key={l2Id} className="relative">
                          <button
                            type="button"
                            onClick={() => handleL2Click(l2)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs transition-all rounded-md text-left ${
                              isL2Active
                                ? 'bg-neutral-900 text-white font-medium'
                                : 'text-neutral-600 hover:text-black hover:bg-neutral-50'
                            }`}
                          >
                            <span className="truncate">{l2.item.name}</span>
                            {hasL3 && (
                              <span className="ml-1 flex items-center text-[10px] opacity-75 font-normal">
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </button>
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

      {/* Standalone Separate Dialog for 3rd Depth Subcategories */}
      {activeDialogL2 && activeDialogL2.l3Children.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-category-title"
          >
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 bg-neutral-50/50">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-0.5">
                  Select Subcategory
                </span>
                <h3
                  id="dialog-category-title"
                  className="text-lg font-semibold text-neutral-900 tracking-tight"
                >
                  {activeDialogL2.item.name}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCategorySelect(activeDialogL2.item.name, activeDialogL2.item.href)
                  }
                  className="text-xs px-3 py-1.5 rounded-full bg-neutral-900 text-white hover:bg-black font-medium transition-colors"
                >
                  View All {activeDialogL2.item.name}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDialogL2(null)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-200/60 transition-colors"
                  aria-label="Close subcategories dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dialog Content Grid (3rd Depth Subcategory Cards) */}
            <div className="p-5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4">
              {activeDialogL2.l3Children.map((subItem) => {
                const img = getCategoryImage(subItem);
                const isSubActive =
                  currentCategory &&
                  currentCategory.toLowerCase() === subItem.name.toLowerCase();

                return (
                  <button
                    key={subItem.id || subItem.name}
                    type="button"
                    onClick={() => handleCategorySelect(subItem.name, subItem.href)}
                    className={`group flex flex-col items-center bg-white p-3 rounded-xl border transition-all text-center h-full justify-between hover:shadow-md ${
                      isSubActive
                        ? 'border-neutral-900 ring-2 ring-neutral-900 bg-neutral-50/50'
                        : 'border-neutral-200/80 hover:border-neutral-800'
                    }`}
                  >
                    {/* Card Thumbnail Image */}
                    <div className="w-full aspect-[4/5] relative rounded-lg overflow-hidden bg-neutral-100 mb-2.5 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={subItem.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {/* Card Label */}
                    <span className="text-xs text-neutral-900 font-semibold group-hover:text-black line-clamp-2 mt-auto">
                      {subItem.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Dialog Footer */}
            <div className="p-3 px-5 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <span>{activeDialogL2.l3Children.length} items available</span>
              <button
                type="button"
                onClick={() => setActiveDialogL2(null)}
                className="hover:text-black font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
