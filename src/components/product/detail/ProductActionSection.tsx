'use client';

import React from 'react';
import { Heart, ShoppingBag, Check, Clock } from 'lucide-react';
import ProductVariantSelector from './ProductVariantSelector';
import ProductRentalSection from './ProductRentalSection';
import { formatIDR } from '@/lib/utils/product-stock';
import { ProductDetailProduct, ProductDetailVariant } from './useProductDetail';

export interface ProductActionSectionProps {
  product: ProductDetailProduct & {
    variants: ProductDetailVariant[];
  };
  selectedVariant?: ProductDetailVariant;
  selectedVariantId: string;
  setSelectedVariantId: (id: string) => void;
  optionType: 'SALE' | 'RENTAL';
  setOptionType: (type: 'SALE' | 'RENTAL') => void;
  hasSalePrice: boolean;
  hasRentalPrice: boolean;
  isSalePreOrder: boolean;
  preOrderDays?: number;
  estimatedArrival?: string | null;
  currentPrice?: number | string | null;
  compareAtPrice?: number | string | null;
  discountPercent?: number | null;
  saleStock: number;
  rentStock: number;
  quantity: number;
  incrementQuantity: () => void;
  decrementQuantity: () => void;
  rentStartDate?: string;
  rentEndDate?: string;
  isRentalDatesValid: boolean;
  setRentalDates: (start: string, end: string, isValid: boolean) => void;
  canAddToCart: boolean;
  isAddingToCart: boolean;
  addedSuccess: boolean;
  handleAddToCart: () => void;
  isWishlisted: boolean;
  isWishlistLoading: boolean;
  handleWishlistToggle: () => void;
  getVariantStockStatus: (variant: any, mode?: 'SALE' | 'RENTAL') => {
    badgeText: string;
    badgeType: any;
    isAvailable: boolean;
  };
  mainCtaId?: string;
}

