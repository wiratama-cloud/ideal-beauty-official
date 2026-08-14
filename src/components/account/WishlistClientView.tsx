'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/cart/CartContext';
import { toggleWishlistAction } from '@/app/actions/wishlist';
import {
  Heart,
  ShoppingBag,
  Trash2,
  Sparkles,
  Check,
  Crown,
  Tag,
  ExternalLink,
  ArrowRight,
  Filter,
  PackageCheck,
  AlertCircle,
} from 'lucide-react';

export interface WishlistProductVariant {
  id: string;
  title: string | null;
  sku: string | null;
  inventory?: number;
  stockAvailable?: number;
  stockSaleAvailable?: number;
  stockRentAvailable?: number;
  priceSale: number | null;
  priceRent: number | null;
  compareAtPrice: number | null;
}

export interface WishlistProduct {
  id: string;
  name?: string;
  title?: string;
  slug: string;
  description: string | null;
  category: string | null;
  images: any;
  variants: WishlistProductVariant[];
}

export interface WishlistItemData {
  id: string;
  userId: string;
  productId: string;
  variantId: string | null;
  createdAt: Date | string;
  product: WishlistProduct | null;
  variant: WishlistProductVariant | null;
}

interface WishlistClientViewProps {
  initialItems: WishlistItemData[];
}

