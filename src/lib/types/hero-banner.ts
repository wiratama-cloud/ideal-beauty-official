export interface HeroBannerData {
  tagline: string;
  title: string;
  description: string;
  imageUrl?: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  isActive: boolean;
}

export const DEFAULT_HERO_BANNER: HeroBannerData = {
  tagline: 'AUTUMN / WINTER HAUTE COUTURE 2026',
  title: 'Elegance Woven in Gold & Velvet',
  description: 'Discover hand-crafted bridal ensembles, imperial kaftans, and couture rentals for life’s grandest celebrations.',
  imageUrl: '/images/hero/hero-banner.jpg',
  primaryCtaLabel: 'Explore Collections',
  primaryCtaUrl: '/products',
  secondaryCtaLabel: 'Rent Luxury Wear',
  secondaryCtaUrl: '/products?type=RENTAL',
  isActive: true,
};
