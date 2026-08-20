// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TopFilterBar from '../src/components/product/TopFilterBar';
import MobileFilterDrawer from '../src/components/product/MobileFilterDrawer';
import ProductGrid from '../src/components/product/ProductGrid';
import type { NavCategoryItem } from '../src/lib/types/nav-category';

// Mock next/navigation
const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key),
    getAll: (key: string) => mockSearchParams.getAll(key),
    has: (key: string) => mockSearchParams.has(key),
    toString: () => mockSearchParams.toString(),
  }),
  usePathname: () => '/products',
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt || ''} {...props} />;
  },
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

// Mock toggleWishlistAction
vi.mock('@/app/actions/wishlist', () => ({
  toggleWishlistAction: vi.fn().mockResolvedValue({ wishlisted: true }),
}));

describe('PLP React Components Suite', () => {
  const sampleCategories: NavCategoryItem[] = [
    {
      id: 'cat-1',
      name: 'Lehengas',
      href: '/products?category=Lehengas',
      parentId: null,
      displayOrder: 0,
      isActive: true,
      children: [
        {
          id: 'cat-1-1',
          name: 'Bridal Lehengas',
          href: '/products?category=Bridal%20Lehengas',
          parentId: 'cat-1',
          displayOrder: 0,
          isActive: true,
          children: [],
        },
      ],
    },
    {
      id: 'cat-2',
      name: 'Sarees',
      href: '/products?category=Sarees',
      parentId: null,
      displayOrder: 1,
      isActive: true,
      children: [],
    },
  ];

  const sampleProducts = [
    {
      id: 'prod-1',
      name: 'Royal Crimson Velvet Lehenga',
      slug: 'royal-crimson-velvet-lehenga',
      category: 'Lehengas',
      images: ['/images/products/lehenga-1.jpg'],
      variants: [
        {
          id: 'var-1',
          priceSale: 15000000,
          priceRent: 3500000,
          compareAtPrice: 18000000,
          stockAvailable: 2,
        },
      ],
    },
    {
      id: 'prod-2',
      name: 'Emerald Silk Embroidered Saree',
      slug: 'emerald-silk-embroidered-saree',
      category: 'Sarees',
      images: ['/images/products/saree-1.jpg'],
      variants: [
        {
          id: 'var-2',
          priceSale: 8500000,
          priceRent: 1800000,
          stockAvailable: 5,
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  /* -------------------------------------------------------------------------- */
  /* TopFilterBar Component Tests                                               */
  /* -------------------------------------------------------------------------- */
  describe('TopFilterBar', () => {
    it('renders total count and search input', () => {
      render(<TopFilterBar totalResults={12} categoriesTree={sampleCategories} />);

      expect(screen.getByText(/12 Pieces Found/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/search pieces, fabrics\.\.\./i)).toBeDefined();
    });

    it('submits text search and pushes to router with query param', () => {
      render(<TopFilterBar totalResults={12} categoriesTree={sampleCategories} />);

      const searchInput = screen.getByPlaceholderText(/search pieces, fabrics\.\.\./i);
      fireEvent.change(searchInput, { target: { value: 'Velvet' } });

      const searchForm = searchInput.closest('form');
      expect(searchForm).toBeDefined();
      fireEvent.submit(searchForm!);

      expect(mockPush).toHaveBeenCalledWith('/products?query=Velvet');
    });

    it('changes sorting option and updates query params', () => {
      render(<TopFilterBar totalResults={12} categoriesTree={sampleCategories} />);

      const sortSelect = screen.getByRole('combobox');
      fireEvent.change(sortSelect, { target: { value: 'price-asc' } });

      expect(mockPush).toHaveBeenCalledWith('/products?sort=price-asc');
    });

    it('toggles acquisition mode between All, Purchase, and Rental', () => {
      render(<TopFilterBar totalResults={12} categoriesTree={sampleCategories} />);

      const rentalButton = screen.getByRole('button', { name: /^Rental$/i });
      fireEvent.click(rentalButton);

      expect(mockPush).toHaveBeenCalledWith('/products?type=RENTAL');
    });

    it('applies price range filters when form is submitted', () => {
      render(<TopFilterBar totalResults={12} categoriesTree={sampleCategories} />);

      const minPriceInput = screen.getByPlaceholderText('Min');
      const maxPriceInput = screen.getByPlaceholderText('Max');

      fireEvent.change(minPriceInput, { target: { value: '1000000' } });
      fireEvent.change(maxPriceInput, { target: { value: '5000000' } });

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      fireEvent.click(applyButton);

      expect(mockPush).toHaveBeenCalledWith('/products?minPrice=1000000&maxPrice=5000000');
    });

    it('toggles in-stock only filter', () => {
      render(<TopFilterBar totalResults={12} categoriesTree={sampleCategories} />);

      const inStockButton = screen.getByRole('button', { name: /in-stock only/i });
      fireEvent.click(inStockButton);

      expect(mockPush).toHaveBeenCalledWith('/products?inStock=true');
    });

    it('renders active filter chips and allows clearing individual filters or all', () => {
      mockSearchParams = new URLSearchParams('category=Lehengas&type=SALE&minPrice=1000000&inStock=true&sort=price-desc');
      render(<TopFilterBar totalResults={5} categoriesTree={sampleCategories} />);

      expect(screen.getAllByText('Lehengas').length).toBeGreaterThan(0);
      expect(screen.getByText('Purchase Only')).toBeDefined();
      expect(screen.getAllByText('In-Stock Only').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Price: High to Low').length).toBeGreaterThan(0);

      // Remove category chip
      const removeCategoryBtn = screen.getByLabelText('Remove category filter');
      fireEvent.click(removeCategoryBtn);
      expect(mockPush).toHaveBeenCalledWith(
        expect.not.stringContaining('category=Lehengas')
      );

      // Clear all filters
      const clearAllButton = screen.getByRole('button', { name: /reset filters/i });
      fireEvent.click(clearAllButton);
      expect(mockPush).toHaveBeenCalledWith('/products');
    });

    it('opens mobile filter drawer when mobile filter button is clicked', () => {
      render(<TopFilterBar totalResults={12} categoriesTree={sampleCategories} />);

      const mobileFilterButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(mobileFilterButton);

      // Drawer title should now be visible
      expect(screen.getByText('Refine Catalogue')).toBeDefined();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* MobileFilterDrawer Component Tests                                         */
  /* -------------------------------------------------------------------------- */
  describe('MobileFilterDrawer', () => {
    it('does not render when isOpen is false', () => {
      const onClose = vi.fn();
      render(
        <MobileFilterDrawer
          isOpen={false}
          onClose={onClose}
          totalResults={10}
          categoriesTree={sampleCategories}
        />
      );

      expect(screen.queryByText('Refine Catalogue')).toBeNull();
    });

    it('renders drawer with category tree, price, sort, and handles apply', () => {
      const onClose = vi.fn();
      render(
        <MobileFilterDrawer
          isOpen={true}
          onClose={onClose}
          totalResults={10}
          categoriesTree={sampleCategories}
        />
      );

      expect(screen.getByText('Refine Catalogue')).toBeDefined();
      expect(screen.getByText('Lehengas')).toBeDefined();
      expect(screen.getByText('Sarees')).toBeDefined();

      // Select category
      const sareeButton = screen.getByRole('button', { name: /^Sarees/i });
      fireEvent.click(sareeButton);

      // Select type Rental
      const rentalButton = screen.getByRole('button', { name: /bespoke rental/i });
      fireEvent.click(rentalButton);

      // Set sort
      const sortDescButton = screen.getByRole('button', { name: /price: high to low/i });
      fireEvent.click(sortDescButton);

      // Click apply
      const applyButton = screen.getByRole('button', { name: /apply filters/i });
      fireEvent.click(applyButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('category=Sarees')
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('type=RENTAL')
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('sort=price-desc')
      );
      expect(onClose).toHaveBeenCalled();
    });

    it('resets all draft filters when Reset All is clicked', () => {
      mockSearchParams = new URLSearchParams('category=Lehengas&type=SALE&minPrice=500000');
      const onClose = vi.fn();
      render(
        <MobileFilterDrawer
          isOpen={true}
          onClose={onClose}
          totalResults={5}
          categoriesTree={sampleCategories}
        />
      );

      const resetButton = screen.getByRole('button', { name: /reset all/i });
      fireEvent.click(resetButton);

      expect(mockPush).toHaveBeenCalledWith('/products');
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when close button is clicked or Escape key is pressed', () => {
      const onClose = vi.fn();
      render(
        <MobileFilterDrawer
          isOpen={true}
          onClose={onClose}
          totalResults={10}
          categoriesTree={sampleCategories}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close filter drawer/i });
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(2);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* ProductGrid Component Tests                                               */
  /* -------------------------------------------------------------------------- */
  describe('ProductGrid', () => {
    it('renders luxury empty state when products list is empty', () => {
      render(<ProductGrid products={[]} />);

      expect(screen.getByText('No Masterpieces Found')).toBeDefined();
      expect(screen.getByText('Reset Search & Filters')).toBeDefined();
      expect(screen.getByText('Lehengas')).toBeDefined();
      expect(screen.getByText('Rentals')).toBeDefined();
    });

    it('renders products and density switcher buttons', () => {
      const { container } = render(<ProductGrid products={sampleProducts} />);

      expect(screen.getByText('Royal Crimson Velvet Lehenga')).toBeDefined();
      expect(screen.getByText('Emerald Silk Embroidered Saree')).toBeDefined();

      const editorialBtn = screen.getByRole('button', { name: /editorial 2-column view/i });
      const compactBtn = screen.getByRole('button', { name: /compact multi-column grid/i });

      expect(editorialBtn).toBeDefined();
      expect(compactBtn).toBeDefined();

      // Click editorial button
      fireEvent.click(editorialBtn);
      expect(localStorage.getItem('ideal_beauty_grid_density')).toBe('editorial');

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer?.className).toContain('grid-cols-1 sm:grid-cols-2 lg:grid-cols-2');

      // Click compact button
      fireEvent.click(compactBtn);
      expect(localStorage.getItem('ideal_beauty_grid_density')).toBe('compact');
      expect(gridContainer?.className).toContain('grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4');
    });

    it('initializes density preference from localStorage', () => {
      localStorage.setItem('ideal_beauty_grid_density', 'editorial');
      const { container } = render(<ProductGrid products={sampleProducts} />);

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer?.className).toContain('grid-cols-1 sm:grid-cols-2 lg:grid-cols-2');
    });

    it('hides density switcher when showDensitySwitcher is false', () => {
      render(<ProductGrid products={sampleProducts} showDensitySwitcher={false} />);

      expect(screen.queryByRole('button', { name: /editorial 2-column view/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /compact multi-column grid/i })).toBeNull();
    });
  });
});
