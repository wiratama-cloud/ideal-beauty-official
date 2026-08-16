import { describe, it, expect } from 'vitest';
import { getMobilePills, filterCategoryTree, Level1Category } from '../src/components/product/CategoryTreeSidebar';

describe('Category Tree Mobile Pills Logic', () => {
  it('should generate pills array containing L1 and top L2 categories without duplicates using exported getMobilePills', () => {
    const sampleLevel1Categories: Level1Category[] = [
      {
        item: {
          id: 'cat-1',
          name: 'Women',
          href: '/products?category=Women',
          displayOrder: 1,
          isActive: true,
          children: [],
        },
        l2Children: [
          {
            item: {
              id: 'cat-1-1',
              name: 'Bridal Wear',
              href: '/products?category=Bridal+Wear',
              displayOrder: 1,
              isActive: true,
              children: [],
            },
            l3Children: [],
          },
          {
            item: {
              id: 'cat-1-2',
              name: 'Haute Couture',
              href: '/products?category=Haute+Couture',
              displayOrder: 2,
              isActive: true,
              children: [],
            },
            l3Children: [],
          },
        ],
      },
      {
        item: {
          id: 'cat-2',
          name: 'Men',
          href: '/products?category=Men',
          displayOrder: 2,
          isActive: true,
          children: [],
        },
        l2Children: [
          {
            item: {
              id: 'cat-2-1',
              name: 'Women', // Duplicate name across L2 to test case-insensitive deduplication
              href: '/products?category=Women',
              displayOrder: 1,
              isActive: true,
              children: [],
            },
            l3Children: [],
          },
        ],
      },
    ];

    const pills = getMobilePills(sampleLevel1Categories);

    expect(pills).toEqual([
      { name: 'Women', href: '/products?category=Women' },
      { name: 'Bridal Wear', href: '/products?category=Bridal+Wear' },
      { name: 'Haute Couture', href: '/products?category=Haute+Couture' },
      { name: 'Men', href: '/products?category=Men' },
    ]);
  });

  it('should filter category tree by search query in real-time', () => {
    const sampleLevel1Categories: Level1Category[] = [
      {
        item: {
          id: 'cat-1',
          name: 'Women',
          href: '/products?category=Women',
          displayOrder: 1,
          isActive: true,
          children: [],
        },
        l2Children: [
          {
            item: {
              id: 'cat-1-1',
              name: 'Bridal Wear',
              href: '/products?category=Bridal+Wear',
              displayOrder: 1,
              isActive: true,
              children: [],
            },
            l3Children: [
              { id: 'cat-1-1-1', name: 'Lehengas', href: '/products?category=Lehengas', displayOrder: 1, isActive: true },
              { id: 'cat-1-1-2', name: 'Shararas', href: '/products?category=Shararas', displayOrder: 2, isActive: true },
            ],
          },
        ],
      },
      {
        item: {
          id: 'cat-2',
          name: 'Men',
          href: '/products?category=Men',
          displayOrder: 2,
          isActive: true,
          children: [],
        },
        l2Children: [
          {
            item: {
              id: 'cat-2-1',
              name: 'Formals & Wedding',
              href: '/products?category=Formals+%26+Wedding',
              displayOrder: 1,
              isActive: true,
              children: [],
            },
            l3Children: [
              { id: 'cat-2-1-1', name: 'Sherwanis', href: '/products?category=Sherwanis', displayOrder: 1, isActive: true },
            ],
          },
        ],
      },
    ];

    // Filter by "Sherwani"
    const sherwaniFilter = filterCategoryTree(sampleLevel1Categories, 'Sherwani');
    expect(sherwaniFilter.length).toBe(1);
    expect(sherwaniFilter[0].item.name).toBe('Men');
    expect(sherwaniFilter[0].l2Children[0].item.name).toBe('Formals & Wedding');
    expect(sherwaniFilter[0].l2Children[0].l3Children[0].name).toBe('Sherwanis');

    // Filter by non-existent query
    const emptyFilter = filterCategoryTree(sampleLevel1Categories, 'NonExistentCategory123');
    expect(emptyFilter.length).toBe(0);

    // Empty search query returns full tree
    const fullTree = filterCategoryTree(sampleLevel1Categories, '');
    expect(fullTree.length).toBe(2);
  });
});
