import { prisma } from '../prisma';

export interface GetProductsParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: 'SALE' | 'RENTAL';
  query?: string;
}

export async function getProducts(params: GetProductsParams = {}) {
  const { category, minPrice, maxPrice, type, query } = params;

  const whereClause: any = {
    isActive: true,
  };

  if (category && category !== 'All') {
    whereClause.category = {
      equals: category,
      mode: 'insensitive',
    };
  }

  if (query && query.trim() !== '') {
    whereClause.OR = [
      { name: { contains: query.trim(), mode: 'insensitive' } },
      { description: { contains: query.trim(), mode: 'insensitive' } },
      { category: { contains: query.trim(), mode: 'insensitive' } },
    ];
  }

  // Variant level filtering
  const variantFilter: any = {};

  if (type === 'SALE') {
    variantFilter.priceSale = { not: null };
  } else if (type === 'RENTAL') {
    variantFilter.priceRent = { not: null };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceCondition: any = {};
    if (minPrice !== undefined) priceCondition.gte = minPrice;
    if (maxPrice !== undefined) priceCondition.lte = maxPrice;

    if (type === 'RENTAL') {
      variantFilter.priceRent = priceCondition;
    } else {
      variantFilter.priceSale = priceCondition;
    }
  }

  if (Object.keys(variantFilter).length > 0) {
    whereClause.variants = {
      some: variantFilter,
    };
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      variants: {
        where: Object.keys(variantFilter).length > 0 ? variantFilter : undefined,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return products.map(product => ({
    ...product,
    variants: product.variants.map(variant => ({
      ...variant,
      priceSale: variant.priceSale ? Number(variant.priceSale) : null,
      priceRent: variant.priceRent ? Number(variant.priceRent) : null,
      costPrice: variant.costPrice ? Number(variant.costPrice) : null,
    })),
  }));
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      variants: {
        orderBy: {
          sku: 'asc',
        },
      },
    },
  });

  if (!product) return null;

  return {
    ...product,
    variants: product.variants.map(variant => ({
      ...variant,
      priceSale: variant.priceSale ? Number(variant.priceSale) : null,
      priceRent: variant.priceRent ? Number(variant.priceRent) : null,
      costPrice: variant.costPrice ? Number(variant.costPrice) : null,
    })),
  };
}

export async function getCategories() {
  const categories = await prisma.product.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ['category'],
  });

  const categoryList = categories
    .map((c) => c.category)
    .filter((cat): cat is string => Boolean(cat));

  return ['All', ...Array.from(new Set(categoryList))];
}
