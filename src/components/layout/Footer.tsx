'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-300 font-light border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {/* Brand Philosophy */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg tracking-[0.2em] uppercase text-white font-light">
              IDEAL BEAUTY
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Crafting bespoke luxury fashion, bridal lehengas, haute couture kaftans, and evening gowns inspired by South Asian craftsmanship and modern elegance.
            </p>
            <p className="text-[11px] text-neutral-500 font-mono">
              Jakarta &bull; Bali &bull; Worldwide Delivery
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs tracking-widest uppercase text-white font-medium">Collections</h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><Link href="/products?category=Haute+Couture" className="hover:text-white transition-colors">Haute Couture</Link></li>
              <li><Link href="/products?category=Bridal+Wear" className="hover:text-white transition-colors">Bridal Collection</Link></li>
              <li><Link href="/products?category=Ready+To+Wear" className="hover:text-white transition-colors">Ready To Wear</Link></li>
              <li><Link href="/products?category=Menswear" className="hover:text-white transition-colors">Menswear Sherwanis</Link></li>
              <li><Link href="/products?type=RENTAL" className="hover:text-white transition-colors">Luxury Rental Boutique</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="text-xs tracking-widest uppercase text-white font-medium">Customer Care</h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><Link href="/account/orders" className="hover:text-white transition-colors">Order Tracking</Link></li>
              <li><Link href="/account/wishlist" className="hover:text-white transition-colors">Saved Wishlist</Link></li>
              <li><span className="text-neutral-500">QRIS & Virtual Account Payment</span></li>
              <li><span className="text-neutral-500">Bespoke Fitting Appointment</span></li>
              <li><Link href="/admin/dashboard" className="text-neutral-500 hover:text-neutral-300">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="text-xs tracking-widest uppercase text-white font-medium">Privé Club</h4>
            <p className="text-xs text-neutral-400">
              Subscribe to receive private invitations to runway releases and bespoke trunk shows.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex">
              <input
                type="email"
                placeholder="Enter email address"
                className="bg-neutral-800 text-xs px-3 py-2 text-white border-none focus:outline-none w-full placeholder-neutral-500"
              />
              <button
                type="submit"
                className="bg-white text-black px-4 py-2 text-xs tracking-widest uppercase hover:bg-neutral-200 transition-colors"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center text-[11px] text-neutral-500">
          <p>&copy; {new Date().getFullYear()} Ideal Beauty Official. All Rights Reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0 font-sans uppercase tracking-wider text-[10px]">
            <span>QRIS Integrated</span>
            <span>Bank Virtual Account</span>
            <span>Midtrans Secured</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
