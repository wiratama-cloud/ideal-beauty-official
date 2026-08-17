import { prisma } from '../prisma';
import { getCategoryAndDescendantNames } from './nav-category';
import { serializeProduct } from '../utils/serialization';
import { getDefaultSizeChart } from './size-chart';

export interface GetProductsParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: 'SALE' | 'RENTAL';
  query?: string;
}

export async function getProducts(params: GetProductsParams = {}) {
  try {
    const { category, minPrice, maxPrice, type, query } = params;

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

    return products.map((product) => serializeProduct(product));
  } catch (error) {
    console.error('Failed to fetch products from database:', error);
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
