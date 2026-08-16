import { prisma } from '../prisma';
import {
  NavCategoryItem,
  DEFAULT_NAV_CATEGORIES,
  CategoryTreeSpecItem,
} from '../types/nav-category';

export type { NavCategoryItem, CategoryTreeSpecItem };
export { DEFAULT_NAV_CATEGORIES };

export const DEFAULT_CATEGORY_TREE_SPEC: CategoryTreeSpecItem[] = [
  { name: 'All Collections', href: '/products', displayOrder: 0, isActive: true },
  {
    name: 'Women',
    href: '/products?category=Women',
    displayOrder: 1,
    isActive: true,
    imageUrl: '/images/sections/brand-silk.jpg',
    children: [
      {
        name: 'Clothing',
        href: '/products?category=Clothing',
        displayOrder: 0,
        isActive: true,
        imageUrl: '/images/sections/brand-silk.jpg',
        children: [
          {
            name: 'Bridal Wear',
            href: '/products?category=Bridal+Wear',
            displayOrder: 0,
            isActive: true,
            imageUrl: '/images/sections/brand-silk.jpg',
            children: [
              { name: 'Lehengas', href: '/products?category=Lehengas', displayOrder: 0, isActive: true, imageUrl: '/images/products/lehenga-1.jpg' },
              { name: 'Shararas', href: '/products?category=Shararas', displayOrder: 1, isActive: true, imageUrl: '/images/products/sharara-1.jpg' },
              { name: 'Bridal Maxis & Gowns', href: '/products?category=Bridal+Maxis+%26+Gowns', displayOrder: 2, isActive: true, imageUrl: '/images/products/anarkali-1.jpg' },
            ],
          },
          {
            name: 'Haute Couture',
            href: '/products?category=Haute+Couture',
            displayOrder: 1,
            isActive: true,
            imageUrl: '/images/sections/brand-kaftan.jpg',
            children: [
              { name: 'Kaftans', href: '/products?category=Kaftans', displayOrder: 0, isActive: true, imageUrl: '/images/products/kaftan-1.jpg' },
              { name: 'Sarees', href: '/products?category=Sarees', displayOrder: 1, isActive: true, imageUrl: '/images/products/saree-1.jpg' },
              { name: 'Eveningwear', href: '/products?category=Eveningwear', displayOrder: 2, isActive: true, imageUrl: '/images/products/cape-1.jpg' },
            ],
          },
          {
            name: 'Ready To Wear',
            href: '/products?category=Ready+To+Wear',
            displayOrder: 2,
            isActive: true,
            imageUrl: '/images/products/anarkali-1.jpg',
            children: [
              { name: 'Anarkalis', href: '/products?category=Anarkalis', displayOrder: 0, isActive: true, imageUrl: '/images/products/anarkali-1.jpg' },
              { name: 'Kurta Sets', href: '/products?category=Kurta+Sets', displayOrder: 1, isActive: true, imageUrl: '/images/products/kaftan-2.jpg' },
            ],
          },
          {
            name: 'Unstitched & Lawn',
            href: '/products?category=Unstitched+%26+Lawn',
            displayOrder: 3,
            isActive: true,
            children: [
              { name: '3 Piece Suits', href: '/products?category=3+Piece+Suits', displayOrder: 0, isActive: true, imageUrl: '/images/products/saree-2.jpg' },
              { name: '2 Piece Suits', href: '/products?category=2+Piece+Suits', displayOrder: 1, isActive: true, imageUrl: '/images/products/anarkali-2.jpg' },
            ],
          },
        ],
      },
      {
        name: 'Accessories',
        href: '/products?category=Accessories',
        displayOrder: 1,
        isActive: true,
        imageUrl: '/images/products/veil-1.jpg',
        children: [
          { name: 'Veils & Dupattas', href: '/products?category=Veils+%26+Dupattas', displayOrder: 0, isActive: true, imageUrl: '/images/products/veil-1.jpg' },
          { name: 'Clutches & Bags', href: '/products?category=Clutches+%26+Bags', displayOrder: 1, isActive: true },
        ],
      },
      {
        name: 'Footwear',
        href: '/products?category=Footwear',
        displayOrder: 2,
        isActive: true,
        children: [
          { name: 'Khussas', href: '/products?category=Khussas', displayOrder: 0, isActive: true },
          { name: 'Heels', href: '/products?category=Heels', displayOrder: 1, isActive: true },
          { name: 'Flats', href: '/products?category=Flats', displayOrder: 2, isActive: true },
        ],
      },
    ],
  },
  {
    name: 'Men',
    href: '/products?category=Men',
    displayOrder: 2,
    isActive: true,
    imageUrl: '/images/sections/brand-groom.jpg',
    children: [
      {
        name: 'Clothing',
        href: '/products?category=Clothing',
        displayOrder: 0,
        isActive: true,
        imageUrl: '/images/sections/brand-groom.jpg',
        children: [
          {
            name: 'Formals & Wedding',
            href: '/products?category=Formals+%26+Wedding',
            displayOrder: 0,
            isActive: true,
            imageUrl: '/images/sections/brand-groom.jpg',
            children: [
              { name: 'Sherwanis', href: '/products?category=Sherwanis', displayOrder: 0, isActive: true, imageUrl: '/images/products/sherwani-1.jpg' },
              { name: 'Prince Suits', href: '/products?category=Prince+Suits', displayOrder: 1, isActive: true, imageUrl: '/images/products/sherwani-2.jpg' },
            ],
          },
          {
            name: 'Men Kurta Sets',
            href: '/products?category=Men+Kurta+Sets',
            displayOrder: 1,
            isActive: true,
            children: [
              { name: 'Kurta Shalwar', href: '/products?category=Kurta+Shalwar', displayOrder: 0, isActive: true, imageUrl: '/images/products/sherwani-1.jpg' },
            ],
          },
        ],
      },
      {
        name: 'Accessories',
        href: '/products?category=Accessories',
        displayOrder: 1,
        isActive: true,
        children: [
          { name: 'Turbans', href: '/products?category=Turbans', displayOrder: 0, isActive: true },
          { name: 'Cufflinks', href: '/products?category=Cufflinks', displayOrder: 1, isActive: true },
        ],
      },
      {
        name: 'Footwear',
        href: '/products?category=Footwear',
        displayOrder: 2,
        isActive: true,
        children: [
          { name: 'Peshawari Chappals', href: '/products?category=Peshawari+Chappals', displayOrder: 0, isActive: true },
          { name: 'Loafers', href: '/products?category=Loafers', displayOrder: 1, isActive: true },
        ],
      },
    ],
  },
  {
    name: 'Jewelry & Accessories',
    href: '/products?category=Accessories',
    displayOrder: 3,
    isActive: true,
    imageUrl: '/images/products/veil-1.jpg',
  },
  { name: 'Rentals', href: '/products?type=RENTAL', displayOrder: 4, isActive: true },
];

