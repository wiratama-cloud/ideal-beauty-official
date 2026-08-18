import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import {
  processImageVariants,
  getBaseFileNameWithoutExt,
  getVariantFileName,
  IMAGE_RESOLUTIONS,
} from '@/lib/services/image-processor';

describe('Image Processor Service', () => {
  it('getBaseFileNameWithoutExt correctly strips extensions and variant suffixes', () => {
    expect(getBaseFileNameWithoutExt('sample.jpg')).toBe('sample');
    expect(getBaseFileNameWithoutExt('banner-1024w.webp')).toBe('banner');
    expect(getBaseFileNameWithoutExt('products/test-photo.png')).toBe('test-photo');
    expect(getBaseFileNameWithoutExt('image-512w.WEBP')).toBe('image');
  });

  it('getVariantFileName creates deterministic file names', () => {
    expect(getVariantFileName('photo.jpg', 256)).toBe('photo-256w.webp');
    expect(getVariantFileName('photo-1024w.webp', 512)).toBe('photo-512w.webp');
    expect(getVariantFileName('dress.png', 768)).toBe('dress-768w.webp');
    expect(getVariantFileName('dress.png', 1024)).toBe('dress-1024w.webp');
  });

  it('processes JPEG buffer into 4 WebP variants preserving aspect ratio', async () => {
    // Create 1200x800 JPEG (aspect ratio 3:2 = 1.5)
    const originalBuffer = await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 3,
        background: { r: 255, g: 100, b: 50 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await processImageVariants(originalBuffer, 'banner.jpg', 'image/jpeg');

    expect(result.originalFileName).toBe('banner.jpg');
    expect(result.originalContentType).toBe('image/jpeg');
    expect(result.metadata.originalWidth).toBe(1200);
    expect(result.metadata.originalHeight).toBe(800);
    expect(result.metadata.format).toBe('jpeg');
    expect(result.variants).toHaveLength(4);

    for (const resolution of IMAGE_RESOLUTIONS) {
      const variant = result.variants.find((v) => v.resolution === resolution);
      expect(variant).toBeDefined();
      expect(variant?.contentType).toBe('image/webp');
      expect(variant?.fileName).toBe(`banner-${resolution}w.webp`);
      expect(variant?.width).toBe(resolution);
      // Verify aspect ratio calculation
      const expectedHeight = Math.round(resolution / (1200 / 800));
      expect(variant?.height).toBe(expectedHeight);

      // Verify the generated buffer is a valid WebP image
      const checkMeta = await sharp(variant!.buffer).metadata();
      expect(checkMeta.format).toBe('webp');
      expect(checkMeta.width).toBe(resolution);
      expect(checkMeta.height).toBe(expectedHeight);
    }
  });

  it('processes PNG buffer with transparency into WebP variants', async () => {
    // Create 800x800 RGBA PNG
    const originalBuffer = await sharp({
      create: {
        width: 800,
        height: 800,
        channels: 4,
        background: { r: 0, g: 128, b: 255, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer();

    const result = await processImageVariants(originalBuffer, 'transparent-logo.png');

    expect(result.originalFileName).toBe('transparent-logo.png');
    expect(result.metadata.format).toBe('png');
    expect(result.variants).toHaveLength(4);

    const v256 = result.variants.find((v) => v.resolution === 256)!;
    expect(v256.width).toBe(256);
    expect(v256.height).toBe(256);
    expect(v256.fileName).toBe('transparent-logo-256w.webp');

    const meta = await sharp(v256.buffer).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.hasAlpha).toBe(true);
  });

  it('does not upscale small images beyond original dimensions (withoutEnlargement)', async () => {
    // Small 300x300 WebP
    const smallBuffer = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 3,
        background: { r: 50, g: 50, b: 50 },
      },
    })
      .webp()
      .toBuffer();

    const result = await processImageVariants(smallBuffer, 'small-thumb.webp');

    const v256 = result.variants.find((v) => v.resolution === 256)!;
    expect(v256.width).toBe(256);
    expect(v256.height).toBe(256);

    // Higher resolutions should not enlarge beyond 300px
    const v512 = result.variants.find((v) => v.resolution === 512)!;
    expect(v512.width).toBe(300);
    expect(v512.height).toBe(300);

    const v1024 = result.variants.find((v) => v.resolution === 1024)!;
    expect(v1024.width).toBe(300);
    expect(v1024.height).toBe(300);
  });

  it('throws error for invalid non-image buffer', async () => {
    const invalidBuffer = Buffer.from('this is not an image file content');
    await expect(processImageVariants(invalidBuffer, 'text.txt')).rejects.toThrow();
  });
});
