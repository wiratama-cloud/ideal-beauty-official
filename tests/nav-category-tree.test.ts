import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  createNavCategory,
  updateNavCategory,
  getNavCategoryTree,
  getCategoryAndDescendantNames,
  resetDefaultNavCategories,
  seedDefaultCategoryTree,
} from '../src/lib/services/nav-category';
import { getProducts } from '../src/lib/services/product';

describe('NavCategory Tree & Hierarchy Services', () => {
  let createdCategoryIds: string[] = [];
  let createdProductIds: string[] = [];

  afterEach(async () => {
    if (createdProductIds.length > 0) {
      await prisma.productVariant.deleteMany({ where: { productId: { in: createdProductIds } } });
      await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
      createdProductIds = [];
    }
    if (createdCategoryIds.length > 0) {
      await prisma.navCategory.deleteMany({ where: { id: { in: createdCategoryIds } } });
      createdCategoryIds = [];
    }
  });

  afterAll(async () => {
    await resetDefaultNavCategories();
  });

  it('should create and build a nested category tree', async () => {
    const parent = await createNavCategory({
      name: 'Haute Couture Tree Test',
      href: '/products?category=Haute+Couture+Tree+Test',
      imageUrl: '/images/parent.jpg',
    });
    createdCategoryIds.push(parent.id);

    const child1 = await createNavCategory({
      name: 'Eveningwear Tree Test',
      href: '/products?category=Eveningwear+Tree+Test',
      parentId: parent.id,
      imageUrl: '/images/child1.jpg',
    });
    createdCategoryIds.push(child1.id);

    const child2 = await createNavCategory({
      name: 'Gowns Tree Test',
      href: '/products?category=Gowns+Tree+Test',
      parentId: parent.id,
    });
    createdCategoryIds.push(child2.id);

    const grandChild = await createNavCategory({
      name: 'Ball Gowns Tree Test',
      href: '/products?category=Ball+Gowns+Tree+Test',
      parentId: child2.id,
    });
    createdCategoryIds.push(grandChild.id);

    const tree = await getNavCategoryTree(false);

    const parentNode = tree.find((t) => t.id === parent.id);
    expect(parentNode).toBeDefined();
    expect(parentNode?.id).toBe(parent.id);
    expect(parentNode?.imageUrl).toBe('/images/parent.jpg');
    expect(parentNode?.children?.length).toBe(2);

    const gownsNode = parentNode?.children?.find((c) => c.id === child2.id);
    expect(gownsNode).toBeDefined();
    expect(gownsNode?.children?.length).toBe(1);
    expect(gownsNode?.children?.[0].id).toBe(grandChild.id);
  });

  it('should collect category and all descendant names correctly', async () => {
    const parent = await createNavCategory({
      name: 'Bridal Wear Test',
      href: '/products?category=Bridal+Wear+Test',
    });
    createdCategoryIds.push(parent.id);

    const child = await createNavCategory({
      name: 'Lehengas Test',
      href: '/products?category=Lehengas+Test',
      parentId: parent.id,
    });
    createdCategoryIds.push(child.id);

    const grandChild = await createNavCategory({
      name: 'Silk Lehengas Test',
      href: '/products?category=Silk+Lehengas+Test',
      parentId: child.id,
    });
    createdCategoryIds.push(grandChild.id);

    const namesByParentId = await getCategoryAndDescendantNames(parent.id);
    expect(namesByParentId).toEqual(expect.arrayContaining(['Bridal Wear Test', 'Lehengas Test', 'Silk Lehengas Test']));
    expect(namesByParentId.length).toBe(3);

    const namesByName = await getCategoryAndDescendantNames('Bridal Wear Test');
    expect(namesByName).toEqual(expect.arrayContaining(['Bridal Wear Test', 'Lehengas Test', 'Silk Lehengas Test']));

    const childNames = await getCategoryAndDescendantNames('Lehengas Test');
    expect(childNames).toEqual(expect.arrayContaining(['Lehengas Test', 'Silk Lehengas Test']));
    expect(childNames.length).toBe(2);

    const unknown = await getCategoryAndDescendantNames('NonExistent');
    expect(unknown).toEqual(['NonExistent']);
  });

  it('should filter products including descendant category names', async () => {
    const uniqueSuffix = Date.now().toString();
    const parentName = `Couture-${uniqueSuffix}`;
    const childName = `Luxury Dresses-${uniqueSuffix}`;
    const otherName = `Menswear-${uniqueSuffix}`;

    const parentCat = await createNavCategory({
      name: parentName,
      href: `/products?category=${encodeURIComponent(parentName)}`,
    });
    createdCategoryIds.push(parentCat.id);

    const subCat = await createNavCategory({
      name: childName,
      href: `/products?category=${encodeURIComponent(childName)}`,
      parentId: parentCat.id,
    });
    createdCategoryIds.push(subCat.id);

    const p1 = await prisma.product.create({
      data: {
        name: `Couture Gown ${uniqueSuffix}`,
        slug: `couture-gown-${uniqueSuffix}`,
        description: 'Test Gown',
        category: parentName,
        isActive: true,
      },
    });
    const p2 = await prisma.product.create({
      data: {
        name: `Luxury Dress ${uniqueSuffix}`,
        slug: `luxury-dress-${uniqueSuffix}`,
        description: 'Test Dress',
        category: childName,
        isActive: true,
      },
    });
    const p3 = await prisma.product.create({
      data: {
        name: `Casual Shirt ${uniqueSuffix}`,
        slug: `casual-shirt-${uniqueSuffix}`,
        description: 'Test Shirt',
        category: otherName,
        isActive: true,
      },
    });
    createdProductIds.push(p1.id, p2.id, p3.id);

    const products = await getProducts({ category: parentName });
    expect(products.length).toBe(2);
    const productNames = products.map((p) => p.name);
    expect(productNames).toContain(`Couture Gown ${uniqueSuffix}`);
    expect(productNames).toContain(`Luxury Dress ${uniqueSuffix}`);
    expect(productNames).not.toContain(`Casual Shirt ${uniqueSuffix}`);
  });

  it('should handle circular category references gracefully without infinite loops', async () => {
    const catA = await createNavCategory({
      name: 'Category A Loop Test',
      href: '/cat-a-loop',
    });
    createdCategoryIds.push(catA.id);

    const catB = await createNavCategory({
      name: 'Category B Loop Test',
      href: '/cat-b-loop',
      parentId: catA.id,
    });
    createdCategoryIds.push(catB.id);

    // Create a circular link catA -> catB -> catA by updating catA's parentId to catB.id
    await updateNavCategory(catA.id, { parentId: catB.id });

    const names = await getCategoryAndDescendantNames(catA.id);
    expect(names).toEqual(expect.arrayContaining(['Category A Loop Test', 'Category B Loop Test']));
    expect(names.length).toBe(2);
  });

  it('should update parentId and imageUrl with updateNavCategory', async () => {
    const parent = await createNavCategory({
      name: 'Parent Cat Update Test',
      href: '/parent-update',
    });
    createdCategoryIds.push(parent.id);

    const item = await createNavCategory({
      name: 'Item Cat Update Test',
      href: '/item-update',
    });
    createdCategoryIds.push(item.id);

    const updated = await updateNavCategory(item.id, {
      parentId: parent.id,
      imageUrl: '/images/item.jpg',
    });

    expect(updated.parentId).toBe(parent.id);
    expect(updated.imageUrl).toBe('/images/item.jpg');
  });

  it('should seed default category tree with resolved imageUrlMap', async () => {
    const mockMap: Record<string, string> = {
      '/images/sections/brand-silk.jpg': 'https://firebasestorage.googleapis.com/v0/b/bucket/o/sections%2Fbrand-silk.jpg',
      '/images/products/kaftan-1.jpg': 'https://firebasestorage.googleapis.com/v0/b/bucket/o/products%2Fkaftan-1.jpg',
    };

    await seedDefaultCategoryTree(mockMap);

    const categories = await prisma.navCategory.findMany();
    expect(categories.length).toBeGreaterThan(0);

    const womenCategories = categories.filter((c) => c.name === 'Women');
    expect(womenCategories.some((c) => c.imageUrl === 'https://firebasestorage.googleapis.com/v0/b/bucket/o/sections%2Fbrand-silk.jpg')).toBe(true);

    const kaftansCategories = categories.filter((c) => c.name === 'Kaftans');
    expect(kaftansCategories.some((c) => c.imageUrl === 'https://firebasestorage.googleapis.com/v0/b/bucket/o/products%2Fkaftan-1.jpg')).toBe(true);
  });
});
