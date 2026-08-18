import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/utils/image-url';

interface FeaturedBrandsSectionProps {
  section: {
    id: string;
    title: string;
    subtitle?: string | null;
    viewAllUrl?: string | null;
    items: any[];
  };
}

export default function FeaturedBrandsSection({ section }: FeaturedBrandsSectionProps) {
  if (!section.items || section.items.length === 0) return null;

  return (
    <section className="bg-neutral-900 text-white py-16 px-4 sm:px-6 lg:px-8 my-12">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-medium block">
            LUXURY HOUSES
          </span>
          <h2 className="text-3xl sm:text-4xl font-light font-serif tracking-wide">
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="text-neutral-400 text-xs sm:text-sm font-light max-w-xl mx-auto">
              {section.subtitle}
            </p>
          )}
          <div className="w-12 h-px bg-neutral-700 mx-auto mt-4" />
        </div>

        {/* Brand Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {section.items.map((item) => {
            const image = getOptimizedImageUrl(
              item.imageUrl,
              512,
              '/images/sections/brand-atelier.jpg'
            );
            const link = item.linkUrl || section.viewAllUrl || '/products';

            return (
              <Link
                key={item.id}
                href={link}
                className="group relative block aspect-[4/5] overflow-hidden bg-neutral-800 rounded-sm shadow-lg border border-neutral-800 hover:border-neutral-600 transition-all"
              >
                {/* Background Image */}
                <Image
                  src={image}
                  alt={item.title || 'Brand image'}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-70 group-hover:opacity-90"
                  unoptimized
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6 space-y-2">
                  <span className="text-[9px] uppercase tracking-[0.25em] text-amber-400 font-medium block">
                    ATELIER BRAND
                  </span>
                  <h3 className="text-xl font-serif text-white font-medium group-hover:text-amber-200 transition-colors">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="text-neutral-300 text-xs font-light line-clamp-1">
                      {item.subtitle}
                    </p>
                  )}
                  <div className="pt-2 flex items-center space-x-1.5 text-[10px] uppercase tracking-widest text-white/80 group-hover:text-white font-medium">
                    <span>Explore House</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
