import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  createNavCategory,
  updateNavCategory,
  getNavCategoryTree,
  getCategoryAndDescendantNames,
  resetDefaultNavCategories,
} from '../src/lib/services/nav-category';
import { getProducts } from '../src/lib/services/product';

describe('NavCategory Tree & Hierarchy Services', () => {
  beforeEach(async () => {
    await prisma.navCategory.deleteMany();
    await prisma.ledgerEntry.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.wishlistItem.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
  });

  afterAll(async () => {
    await resetDefaultNavCategories();
  });

  it('should create and build a nested category tree', async () => {
    const parent = await createNavCategory({
      name: 'Haute Couture',
      href: '/products?category=Haute+Couture',
      imageUrl: '/images/parent.jpg',
    });

    const child1 = await createNavCategory({
      name: 'Eveningwear',
      href: '/products?category=Eveningwear',
      parentId: parent.id,
      imageUrl: '/images/child1.jpg',
    });

    const child2 = await createNavCategory({
      name: 'Gowns',
      href: '/products?category=Gowns',
      parentId: parent.id,
    });

    const grandChild = await createNavCategory({
      name: 'Ball Gowns',
      href: '/products?category=Ball+Gowns',
      parentId: child2.id,
    });

    const tree = await getNavCategoryTree(false);

    expect(tree.length).toBe(1);
    expect(tree[0].id).toBe(parent.id);
    expect(tree[0].imageUrl).toBe('/images/parent.jpg');
    expect(tree[0].children?.length).toBe(2);

    const gownsNode = tree[0].children?.find((c) => c.id === child2.id);
    expect(gownsNode).toBeDefined();
    expect(gownsNode?.children?.length).toBe(1);
    expect(gownsNode?.children?.[0].id).toBe(grandChild.id);
  });

  it('should collect category and all descendant names correctly', async () => {
    const parent = await createNavCategory({
      name: 'Bridal Wear',
      href: '/products?category=Bridal+Wear',
    });

    const child = await createNavCategory({
      name: 'Lehengas',
      href: '/products?category=Lehengas',
      parentId: parent.id,
    });

    const grandChild = await createNavCategory({
      name: 'Silk Lehengas',
      href: '/products?category=Silk+Lehengas',
      parentId: child.id,
    });

    const namesByParentId = await getCategoryAndDescendantNames(parent.id);
    expect(namesByParentId).toEqual(expect.arrayContaining(['Bridal Wear', 'Lehengas', 'Silk Lehengas']));
    expect(namesByParentId.length).toBe(3);

    const namesByName = await getCategoryAndDescendantNames('Bridal Wear');
    expect(namesByName).toEqual(expect.arrayContaining(['Bridal Wear', 'Lehengas', 'Silk Lehengas']));

    const childNames = await getCategoryAndDescendantNames('Lehengas');
    expect(childNames).toEqual(expect.arrayContaining(['Lehengas', 'Silk Lehengas']));
    expect(childNames.length).toBe(2);

    const unknown = await getCategoryAndDescendantNames('NonExistent');
    expect(unknown).toEqual(['NonExistent']);
  });

  it('should filter products including descendant category names', async () => {
    const parentCat = await createNavCategory({
      name: 'Couture',
      href: '/products?category=Couture',
    });

    const subCat = await createNavCategory({
      name: 'Luxury Dresses',
      href: '/products?category=Luxury+Dresses',
      parentId: parentCat.id,
    });

    await prisma.product.create({
      data: {
        name: 'Couture Gown',
        slug: 'couture-gown',
        description: 'Test Gown',
        category: 'Couture',
        isActive: true,
      },
    });

    await prisma.product.create({
      data: {
        name: 'Luxury Dress 1',
        slug: 'luxury-dress-1',
        description: 'Test Dress',
        category: 'Luxury Dresses',
        isActive: true,
      },
    });

    await prisma.product.create({
      data: {
        name: 'Casual Shirt',
        slug: 'casual-shirt',
        description: 'Test Shirt',
        category: 'Menswear',
        isActive: true,
      },
    });

    const products = await getProducts({ category: 'Couture' });
    expect(products.length).toBe(2);
    const productNames = products.map((p) => p.name);
    expect(productNames).toContain('Couture Gown');
    expect(productNames).toContain('Luxury Dress 1');
    expect(productNames).not.toContain('Casual Shirt');
  });

  it('should handle circular category references gracefully without infinite loops', async () => {
    const catA = await createNavCategory({
      name: 'Category A',
      href: '/cat-a',
    });

    const catB = await createNavCategory({
      name: 'Category B',
      href: '/cat-b',
      parentId: catA.id,
    });

    // Create a circular link catA -> catB -> catA by updating catA's parentId to catB.id
    await updateNavCategory(catA.id, { parentId: catB.id });

    const names = await getCategoryAndDescendantNames(catA.id);
    expect(names).toEqual(expect.arrayContaining(['Category A', 'Category B']));
    expect(names.length).toBe(2);
  });

  it('should update parentId and imageUrl with updateNavCategory', async () => {
    const parent = await createNavCategory({
      name: 'Parent Cat',
      href: '/parent',
    });

    const item = await createNavCategory({
      name: 'Item Cat',
      href: '/item',
    });

    const updated = await updateNavCategory(item.id, {
      parentId: parent.id,
      imageUrl: '/images/item.jpg',
    });

    expect(updated.parentId).toBe(parent.id);
    expect(updated.imageUrl).toBe('/images/item.jpg');
  });
});
