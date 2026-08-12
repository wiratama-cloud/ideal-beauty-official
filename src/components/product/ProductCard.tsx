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

  const minSalePrice = salePrices.length > 0 ? Math.min(...salePrices) : null;
  const minRentPrice = rentPrices.length > 0 ? Math.min(...rentPrices) : null;

  const mainImage = product.images[0] || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop';
  const hoverImage = product.images[1] || mainImage;
  const hasHoverImage = product.images.length > 1;

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
    <div className="group relative flex flex-col bg-white">
      {/* Whole card wrapped in Link for seamless mobile touch */}
      <Link href={`/products/${product.slug}`} className="block relative w-full flex-1">
        {/* Aspect Ratio Image Container */}
        <div className="relative aspect-[5/7] w-full overflow-hidden bg-gray-100 rounded-sm">
          {/* Main Image */}
          <Image
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className={`object-cover object-center transition-all duration-700 ${
              hasHoverImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'
            }`}
            unoptimized
          />

          {/* Hover Image (CSS only to prevent breaking touch events) */}
          {hasHoverImage && (
            <Image
              src={hoverImage}
              alt={`${product.name} hover`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover object-center transition-all duration-700 opacity-0 group-hover:opacity-100 group-hover:scale-105"
              unoptimized
            />
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 z-10 pointer-events-none">
            {minRentPrice !== null && (
              <span className="bg-white/90 text-neutral-800 text-[8px] sm:text-[9px] uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 font-medium backdrop-blur-sm shadow-sm rounded-sm">
                Rent Available
              </span>
            )}
            {product.category && (
              <span className="bg-white/90 text-neutral-800 text-[8px] sm:text-[9px] uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 font-medium backdrop-blur-sm shadow-sm rounded-sm">
                {product.category}
              </span>
            )}
          </div>

          {/* Wishlist Button Overlay */}
          <button
            onClick={handleWishlistToggle}
            disabled={isWishlistLoading}
            className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
            aria-label="Wishlist"
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                isWishlisted ? 'fill-red-600 text-red-600' : 'text-neutral-700 hover:text-black'
              }`}
            />
          </button>
        </div>

        {/* Product Information */}
        <div className="pt-2 sm:pt-3 pb-2 px-0.5 space-y-1">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.1em] text-neutral-500 block">
            {product.category || 'Collection'}
          </span>
          <h3 className="text-xs sm:text-sm text-neutral-900 font-medium group-hover:text-neutral-600 transition-colors line-clamp-1">
            {product.name}
          </h3>

          <div className="pt-0.5 sm:pt-1 flex flex-col space-y-0.5">
            {minSalePrice !== null && (
              <span className="text-xs sm:text-sm font-semibold text-neutral-900 tracking-wide">
                {formatIDR(minSalePrice)}
              </span>
            )}
            {minRentPrice !== null && (
              <span className="text-[10px] sm:text-xs font-medium text-neutral-500 tracking-wide">
                Rent from {formatIDR(minRentPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
