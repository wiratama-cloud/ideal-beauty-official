import { prisma } from '../prisma';
import {
  SizeChartType,
  SizeMeasurementInput,
  CreateSizeChartInput,
  DEFAULT_SIZE_MEASUREMENTS,
  DEFAULT_WEIGHT_HEIGHT_MEASUREMENTS,
} from '../types/size-chart';

export type { SizeChartType, SizeMeasurementInput, CreateSizeChartInput };
export { DEFAULT_SIZE_MEASUREMENTS, DEFAULT_WEIGHT_HEIGHT_MEASUREMENTS };

export async function getSizeCharts() {
  const charts = await prisma.sizeChart.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });

  return charts.map((chart) => ({
    ...chart,
    type: (chart.type as SizeChartType) || 'BODY_MEASUREMENT',
    productCount: chart._count.products,
    measurements: (chart.measurements as unknown as SizeMeasurementInput[]) || [],
  }));
}

export async function getSizeChartById(id: string) {
  const chart = await prisma.sizeChart.findUnique({
    where: { id },
    include: {
      products: {
        select: { id: true, name: true, slug: true, category: true, images: true, isActive: true },
      },
    },
  });

  if (!chart) return null;

  return {
    ...chart,
    type: (chart.type as SizeChartType) || 'BODY_MEASUREMENT',
    measurements: (chart.measurements as unknown as SizeMeasurementInput[]) || [],
  };
}

export async function getDefaultSizeChart() {
  let chart = await prisma.sizeChart.findFirst({
    where: { isDefault: true },
  });

  if (!chart) {
    chart = await prisma.sizeChart.findFirst({
      orderBy: { createdAt: 'asc' },
    });
  }

  if (!chart) {
    chart = await seedDefaultSizeCharts();
  }

  return chart
    ? {
        ...chart,
        type: (chart.type as SizeChartType) || 'BODY_MEASUREMENT',
        measurements: (chart.measurements as unknown as SizeMeasurementInput[]) || [],
      }
    : null;
}

export async function createSizeChart(data: CreateSizeChartInput) {
  if (data.isDefault) {
    await prisma.sizeChart.updateMany({
      data: { isDefault: false },
    });
  }

  // If no size chart exists yet, make this default
  const existingCount = await prisma.sizeChart.count();
  const shouldBeDefault = data.isDefault || existingCount === 0;

  const newChart = await prisma.sizeChart.create({
    data: {
      name: data.name,
      type: data.type || 'BODY_MEASUREMENT',
      category: data.category || null,
      description: data.description || null,
      guideText: data.guideText || 'All garments are tailored to standard proportions.',
      isDefault: shouldBeDefault,
      measurements: data.measurements as any,
    },
  });

  return {
    ...newChart,
    type: (newChart.type as SizeChartType) || 'BODY_MEASUREMENT',
    measurements: (newChart.measurements as unknown as SizeMeasurementInput[]) || [],
  };
}

export async function updateSizeChart(id: string, data: CreateSizeChartInput) {
  if (data.isDefault) {
    await prisma.sizeChart.updateMany({
      where: { id: { not: id } },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.sizeChart.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type || 'BODY_MEASUREMENT',
      category: data.category || null,
      description: data.description || null,
      guideText: data.guideText || null,
      isDefault: data.isDefault,
      measurements: data.measurements as any,
    },
  });

  return {
    ...updated,
    type: (updated.type as SizeChartType) || 'BODY_MEASUREMENT',
    measurements: (updated.measurements as unknown as SizeMeasurementInput[]) || [],
  };
}

export async function deleteSizeChart(id: string) {
  return await prisma.sizeChart.delete({
    where: { id },
  });
}

export async function linkProductsToSizeChart(sizeChartId: string | null, productIds: string[]) {
  if (!productIds || productIds.length === 0) return { count: 0 };

  const res = await prisma.product.updateMany({
    where: { id: { in: productIds } },
    data: { sizeChartId: sizeChartId },
  });

  return { count: res.count };
}

export async function seedDefaultSizeCharts() {
  const existingCount = await prisma.sizeChart.count();
  if (existingCount > 0) {
    return (await prisma.sizeChart.findFirst({ where: { isDefault: true } })) || (await prisma.sizeChart.findFirst());
  }

  const defaultChart = await prisma.sizeChart.create({
    data: {
      name: 'Standard Atelier Fit Chart',
      type: 'BODY_MEASUREMENT',
      category: 'General Luxury Couture',
      description: 'Universal body measurement size chart for Ready-To-Wear dresses, lehengas, and kaftans.',
      guideText: 'All garments are tailored to standard proportions. Select the size matching your bust measurement.',
      isDefault: true,
      measurements: DEFAULT_SIZE_MEASUREMENTS as any,
    },
  });

  // Seed Weight & Height chart template
  await prisma.sizeChart.create({
    data: {
      name: 'Weight & Height Fit Guide',
      type: 'WEIGHT_HEIGHT',
      category: 'Casual & Lounge Wear',
      description: 'Quick size recommendation chart based on your height and weight.',
      guideText: 'Find your size easily by matching your body weight (kg) and total height (cm).',
      isDefault: false,
      measurements: DEFAULT_WEIGHT_HEIGHT_MEASUREMENTS as any,
    },
  });

  // Seed secondary template for traditional wear
  await prisma.sizeChart.create({
    data: {
      name: 'Lehenga & Saree Blouse Chart',
      type: 'BODY_MEASUREMENT',
      category: 'Traditional & Festive',
      description: 'Precision fitted sizing for corsets, stitched saree blouses, and flared lehenga skirts.',
      guideText: 'For structured corset blouses, choose based on bust and upper waist measurement for optimum drape.',
      isDefault: false,
      measurements: DEFAULT_SIZE_MEASUREMENTS as any,
    },
  });

  return defaultChart;
}
