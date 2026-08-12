import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CartProvider } from '@/components/cart/CartContext';
import CartDrawer from '@/components/cart/CartDrawer';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Ideal Beauty Official | Luxury Couture, Bridal & Rental Boutique',
  description: 'Bespoke South Asian & Indonesian haute couture, velvet kaftans, silk lehengas, and luxury rental fashion.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-white text-neutral-900 selection:bg-black selection:text-white">
        <CartProvider>
          <AnnouncementBar />
          <Suspense fallback={<div className="h-20 border-b border-neutral-100 bg-white" />}>
            <Header />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
