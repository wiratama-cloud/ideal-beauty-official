export interface NavCategoryItem {
  id: string;
  name: string;
  href: string;
  displayOrder: number;
  isActive: boolean;
  parentId?: string | null;
  imageUrl?: string | null;
  children?: NavCategoryItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export const DEFAULT_NAV_CATEGORIES = [
  { name: 'All Collections', href: '/products', displayOrder: 0, isActive: true },
  { name: 'Women', href: '/products?category=Women', displayOrder: 1, isActive: true, imageUrl: '/images/sections/brand-silk.jpg' },
  { name: 'Men', href: '/products?category=Men', displayOrder: 2, isActive: true, imageUrl: '/images/sections/brand-groom.jpg' },
  { name: 'Jewelry & Accessories', href: '/products?category=Accessories', displayOrder: 3, isActive: true, imageUrl: '/images/products/veil-1.jpg' },
  { name: 'Rentals', href: '/products?type=RENTAL', displayOrder: 4, isActive: true },
];

export interface CategoryTreeSpecItem {
  name: string;
  href: string;
  displayOrder: number;
  isActive: boolean;
  imageUrl?: string;
  children?: CategoryTreeSpecItem[];
}
