'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface ProductBreadcrumbsProps {
  productName: string;
  category?: string | null;
  className?: string;
}

export default function ProductBreadcrumbs({
  productName,
  category,
  className = '',
}: ProductBreadcrumbsProps) {
  const items = [
    { label: 'Home', href: '/' },
    { label: 'Catalogue', href: '/products' },
    ...(category
      ? [
          {
            label: category,
            href: `/products?category=${encodeURIComponent(category)}`,
          },
        ]
      : []),
    { label: productName, href: null },
  ];

  return (
    <nav
      aria-label="Breadcrumb"
      className={`py-3 sm:py-4 text-xs font-light text-neutral-500 tracking-wider uppercase font-sans ${className}`}
    >
      <ol className="flex items-center flex-wrap gap-1.5 sm:gap-2">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <li key={idx} className="inline-flex items-center space-x-1.5 sm:space-x-2">
              {idx > 0 && (
                <ChevronRight className="w-3 h-3 text-neutral-300 flex-shrink-0" aria-hidden="true" />
              )}
              {isLast ? (
                <span
                  className="text-neutral-900 font-medium truncate max-w-[200px] sm:max-w-xs md:max-w-md"
                  aria-current="page"
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-neutral-900 transition-colors whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-neutral-500 whitespace-nowrap">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
