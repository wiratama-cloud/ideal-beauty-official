import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { processImageVariants } from '@/lib/services/image-processor';
import {
  saveFileToLocal,
  saveImageVariantsToLocal,
  deleteImageVariantsFromLocal,
} from '@/lib/services/local-storage';

describe('Local Storage Service', () => {
  const testSubDir = 'test-uploads';
  const publicDir = path.resolve(process.cwd(), 'public');
  const testDir = path.join(publicDir, testSubDir);

  beforeEach(async () => {
    if (fs.existsSync(testDir)) {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    }
  });

  afterEach(async () => {
    if (fs.existsSync(testDir)) {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    }
  });

  it('saveFileToLocal writes buffer to disk and returns local url', async () => {
    const buffer = Buffer.from('hello world');
    const url = await saveFileToLocal(buffer, 'test-file.txt', testSubDir);

    expect(url).toBe('/test-uploads/test-file.txt');
    const exists = fs.existsSync(path.join(testDir, 'test-file.txt'));
    expect(exists).toBe(true);
    const content = await fs.promises.readFile(path.join(testDir, 'test-file.txt'), 'utf-8');
    expect(content).toBe('hello world');
  });

  it('saveImageVariantsToLocal writes original and all variants to disk with correct URLs', async () => {
    const buffer = await sharp({
      create: {
        width: 1000,
        height: 600,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .jpeg()
      .toBuffer();

    const processingResult = await processImageVariants(buffer, 'product-card.jpg', 'image/jpeg');
    const result = await saveImageVariantsToLocal(processingResult, testSubDir);

    expect(result.url).toBe('/test-uploads/product-card-1024w.webp');
    expect(result.urls.original).toBe('/test-uploads/product-card.jpg');
    expect(result.urls['256']).toBe('/test-uploads/product-card-256w.webp');
    expect(result.urls['512']).toBe('/test-uploads/product-card-512w.webp');
    expect(result.urls['768']).toBe('/test-uploads/product-card-768w.webp');
    expect(result.urls['1024']).toBe('/test-uploads/product-card-1024w.webp');

    // Verify all files exist on disk
    expect(fs.existsSync(path.join(testDir, 'product-card.jpg'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'product-card-256w.webp'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'product-card-512w.webp'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'product-card-768w.webp'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'product-card-1024w.webp'))).toBe(true);
  });

  it('deleteImageVariantsFromLocal deletes all variant files and original', async () => {
    const buffer = await sharp({
      create: {
        width: 500,
        height: 500,
        channels: 3,
        background: { r: 50, g: 100, b: 150 },
      },
    })
      .png()
      .toBuffer();

    const processingResult = await processImageVariants(buffer, 'delete-me.png', 'image/png');
    await saveImageVariantsToLocal(processingResult, testSubDir);

    expect(fs.existsSync(path.join(testDir, 'delete-me.png'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'delete-me-256w.webp'))).toBe(true);

    await deleteImageVariantsFromLocal('delete-me.png', testSubDir);

    expect(fs.existsSync(path.join(testDir, 'delete-me.png'))).toBe(false);
    expect(fs.existsSync(path.join(testDir, 'delete-me-256w.webp'))).toBe(false);
    expect(fs.existsSync(path.join(testDir, 'delete-me-512w.webp'))).toBe(false);
    expect(fs.existsSync(path.join(testDir, 'delete-me-768w.webp'))).toBe(false);
    expect(fs.existsSync(path.join(testDir, 'delete-me-1024w.webp'))).toBe(false);
  });
});