export default function ProductActionSection({
  product,
  selectedVariant,
  selectedVariantId,
  setSelectedVariantId,
  optionType,
  setOptionType,
  hasSalePrice,
  hasRentalPrice,
  isSalePreOrder,
  preOrderDays,
  estimatedArrival,
  currentPrice,
  compareAtPrice,
  discountPercent,
  saleStock,
  rentStock,
  quantity,
  incrementQuantity,
  decrementQuantity,
  rentStartDate,
  rentEndDate,
  isRentalDatesValid,
  setRentalDates,
  canAddToCart,
  isAddingToCart,
  addedSuccess,
  handleAddToCart,
  isWishlisted,
  isWishlistLoading,
  handleWishlistToggle,
  getVariantStockStatus,
  mainCtaId = 'pdp-main-cta',
}: ProductActionSectionProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Brand Header & Product Title (Desktop only; on mobile rendered above gallery) */}
      <div className="hidden lg:block">
        <span className="text-xs uppercase tracking-[0.3em] text-neutral-400 font-sans block mb-1.5">
          {product.category || 'Ideal Beauty Couture'}
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-light text-neutral-900 leading-tight">
          {product.name}
        </h1>
      </div>

      {/* Acquisition Mode Switcher: Purchase vs Bespoke Rental */}
      <div className="border-y border-neutral-100 py-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {hasSalePrice && (
            <button
              type="button"
              onClick={() => setOptionType('SALE')}
              className={`flex-1 py-3 px-4 text-xs uppercase tracking-widest border transition-all text-center rounded-xs ${
                optionType === 'SALE'
                  ? 'border-black bg-black text-white font-medium shadow-xs ring-1 ring-black'
                  : 'border-neutral-200 text-neutral-700 hover:border-black bg-white'
              }`}
            >
              <span>
                {isSalePreOrder ? 'Pre-Order' : 'Purchase'} &bull; {formatIDR(selectedVariant?.priceSale)}
              </span>
            </button>
          )}

          {hasRentalPrice && (
            <button
              type="button"
              onClick={() => setOptionType('RENTAL')}
              className={`flex-1 py-3 px-4 text-xs uppercase tracking-widest border transition-all text-center rounded-xs ${
                optionType === 'RENTAL'
                  ? 'border-black bg-black text-white font-medium shadow-xs ring-1 ring-black'
                  : 'border-neutral-200 text-neutral-700 hover:border-black bg-white'
              }`}
            >
              <span>Rent &bull; {formatIDR(selectedVariant?.priceRent)}</span>
            </button>
          )}
        </div>

        {/* Pre-Order Banner (when Sale pre-order is active) */}
        {optionType === 'SALE' && isSalePreOrder && (
          <div className="bg-purple-50/80 border border-purple-200 p-3.5 rounded-xs text-xs text-purple-950 space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between font-semibold text-purple-900 uppercase tracking-wider text-[11px]">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-purple-700" />
                <span>Pre-Order Item</span>
              </div>
              {preOrderDays ? (
                <span className="bg-purple-200/80 text-purple-950 px-2 py-0.5 rounded-xs font-mono text-[10px]">
                  {preOrderDays} Days Lead Time
                </span>
              ) : null}
            </div>
            {estimatedArrival && (
              <p className="text-xs text-purple-950 font-medium">
                Expected Arrival:{' '}
                <span className="font-semibold text-purple-900">{estimatedArrival}</span>
              </p>
            )}
            {selectedVariant?.preOrderNote && (
              <p className="text-[11px] text-purple-800 italic">{selectedVariant.preOrderNote}</p>
            )}
          </div>
        )}

        {/* Price Display */}
        <div className="pt-2 font-mono text-xl sm:text-2xl text-neutral-900 font-light flex items-center flex-wrap gap-2.5">
          {optionType === 'SALE' ? (
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="text-xs sm:text-sm uppercase tracking-widest font-sans text-neutral-400">
                {isSalePreOrder ? 'Pre-Order Price:' : 'Sale Price:'}
              </span>
              <span className="font-semibold">{formatIDR(currentPrice)}</span>
              {compareAtPrice && currentPrice && Number(compareAtPrice) > Number(currentPrice) && (
                <>
                  <span className="text-xs sm:text-sm text-neutral-400 line-through">
                    {formatIDR(compareAtPrice)}
                  </span>
                  {discountPercent !== null && discountPercent !== undefined && (
                    <span className="bg-red-600 text-white font-sans text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs tracking-wider">
                      -{discountPercent}% OFF
                    </span>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="text-xs sm:text-sm uppercase tracking-widest font-sans text-neutral-400">
                Rental Rate:
              </span>
              <span className="font-semibold">{formatIDR(currentPrice)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Variant Selector */}
      <ProductVariantSelector
        variants={product.variants}
        selectedVariantId={selectedVariantId}
        onSelectVariant={setSelectedVariantId}
        optionType={optionType}
        category={product.category}
        productName={product.name}
        sizeChart={(product as any).sizeChart}
        getVariantStockStatus={getVariantStockStatus}
      />

      {/* Rental Section (when in RENTAL mode) */}
      {optionType === 'RENTAL' && (
        <ProductRentalSection
          variantId={selectedVariant?.id || ''}
          dailyRate={
            selectedVariant?.priceRent !== null && selectedVariant?.priceRent !== undefined
              ? Number(selectedVariant.priceRent)
              : null
          }
          rentStartDate={rentStartDate}
          rentEndDate={rentEndDate}
          isRentalDatesValid={isRentalDatesValid}
          onSelectDates={(start, end, isValid) => {
            setRentalDates(start, end, isValid);
          }}
        />
      )}

      {/* Quantity Selector */}
      <div className="flex items-center space-x-4">
        <span className="text-xs uppercase tracking-widest text-neutral-700 font-sans font-medium">
          Quantity
        </span>
        <div className="flex items-center border border-neutral-300 rounded-xs">
          <button
            type="button"
            onClick={decrementQuantity}
            disabled={optionType === 'RENTAL' || quantity <= 1}
            className={`px-3.5 py-2 text-sm transition-colors ${
              optionType === 'RENTAL' || quantity <= 1
                ? 'text-neutral-300 cursor-not-allowed bg-neutral-50'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="px-4 py-2 text-xs font-mono select-none">
            {optionType === 'RENTAL' ? 1 : quantity}
          </span>
          <button
            type="button"
            onClick={incrementQuantity}
            disabled={optionType === 'RENTAL' || (!isSalePreOrder && quantity >= saleStock)}
            className={`px-3.5 py-2 text-sm transition-colors ${
              optionType === 'RENTAL' || (!isSalePreOrder && quantity >= saleStock)
                ? 'text-neutral-300 cursor-not-allowed bg-neutral-50'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        {optionType === 'RENTAL' && (
          <span className="text-[11px] text-neutral-400 font-sans italic">
            (Quantity is 1 for bespoke rental)
          </span>
        )}
      </div>

      {/* Commerce Action Buttons: Add to Bag & Wishlist */}
      <div id={mainCtaId} className="flex space-x-3 sm:space-x-4 pt-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          className={`flex-1 py-4 px-6 text-xs uppercase tracking-[0.2em] font-light transition-all flex items-center justify-center space-x-2 rounded-xs ${
            addedSuccess
              ? 'bg-emerald-800 text-white shadow-xs'
              : canAddToCart
              ? 'bg-black text-white hover:bg-neutral-800 active:scale-[0.99] shadow-xs'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          }`}
        >
          {addedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>Added to Shopping Bag</span>
            </>
          ) : isAddingToCart ? (
            <span>Processing...</span>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>
                {optionType === 'SALE'
                  ? saleStock > 0
                    ? 'Add To Bag (Purchase)'
                    : isSalePreOrder
                    ? 'Pre-Order Now'
                    : 'Out of Stock'
                  : rentStock > 0
                  ? 'Add To Bag (Rental)'
                  : 'Out of Stock'}
              </span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleWishlistToggle}
          disabled={isWishlistLoading}
          className="p-4 border border-neutral-300 hover:border-black transition-colors rounded-xs flex items-center justify-center"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isWishlisted ? 'fill-red-600 text-red-600' : 'text-neutral-700'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
