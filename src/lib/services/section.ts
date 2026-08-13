import { prisma } from '../prisma';
import { SectionType } from '@prisma/client';

export interface CreateSectionInput {
  title: string;
  subtitle?: string;
  type: SectionType;
  viewAllUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
  tabs?: string[];
}

export interface CreateSectionItemInput {
  sectionId: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  linkUrl?: string;
  categoryTab?: string;
  productId?: string;
  displayOrder?: number;
}

export async function getLandingSections(onlyActive = true) {
  if (!prisma.landingSection) {
    return [];
  }

  try {
    const sections = await prisma.landingSection.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: {
        displayOrder: 'asc',
      },
      include: {
        items: {
          orderBy: {
            displayOrder: 'asc',
          },
          include: {
            product: {
              include: {
                variants: true,
              },
            },
          },
        },
      },
    });

    return sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        product: item.product
          ? {
              ...item.product,
              variants: item.product.variants.map((variant) => ({
                ...variant,
                priceSale: variant.priceSale ? Number(variant.priceSale) : null,
                priceRent: variant.priceRent ? Number(variant.priceRent) : null,
                compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
                costPrice: variant.costPrice ? Number(variant.costPrice) : null,
              })),
            }
          : null,
      })),
    }));
  } catch (error) {
    console.error('Error fetching landing sections:', error);
    return [];
  }
}

export async function getLandingSectionById(id: string) {
  if (!prisma.landingSection) {
    return null;
  }

  try {
    const section = await prisma.landingSection.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: {
            displayOrder: 'asc',
          },
          include: {
            product: {
              include: {
                variants: true,
              },
            },
          },
        },
      },
    });

    if (!section) return null;

    return {
      ...section,
      items: section.items.map((item) => ({
        ...item,
        product: item.product
          ? {
              ...item.product,
              variants: item.product.variants.map((variant) => ({
                ...variant,
                priceSale: variant.priceSale ? Number(variant.priceSale) : null,
                priceRent: variant.priceRent ? Number(variant.priceRent) : null,
                compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
                costPrice: variant.costPrice ? Number(variant.costPrice) : null,
              })),
            }
          : null,
      })),
    };
  } catch (error) {
    console.error('Error fetching landing section by ID:', error);
    return null;
  }
}

export async function createLandingSection(input: CreateSectionInput) {
  return prisma.landingSection.create({
    data: {
      title: input.title,
      subtitle: input.subtitle,
      type: input.type,
      viewAllUrl: input.viewAllUrl,
      displayOrder: input.displayOrder ?? 0,
      isActive: input.isActive ?? true,
      tabs: input.tabs ?? [],
    },
  });
}

export async function updateLandingSection(id: string, input: Partial<CreateSectionInput>) {
  return prisma.landingSection.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.subtitle !== undefined && { subtitle: input.subtitle }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.viewAllUrl !== undefined && { viewAllUrl: input.viewAllUrl }),
      ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.tabs !== undefined && { tabs: input.tabs }),
    },
  });
}

export async function deleteLandingSection(id: string) {
  return prisma.landingSection.delete({
    where: { id },
  });
}

export async function createLandingSectionItem(input: CreateSectionItemInput) {
  return prisma.landingSectionItem.create({
    data: {
      sectionId: input.sectionId,
      title: input.title,
      subtitle: input.subtitle,
      imageUrl: input.imageUrl,
      linkUrl: input.linkUrl,
      categoryTab: input.categoryTab,
      productId: input.productId || null,
      displayOrder: input.displayOrder ?? 0,
    },
  });
}

export async function updateLandingSectionItem(id: string, input: Partial<CreateSectionItemInput>) {
  return prisma.landingSectionItem.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.subtitle !== undefined && { subtitle: input.subtitle }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      ...(input.linkUrl !== undefined && { linkUrl: input.linkUrl }),
      ...(input.categoryTab !== undefined && { categoryTab: input.categoryTab }),
      ...(input.productId !== undefined && { productId: input.productId || null }),
      ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
    },
  });
}

export async function deleteLandingSectionItem(id: string) {
  return prisma.landingSectionItem.delete({
    where: { id },
  });
}
