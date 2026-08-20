'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShoppingBag, Check, ArrowRight } from 'lucide-react';
import { formatIDR, calculateDiscountPercent } from '@/lib/utils/product-stock';
import { getOptimizedImageUrl } from '@/lib/utils/image-url';

export interface StickyMobileActionProps {
  productName: string;
  thumbnail?: string;
  selectedVariantLabel?: string;
  stockBadgeText?: string;
  optionType: 'SALE' | 'RENTAL';
  currentPrice?: number | string | null;
  compareAtPrice?: number | string | null;
  isSalePreOrder?: boolean;
  isSoldOut?: boolean;
  canAddToCart: boolean;
  isAddingToCart: boolean;
  addedSuccess: boolean;
  onAddToCart: () => void;
  targetTriggerId?: string;
}

export default function StickyMobileAction({
  productName,
  thumbnail,
  selectedVariantLabel,
  stockBadgeText,
  optionType,
  currentPrice,
  compareAtPrice,
  isSalePreOrder,
  isSoldOut,
  canAddToCart,
  isAddingToCart,
  addedSuccess,
  onAddToCart,
  targetTriggerId = 'pdp-main-cta',
}: StickyMobileActionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const triggerEl = document.getElementById(targetTriggerId);
    if (!triggerEl) {
      // Fallback: show sticky bar after scrolling past 400px if element not found
      const handleScroll = () => {
        setIsVisible(window.scrollY > 450);
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When main CTA is NOT intersecting (scrolled out of view above), show sticky bar
        // If entry.boundingClientRect.top < 0, it means it was scrolled above the viewport
        setIsVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      {
        root: null,
        threshold: 0,
      }
    );

    observer.observe(triggerEl);
    return () => observer.disconnect();
  }, [targetTriggerId]);

  if (!isVisible) return null;

  const discountPercent = calculateDiscountPercent(compareAtPrice, currentPrice);
  const imageSrc = thumbnail ? getOptimizedImageUrl(thumbnail, 256) : '/images/products/default-product.jpg';

  const buttonText = addedSuccess
    ? 'Added'
    : isAddingToCart
    ? 'Adding...'
    : !canAddToCart
    ? isSoldOut
      ? 'Sold Out'
      : optionType === 'RENTAL'
      ? 'Select Dates'
      : 'Unavailable'
    : optionType === 'SALE'
    ? isSalePreOrder
      ? 'Pre-Order'
      : 'Add to Bag'
    : 'Reserve Rental';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 shadow-2xl px-4 py-3 sm:hidden animate-slideUp transition-all pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      data-testid="sticky-mobile-action"
    >
      <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
        {/* Left: Thumbnail and Product / Variant Info */}
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          {thumbnail && (
            <div className="relative w-10 h-12 flex-shrink-0 bg-neutral-100 rounded-xs overflow-hidden border border-neutral-200">
              <Image
                src={imageSrc}
                alt={productName}
                fill
                className="object-cover object-center"
                sizes="40px"
                unoptimized
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-serif font-medium text-neutral-900 truncate">
              {productName}
            </p>
            <div className="flex items-center space-x-1.5 text-[11px] text-neutral-500 font-sans truncate">
              {selectedVariantLabel && (
                <span className="font-mono text-neutral-700">{selectedVariantLabel}</span>
              )}
              {selectedVariantLabel && stockBadgeText && <span>&bull;</span>}
              {stockBadgeText && (
                <span className={stockBadgeText.includes('Pre-Order') ? 'text-purple-700 font-medium' : ''}>
                  {stockBadgeText}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1 font-mono text-xs font-semibold text-neutral-900">
              <span>{formatIDR(currentPrice)}</span>
              {discountPercent !== null && (
                <span className="text-[10px] text-red-600 font-sans font-bold">
                  (-{discountPercent}%)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: CTA Button */}
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={onAddToCart}
            disabled={!canAddToCart || isAddingToCart}
            className={`px-4 py-3 text-xs uppercase tracking-wider font-medium flex items-center space-x-1.5 rounded-xs transition-all shadow-sm ${
              addedSuccess
                ? 'bg-emerald-800 text-white'
                : canAddToCart
                ? 'bg-black text-white active:scale-95'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {addedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{buttonText}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{buttonText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
