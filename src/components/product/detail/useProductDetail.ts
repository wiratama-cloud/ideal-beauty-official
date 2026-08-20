'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCart } from '@/components/cart/CartContext';
import { toggleWishlistAction } from '@/app/actions/wishlist';
import { getPreOrderDays, formatEstimatedArrival } from '@/lib/utils/preorder';
import {
  formatIDR,
  calculateDiscountPercent,
  getVariantStockStatus as resolveVariantStockStatus,
  isVariantSoldOut,
  canAddToCartValidation,
  VariantStockBadgeType,
  VariantStockStatus,
  StockVariantInput,
} from '@/lib/utils/product-stock';

export type { VariantStockBadgeType, VariantStockStatus, StockVariantInput };
export { formatIDR, calculateDiscountPercent };

export interface ProductDetailVariant {
  id: string;
  sku: string;
  skuSale?: string | null;
  skuRent?: string | null;
  isPreOrder?: boolean | null;
  preOrderShipDate?: Date | string | null;
  preOrderDays?: number | null;
  preOrderNote?: string | null;
  attributes: Record<string, any> | any;
  priceSale: number | string | null;
  priceRent: number | string | null;
  compareAtPrice?: number | string | null;
  stockAvailable: number;
  stockSaleAvailable?: number;
  stockRentAvailable?: number;
}

export interface ProductDetailProduct {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  images: string[];
  variants: ProductDetailVariant[];
  sizeChart?: any;
}

export interface UseProductDetailOptions {
  product: ProductDetailProduct;
  isWishlistedInitial?: boolean;
}

