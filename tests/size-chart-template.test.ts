import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  getSizeCharts,
  getSizeChartById,
  getDefaultSizeChart,
  createSizeChart,
  updateSizeChart,
  deleteSizeChart,
  linkProductsToSizeChart,
  DEFAULT_SIZE_MEASUREMENTS,
} from '../src/lib/services/size-chart';
import { getProductBySlug } from '../src/lib/services/product';

describe('Size Chart Template Management & Linking', () => {
  let testChartId: string;
  let testProductId: string;

  beforeAll(async () => {
    // Ensure at least one product exists
    const existingProduct = await prisma.product.findFirst();
    if (existingProduct) {
      testProductId = existingProduct.id;
    } else {
      const created = await prisma.product.create({
        data: {
          name: 'Test Chart Product',
          slug: 'test-chart-product',
          category: 'Ready To Wear',
          variants: {
            create: {
              sku: 'TEST-CHART-001',
              attributes: { size: 'M' },
              priceSale: 500000,
            },
          },
        },
      });
      testProductId = created.id;
    }
  });

  afterAll(async () => {
    if (testChartId) {
      await prisma.sizeChart.deleteMany({ where: { id: testChartId } });
    }
  });

  it('should create a new size chart template', async () => {
    const chart = await createSizeChart({
      name: 'Test Bridal Lehenga Chart',
      category: 'Bridal Couture',
      description: 'Specialized chart for structured corsets and bridal lehengas',
      guideText: 'Measure bust and upper waist while wearing event undergarments.',
      isDefault: false,
      measurements: DEFAULT_SIZE_MEASUREMENTS,
    });

    expect(chart.id).toBeDefined();
    expect(chart.name).toBe('Test Bridal Lehenga Chart');
    expect(chart.category).toBe('Bridal Couture');
    expect(chart.measurements.length).toBe(DEFAULT_SIZE_MEASUREMENTS.length);

    testChartId = chart.id;
  });

  it('should retrieve all size chart templates', async () => {
    const charts = await getSizeCharts();
    expect(charts.length).toBeGreaterThan(0);
    const found = charts.find((c) => c.id === testChartId);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Test Bridal Lehenga Chart');
  });

  it('should link product to size chart template', async () => {
    const result = await linkProductsToSizeChart(testChartId, [testProductId]);
    expect(result.count).toBeGreaterThanOrEqual(1);

    const product = await prisma.product.findUnique({
      where: { id: testProductId },
      include: { sizeChart: true },
    });

    expect(product?.sizeChartId).toBe(testChartId);
    expect(product?.sizeChart?.name).toBe('Test Bridal Lehenga Chart');
  });

  it('should include linked size chart in getProductBySlug', async () => {
    const product = await prisma.product.findUnique({ where: { id: testProductId } });
    expect(product).not.toBeNull();

    if (product) {
      const fetched = await getProductBySlug(product.slug);
      expect(fetched).not.toBeNull();
      expect(fetched?.sizeChart).toBeDefined();
      expect(fetched?.sizeChart?.name).toBe('Test Bridal Lehenga Chart');
    }
  });

  it('should update an existing size chart template', async () => {
    const updated = await updateSizeChart(testChartId, {
      name: 'Updated Bridal Lehenga Chart',
      category: 'Bridal Couture',
      description: 'Updated chart details',
      guideText: 'Updated guide text',
      isDefault: false,
      measurements: DEFAULT_SIZE_MEASUREMENTS,
    });

    expect(updated.name).toBe('Updated Bridal Lehenga Chart');
    expect(updated.description).toBe('Updated chart details');
  });

  it('should unlink product from size chart', async () => {
    const result = await linkProductsToSizeChart(null, [testProductId]);
    expect(result.count).toBeGreaterThanOrEqual(1);

    const product = await prisma.product.findUnique({
      where: { id: testProductId },
    });
    expect(product?.sizeChartId).toBeNull();
  });
});
