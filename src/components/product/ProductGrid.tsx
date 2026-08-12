import React from 'react';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Array<{
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
  }>;
  wishlistedIds?: string[];
}

export default function ProductGrid({ products, wishlistedIds = [] }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-20 text-center space-y-4 bg-white border border-neutral-100 p-8">
        <h3 className="font-serif text-xl text-neutral-800">No Masterpieces Found</h3>
        <p className="text-xs text-neutral-500 font-light max-w-md mx-auto">
          We couldn&apos;t find any luxury pieces matching your exact criteria. Try adjusting your filters or search terms.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isWishlistedInitial={wishlistedIds.includes(product.id)}
        />
      ))}
    </div>
  );
}
