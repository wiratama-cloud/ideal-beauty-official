'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, ShoppingBag, Calendar, Check, ShieldCheck, Truck, Clock } from 'lucide-react';
import { useCart } from '../cart/CartContext';
import { toggleWishlistAction } from '@/app/actions/wishlist';
import RentalAvailabilityCalendar from './RentalAvailabilityCalendar';
import SizeChartModal from './SizeChartModal';
import { getPreOrderDays, formatEstimatedArrival } from '@/lib/utils/preorder';

interface ProductDetailViewProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    category?: string | null;
    images: string[];
    variants: Array<{
      id: string;
      sku: string;
      skuSale?: string | null;
      skuRent?: string | null;
      isPreOrder?: boolean;
      preOrderShipDate?: Date | string | null;
      preOrderDays?: number | null;
      preOrderNote?: string | null;
      attributes: any;
      priceSale: any;
      priceRent: any;
      compareAtPrice?: any;
      stockAvailable: number;
      stockSaleAvailable?: number;
      stockRentAvailable?: number;
    }>;
  };
  isWishlistedInitial?: boolean;
}

export default function ProductDetailView({ product, isWishlistedInitial = false }: ProductDetailViewProps) {
  const { addToCart } = useCart();

  const [selectedImage, setSelectedImage] = useState(
    product.images[0] || '/images/products/default-product.jpg'
  );

  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id || '');
  const [optionType, setOptionType] = useState<'SALE' | 'RENTAL'>('SALE');
  const [quantity, setQuantity] = useState(1);

  // Rental dates
  const todayStr = new Date().toISOString().split('T')[0];
  const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [rentStartDate, setRentStartDate] = useState(todayStr);
  const [rentEndDate, setRentEndDate] = useState(threeDaysLater);
  const [isRentalDatesValid, setIsRentalDatesValid] = useState(true);

  const [isWishlisted, setIsWishlisted] = useState(isWishlistedInitial);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  const saleStock = selectedVariant?.stockSaleAvailable ?? selectedVariant?.stockAvailable ?? 0;
  const rentStock = selectedVariant?.stockRentAvailable ?? selectedVariant?.stockAvailable ?? 0;
  const isPreOrderActive = Boolean(selectedVariant?.isPreOrder);
  const isSalePreOrder = saleStock <= 0 && isPreOrderActive;

  // Auto adjust optionType if selected variant does not support current optionType
  React.useEffect(() => {
    if (!selectedVariant) return;
    if (optionType === 'SALE' && !selectedVariant.priceSale && selectedVariant.priceRent) {
      setOptionType('RENTAL');
      setQuantity(1);
    } else if (optionType === 'RENTAL' && !selectedVariant.priceRent && selectedVariant.priceSale) {
      setOptionType('SALE');
    }
  }, [selectedVariantId, selectedVariant, optionType]);

  // Force quantity to 1 when RENTAL option is selected
  React.useEffect(() => {
    if (optionType === 'RENTAL') {
      setQuantity(1);
    }
  }, [optionType]);

  const handleWishlistToggle = async () => {
    setIsWishlistLoading(true);
    try {
      const res = await toggleWishlistAction(product.id, selectedVariant?.id);
      setIsWishlisted(res.wishlisted);
    } catch (err) {
      console.error('Failed to toggle wishlist', err);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setIsAddingToCart(true);
    try {
      await addToCart({
        variantId: selectedVariant.id,
        type: optionType,
        quantity: optionType === 'RENTAL' ? 1 : quantity,
        rentStartDate: optionType === 'RENTAL' ? rentStartDate : undefined,
        rentEndDate: optionType === 'RENTAL' ? rentEndDate : undefined,
      });
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to add to cart', err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const formatIDR = (amount?: number | null) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-[3/4] w-full bg-neutral-100 overflow-hidden">
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
              unoptimized
              onError={() => setSelectedImage('/images/products/default-product.jpg')}
            />
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-20 aspect-[3/4] flex-shrink-0 bg-neutral-100 overflow-hidden border-2 transition-all ${
                    selectedImage === img ? 'border-black' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Thumbnail ${idx}`}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== '/images/products/default-product.jpg') {
                        target.src = '/images/products/default-product.jpg';
                      }
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Options */}
        <div className="space-y-8">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-neutral-400 font-sans block mb-1">
              {product.category || 'Ideal Beauty Couture'}
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl font-light text-neutral-900 leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Option Switcher: Purchase vs Rental */}
          <div className="border-y border-neutral-100 py-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2.5">
              {selectedVariant?.priceSale && (
                <button
                  onClick={() => setOptionType('SALE')}
                  className={`flex-1 py-3 px-4 text-xs uppercase tracking-widest border transition-all text-center ${
                    optionType === 'SALE'
                      ? 'border-black bg-black text-white'
                      : 'border-neutral-200 text-neutral-700 hover:border-black'
                  }`}
                >
                  <span>
                    {isSalePreOrder ? 'Pre-Order' : 'Purchase'} &bull; {formatIDR(selectedVariant.priceSale)}
                  </span>
                </button>
              )}

              {selectedVariant?.priceRent && (
                <button
                  onClick={() => {
                    setOptionType('RENTAL');
                    setQuantity(1);
                  }}
                  className={`flex-1 py-3 px-4 text-xs uppercase tracking-widest border transition-all text-center ${
                    optionType === 'RENTAL'
                      ? 'border-black bg-black text-white'
                      : 'border-neutral-200 text-neutral-700 hover:border-black'
                  }`}
                >
                  <span>Rent &bull; {formatIDR(selectedVariant.priceRent)}</span>
                </button>
              )}
            </div>

            {/* Pre-Order Banner when Pre-Order active */}
            {optionType === 'SALE' && isSalePreOrder && (
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-xs text-xs text-purple-900 space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-purple-800 uppercase tracking-wider text-[11px]">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-purple-700" />
                    <span>Pre-Order Item</span>
                  </div>
                  <span className="bg-purple-200/70 text-purple-900 px-2 py-0.5 rounded font-mono text-[10px]">
                    {getPreOrderDays(selectedVariant)} Days Lead Time
                  </span>
                </div>
                <p className="text-xs text-purple-950 font-medium">
                  Expected Arrival: <span className="font-semibold text-purple-900">{formatEstimatedArrival(getPreOrderDays(selectedVariant))}</span>
                </p>
                {selectedVariant.preOrderNote && (
                  <p className="text-[11px] text-purple-700 italic">{selectedVariant.preOrderNote}</p>
                )}
              </div>
            )}

            {/* Price Display */}
            <div className="pt-2 font-mono text-lg sm:text-xl text-neutral-900 font-light flex items-center flex-wrap gap-2">
              {optionType === 'SALE' ? (
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="text-xs sm:text-sm uppercase tracking-widest font-sans text-neutral-400">
                    {isSalePreOrder ? 'Pre-Order Price:' : 'Sale Price:'}
                  </span>
                  <span className="font-semibold">{formatIDR(selectedVariant?.priceSale)}</span>
                  {selectedVariant?.compareAtPrice && Number(selectedVariant.compareAtPrice) > Number(selectedVariant.priceSale) && (
                    <>
                      <span className="text-xs sm:text-sm text-neutral-400 line-through">
                        {formatIDR(selectedVariant.compareAtPrice)}
                      </span>
                      <span className="bg-red-600 text-white font-sans text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm">
                        -{Math.round(((Number(selectedVariant.compareAtPrice) - Number(selectedVariant.priceSale)) / Number(selectedVariant.compareAtPrice)) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="text-xs sm:text-sm uppercase tracking-widest font-sans text-neutral-400">Rental Rate:</span>
                  <span className="font-semibold">{formatIDR(selectedVariant?.priceRent)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Variant Selection (Size/Color) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="block text-xs uppercase tracking-widest text-neutral-700 font-medium">
                Select Variant / Size
              </label>
              <SizeChartModal category={product.category} productName={product.name} sizeChart={(product as any).sizeChart} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {product.variants.map((variant) => {
                const attrs = variant.attributes as any;
                const attrLabel = attrs ? `${attrs.size || ''} ${attrs.color ? `(${attrs.color})` : ''}` : variant.sku;
                const isSelected = variant.id === selectedVariantId;
                const vSaleStock = variant.stockSaleAvailable ?? variant.stockAvailable ?? 0;
                const vRentStock = variant.stockRentAvailable ?? variant.stockAvailable ?? 0;
                const vIsPreOrder = Boolean(variant.isPreOrder);

                let stockText = '';
                if (optionType === 'RENTAL') {
                  stockText = vRentStock > 0 ? `${vRentStock} for rent` : 'Unavailable';
                } else {
                  if (vSaleStock > 0) {
                    stockText = `${vSaleStock} in stock`;
                  } else if (vIsPreOrder) {
                    stockText = 'Pre-Order';
                  } else {
                    stockText = 'Sold out';
                  }
                }

                return (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`p-3 text-xs border text-center transition-all ${
                      isSelected
                        ? 'border-black bg-neutral-900 text-white font-medium'
                        : 'border-neutral-200 text-neutral-800 hover:border-black'
                    }`}
                  >
                    <div>{attrLabel}</div>
                    <div className="text-[10px] opacity-70 mt-1 font-mono">{stockText}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rental Date Selector (if RENTAL) */}
          {optionType === 'RENTAL' && (
            <RentalAvailabilityCalendar
              key={selectedVariant?.id}
              variantId={selectedVariant?.id || ''}
              dailyRate={selectedVariant?.priceRent}
              initialStartDate={rentStartDate}
              initialEndDate={rentEndDate}
              onSelectDates={(start, end, isValid) => {
                setRentStartDate(start);
                setRentEndDate(end);
                setIsRentalDatesValid(isValid);
              }}
            />
          )}

          {/* Quantity Selector */}
          <div className="flex items-center space-x-4">
            <span className="text-xs uppercase tracking-widest text-neutral-700">Quantity</span>
            <div className="flex items-center border border-neutral-300">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={optionType === 'RENTAL' || quantity <= 1}
                className={`px-3 py-2 text-sm ${
                  optionType === 'RENTAL' || quantity <= 1
                    ? 'text-neutral-300 cursor-not-allowed bg-neutral-50'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                -
              </button>
              <span className="px-4 py-2 text-xs font-mono">{optionType === 'RENTAL' ? 1 : quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                disabled={optionType === 'RENTAL'}
                className={`px-3 py-2 text-sm ${
                  optionType === 'RENTAL'
                    ? 'text-neutral-300 cursor-not-allowed bg-neutral-50'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                +
              </button>
            </div>
            {optionType === 'RENTAL' && (
              <span className="text-[11px] text-neutral-400 font-sans italic">
                (Quantity is always 1 for rental)
              </span>
            )}
          </div>

          {/* Add to Cart & Wishlist Buttons */}
          <div className="flex space-x-4 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={
                isAddingToCart ||
                !selectedVariant ||
                (optionType === 'SALE' && saleStock <= 0 && !isSalePreOrder) ||
                (optionType === 'RENTAL' && (rentStock <= 0 || !isRentalDatesValid || !rentStartDate || !rentEndDate))
              }
              className={`flex-1 py-4 text-xs uppercase tracking-[0.2em] font-light transition-all flex items-center justify-center space-x-2 ${
                addedSuccess
                  ? 'bg-emerald-700 text-white'
                  : selectedVariant &&
                    ((optionType === 'SALE' && (saleStock > 0 || isSalePreOrder)) ||
                      (optionType === 'RENTAL' && rentStock > 0 && isRentalDatesValid && rentStartDate && rentEndDate))
                  ? 'bg-black text-white hover:bg-neutral-800'
                  : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
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
                        ? 'Add To Cart (Purchase)'
                        : isSalePreOrder
                        ? 'Pre-Order Now'
                        : 'Out of Stock'
                      : rentStock > 0
                      ? 'Add To Cart (Rental)'
                      : 'Out of Stock'}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={handleWishlistToggle}
              disabled={isWishlistLoading}
              className="p-4 border border-neutral-300 hover:border-black transition-colors"
              aria-label="Wishlist"
            >
              <Heart
                className={`w-5 h-5 ${isWishlisted ? 'fill-red-600 text-red-600' : 'text-neutral-700'}`}
              />
            </button>
          </div>

          {/* Value Props / Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-neutral-100 text-xs text-neutral-600 font-light">
            <div className="flex items-start space-x-3">
              <Truck className="w-5 h-5 text-neutral-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-neutral-900">Complimentary Express Shipping</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Insured delivery across Indonesia.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-neutral-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-neutral-900">100% Authentic Luxury</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Directly from our Jakarta atelier.</p>
              </div>
            </div>
          </div>

          {/* Description & Details */}
          <div className="space-y-4 pt-6 border-t border-neutral-100 text-xs text-neutral-700 leading-relaxed font-light">
            <h3 className="uppercase tracking-widest text-neutral-900 font-medium">Atelier Description</h3>
            <p>{product.description || 'Handcrafted bespoke ensemble by Ideal Beauty Official.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
