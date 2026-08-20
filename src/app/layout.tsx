import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/components/cart/CartContext';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Ideal Beauty Official | Luxury Couture, Bridal & Rental Boutique',
  description: 'Bespoke South Asian & Indonesian haute couture, velvet kaftans, silk lehengas, and luxury rental fashion.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ideal Beauty',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-white text-neutral-900 selection:bg-black selection:text-white" suppressHydrationWarning>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
