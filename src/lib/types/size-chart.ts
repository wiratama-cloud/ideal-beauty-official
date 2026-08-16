export type SizeChartType = 'WEIGHT_HEIGHT' | 'BODY_MEASUREMENT';

export interface SizeMeasurementInput {
  size: string;
  // Body measurement fields (CM)
  bustCm?: string;
  waistCm?: string;
  hipsCm?: string;
  shoulderCm?: string;
  minBustCm?: number;
  maxBustCm?: number;
  // Weight & Height fields (KG & CM)
  heightCm?: string;
  weightKg?: string;
  minWeightKg?: number;
  maxWeightKg?: number;
  minHeightCm?: number;
  maxHeightCm?: number;
}

export interface CreateSizeChartInput {
  name: string;
  type?: SizeChartType;
  category?: string | null;
  description?: string | null;
  guideText?: string | null;
  isDefault?: boolean;
  measurements: SizeMeasurementInput[];
}

export const DEFAULT_SIZE_MEASUREMENTS: SizeMeasurementInput[] = [
  {
    size: 'XS',
    bustCm: '81 - 84',
    waistCm: '61 - 64',
    hipsCm: '86 - 89',
    shoulderCm: '35.5',
    minBustCm: 78,
    maxBustCm: 84,
  },
  {
    size: 'S',
    bustCm: '86 - 89',
    waistCm: '66 - 69',
    hipsCm: '91 - 94',
    shoulderCm: '37.0',
    minBustCm: 85,
    maxBustCm: 89,
  },
  {
    size: 'M',
    bustCm: '91 - 94',
    waistCm: '71 - 74',
    hipsCm: '96 - 99',
    shoulderCm: '38.0',
    minBustCm: 90,
    maxBustCm: 94,
  },
  {
    size: 'L',
    bustCm: '96 - 101',
    waistCm: '76 - 81',
    hipsCm: '101 - 106',
    shoulderCm: '39.5',
    minBustCm: 95,
    maxBustCm: 101,
  },
  {
    size: 'XL',
    bustCm: '104 - 109',
    waistCm: '84 - 89',
    hipsCm: '109 - 114',
    shoulderCm: '41.0',
    minBustCm: 102,
    maxBustCm: 109,
  },
  {
    size: '2XL',
    bustCm: '112 - 117',
    waistCm: '92 - 97',
    hipsCm: '117 - 122',
    shoulderCm: '42.5',
    minBustCm: 110,
    maxBustCm: 117,
  },
  {
    size: '3XL',
    bustCm: '120 - 125',
    waistCm: '100 - 105',
    hipsCm: '125 - 130',
    shoulderCm: '44.0',
    minBustCm: 118,
    maxBustCm: 125,
  },
];

export const DEFAULT_WEIGHT_HEIGHT_MEASUREMENTS: SizeMeasurementInput[] = [
  {
    size: 'XS',
    heightCm: '150 - 158',
    weightKg: '40 - 48',
    minWeightKg: 40,
    maxWeightKg: 48,
    minHeightCm: 150,
    maxHeightCm: 158,
  },
  {
    size: 'S',
    heightCm: '155 - 165',
    weightKg: '48 - 55',
    minWeightKg: 48,
    maxWeightKg: 55,
    minHeightCm: 155,
    maxHeightCm: 165,
  },
  {
    size: 'M',
    heightCm: '160 - 170',
    weightKg: '55 - 63',
    minWeightKg: 55,
    maxWeightKg: 63,
    minHeightCm: 160,
    maxHeightCm: 170,
  },
  {
    size: 'L',
    heightCm: '165 - 175',
    weightKg: '63 - 72',
    minWeightKg: 63,
    maxWeightKg: 72,
    minHeightCm: 165,
    maxHeightCm: 175,
  },
  {
    size: 'XL',
    heightCm: '170 - 180',
    weightKg: '72 - 82',
    minWeightKg: 72,
    maxWeightKg: 82,
    minHeightCm: 170,
    maxHeightCm: 180,
  },
  {
    size: '2XL',
    heightCm: '175 - 185',
    weightKg: '82 - 92',
    minWeightKg: 82,
    maxWeightKg: 92,
    minHeightCm: 175,
    maxHeightCm: 185,
  },
  {
    size: '3XL',
    heightCm: '180 - 190',
    weightKg: '92 - 105',
    minWeightKg: 92,
    maxWeightKg: 105,
    minHeightCm: 180,
    maxHeightCm: 190,
  },
];
