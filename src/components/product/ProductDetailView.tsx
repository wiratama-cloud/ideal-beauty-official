'use client';

import React from 'react';
import ProductBreadcrumbs from './detail/ProductBreadcrumbs';
import ProductGallery from './detail/ProductGallery';
import ProductActionSection from './detail/ProductActionSection';
import ProductAccordionDetails from './detail/ProductAccordionDetails';
import StickyMobileAction from './detail/StickyMobileAction';
import RelatedProductsSection from './detail/RelatedProductsSection';
import {
  useProductDetail,
  ProductDetailProduct,
  ProductDetailVariant,
} from './detail/useProductDetail';

export interface ProductDetailViewProps {
  product: ProductDetailProduct & {
    variants: ProductDetailVariant[];
  };
  isWishlistedInitial?: boolean;
  relatedProducts?: any[];
  wishlistedIds?: string[];
}

export default function ProductDetailView({
  product,
  isWishlistedInitial = false,
  relatedProducts = [],
  wishlistedIds = [],
}: ProductDetailViewProps) {
  const {
    // Images & Gallery
    images,
    selectedImageIndex,
    setSelectedImageIndex,

    // Variant
    selectedVariantId,
    selectedVariant,
    setSelectedVariantId,
    getVariantStockStatus,

    // Purchase mode & options
    optionType,
    setOptionType,
    hasSalePrice,
    hasRentalPrice,

    // Quantities & rental dates
    quantity,
    incrementQuantity,
    decrementQuantity,
    rentStartDate,
    rentEndDate,
    isRentalDatesValid,
    setRentalDates,

    // Computed stocks & statuses
    saleStock,
    rentStock,
    isSalePreOrder,
    isSoldOut,
    canAddToCart,

    // Pricing & Pre-order
    currentPrice,
    compareAtPrice,
    discountPercent,
    preOrderDays,
    estimatedArrival,

    // Cart & Wishlist actions
    isWishlisted,
    isWishlistLoading,
    isAddingToCart,
    addedSuccess,
    handleWishlistToggle,
    handleAddToCart,
  } = useProductDetail({ product, isWishlistedInitial });

  // Format selected variant label for mobile action bar
  const selectedVariantLabel = React.useMemo(() => {
    if (!selectedVariant) return '';
    const attrs = selectedVariant.attributes;
    if (attrs?.size && attrs?.color) {
      return `${attrs.size} / ${attrs.color}`;
    }
    if (attrs?.size) return String(attrs.size);
    if (attrs?.color) return String(attrs.color);
    return selectedVariant.sku || '';
  }, [selectedVariant]);

  const activeStockStatus = selectedVariant
    ? getVariantStockStatus(selectedVariant, optionType)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-24 sm:pb-16">
      {/* Luxury Breadcrumbs Navigation */}
      <ProductBreadcrumbs
        productName={product.name}
        category={product.category}
        className="mb-3 sm:mb-6"
      />

      {/* Mobile-only Product Header (Title & Category above image gallery on mobile) */}
      <div className="lg:hidden mb-4">
        <span className="text-xs uppercase tracking-[0.3em] text-neutral-400 font-sans block mb-1.5">
          {product.category || 'Ideal Beauty Couture'}
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-light text-neutral-900 leading-tight">
          {product.name}
        </h1>
      </div>

      {/* Main Layout: Gallery & Actions & Accordions */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-10 lg:gap-x-16 lg:gap-y-8 items-start">
        {/* 1. Interactive Media Gallery (Left top on desktop, first on mobile) */}
        <div className="order-1 lg:col-start-1 lg:row-start-1 w-full">
          <ProductGallery
            images={images}
            productName={product.name}
            selectedIndex={selectedImageIndex}
            onSelectIndex={setSelectedImageIndex}
          />
        </div>

        {/* 2. Product Info & Commerce Actions (Right column on desktop, second on mobile) */}
        <div className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24 w-full">
          <ProductActionSection
            product={product}
            selectedVariant={selectedVariant || undefined}
            selectedVariantId={selectedVariantId}
            setSelectedVariantId={setSelectedVariantId}
            optionType={optionType}
            setOptionType={setOptionType}
            hasSalePrice={hasSalePrice}
            hasRentalPrice={hasRentalPrice}
            isSalePreOrder={isSalePreOrder}
            preOrderDays={preOrderDays}
            estimatedArrival={estimatedArrival}
            currentPrice={currentPrice}
            compareAtPrice={compareAtPrice}
            discountPercent={discountPercent}
            saleStock={saleStock}
            rentStock={rentStock}
            quantity={quantity}
            incrementQuantity={incrementQuantity}
            decrementQuantity={decrementQuantity}
            rentStartDate={rentStartDate}
            rentEndDate={rentEndDate}
            isRentalDatesValid={isRentalDatesValid}
            setRentalDates={setRentalDates}
            canAddToCart={canAddToCart}
            isAddingToCart={isAddingToCart}
            addedSuccess={addedSuccess}
            handleAddToCart={handleAddToCart}
            isWishlisted={isWishlisted}
            isWishlistLoading={isWishlistLoading}
            handleWishlistToggle={handleWishlistToggle}
            getVariantStockStatus={getVariantStockStatus}
            mainCtaId="pdp-main-cta"
          />
        </div>

        {/* 3. Luxury Editorial Collapsible Accordions (Left bottom on desktop, third on mobile) */}
        <div className="order-3 lg:col-start-1 lg:row-start-2 w-full">
          <ProductAccordionDetails product={product} optionType={optionType} />
        </div>
      </div>

      {/* Complementary Curated Recommendations ("Complete the Look") */}
      {relatedProducts && relatedProducts.length > 0 && (
        <RelatedProductsSection
          products={relatedProducts}
          wishlistedIds={wishlistedIds}
          title="Complete The Look"
          subtitle="Curated complementary creations hand-selected by our atelier stylists."
        />
      )}

      {/* Sticky Mobile Action Bar (shows on mobile when main CTA scrolls past) */}
      <StickyMobileAction
        productName={product.name}
        thumbnail={images[0]}
        selectedVariantLabel={selectedVariantLabel}
        stockBadgeText={activeStockStatus?.badgeText}
        optionType={optionType}
        currentPrice={currentPrice}
        compareAtPrice={compareAtPrice}
        isSalePreOrder={isSalePreOrder}
        isSoldOut={isSoldOut}
        canAddToCart={canAddToCart}
        isAddingToCart={isAddingToCart}
        addedSuccess={addedSuccess}
        onAddToCart={handleAddToCart}
        targetTriggerId="pdp-main-cta"
      />
    </div>
  );
}
