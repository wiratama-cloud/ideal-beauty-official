import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import {
  isVariantFileName,
  isSupportedImage,
  findImageFiles,
  optimizeSingleImage,
  optimizeExistingImages,
} from '../scripts/optimize-existing-images';
import { IMAGE_RESOLUTIONS } from '@/lib/services/image-processor';

describe('Optimize Existing Images Migration Script', () => {
  const testDir = path.resolve(process.cwd(), 'test-migrate-images');

  beforeEach(async () => {
    if (fs.existsSync(testDir)) {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    }
    await fs.promises.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    if (fs.existsSync(testDir)) {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    }
  });

  it('isVariantFileName identifies variant names correctly', () => {
    expect(isVariantFileName('photo-256w.webp')).toBe(true);
    expect(isVariantFileName('photo-512w.webp')).toBe(true);
    expect(isVariantFileName('photo-768w.webp')).toBe(true);
    expect(isVariantFileName('photo-1024w.webp')).toBe(true);
    expect(isVariantFileName('banner-256w.WEBP')).toBe(true);

    expect(isVariantFileName('photo.jpg')).toBe(false);
    expect(isVariantFileName('photo.webp')).toBe(false);
    expect(isVariantFileName('photo-hero.png')).toBe(false);
  });

  it('isSupportedImage filters valid image formats and excludes variants', () => {
    expect(isSupportedImage('dress.jpg')).toBe(true);
    expect(isSupportedImage('dress.jpeg')).toBe(true);
    expect(isSupportedImage('dress.png')).toBe(true);
    expect(isSupportedImage('dress.webp')).toBe(true);

    expect(isSupportedImage('dress-512w.webp')).toBe(false);
    expect(isSupportedImage('file.pdf')).toBe(false);
    expect(isSupportedImage('script.js')).toBe(false);
  });

  it('findImageFiles finds all supported images recursively excluding variants', async () => {
    const subDir = path.join(testDir, 'subfolder');
    await fs.promises.mkdir(subDir, { recursive: true });

    await fs.promises.writeFile(path.join(testDir, 'img1.jpg'), 'fake');
    await fs.promises.writeFile(path.join(testDir, 'img1-256w.webp'), 'fake');
    await fs.promises.writeFile(path.join(testDir, 'doc.txt'), 'fake');
    await fs.promises.writeFile(path.join(subDir, 'nested-img.png'), 'fake');

    const files = await findImageFiles(testDir);
    expect(files).toHaveLength(2);
    expect(files.some((f) => f.endsWith('img1.jpg'))).toBe(true);
    expect(files.some((f) => f.endsWith('nested-img.png'))).toBe(true);
  });

  it('optimizeSingleImage creates missing WebP variants on disk', async () => {
    const originalBuffer = await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 3,
        background: { r: 120, g: 180, b: 240 },
      },
    })
      .jpeg()
      .toBuffer();

    const filePath = path.join(testDir, 'sample-item.jpg');
    await fs.promises.writeFile(filePath, originalBuffer);

    const { variantsCreated, skipped } = await optimizeSingleImage(filePath);

    expect(skipped).toBe(false);
    expect(variantsCreated).toBe(4);

    for (const res of IMAGE_RESOLUTIONS) {
      const variantPath = path.join(testDir, `sample-item-${res}w.webp`);
      expect(fs.existsSync(variantPath)).toBe(true);
      const meta = await sharp(variantPath).metadata();
      expect(meta.format).toBe('webp');
      expect(meta.width).toBe(res);
    }
  });

  it('optimizeExistingImages runs batch optimization and skips already processed images unless forced', async () => {
    const image1 = await sharp({
      create: {
        width: 600,
        height: 600,
        channels: 3,
        background: { r: 200, g: 100, b: 50 },
      },
    })
      .png()
      .toBuffer();

    const image2 = await sharp({
      create: {
        width: 800,
        height: 400,
        channels: 3,
        background: { r: 50, g: 150, b: 200 },
      },
    })
      .webp()
      .toBuffer();

    await fs.promises.writeFile(path.join(testDir, 'product1.png'), image1);
    await fs.promises.writeFile(path.join(testDir, 'product2.webp'), image2);

    // Initial batch run
    const firstRunStats = await optimizeExistingImages([testDir]);
    expect(firstRunStats.scanned).toBe(2);
    expect(firstRunStats.processed).toBe(2);
    expect(firstRunStats.skipped).toBe(0);
    expect(firstRunStats.variantsGenerated).toBe(8); // 4 for each

    // Second run without force should skip
    const secondRunStats = await optimizeExistingImages([testDir]);
    expect(secondRunStats.scanned).toBe(2);
    expect(secondRunStats.processed).toBe(0);
    expect(secondRunStats.skipped).toBe(2);
    expect(secondRunStats.variantsGenerated).toBe(0);

    // Run with force should re-process all
    const forceRunStats = await optimizeExistingImages([testDir], { force: true });
    expect(forceRunStats.scanned).toBe(2);
    expect(forceRunStats.processed).toBe(2);
    expect(forceRunStats.skipped).toBe(0);
    expect(forceRunStats.variantsGenerated).toBe(8);
  });

  it('records error in stats when an image file is corrupted', async () => {
    await fs.promises.writeFile(path.join(testDir, 'corrupt.jpg'), 'not a real image');

    const stats = await optimizeExistingImages([testDir]);
    expect(stats.scanned).toBe(1);
    expect(stats.processed).toBe(0);
    expect(stats.errors).toHaveLength(1);
    expect(stats.errors[0].file).toContain('corrupt.jpg');
  });
});
