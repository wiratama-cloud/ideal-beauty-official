import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/components/cart/CartContext';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Ideal Beauty Official | Luxury Couture, Bridal & Rental Boutique',
  description: 'Bespoke South Asian & Indonesian haute couture, velvet kaftans, silk lehengas, and luxury rental fashion.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ideal Beauty',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans bg-white text-neutral-900 selection:bg-black selection:text-white" suppressHydrationWarning>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
