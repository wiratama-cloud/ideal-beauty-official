'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { toggleWishlistAction } from '@/app/actions/wishlist';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    category?: string | null;
    images: string[];
    variants: Array<{
      id: string;
      priceSale: any;
      priceRent: any;
      compareAtPrice?: any;
      stockAvailable: number;
    }>;
  };
  isWishlistedInitial?: boolean;
}

export default function ProductCard({ product, isWishlistedInitial = false }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(isWishlistedInitial);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  // Price calculation
  const salePrices = product.variants
    .map((v) => (v.priceSale ? Number(v.priceSale) : null))
    .filter((p): p is number => p !== null);
  const rentPrices = product.variants
    .map((v) => (v.priceRent ? Number(v.priceRent) : null))
    .filter((p): p is number => p !== null);
  const compareAtPrices = product.variants
    .map((v) => (v.compareAtPrice ? Number(v.compareAtPrice) : null))
    .filter((p): p is number => p !== null);

  const minSalePrice = salePrices.length > 0 ? Math.min(...salePrices) : null;
  const minRentPrice = rentPrices.length > 0 ? Math.min(...rentPrices) : null;
  const minCompareAtPrice = compareAtPrices.length > 0 ? Math.min(...compareAtPrices) : null;

  const hasDiscount = Boolean(
    minCompareAtPrice && minSalePrice && minCompareAtPrice > minSalePrice
  );
  const discountPercent = hasDiscount
    ? Math.round(((minCompareAtPrice! - minSalePrice!) / minCompareAtPrice!) * 100)
    : 0;
  const savingsAmount = hasDiscount && minCompareAtPrice && minSalePrice
    ? minCompareAtPrice - minSalePrice
    : 0;

  const mainImage = product.images[0] || '/images/products/default-product.jpg';
  const hoverImage = product.images[1] || mainImage;
  const hasHoverImage = product.images.length > 1;

  const [mainImgSrc, setMainImgSrc] = useState(mainImage);
  const [hoverImgSrc, setHoverImgSrc] = useState(hoverImage);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlistLoading(true);
    try {
      const res = await toggleWishlistAction(product.id, product.variants[0]?.id);
      setIsWishlisted(res.wishlisted);
    } catch (err) {
      console.error('Failed to toggle wishlist', err);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-sm overflow-hidden border border-neutral-100/80 shadow-xs hover:shadow-md transition-all duration-300">
      {/* Card wrapped in Link */}
      <Link href={`/products/${product.slug}`} className="block relative w-full flex-1">
        {/* Aspect Ratio Image Container */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
          {/* Main Image */}
          <Image
            src={mainImgSrc}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className={`object-cover object-center transition-all duration-700 ${
              hasHoverImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'
            }`}
            unoptimized
            onError={() => setMainImgSrc('/images/products/default-product.jpg')}
          />

          {/* Hover Image */}
          {hasHoverImage && (
            <Image
              src={hoverImgSrc}
              alt={`${product.name} hover`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover object-center transition-all duration-700 opacity-0 group-hover:opacity-100 group-hover:scale-105"
              unoptimized
              onError={() => setHoverImgSrc('/images/products/default-product.jpg')}
            />
          )}

          {/* Top Left Badges Overlay */}
          <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1 z-10 pointer-events-none">
            {hasDiscount && (
              <span className="bg-red-600 text-white font-bold text-[9px] sm:text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-xs shadow-sm">
                -{discountPercent}% OFF
              </span>
            )}
            {minRentPrice !== null && (
              <span className="bg-black/75 backdrop-blur-md text-white font-medium text-[8px] sm:text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-xs shadow-sm">
                RENTAL
              </span>
            )}
            {product.category && !hasDiscount && (
              <span className="bg-white/90 backdrop-blur-md text-neutral-800 font-medium text-[8px] sm:text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-xs shadow-sm">
                {product.category}
              </span>
            )}
          </div>

          {/* Top Right Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            disabled={isWishlistLoading}
            className="absolute top-2.5 right-2.5 z-20 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 backdrop-blur-md shadow-sm hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200"
            aria-label="Wishlist"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isWishlisted ? 'fill-red-600 text-red-600' : 'text-neutral-600 hover:text-black'
              }`}
            />
          </button>
        </div>

        {/* Product Information */}
        <div className="p-3 sm:p-4 flex flex-col justify-between flex-1 bg-white">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-neutral-400 truncate">
                {product.category || 'Collection'}
              </span>
              {hasDiscount && (
                <span className="text-[9px] font-semibold text-red-600 bg-red-50 border border-red-100/80 px-1.5 py-0.5 rounded-xs whitespace-nowrap">
                  Save {formatIDR(savingsAmount)}
                </span>
              )}
            </div>

            <h3 className="text-xs sm:text-sm font-medium text-neutral-900 group-hover:text-black transition-colors line-clamp-1">
              {product.name}
            </h3>
          </div>

          <div className="mt-2.5 pt-2 border-t border-neutral-100 flex flex-col gap-1.5">
            {/* Sale Price & Discount Compare */}
            {minSalePrice !== null && (
              <div className="flex items-baseline justify-between flex-wrap gap-1">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-xs sm:text-sm font-bold tracking-tight ${hasDiscount ? 'text-red-700' : 'text-neutral-900'}`}>
                    {formatIDR(minSalePrice)}
                  </span>
                  {hasDiscount && minCompareAtPrice && (
                    <span className="text-[10px] sm:text-xs text-neutral-400 line-through font-normal">
                      {formatIDR(minCompareAtPrice)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Rental Price Row */}
            {minRentPrice !== null && (
              <div className="flex items-center justify-between text-[10px] sm:text-xs pt-1 border-t border-neutral-100/80">
                <span className="text-neutral-500 font-medium tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Rent from
                </span>
                <span className="font-semibold text-neutral-800">
                  {formatIDR(minRentPrice)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
