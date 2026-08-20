import { prisma } from '../prisma';
import { getCategoryAndDescendantNames } from './nav-category';
import { serializeProduct, SerializedProduct } from '../utils/serialization';
import { getDefaultSizeChart } from './size-chart';

export interface GetProductsParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: 'SALE' | 'RENTAL';
  query?: string;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'popular';
  inStockOnly?: boolean;
}

function getProductEffectivePrice(
  product: any,
  type?: 'SALE' | 'RENTAL',
  mode: 'min' | 'max' = 'min'
): number {
  const prices: number[] = [];
  for (const v of product.variants || []) {
    if (type === 'RENTAL') {
      if (typeof v.priceRent === 'number' && !isNaN(v.priceRent)) {
        prices.push(v.priceRent);
      }
    } else if (type === 'SALE') {
      if (typeof v.priceSale === 'number' && !isNaN(v.priceSale)) {
        prices.push(v.priceSale);
      }
    } else {
      if (typeof v.priceSale === 'number' && !isNaN(v.priceSale)) {
        prices.push(v.priceSale);
      } else if (typeof v.priceRent === 'number' && !isNaN(v.priceRent)) {
        prices.push(v.priceRent);
      }
    }
  }

  if (prices.length === 0) {
    return mode === 'min' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  }
  return mode === 'min' ? Math.min(...prices) : Math.max(...prices);
}

function getProductPopularityScore(product: any): number {
  const wishlistCount = product._count?.wishlistedBy || 0;
  const orderCount = (product.variants || []).reduce((acc: number, v: any) => {
    return acc + (v._count?.orderItems || 0);
  }, 0);
  return wishlistCount * 2 + orderCount * 3;
}

export async function getProducts(params: GetProductsParams = {}) {
  try {
    const { category, minPrice, maxPrice, type, query, sort = 'newest', inStockOnly } = params;

    const whereClause: any = {
      isActive: true,
    };

    if (category && category !== 'All') {
      const names = await getCategoryAndDescendantNames(category);
      whereClause.category = {
        in: names,
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

    if (inStockOnly) {
      if (type === 'SALE') {
        variantFilter.OR = [
          { stockSaleAvailable: { gt: 0 } },
          { stockAvailable: { gt: 0 } },
          { isPreOrder: true },
        ];
      } else if (type === 'RENTAL') {
        variantFilter.OR = [
          { stockRentAvailable: { gt: 0 } },
          { stockAvailable: { gt: 0 } },
        ];
      } else {
        variantFilter.OR = [
          { stockSaleAvailable: { gt: 0 } },
          { stockRentAvailable: { gt: 0 } },
          { stockAvailable: { gt: 0 } },
          { isPreOrder: true },
        ];
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
          include: {
            _count: {
              select: {
                orderItems: true,
              },
            },
          },
        },
        _count: {
          select: {
            wishlistedBy: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const serializedProducts = products.map((product) => serializeProduct(product));

    if (sort === 'price-asc') {
      serializedProducts.sort((a, b) => {
        const minA = getProductEffectivePrice(a, type, 'min');
        const minB = getProductEffectivePrice(b, type, 'min');
        const validA = minA !== Number.POSITIVE_INFINITY && minA !== Number.NEGATIVE_INFINITY;
        const validB = minB !== Number.POSITIVE_INFINITY && minB !== Number.NEGATIVE_INFINITY;
        if (validA && !validB) return -1;
        if (!validA && validB) return 1;
        if (!validA && !validB) return 0;

        if (minA !== minB) return minA - minB;
        const maxA = getProductEffectivePrice(a, type, 'max');
        const maxB = getProductEffectivePrice(b, type, 'max');
        if (maxA !== maxB) return maxA - maxB;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (sort === 'price-desc') {
      serializedProducts.sort((a, b) => {
        const minA = getProductEffectivePrice(a, type, 'min');
        const minB = getProductEffectivePrice(b, type, 'min');
        const validA = minA !== Number.POSITIVE_INFINITY && minA !== Number.NEGATIVE_INFINITY;
        const validB = minB !== Number.POSITIVE_INFINITY && minB !== Number.NEGATIVE_INFINITY;
        if (validA && !validB) return -1;
        if (!validA && validB) return 1;
        if (!validA && !validB) return 0;

        if (minA !== minB) return minB - minA;
        const maxA = getProductEffectivePrice(a, type, 'max');
        const maxB = getProductEffectivePrice(b, type, 'max');
        if (maxA !== maxB) return maxB - maxA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (sort === 'popular') {
      serializedProducts.sort((a, b) => {
        const scoreA = getProductPopularityScore(a);
        const scoreB = getProductPopularityScore(b);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      // Default / newest
      serializedProducts.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return serializedProducts;
  } catch (error) {
    console.error('Failed to fetch products from database:', error);
    return [];
  }
}

export async function getRelatedProducts(
  productId: string,
  category?: string | null,
  limit: number = 4
) {
  try {
    const targetLimit = Math.max(1, limit || 4);
    let relatedProducts: any[] = [];

    if (category && category.trim() !== '' && category !== 'All') {
      const categoryNames = await getCategoryAndDescendantNames(category);

      relatedProducts = await prisma.product.findMany({
        where: {
          id: { not: productId },
          isActive: true,
          category: {
            in: categoryNames,
            mode: 'insensitive',
          },
        },
        include: {
          variants: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: targetLimit,
      });
    }

    if (relatedProducts.length < targetLimit) {
      const needed = targetLimit - relatedProducts.length;
      const excludedIds = [productId, ...relatedProducts.map((p) => p.id)];

      const fallbackProducts = await prisma.product.findMany({
        where: {
          id: { notIn: excludedIds },
          isActive: true,
        },
        include: {
          variants: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: needed,
      });

      relatedProducts = [...relatedProducts, ...fallbackProducts];
    }

    return relatedProducts.map((product) => serializeProduct(product));
  } catch (error) {
    console.error(`Failed to fetch related products for product ${productId}:`, error);
    return [];
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        sizeChart: true,
        variants: {
          orderBy: {
            sku: 'asc',
          },
        },
      },
    });

    if (!product) return null;

    const serialized = serializeProduct(product) as any;
    if (!serialized.sizeChart) {
      const defaultChart = await getDefaultSizeChart();
      if (defaultChart) {
        serialized.sizeChart = defaultChart;
      }
    }

    return serialized;
  } catch (error) {
    console.error(`Failed to fetch product by slug ${slug}:`, error);
    return null;
  }
}

export async function getCategories() {
  try {
    const categories = await prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    const categoryList = categories
      .map((c) => c.category)
      .filter((cat): cat is string => Boolean(cat));

    return ['All', ...Array.from(new Set(categoryList))];
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return ['All'];
  }
}
