import React from 'react';
import Link from 'next/link';
import { HeroBannerData, DEFAULT_HERO_BANNER } from '@/lib/types/hero-banner';
import { getOptimizedImageUrl } from '@/lib/utils/image-url';

interface HeroBannerProps {
  data?: HeroBannerData | null;
}

export default function HeroBanner({ data }: HeroBannerProps) {
  const banner = data || DEFAULT_HERO_BANNER;

  if (banner.isActive === false) {
    return null;
  }

  const rawImage =
    banner.imageUrl && banner.imageUrl.trim().length > 0
      ? banner.imageUrl
      : DEFAULT_HERO_BANNER.imageUrl;
  const bgImage = getOptimizedImageUrl(rawImage, 1024, '/images/hero/hero-banner.jpg');

  return (
    <section className="relative bg-neutral-950 text-white min-h-[60vh] sm:min-h-[75vh] flex items-center justify-center overflow-hidden">
      {/* High Fashion Background Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-50 scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `url(${bgImage})`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />

      <div className="relative z-10 max-w-4xl mx-auto text-center px-4 py-14 sm:py-20 space-y-4 sm:space-y-6">
        {banner.tagline && (
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-neutral-300 font-sans block">
            {banner.tagline}
          </span>
        )}
        {banner.title && (
          <h1 className="font-serif text-3xl sm:text-6xl md:text-7xl font-light tracking-wide text-white leading-tight">
            {banner.title}
          </h1>
        )}
        {banner.description && (
          <p className="text-neutral-300 font-light text-xs sm:text-base max-w-2xl mx-auto leading-relaxed">
            {banner.description}
          </p>
        )}

        <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          {banner.primaryCtaLabel && (
            <Link
              href={banner.primaryCtaUrl || '/products'}
              className="w-full sm:w-auto bg-white text-black text-xs uppercase tracking-[0.2em] px-8 py-3.5 sm:py-4 font-light hover:bg-neutral-200 transition-colors text-center"
            >
              {banner.primaryCtaLabel}
            </Link>
          )}
          {banner.secondaryCtaLabel && (
            <Link
              href={banner.secondaryCtaUrl || '/products?type=RENTAL'}
              className="w-full sm:w-auto border border-white/60 text-white text-xs uppercase tracking-[0.2em] px-8 py-3.5 sm:py-4 font-light hover:bg-white hover:text-black transition-all text-center"
            >
              {banner.secondaryCtaLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