export default function WishlistClientView({ initialItems }: WishlistClientViewProps) {
  const [items, setItems] = useState<WishlistItemData[]>(initialItems);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedVariantMap, setSelectedVariantMap] = useState<Record<string, string>>({});
  const [addingToBagId, setAddingToBagId] = useState<string | null>(null);
  const [addedSuccessId, setAddedSuccessId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { addToCart } = useCart();

  // Categories extraction
  const rawCategories = Array.from(
    new Set(
      items
        .map((item) => item.product?.category)
        .filter((cat): cat is string => Boolean(cat))
    )
  );

  const filteredItems = selectedCategory === 'ALL'
    ? items
    : items.filter((item) => item.product?.category === selectedCategory);

  // Helper for image extraction
  const getPrimaryImage = (product: WishlistProduct | null): string => {
    if (!product || !product.images) return '/images/products/default-product.jpg';
    let imgs: string[] = [];
    if (Array.isArray(product.images)) {
      imgs = product.images;
    } else if (typeof product.images === 'string') {
      try {
        const parsed = JSON.parse(product.images);
        imgs = Array.isArray(parsed) ? parsed : [product.images];
      } catch {
        imgs = [product.images];
      }
    }
    return imgs[0] || '/images/products/default-product.jpg';
  };

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Stock status calculator
  const getStockStatus = (variant: WishlistProductVariant | null, product: WishlistProduct | null) => {
    const targetVariants = variant ? [variant] : (product?.variants || []);
    let totalStock = 0;

    for (const v of targetVariants) {
      const sale = v.stockSaleAvailable ?? 0;
      const rent = v.stockRentAvailable ?? 0;
      const available = v.stockAvailable ?? 0;
      const inv = v.inventory ?? 0;
      const effective = (sale || rent) ? (sale + rent) : (available || inv);
      totalStock += effective;
    }

    if (totalStock > 3) {
      return {
        label: 'In Stock',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotBg: 'bg-emerald-500',
      };
    } else if (totalStock > 0) {
      return {
        label: `Low Stock (${totalStock} Left)`,
        badgeBg: 'bg-amber-50 text-amber-900 border-amber-200',
        dotBg: 'bg-amber-500',
      };
    } else {
      return {
        label: 'Pre-Order / Atelier Reservation',
        badgeBg: 'bg-neutral-100 text-neutral-700 border-neutral-200',
        dotBg: 'bg-neutral-400',
      };
    }
  };

  // One-click remove handler
  const handleRemove = async (item: WishlistItemData) => {
    setRemovingId(item.id);
    // Optimistic removal
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    try {
      await toggleWishlistAction(item.productId, item.variantId || undefined);
    } catch (err) {
      console.error('Failed to remove item from wishlist:', err);
      // Revert if error
      setItems((prev) => [...prev, item]);
    } finally {
      setRemovingId(null);
    }
  };

  // Add to Bag handler
  const handleAddToBag = async (item: WishlistItemData, type: 'SALE' | 'RENTAL') => {
    const product = item.product;
    if (!product) return;

    const selectedVariantId =
      selectedVariantMap[item.id] ||
      item.variantId ||
      product.variants[0]?.id;

    if (!selectedVariantId) return;

    setAddingToBagId(`${item.id}_${type}`);

    try {
      await addToCart({
        variantId: selectedVariantId,
        type,
        quantity: 1,
      });

      setAddedSuccessId(`${item.id}_${type}`);
      setTimeout(() => {
        setAddedSuccessId(null);
      }, 2500);
    } catch (err) {
      console.error('Failed to add to bag:', err);
    } finally {
      setAddingToBagId(null);
    }
  };

  // Total valuation calculation
  const totalValuation = items.reduce((sum, item) => {
    const p = item.product;
    if (!p) return sum;
    const variant = item.variant || p.variants[0];
    const price = variant?.priceSale || variant?.priceRent || 0;
    return sum + price;
  }, 0);

  return (
    <div className="space-y-8">
      {/* Header Summary & Filters Bar */}
      <div className="bg-white border border-neutral-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-neutral-100 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4 text-amber-600" />
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-900/80">
                ATELIER CURATED WISHLIST
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-light text-neutral-900 tracking-wide flex items-center gap-3">
              <span>Saved Masterpieces</span>
              <span className="text-xs font-mono font-normal bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-1">
                {items.length} {items.length === 1 ? 'Piece' : 'Pieces'}
              </span>
            </h2>
            <p className="text-neutral-500 text-xs font-light">
              Your personalized collection of haute couture gowns, imperial kaftans, and bridal wear.
            </p>
          </div>

          {items.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 bg-neutral-50 border border-neutral-200/80 p-4 font-mono text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 block">
                  ESTIMATED ATELIER VALUE
                </span>
                <span className="text-sm font-medium text-neutral-900">
                  {formatIDR(totalValuation)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Category Filters */}
        {items.length > 0 && rawCategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mr-2 flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber-600" />
              Filter:
            </span>
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 text-[11px] uppercase tracking-wider font-mono transition-colors whitespace-nowrap border ${
                selectedCategory === 'ALL'
                  ? 'bg-neutral-900 text-white border-neutral-900 font-medium'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
              }`}
            >
              All Pieces ({items.length})
            </button>
            {rawCategories.map((category) => {
              const count = items.filter((i) => i.product?.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3.5 py-1.5 text-[11px] uppercase tracking-wider font-mono transition-colors whitespace-nowrap border ${
                    selectedCategory === category
                      ? 'bg-neutral-900 text-white border-neutral-900 font-medium'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Wishlist Items Grid / Empty State */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-neutral-200/80 p-12 sm:p-16 text-center space-y-6 max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200/80 flex items-center justify-center mx-auto text-amber-600">
            <Heart className="w-8 h-8 stroke-[1.5]" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-900/80 block">
              EMPTY WISHLIST
            </span>
            <h3 className="font-serif text-2xl text-neutral-900 font-light">
              {items.length === 0
                ? 'Your Private Wishlist is Empty'
                : `No Saved Pieces in "${selectedCategory}"`}
            </h3>
            <p className="text-neutral-500 font-light text-xs max-w-md mx-auto leading-relaxed">
              {items.length === 0
                ? 'Curate your private haute couture gallery by saving bridal lehengas, evening gowns, and imperial kaftans.'
                : 'Try selecting another category or view all saved pieces in your atelier wishlist.'}
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {items.length > 0 ? (
              <button
                onClick={() => setSelectedCategory('ALL')}
                className="w-full sm:w-auto bg-neutral-900 text-white text-xs uppercase tracking-[0.2em] px-8 py-3.5 font-light hover:bg-neutral-800 transition-colors"
              >
                View All Saved Items
              </button>
            ) : (
              <>
                <Link
                  href="/products"
                  className="w-full sm:w-auto bg-neutral-900 text-white text-xs uppercase tracking-[0.2em] px-8 py-3.5 font-light hover:bg-amber-900 transition-colors inline-flex items-center justify-center space-x-2"
                >
                  <span>Browse Full Catalogue</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </Link>
                <Link
                  href="/products?category=Bridal"
                  className="w-full sm:w-auto bg-white border border-neutral-300 text-neutral-800 text-xs uppercase tracking-[0.2em] px-8 py-3.5 font-light hover:bg-neutral-50 transition-colors"
                >
                  Bridal Collection
                </Link>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const product = item.product;
            if (!product) return null;

            const name = product.name || product.title || 'Haute Couture Piece';
            const primaryImage = getPrimaryImage(product);
            const activeVariantId =
              selectedVariantMap[item.id] ||
              item.variantId ||
              product.variants[0]?.id;

            const selectedVariant =
              product.variants.find((v) => v.id === activeVariantId) ||
              item.variant ||
              product.variants[0];

            const stockStatus = getStockStatus(selectedVariant, product);

            const priceSale = selectedVariant?.priceSale ?? null;
            const priceRent = selectedVariant?.priceRent ?? null;
            const compareAtPrice = selectedVariant?.compareAtPrice ?? null;

            const hasSaleDiscount =
              Boolean(compareAtPrice && priceSale && compareAtPrice > priceSale);
            const discountPercent = hasSaleDiscount
              ? Math.round(((compareAtPrice! - priceSale!) / compareAtPrice!) * 100)
              : 0;

            const isAddingSale = addingToBagId === `${item.id}_SALE`;
            const isAddingRent = addingToBagId === `${item.id}_RENTAL`;
            const isSuccessSale = addedSuccessId === `${item.id}_SALE`;
            const isSuccessRent = addedSuccessId === `${item.id}_RENTAL`;
            const isRemoving = removingId === item.id;

            return (
              <div
                key={item.id}
                className={`group bg-white border border-neutral-200/80 hover:border-amber-300 transition-all duration-300 shadow-xs flex flex-col justify-between overflow-hidden relative ${
                  isRemoving ? 'opacity-40 pointer-events-none' : ''
                }`}
              >
                <div>
                  {/* Aspect Ratio Image Container */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
                    <Image
                      src={primaryImage}
                      alt={name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      unoptimized
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== '/images/products/default-product.jpg') {
                          target.src = '/images/products/default-product.jpg';
                        }
                      }}
                    />

                    {/* Stock Status Badge Overlay */}
                    <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1">
                      <div
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 border text-[9px] font-mono uppercase tracking-wider backdrop-blur-md shadow-xs ${stockStatus.badgeBg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${stockStatus.dotBg}`} />
                        <span>{stockStatus.label}</span>
                      </div>

                      {hasSaleDiscount && (
                        <span className="bg-rose-700 text-white font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 shadow-xs">
                          -{discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    {/* Quick Remove Button Overlay */}
                    <button
                      onClick={() => handleRemove(item)}
                      disabled={isRemoving}
                      title="Remove from saved wishlist"
                      className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-rose-600 hover:bg-white hover:border-rose-300 transition-all duration-200 shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Product Details Section */}
                  <div className="p-5 space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-amber-900/80">
                        <span>{product.category || 'Atelier Collection'}</span>
                        {selectedVariant?.sku && (
                          <span className="text-neutral-400">{selectedVariant.sku}</span>
                        )}
                      </div>

                      <Link href={`/products/${product.slug}`} className="block group-hover:text-amber-900 transition-colors">
                        <h3 className="font-serif text-lg font-light text-neutral-900 line-clamp-1">
                          {name}
                        </h3>
                      </Link>
                    </div>

                    {/* Variant Dropdown (if multiple variants) */}
                    {product.variants.length > 1 && (
                      <div className="space-y-1 pt-1">
                        <label className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block">
                          Select Variant / Size:
                        </label>
                        <select
                          value={activeVariantId}
                          onChange={(e) =>
                            setSelectedVariantMap((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 text-[11px] font-mono py-1.5 px-2.5 focus:outline-none focus:border-amber-500"
                        >
                          {product.variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.title || `Variant ${v.sku || v.id.substring(0, 6)}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Pricing Breakdown */}
                    <div className="pt-2 border-t border-neutral-100 space-y-1.5">
                      {priceSale !== null && (
                        <div className="flex items-baseline justify-between">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                            Purchase Price:
                          </span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-serif text-base font-medium text-neutral-900">
                              {formatIDR(priceSale)}
                            </span>
                            {hasSaleDiscount && compareAtPrice && (
                              <span className="text-[10px] text-neutral-400 line-through font-mono">
                                {formatIDR(compareAtPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {priceRent !== null && (
                        <div className="flex items-baseline justify-between text-xs pt-0.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-900/80 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            Rental Rate:
                          </span>
                          <span className="font-serif font-light text-neutral-800">
                            {formatIDR(priceRent)} / event
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-5 pt-0 space-y-2 border-t border-neutral-100/60 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3">
                    {/* Add for Sale button */}
                    {priceSale !== null && (
                      <button
                        onClick={() => handleAddToBag(item, 'SALE')}
                        disabled={isAddingSale || isAddingRent}
                        className={`w-full py-2.5 px-3 text-[10px] font-mono uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 ${
                          isSuccessSale
                            ? 'bg-emerald-800 text-white'
                            : 'bg-neutral-900 text-white hover:bg-neutral-800'
                        } disabled:opacity-50`}
                      >
                        {isAddingSale ? (
                          <span>Adding...</span>
                        ) : isSuccessSale ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>In Bag</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                            <span>Buy Piece</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Add for Rent button */}
                    {priceRent !== null && (
                      <button
                        onClick={() => handleAddToBag(item, 'RENTAL')}
                        disabled={isAddingSale || isAddingRent}
                        className={`w-full py-2.5 px-3 text-[10px] font-mono uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 border ${
                          isSuccessRent
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-amber-50/80 border-amber-300/80 text-amber-900 hover:bg-amber-100/80'
                        } disabled:opacity-50`}
                      >
                        {isAddingRent ? (
                          <span>Reserving...</span>
                        ) : isSuccessRent ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Reserved</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>Rent Piece</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <Link
                    href={`/products/${product.slug}`}
                    className="block text-center text-[10px] font-mono uppercase tracking-widest text-neutral-400 hover:text-neutral-800 pt-1 transition-colors"
                  >
                    View Atelier Details &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