export async function seedDefaultCategoryTree(): Promise<void> {
  async function seedNode(item: CategoryTreeSpecItem, parentId?: string): Promise<void> {
    const { children, ...data } = item;
    const created = await prisma.navCategory.create({
      data: {
        ...data,
        parentId: parentId || null,
      },
    });
    if (children && children.length > 0) {
      for (const child of children) {
        await seedNode(child, created.id);
      }
    }
  }

  for (const item of DEFAULT_CATEGORY_TREE_SPEC) {
    await seedNode(item);
  }
}

export async function getNavCategories(activeOnly = true): Promise<NavCategoryItem[]> {
  const count = await prisma.navCategory.count();

  if (count === 0) {
    // Auto-seed default categories if empty
    await seedDefaultCategoryTree();
  }

  const items = await prisma.navCategory.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [
      { displayOrder: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  // Deduplicate categories by name
  const uniqueItems: NavCategoryItem[] = [];
  const seenNames = new Set<string>();
  const duplicateIds: string[] = [];

  for (const item of items) {
    const key = `${item.parentId || 'root'}:${item.name.trim().toLowerCase()}`;
    if (!seenNames.has(key)) {
      seenNames.add(key);
      uniqueItems.push(item);
    } else {
      duplicateIds.push(item.id);
    }
  }

  // Clean up duplicate entries from database if any exist
  if (duplicateIds.length > 0) {
    try {
      await prisma.navCategory.deleteMany({
        where: { id: { in: duplicateIds } },
      });
    } catch {
      // Ignore if concurrent deletion occurs
    }
  }

  return uniqueItems;
}

export async function getNavCategoryTree(activeOnly = true): Promise<NavCategoryItem[]> {
  const allCategories = await getNavCategories(activeOnly);

  const itemMap = new Map<string, NavCategoryItem>();
  for (const cat of allCategories) {
    itemMap.set(cat.id, { ...cat, children: [] });
  }

  const rootNodes: NavCategoryItem[] = [];

  for (const cat of allCategories) {
    const node = itemMap.get(cat.id)!;
    if (cat.parentId && itemMap.has(cat.parentId)) {
      const parentNode = itemMap.get(cat.parentId)!;
      parentNode.children!.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  return rootNodes;
}

export async function getCategoryAndDescendantNames(categoryIdOrName: string): Promise<string[]> {
  const allCategories = await prisma.navCategory.findMany();

  const searchTarget = categoryIdOrName.trim().toLowerCase();

  const matchedCategories = allCategories.filter(
    (c) => c.id === categoryIdOrName || c.name.trim().toLowerCase() === searchTarget
  );

  if (matchedCategories.length === 0) {
    return [categoryIdOrName];
  }

  const childrenMap = new Map<string, typeof allCategories>();
  for (const cat of allCategories) {
    if (cat.parentId) {
      if (!childrenMap.has(cat.parentId)) {
        childrenMap.set(cat.parentId, []);
      }
      childrenMap.get(cat.parentId)!.push(cat);
    }
  }

  const visited = new Set<string>();
  const resultNames = new Set<string>();
  const queue: typeof allCategories = [...matchedCategories];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) {
      continue;
    }
    visited.add(current.id);
    resultNames.add(current.name);

    const children = childrenMap.get(current.id);
    if (children) {
      queue.push(...children);
    }
  }

  return Array.from(resultNames);
}

export async function createNavCategory(data: {
  name: string;
  href: string;
  displayOrder?: number;
  isActive?: boolean;
  parentId?: string | null;
  imageUrl?: string | null;
}): Promise<NavCategoryItem> {
  let displayOrder = data.displayOrder;
  if (displayOrder === undefined) {
    const highestOrder = await prisma.navCategory.findFirst({
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    displayOrder = (highestOrder?.displayOrder ?? -1) + 1;
  }

  return prisma.navCategory.create({
    data: {
      name: data.name,
      href: data.href,
      displayOrder,
      isActive: data.isActive ?? true,
      parentId: data.parentId ?? null,
      imageUrl: data.imageUrl ?? null,
    },
  });
}

export async function updateNavCategory(
  id: string,
  data: Partial<{
    name: string;
    href: string;
    displayOrder: number;
    isActive: boolean;
    parentId: string | null;
    imageUrl: string | null;
  }>
): Promise<NavCategoryItem> {
  return prisma.navCategory.update({
    where: { id },
    data,
  });
}

export async function deleteNavCategory(id: string): Promise<NavCategoryItem> {
  return prisma.navCategory.delete({
    where: { id },
  });
}

export async function reorderNavCategories(orderedIds: string[]): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.navCategory.update({
        where: { id },
        data: { displayOrder: index },
      })
    )
  );
}

export async function resetDefaultNavCategories(): Promise<NavCategoryItem[]> {
  await prisma.navCategory.deleteMany();
  await seedDefaultCategoryTree();

  return getNavCategories(false);
}
