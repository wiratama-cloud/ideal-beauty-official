import { prisma } from '../prisma';
import { SectionType } from '@prisma/client';
import { HeroBannerData, DEFAULT_HERO_BANNER } from '../types/hero-banner';

export type { HeroBannerData };
export { DEFAULT_HERO_BANNER };

export async function getHeroBannerData(): Promise<HeroBannerData> {
  if (!prisma.landingSection) {
    return DEFAULT_HERO_BANNER;
  }

  try {
    const heroSection = await prisma.landingSection.findFirst({
      where: { type: 'HERO_BANNER' as SectionType },
      include: {
        items: {
          take: 1,
        },
      },
    });

    if (!heroSection) {
      return DEFAULT_HERO_BANNER;
    }

    const item = heroSection.items[0];

    return {
      tagline: heroSection.subtitle || DEFAULT_HERO_BANNER.tagline,
      title: heroSection.title || DEFAULT_HERO_BANNER.title,
      description: heroSection.viewAllUrl || DEFAULT_HERO_BANNER.description,
      imageUrl: (item?.imageUrl && item.imageUrl.trim().length > 0) ? item.imageUrl : DEFAULT_HERO_BANNER.imageUrl,
      primaryCtaLabel: item?.title || DEFAULT_HERO_BANNER.primaryCtaLabel,
      primaryCtaUrl: item?.linkUrl || DEFAULT_HERO_BANNER.primaryCtaUrl,
      secondaryCtaLabel: item?.subtitle || DEFAULT_HERO_BANNER.secondaryCtaLabel,
      secondaryCtaUrl: item?.categoryTab || DEFAULT_HERO_BANNER.secondaryCtaUrl,
      isActive: heroSection.isActive ?? true,
    };
  } catch (err) {
    console.error('Error fetching hero banner data:', err);
    return DEFAULT_HERO_BANNER;
  }
}

export async function updateHeroBannerData(input: HeroBannerData) {
  const effectiveImageUrl =
    input.imageUrl && input.imageUrl.trim().length > 0
      ? input.imageUrl
      : DEFAULT_HERO_BANNER.imageUrl;

  const existingSection = await prisma.landingSection.findFirst({
    where: { type: 'HERO_BANNER' as SectionType },
    include: { items: true },
  });

  if (existingSection) {
    const updated = await prisma.landingSection.update({
      where: { id: existingSection.id },
      data: {
        title: input.title,
        subtitle: input.tagline,
        viewAllUrl: input.description,
        isActive: input.isActive,
      },
    });

    if (existingSection.items.length > 0) {
      await prisma.landingSectionItem.update({
        where: { id: existingSection.items[0].id },
        data: {
          imageUrl: effectiveImageUrl,
          title: input.primaryCtaLabel,
          linkUrl: input.primaryCtaUrl,
          subtitle: input.secondaryCtaLabel,
          categoryTab: input.secondaryCtaUrl,
        },
      });
    } else {
      await prisma.landingSectionItem.create({
        data: {
          sectionId: existingSection.id,
          imageUrl: effectiveImageUrl,
          title: input.primaryCtaLabel,
          linkUrl: input.primaryCtaUrl,
          subtitle: input.secondaryCtaLabel,
          categoryTab: input.secondaryCtaUrl,
        },
      });
    }

    return updated;
  } else {
    return prisma.landingSection.create({
      data: {
        type: 'HERO_BANNER' as SectionType,
        title: input.title,
        subtitle: input.tagline,
        viewAllUrl: input.description,
        isActive: input.isActive,
        displayOrder: -1,
        items: {
          create: {
            imageUrl: effectiveImageUrl,
            title: input.primaryCtaLabel,
            linkUrl: input.primaryCtaUrl,
            subtitle: input.secondaryCtaLabel,
            categoryTab: input.secondaryCtaUrl,
          },
        },
      },
    });
  }
}

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
      where: {
        ...(onlyActive ? { isActive: true } : {}),
        type: {
          not: 'HERO_BANNER' as SectionType,
        },
      },
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
                purchaseCost: variant.purchaseCost ? Number(variant.purchaseCost) : null,
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
                purchaseCost: variant.purchaseCost ? Number(variant.purchaseCost) : null,
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
  if (!prisma.landingSection) {
    return null;
  }

  try {
    const existing = await prisma.landingSection.findUnique({
      where: { id },
    });

    if (!existing) {
      return null;
    }

    return await prisma.landingSection.update({
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
  } catch (err) {
    console.error('Error updating landing section:', err);
    return null;
  }
}

export async function deleteLandingSection(id: string) {
  if (!prisma.landingSection) {
    return null;
  }

  try {
    const existing = await prisma.landingSection.findUnique({
      where: { id },
    });

    if (!existing) {
      return null;
    }

    return await prisma.landingSection.delete({
      where: { id },
    });
  } catch (err) {
    console.error('Error deleting landing section:', err);
    return null;
  }
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
  if (!prisma.landingSectionItem) {
    return null;
  }

  try {
    const existing = await prisma.landingSectionItem.findUnique({
      where: { id },
    });

    if (!existing) {
      if (input.sectionId) {
        return await prisma.landingSectionItem.create({
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
      return null;
    }

    return await prisma.landingSectionItem.update({
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
  } catch (err) {
    console.error('Error updating landing section item:', err);
    return null;
  }
}

export async function deleteLandingSectionItem(id: string) {
  if (!prisma.landingSectionItem) {
    return null;
  }

  try {
    const existing = await prisma.landingSectionItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return null;
    }

    return await prisma.landingSectionItem.delete({
      where: { id },
    });
  } catch (err) {
    console.error('Error deleting landing section item:', err);
    return null;
  }
}
