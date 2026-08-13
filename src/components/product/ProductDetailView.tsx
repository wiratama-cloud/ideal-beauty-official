'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, ShoppingBag, Calendar, Check, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../cart/CartContext';
import { toggleWishlistAction } from '@/app/actions/wishlist';

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
      attributes: any;
      priceSale: any;
      priceRent: any;
      compareAtPrice?: any;
      stockAvailable: number;
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

  const [isWishlisted, setIsWishlisted] = useState(isWishlistedInitial);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  // Auto adjust optionType if selected variant does not support current optionType
  React.useEffect(() => {
    if (!selectedVariant) return;
    if (optionType === 'SALE' && !selectedVariant.priceSale && selectedVariant.priceRent) {
      setOptionType('RENTAL');
    } else if (optionType === 'RENTAL' && !selectedVariant.priceRent && selectedVariant.priceSale) {
      setOptionType('SALE');
    }
  }, [selectedVariantId, selectedVariant, optionType]);

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
        quantity,
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
                  <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover" unoptimized />
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
                  <span>Purchase &bull; {formatIDR(selectedVariant.priceSale)}</span>
                </button>
              )}

              {selectedVariant?.priceRent && (
                <button
                  onClick={() => setOptionType('RENTAL')}
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

            {/* Price Display */}
            <div className="pt-2 font-mono text-lg sm:text-xl text-neutral-900 font-light flex items-center flex-wrap gap-2">
              {optionType === 'SALE' ? (
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="text-xs sm:text-sm uppercase tracking-widest font-sans text-neutral-400">Sale Price:</span>
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
            <label className="block text-xs uppercase tracking-widest text-neutral-700 font-medium">
              Select Variant / Size
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {product.variants.map((variant) => {
                const attrs = variant.attributes as any;
                const attrLabel = attrs ? `${attrs.size || ''} ${attrs.color ? `(${attrs.color})` : ''}` : variant.sku;
                const isSelected = variant.id === selectedVariantId;

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
                    <div className="text-[10px] opacity-70 mt-1 font-mono">
                      {variant.stockAvailable > 0 ? `${variant.stockAvailable} in stock` : 'Sold out'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rental Date Selector (if RENTAL) */}
          {optionType === 'RENTAL' && (
            <div className="bg-neutral-50 p-4 border border-neutral-200 space-y-4">
              <div className="flex items-center space-x-2 text-xs uppercase tracking-widest font-medium text-neutral-800">
                <Calendar className="w-4 h-4 text-neutral-600" />
                <span>Specify Rental Period</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                <div>
                  <label className="block text-neutral-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={rentStartDate}
                    min={todayStr}
                    onChange={(e) => setRentStartDate(e.target.value)}
                    className="w-full bg-white border border-neutral-300 p-2 text-neutral-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Return Date</label>
                  <input
                    type="date"
                    value={rentEndDate}
                    min={rentStartDate}
                    onChange={(e) => setRentEndDate(e.target.value)}
                    className="w-full bg-white border border-neutral-300 p-2 text-neutral-800 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center space-x-4">
            <span className="text-xs uppercase tracking-widest text-neutral-700">Quantity</span>
            <div className="flex items-center border border-neutral-300">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 text-sm"
              >
                -
              </button>
              <span className="px-4 py-2 text-xs font-mono">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart & Wishlist Buttons */}
          <div className="flex space-x-4 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || !selectedVariant || selectedVariant.stockAvailable <= 0}
              className={`flex-1 py-4 text-xs uppercase tracking-[0.2em] font-light transition-all flex items-center justify-center space-x-2 ${
                addedSuccess
                  ? 'bg-emerald-700 text-white'
                  : selectedVariant && selectedVariant.stockAvailable > 0
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
                    {selectedVariant && selectedVariant.stockAvailable > 0
                      ? `Add To Cart (${optionType})`
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
