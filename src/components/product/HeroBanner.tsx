import React from 'react';
import Link from 'next/link';

export default function HeroBanner() {
  return (
    <section className="relative bg-neutral-900 text-white min-h-[60vh] sm:min-h-[75vh] flex items-center justify-center overflow-hidden">
      {/* High Fashion Background Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-105 transition-transform duration-1000"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=2000&auto=format&fit=crop")',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />

      <div className="relative z-10 max-w-4xl mx-auto text-center px-4 py-14 sm:py-20 space-y-4 sm:space-y-6">
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-neutral-300 font-sans">
          AUTUMN / WINTER HAUTE COUTURE 2026
        </span>
        <h1 className="font-serif text-3xl sm:text-6xl md:text-7xl font-light tracking-wide text-white leading-tight">
          Elegance Woven in Gold & Velvet
        </h1>
        <p className="text-neutral-300 font-light text-xs sm:text-base max-w-2xl mx-auto leading-relaxed">
          Discover hand-crafted bridal ensembles, imperial kaftans, and couture rentals for life’s grandest celebrations.
        </p>

        <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/products"
            className="w-full sm:w-auto bg-white text-black text-xs uppercase tracking-[0.2em] px-8 py-3.5 sm:py-4 font-light hover:bg-neutral-200 transition-colors text-center"
          >
            Explore Collections
          </Link>
          <Link
            href="/products?type=RENTAL"
            className="w-full sm:w-auto border border-white/60 text-white text-xs uppercase tracking-[0.2em] px-8 py-3.5 sm:py-4 font-light hover:bg-white hover:text-black transition-all text-center"
          >
            Rent Luxury Wear
          </Link>
        </div>
      </div>
    </section>
  );
}
