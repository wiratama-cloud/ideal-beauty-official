import { prisma } from '../prisma';

export interface NavCategoryItem {
  id: string;
  name: string;
  href: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const DEFAULT_NAV_CATEGORIES = [
  { name: 'All Collections', href: '/products', displayOrder: 0, isActive: true },
  { name: 'Haute Couture', href: '/products?category=Haute+Couture', displayOrder: 1, isActive: true },
  { name: 'Bridal Wear', href: '/products?category=Bridal+Wear', displayOrder: 2, isActive: true },
  { name: 'Ready To Wear', href: '/products?category=Ready+To+Wear', displayOrder: 3, isActive: true },
  { name: 'Menswear', href: '/products?category=Menswear', displayOrder: 4, isActive: true },
  { name: 'Rentals', href: '/products?type=RENTAL', displayOrder: 5, isActive: true },
];

export async function getNavCategories(activeOnly = true): Promise<NavCategoryItem[]> {
  const count = await prisma.navCategory.count();

  if (count === 0) {
    // Auto-seed default categories if empty
    await prisma.navCategory.createMany({
      data: DEFAULT_NAV_CATEGORIES,
    });
  }

  const items = await prisma.navCategory.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [
      { displayOrder: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  return items;
}

export async function createNavCategory(data: {
  name: string;
  href: string;
  displayOrder?: number;
  isActive?: boolean;
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
  await prisma.navCategory.createMany({
    data: DEFAULT_NAV_CATEGORIES,
  });

  return getNavCategories(false);
}
