import { describe, it, expect } from 'vitest';
import { getHeroBannerData, updateHeroBannerData, DEFAULT_HERO_BANNER } from '../src/lib/services/section';
import { prisma } from '../src/lib/prisma';

describe('Hero Banner Service', () => {
  it('should return default hero banner data when no DB record exists', async () => {
    // Delete any existing hero banner section
    await prisma.landingSection.deleteMany({
      where: { type: 'HERO_BANNER' as any },
    });

    const banner = await getHeroBannerData();
    expect(banner.tagline).toBe(DEFAULT_HERO_BANNER.tagline);
    expect(banner.title).toBe(DEFAULT_HERO_BANNER.title);
    expect(banner.description).toBe(DEFAULT_HERO_BANNER.description);
    expect(banner.primaryCtaLabel).toBe(DEFAULT_HERO_BANNER.primaryCtaLabel);
  });

  it('should create and update hero banner data in DB', async () => {
    const customData = {
      tagline: 'SUMMER BRIDAL COLLECTION 2027',
      title: 'Royal Velvet & Silk Masterpieces',
      description: 'Hand-crafted royal couture ensembles available for purchase and bespoke rentals.',
      imageUrl: '/images/hero/custom-hero.jpg',
      primaryCtaLabel: 'Explore Bridal',
      primaryCtaUrl: '/products?category=Bridal',
      secondaryCtaLabel: 'Reserve Outfit',
      secondaryCtaUrl: '/products?type=RENTAL',
      isActive: true,
    };

    await updateHeroBannerData(customData);

    const updatedBanner = await getHeroBannerData();
    expect(updatedBanner.tagline).toBe(customData.tagline);
    expect(updatedBanner.title).toBe(customData.title);
    expect(updatedBanner.description).toBe(customData.description);
    expect(updatedBanner.imageUrl).toBe(customData.imageUrl);
    expect(updatedBanner.primaryCtaLabel).toBe(customData.primaryCtaLabel);
    expect(updatedBanner.primaryCtaUrl).toBe(customData.primaryCtaUrl);
  });

  it('should handle updating a non-existent section item safely without throwing Prisma errors', async () => {
    const { updateLandingSectionItem, deleteLandingSectionItem } = await import('../src/lib/services/section');
    
    // Attempting to update a non-existent item without sectionId returns null safely
    const nullRes = await updateLandingSectionItem('non-existent-id-99999', {
      title: 'New Title',
    });
    expect(nullRes).toBeNull();

    // Attempting to delete a non-existent item returns null safely
    const nullDelete = await deleteLandingSectionItem('non-existent-id-99999');
    expect(nullDelete).toBeNull();
  });
});