export function useProductDetail({ product, isWishlistedInitial = false }: UseProductDetailOptions) {
  const { addToCart } = useCart();

  const productImages = useMemo(() => {
    return product?.images && product.images.length > 0
      ? product.images
      : ['/images/products/default-product.jpg'];
  }, [product?.images]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const selectedImage = productImages[selectedImageIndex] || productImages[0];

  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
    return product?.variants?.[0]?.id || '';
  });

  const selectedVariant = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    return product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  }, [product?.variants, selectedVariantId]);

  const [optionType, setOptionType] = useState<'SALE' | 'RENTAL'>(() => {
    const firstVariant = product?.variants?.[0];
    if (firstVariant && !firstVariant.priceSale && firstVariant.priceRent) {
      return 'RENTAL';
    }
    return 'SALE';
  });

  const [quantity, setQuantity] = useState(1);

  // Rental date defaults (today and 3 days later)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const defaultReturnStr = useMemo(
    () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    []
  );

  const [rentStartDate, setRentStartDate] = useState(todayStr);
  const [rentEndDate, setRentEndDate] = useState(defaultReturnStr);
  const [isRentalDatesValid, setIsRentalDatesValid] = useState(true);

  const [isWishlisted, setIsWishlisted] = useState(isWishlistedInitial);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Sync initial wishlisted state if prop changes
  useEffect(() => {
    setIsWishlisted(isWishlistedInitial);
  }, [isWishlistedInitial]);

  // Adjust optionType if the currently selected variant only supports Sale or Rental
  useEffect(() => {
    if (!selectedVariant) return;
    const hasSale = selectedVariant.priceSale !== null && selectedVariant.priceSale !== undefined;
    const hasRent = selectedVariant.priceRent !== null && selectedVariant.priceRent !== undefined;

    if (optionType === 'SALE' && !hasSale && hasRent) {
      setOptionType('RENTAL');
      setQuantity(1);
    } else if (optionType === 'RENTAL' && !hasRent && hasSale) {
      setOptionType('SALE');
    }
  }, [selectedVariant, optionType]);

  // Force quantity to 1 when in RENTAL mode
  useEffect(() => {
    if (optionType === 'RENTAL') {
      setQuantity(1);
    }
  }, [optionType]);

  // Stock calculations
  const saleStock = selectedVariant?.stockSaleAvailable ?? selectedVariant?.stockAvailable ?? 0;
  const rentStock = selectedVariant?.stockRentAvailable ?? selectedVariant?.stockAvailable ?? 0;
  const isPreOrderActive = Boolean(selectedVariant?.isPreOrder);
  const isSalePreOrder = saleStock <= 0 && isPreOrderActive;

  const isSoldOut = useMemo(() => {
    return isVariantSoldOut(selectedVariant, optionType);
  }, [selectedVariant, optionType]);

  // Pricing calculations
  const currentPrice = useMemo(() => {
    if (!selectedVariant) return null;
    const raw = optionType === 'RENTAL' ? selectedVariant.priceRent : selectedVariant.priceSale;
    return raw !== null && raw !== undefined ? Number(raw) : null;
  }, [selectedVariant, optionType]);

  const compareAtPrice = useMemo(() => {
    if (!selectedVariant || optionType !== 'SALE') return null;
    const raw = selectedVariant.compareAtPrice;
    return raw !== null && raw !== undefined ? Number(raw) : null;
  }, [selectedVariant, optionType]);

  const discountPercent = useMemo(() => {
    return calculateDiscountPercent(compareAtPrice, currentPrice);
  }, [compareAtPrice, currentPrice]);

  // Pre-order calculations
  const preOrderDays = useMemo(() => getPreOrderDays(selectedVariant), [selectedVariant]);
  const estimatedArrival = useMemo(() => formatEstimatedArrival(preOrderDays), [preOrderDays]);

  // Check whether adding to cart is currently permitted
  const canAddToCart = useMemo(() => {
    return canAddToCartValidation({
      variant: selectedVariant,
      optionType,
      isAddingToCart,
      rentStartDate,
      rentEndDate,
      isRentalDatesValid,
    });
  }, [
    isAddingToCart,
    selectedVariant,
    optionType,
    isRentalDatesValid,
    rentStartDate,
    rentEndDate,
  ]);

  // Quantity controls
  const incrementQuantity = useCallback(() => {
    if (optionType === 'RENTAL') return;
    const maxStock = !isSalePreOrder && saleStock > 0 ? saleStock : 99;
    setQuantity((prev) => Math.min(maxStock, prev + 1));
  }, [optionType, isSalePreOrder, saleStock]);

  const decrementQuantity = useCallback(() => {
    if (optionType === 'RENTAL') return;
    setQuantity((prev) => Math.max(1, prev - 1));
  }, [optionType]);

  const setRentalDates = useCallback((start: string, end: string, isValid: boolean) => {
    setRentStartDate(start);
    setRentEndDate(end);
    setIsRentalDatesValid(isValid);
  }, []);

  const setSelectedImage = useCallback(
    (imgUrl: string) => {
      const idx = productImages.indexOf(imgUrl);
      if (idx !== -1) {
        setSelectedImageIndex(idx);
      } else {
        setSelectedImageIndex(0);
      }
    },
    [productImages]
  );

  // Helper function to get badge/status for a variant
  const getVariantStockStatus = useCallback(
    (variant: ProductDetailVariant, mode: 'SALE' | 'RENTAL' = optionType): VariantStockStatus => {
      return resolveVariantStockStatus(variant, mode);
    },
    [optionType]
  );

  const handleWishlistToggle = useCallback(async () => {
    if (isWishlistLoading || !product?.id) return;
    setIsWishlistLoading(true);
    try {
      const res = await toggleWishlistAction(product.id, selectedVariant?.id);
      setIsWishlisted(res.wishlisted);
    } catch (err) {
      console.error('Failed to toggle wishlist', err);
    } finally {
      setIsWishlistLoading(false);
    }
  }, [isWishlistLoading, product?.id, selectedVariant?.id]);

  const handleAddToCart = useCallback(async (): Promise<boolean> => {
    if (!canAddToCart || !selectedVariant) return false;
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
      return true;
    } catch (err) {
      console.error('Failed to add to cart', err);
      return false;
    } finally {
      setIsAddingToCart(false);
    }
  }, [
    canAddToCart,
    selectedVariant,
    addToCart,
    optionType,
    quantity,
    rentStartDate,
    rentEndDate,
  ]);

  return {
    // Media & images
    images: productImages,
    selectedImageIndex,
    selectedImage,
    setSelectedImageIndex,
    setSelectedImage,

    // Variant selection
    selectedVariantId,
    selectedVariant,
    setSelectedVariantId,
    getVariantStockStatus,

    // Purchase mode & options
    optionType,
    setOptionType,
    hasSalePrice: Boolean(selectedVariant?.priceSale),
    hasRentalPrice: Boolean(selectedVariant?.priceRent),

    // Quantities & dates
    quantity,
    setQuantity,
    incrementQuantity,
    decrementQuantity,
    rentStartDate,
    rentEndDate,
    isRentalDatesValid,
    setRentalDates,

    // Computed stock & statuses
    saleStock,
    rentStock,
    isPreOrderActive,
    isSalePreOrder,
    isSoldOut,
    canAddToCart,

    // Pricing & Pre-order
    currentPrice,
    compareAtPrice,
    discountPercent,
    preOrderDays,
    estimatedArrival,
    formatIDR,

    // Cart & Wishlist actions
    isWishlisted,
    isWishlistLoading,
    isAddingToCart,
    addedSuccess,
    handleWishlistToggle,
    handleAddToCart,
  };
}
