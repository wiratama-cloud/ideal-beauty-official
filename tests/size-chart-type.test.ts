import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  getSizeCharts,
  getSizeChartById,
  createSizeChart,
  updateSizeChart,
  linkProductsToSizeChart,
  DEFAULT_SIZE_MEASUREMENTS,
  DEFAULT_WEIGHT_HEIGHT_MEASUREMENTS,
} from '../src/lib/services/size-chart';

describe('Size Chart Types (Weight & Height vs Body Measurement)', () => {
  let bodyChartId: string;
  let weightHeightChartId: string;
  let testProductId: string;

  beforeAll(async () => {
    const created = await prisma.product.create({
      data: {
        name: 'Type Test Product',
        slug: `type-test-product-${Date.now()}`,
        category: 'Ready To Wear',
        variants: {
          create: {
            sku: `TYPE-TEST-${Date.now()}`,
            attributes: { size: 'M' },
            priceSale: 500000,
          },
        },
      },
    });
    testProductId = created.id;
  });

  afterAll(async () => {
    if (testProductId) {
      await prisma.productVariant.deleteMany({ where: { productId: testProductId } });
      await prisma.product.deleteMany({ where: { id: testProductId } });
    }
    if (bodyChartId) {
      await prisma.sizeChart.deleteMany({ where: { id: bodyChartId } });
    }
    if (weightHeightChartId) {
      await prisma.sizeChart.deleteMany({ where: { id: weightHeightChartId } });
    }
  });

  it('should create a Weight & Height chart template', async () => {
    const chart = await createSizeChart({
      name: 'Test Weight & Height Fit Chart',
      type: 'WEIGHT_HEIGHT',
      category: 'Casual Wear',
      description: 'Quick size recommendation based on height and weight',
      guideText: 'Select size based on body weight in KG and height in CM.',
      isDefault: false,
      measurements: DEFAULT_WEIGHT_HEIGHT_MEASUREMENTS,
    });

    expect(chart.id).toBeDefined();
    expect(chart.name).toBe('Test Weight & Height Fit Chart');
    expect(chart.type).toBe('WEIGHT_HEIGHT');
    expect(chart.measurements[0].heightCm).toBe('150 - 158');
    expect(chart.measurements[0].weightKg).toBe('40 - 48');

    weightHeightChartId = chart.id;
  });

  it('should create a Body Measurement chart template', async () => {
    const chart = await createSizeChart({
      name: 'Test Body Measurement Chart',
      type: 'BODY_MEASUREMENT',
      category: 'Evening Gowns',
      description: 'Couture fitted measurements',
      guideText: 'Tailored for structured gowns.',
      isDefault: false,
      measurements: DEFAULT_SIZE_MEASUREMENTS,
    });

    expect(chart.id).toBeDefined();
    expect(chart.name).toBe('Test Body Measurement Chart');
    expect(chart.type).toBe('BODY_MEASUREMENT');
    expect(chart.measurements[0].bustCm).toBe('81 - 84');

    bodyChartId = chart.id;
  });

  it('should fetch chart by ID and preserve chart type', async () => {
    const fetched = await getSizeChartById(weightHeightChartId);
    expect(fetched).not.toBeNull();
    expect(fetched?.type).toBe('WEIGHT_HEIGHT');
    expect(fetched?.name).toBe('Test Weight & Height Fit Chart');
  });

  it('should list all charts including chart types', async () => {
    const charts = await getSizeCharts();
    const weightChart = charts.find((c) => c.id === weightHeightChartId);
    const bodyChart = charts.find((c) => c.id === bodyChartId);

    expect(weightChart?.type).toBe('WEIGHT_HEIGHT');
    expect(bodyChart?.type).toBe('BODY_MEASUREMENT');
  });

  it('should update chart type from BODY_MEASUREMENT to WEIGHT_HEIGHT', async () => {
    const updated = await updateSizeChart(bodyChartId, {
      name: 'Converted Weight Height Chart',
      type: 'WEIGHT_HEIGHT',
      category: 'Casual Wear',
      description: 'Converted type',
      guideText: 'Updated guide text',
      isDefault: false,
      measurements: DEFAULT_WEIGHT_HEIGHT_MEASUREMENTS,
    });

    expect(updated.type).toBe('WEIGHT_HEIGHT');
    expect(updated.name).toBe('Converted Weight Height Chart');
  });

  it('should link product to Weight & Height chart template', async () => {
    const linkRes = await linkProductsToSizeChart(weightHeightChartId, [testProductId]);
    expect(linkRes.count).toBeGreaterThanOrEqual(1);

    const product = await prisma.product.findUnique({
      where: { id: testProductId },
      include: { sizeChart: true },
    });

    expect(product?.sizeChartId).toBe(weightHeightChartId);
    expect(product?.sizeChart?.type).toBe('WEIGHT_HEIGHT');
  });
});