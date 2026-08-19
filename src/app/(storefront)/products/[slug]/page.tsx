import React from 'react';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/services/product';
import { getWishlistedProductIds } from '@/lib/services/wishlist';
import { getLoggedInUserId } from '@/lib/session';
import ProductDetailView from '@/components/product/ProductDetailView';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [product, userId] = await Promise.all([
    getProductBySlug(slug),
    getLoggedInUserId(),
  ]);

  if (!product) {
    notFound();
  }

  const wishlistedIds = await getWishlistedProductIds(userId);
  const isWishlisted = wishlistedIds.includes(product.id);

  return (
    <div className="bg-white min-h-screen">
      <ProductDetailView product={product} isWishlistedInitial={isWishlisted} />
    </div>
  );
}
